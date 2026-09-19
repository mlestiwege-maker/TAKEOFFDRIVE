# Architecture

## Overview

TakeOFF Driver Onboarding is a three-tier system: a React/TypeScript frontend
(split into a Driver Portal and an Admin Portal), a FastAPI REST backend, and
PostgreSQL for persistence. The frontend never talks to the database
directly — every read and write goes through the API, which enforces
authentication, authorization and business rules (e.g. the application state
machine) before touching storage.

```
Driver / Admin (browser)
        │
        ▼
React + TypeScript (Vite)
        │  HTTPS / JSON
        ▼
FastAPI REST API
        │
        ├── SQLAlchemy ORM ──► PostgreSQL (users, drivers, vehicles,
        │                       documents, applications, reviews, OTP codes,
        │                       revoked tokens)
        │
        ├── Local disk or S3 — document storage (see File storage below)
        │
        └── Redis (optional) — shared rate-limit counters across instances
```

## Why this split

- **Frontend never touches the DB.** All persistence and validation lives in
  the API. This keeps business rules (e.g. "an application can't be approved
  from DRAFT") in one place instead of duplicated in the UI.
- **Layered backend.** `api/` (HTTP boundary, request/response shapes) →
  `services/` (business logic, e.g. the application state machine) →
  `models/` (SQLAlchemy ORM) → `repositories/` folder is reserved for query
  logic that would otherwise bloat services as the app grows; for the
  current scope, straightforward queries live directly in services/routers
  to avoid a needless indirection layer.
- **Stateless auth (JWT).** The API doesn't hold session state, so it can be
  scaled horizontally without sticky sessions. OTP codes are the one
  short-lived, stateful piece of the auth flow, and they live in Postgres
  (`otp_codes`) with an expiry and attempt counter rather than in memory, so
  they survive an API restart and work across multiple backend instances.

## Application state machine

```
   DRAFT ──submit──► SUBMITTED ──(admin opens)──► UNDER_REVIEW
                                                        │
                          ┌─────────────────────────────┼─────────────────────────────┐
                          │                              │                              │
                          ▼                              ▼                              ▼
                      APPROVED                CORRECTION_REQUIRED                   REJECTED
                     (terminal)                        │                          (terminal)
                                                        ▼
                                                      DRAFT
                                          (driver edits, resubmits)
```

This lives in `backend/app/services/application_service.py`. Submission is
only allowed from `DRAFT` or `CORRECTION_REQUIRED`, and only if all required
profile fields, at least one vehicle, and all four required documents are
present — so a submitted application is always complete by construction, not
by convention.

## Authentication flow

1. Driver registers with phone + password → `users` row created,
   `is_verified = false`.
2. `POST /api/auth/send-otp` generates a 6-digit code, hashes it (SHA-256 +
   server secret) into `otp_codes`, and — since no SMS provider is wired up
   in this prototype — logs it server-side and echoes it in the response
   when `OTP_DEBUG_ECHO=true`, so the flow is fully exercisable in a demo.
3. `POST /api/auth/verify-otp` checks the hash, expiry and attempt count,
   marks the user verified, and returns a JWT.
4. The JWT (`sub`=user id, `role`, `jti`) is sent as
   `Authorization: Bearer <token>` on every subsequent request;
   `get_current_user` decodes it, checks `jti` against `revoked_tokens`,
   and loads the user on each call.
5. `POST /api/auth/logout` inserts the token's `jti` into `revoked_tokens`
   with its natural expiry, so a captured/leaked token stops working
   immediately rather than remaining valid until it would have expired
   anyway. This is the one piece of state a "stateless" JWT scheme needs —
   everything else about auth stays stateless.

Swapping in a real SMS provider (Twilio, Africa's Talking, etc.) means
replacing the body of `otp_service.send_otp` — the hashing, expiry and
attempt-limiting logic around it don't change.

## File storage

Documents go through `app/services/storage_provider.py`: `LocalDiskStorage`
(default, under `backend/uploads/`) or `S3Storage` (activated by setting
`S3_BUCKET_NAME`, using boto3 — also works against S3-compatible services
like MinIO, DigitalOcean Spaces, Cloudflare R2, or GCS's S3-interop mode via
`S3_ENDPOINT_URL`). Either way, `Document.file_url` stores an opaque key,
and `document_service.py`/the download endpoints never need to know which
backend is active — they just call `save`/`read`/`delete` on whatever
`get_storage_provider()` returns.

## Security hardening

- **Rate limiting** (`app/core/limiter.py`, via `slowapi`): per-IP limits on
  registration, OTP send/verify and login, so brute-forcing a code or
  password is bounded even before the per-account OTP attempt counter kicks
  in. In-memory storage by default; set `REDIS_URL` to share counters across
  multiple backend instances instead of each one tracking its own.
- **Security headers** (`app/core/security_headers.py`): `X-Content-Type-Options`,
  `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` on every
  response, plus HSTS outside debug mode.
- **JWT revocation** (`app/models/revoked_token.py`): logout revokes the
  specific token by `jti` rather than relying on it to just expire naturally
  — see Authentication flow above.
- **Boot-time config guard** (`assert_production_config_is_safe` in
  `app/core/config.py`): refuses to start with `ENVIRONMENT=production` if
  `JWT_SECRET_KEY`/`FIRST_ADMIN_PASSWORD` are still the dev defaults, or if
  `DEBUG`/`OTP_DEBUG_ECHO` are left on — turning "forgot to change the
  secret" from a silent vulnerability into a startup crash.

## Pluggable delivery providers

Both OTP SMS and application-status emails follow the same pattern
(`app/services/sms_provider.py`, `app/services/email_provider.py`): a
`ConsoleXProvider` that just logs, used whenever the relevant env vars
aren't set, and a real provider (Twilio for SMS, SMTP for email) that
activates automatically once they are. Nothing calling `get_sms_provider()`
or `notify_application_status()` needs to know which one is active — see
`docs/api.md`/`DEPLOYMENT.md` for the env vars.

## Dark mode

A real toggle (`ThemeContext`, persisted to `localStorage`, applied via a
`.dark` class on `<html>`), not just `prefers-color-scheme`. Status colors
and chart colors have their own dark-surface-validated palette
(`STATUS_COLORS_DARK` in `frontend/src/utils/constants.ts`) rather than
reusing the light-mode hues at reduced opacity — the light-mode steps for
amber/green specifically failed a lightness-band check against a dark
surface when tested, so this isn't a cosmetic detail.

## Known limitations (by design, for this scope)

- No document virus scanning on upload (extension/size validation only).
- No pagination on the admin applications/drivers list (fine at prototype
  scale; would need it before this list grows past a few hundred rows).
- `revoked_tokens` rows aren't actively purged after they expire — harmless
  (the token would be rejected by its own `exp` claim regardless) but a
  production deployment would add a periodic cleanup job.
