# Deployment

## Local development (Docker, recommended)

```bash
docker compose up --build
```

This starts:
- `db` — PostgreSQL 16
- `redis` — backs the rate limiter across backend instances
- `backend` — FastAPI on `http://localhost:8000` (runs migrations, then
  seeds an admin + a fully submitted test driver application, then serves)
- `frontend` — production build served on `http://localhost:5173`
- `adminer` — DB inspector at `http://localhost:8080` (system: PostgreSQL,
  server: `db`, user/pass: `takeoff`/`takeoff`, db: `takeoff_onboarding`)

## Local development (without Docker)

**Backend:**
```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # point DATABASE_URL at your local Postgres
alembic upgrade head
python -m app.seed
uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

## Production deployment

| Component | Suggested host |
|---|---|
| Frontend | Vercel (static build from `frontend/`, `VITE_API_BASE_URL` pointed at the deployed API) |
| Backend | Render / Railway / Fly.io (Dockerfile-based, `backend/Dockerfile`) |
| Database | Managed PostgreSQL (Render/Railway/Neon/RDS) |
| File storage | Set `S3_BUCKET_NAME` (+ region/credentials) before deploying anywhere with an ephemeral filesystem — local disk (the default) does not persist uploaded documents across container restarts on most PaaS hosts |
| Rate limit storage | Set `REDIS_URL` if you run more than one backend instance — otherwise each instance tracks its own limits independently |

### Before deploying

1. Set `ENVIRONMENT=production`. The app refuses to boot in this mode with
   unsafe defaults (`assert_production_config_is_safe` in
   `app/core/config.py`), so you'll be told exactly what's still wrong:
   - `JWT_SECRET_KEY` must not be the dev default — generate one with
     `python -c "import secrets; print(secrets.token_urlsafe(64))"`.
   - `FIRST_ADMIN_PASSWORD` must not be the dev default.
   - `DEBUG` must be `false`.
   - `OTP_DEBUG_ECHO` must be `false` (otherwise OTP codes leak in API responses).
2. Point `CORS_ORIGINS` at the deployed frontend's origin.
3. Set the Twilio env vars (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`,
   `TWILIO_FROM_NUMBER`) for real OTP delivery, and the `SMTP_*` env vars for
   real email notifications. Both are optional — without them the app falls
   back to logging codes/emails server-side, which is fine for a demo but
   not for real users.
4. Run `alembic upgrade head` against the production database before first
   boot (the Docker Compose `backend` command does this automatically).
5. `RATE_LIMIT_ENABLED=true` (the default) rate-limits `/api/auth/send-otp`,
   `/api/auth/verify-otp`, `/api/auth/login` and `/api/auth/register` per
   IP. Set `REDIS_URL` if you're running more than one backend instance —
   otherwise each instance enforces the limit independently, which
   effectively multiplies it by instance count.
6. Set `S3_BUCKET_NAME` (+ `S3_REGION`, and `AWS_ACCESS_KEY_ID`/
   `AWS_SECRET_ACCESS_KEY` in the environment) for durable document storage.
   Without it, uploads go to local disk, which most PaaS hosts wipe on
   redeploy.

### CI/CD

`.github/workflows/ci.yml` runs backend tests (against a real Postgres
service container) and the frontend build on every push/PR. Two deploy jobs
are wired in but gated on secrets being present, so the pipeline is safe to
merge before deployment is configured — it just won't deploy anything until
you add:

| Secret | Where to get it |
|---|---|
| `RENDER_DEPLOY_HOOK_URL` | Render dashboard → your backend service → Settings → Deploy Hook |
| `VERCEL_TOKEN` | Vercel dashboard → Account Settings → Tokens |
| `VERCEL_ORG_ID` / `VERCEL_PROJECT_ID` | Run `vercel link` locally inside `frontend/` once; both land in `frontend/.vercel/project.json` |

Add these under the repo's **Settings → Secrets and variables → Actions**.
Once present, every push to `main` that passes tests automatically deploys.
