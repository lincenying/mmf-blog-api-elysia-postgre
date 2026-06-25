#!/bin/sh
set -e

echo "[entrypoint] applying migrations"
bun run db:postgre:migrate

echo "[entrypoint] starting API"
exec "$@"
