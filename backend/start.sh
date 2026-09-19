#!/bin/sh
# Render's dockerCommand (and similar PaaS "start command" fields) don't
# reliably shell-parse a quoted compound command like
# `sh -c "cmd1 && cmd2 && cmd3"` — some hosts pass it through as a single
# literal argv token instead of invoking it via a real shell, which makes
# `&&` never get interpreted as an operator. A real script file sidesteps
# that ambiguity entirely.
set -e
alembic upgrade head
python -m app.seed
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-10000}"
