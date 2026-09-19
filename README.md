# 🚚 TakeOFF Driver Onboarding

A driver/courier registration and verification platform: drivers register,
verify their phone number via OTP, submit personal/identity/vehicle
information and documents, and track their application through review by an
admin team.

This is an independent prototype built to demonstrate a realistic,
end-to-end full-stack implementation of the driver onboarding problem — it
is not affiliated with or branded as any production TakeOFF/African Unicorn
system.

## Stack

| Layer | Technology |
|---|---|
| Driver & Admin portals | React 19 + TypeScript + Vite + Tailwind CSS (light/dark) |
| API | FastAPI (Python) |
| Database | PostgreSQL + SQLAlchemy 2.0 + Alembic |
| Auth | JWT with server-side revocation + OTP (phone verification) |
| File storage | Local disk by default, S3-compatible when `S3_BUCKET_NAME` is set |
| Rate limiting | In-memory by default, Redis-backed when `REDIS_URL` is set |

The frontend never talks to the database directly; every read/write goes
through the FastAPI REST API, which owns validation, auth and the
application review workflow.

```
Driver / Admin ── React (Vite) ── HTTPS/JSON ── FastAPI ── SQLAlchemy ── PostgreSQL
                                                     │
                                                     └── local disk (uploads/)
```

## Quickstart

```bash
docker compose up --build
```

Or, without Docker: `./run-local.sh` (uses SQLite as a stand-in DB — good
for a quick demo, see [DEPLOYMENT.md](DEPLOYMENT.md) for the Postgres path).

- Driver/Admin portal: http://localhost:5173
- API + interactive docs: http://localhost:8000/docs
- DB inspector (Adminer): http://localhost:8080

The backend automatically runs migrations and seeds:
- **Admin login:** `admin@takeoff.dev` / `AdminPass123!`
- **Test driver:** phone `+263700000001`, with a complete profile, vehicle,
  all four required documents, and a submitted application
  (`TAKEOFF-000001`, status `UNDER_REVIEW`) already persisted — so the
  admin review flow can be exercised immediately.
- **New driver signups:** unless Twilio is configured (see below), the OTP
  code is echoed back in the API response (and logged server-side) so the
  phone verification flow is fully testable without a real phone number.

See [DEPLOYMENT.md](DEPLOYMENT.md) for running without Docker, and
production deployment notes.

## Features

- **Auth:** JWT + OTP phone verification, pluggable real SMS delivery via
  Twilio (falls back to console-logged codes when unconfigured).
- **Multi-step onboarding:** personal → contact → identity → vehicle(s) →
  documents → review → submit, editable at any step, backed by a
  server-enforced completeness check before submission.
- **Multiple vehicles per driver.**
- **Application review workflow:** a real state machine
  (`DRAFT → SUBMITTED → UNDER_REVIEW → APPROVED/REJECTED/CORRECTION_REQUIRED`),
  not a boolean flag — see below.
- **Email notifications:** drivers get emailed on submission and on every
  admin decision, via a pluggable SMTP provider (same console-log fallback
  pattern as OTP).
- **Admin analytics dashboard:** applications-by-status and submissions-over-time
  charts, approval rate, and average review turnaround.
- **Security hardening:** per-IP rate limiting on auth endpoints (Redis-backed
  when `REDIS_URL` is set, so it holds across multiple instances), JWT
  revocation on logout (a captured token stops working immediately, not just
  at its natural expiry), security response headers, and a boot-time check
  that refuses to start in production with dev-default secrets.
- **Pluggable file storage:** local disk by default; set `S3_BUCKET_NAME` to
  switch to S3 (or an S3-compatible/GCS-interop endpoint) with no other code
  changes.
- **Dark mode:** a real toggle (not just `prefers-color-scheme`), persisted
  per-browser, with its own validated color palette rather than an automatic
  invert — including the status badges and chart colors.

## Documentation

- [docs/architecture.md](docs/architecture.md) — system design, why it's
  layered this way, the application state machine
- [docs/database.md](docs/database.md) — schema, migrations, seed data
- [docs/api.md](docs/api.md) — endpoint reference
- [docs/user-flow.md](docs/user-flow.md) — driver and admin journeys

## Application workflow

```
DRAFT ──submit──► SUBMITTED ──► UNDER_REVIEW ──┬─► APPROVED (terminal)
                                                ├─► REJECTED (terminal)
                                                └─► CORRECTION_REQUIRED ──► DRAFT (edit & resubmit)
```

Submission is only allowed once the driver's personal/contact/identity
fields, at least one vehicle, and all four required documents are present —
enforced server-side in `backend/app/services/application_service.py`, not
just in the UI.

## Testing

```bash
cd backend && source .venv/bin/activate && pytest
```

31 tests cover registration, OTP verification (including expiry/attempt
limits), rate limiting, JWT revocation on logout, driver profile and vehicle
CRUD, document upload/download/replace/reject (round-tripped through the
storage provider), and the full application state machine (submit
validation, admin approve/reject/correction, and the correction → draft →
resubmit loop).

```bash
cd frontend && npm run build   # type-checks and builds the production bundle
```

## Known limitations

- No document virus scanning on upload (only extension/size validation).
- No pagination on the admin applications/drivers list (fine at prototype
  scale; would need it before this list grows past a few hundred rows).
- Revoked-token cleanup is lazy — expired rows in `revoked_tokens` are
  simply harmless (the token would be rejected by its own `exp` regardless),
  not actively purged. A production deployment would add a periodic job.

## License

MIT — see [LICENSE](LICENSE).
