# Database

PostgreSQL, accessed through SQLAlchemy 2.0 (typed models) and versioned
with Alembic. Schema source of truth: `backend/app/models/`.

## Tables

### users
Login identity, shared by drivers and admins.
| column | notes |
|---|---|
| phone | unique, used for OTP login |
| email | unique, optional (required for admins) |
| password_hash | bcrypt |
| role | `DRIVER` \| `ADMIN` |
| is_verified | set true after first successful OTP verification |

### drivers
One-to-one with `users` (only present for driver accounts). Personal,
contact and identity fields all live here rather than on `users`, so the
onboarding form fields map directly onto columns.

### vehicles
Many-to-one with `drivers` — a driver can register more than one vehicle;
the onboarding UI's vehicle step is an add/remove list, not a single form.

### documents
Many-to-one with `drivers`. One row per uploaded file; re-uploading a
document of the same `document_type` replaces the previous row (and the
file on disk) rather than accumulating duplicates. `status` tracks per-document
review state (`PENDING`/`ACCEPTED`/`REJECTED`) independent of the overall
application status.

### applications
The unit an admin reviews and decides on. `application_number` is a
human-readable ID (`TAKEOFF-000001`) generated sequentially at creation.
`status` follows the state machine described in `architecture.md`.

### application_reviews
Append-only audit log: every admin decision (approve / reject / request
correction) is a new row with the admin's id, the decision, and their
notes. `applications.status` reflects the *current* state; this table is
the history of how it got there.

### otp_codes
Short-lived, hashed OTP codes with an expiry and an attempt counter (caps
brute-force guesses at `OTP_MAX_ATTEMPTS`). Never stores the code in plain
text — `code_hash` is a salted SHA-256 of the code.

### revoked_tokens
One row per logged-out JWT, keyed by its `jti` claim, with the token's own
`expires_at` copied in. `get_current_user` checks this table on every
request; a row past its `expires_at` is harmless dead weight rather than a
correctness issue (the token would be rejected by its own `exp` claim
either way), so cleanup is a nice-to-have, not load-bearing.

## Migrations

Managed with Alembic (`backend/migrations/`). To generate a new migration
after changing a model:

```bash
cd backend
alembic revision --autogenerate -m "describe the change"
alembic upgrade head
```

## Seed data

`backend/app/seed.py` creates:
- An admin user (`admin@takeoff.dev` / see `.env` for the password).
- A fully populated test driver (`+263700000001`) with a vehicle, all four
  required documents, and a submitted application (`TAKEOFF-000001`,
  status `UNDER_REVIEW`) — so the review workflow can be exercised
  immediately without manually onboarding a driver first.

Run it with `python -m app.seed` (or automatically via `docker compose up`,
see the root `docker-compose.yml`).
