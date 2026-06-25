#!/bin/sh
set -e

export NODE_ENV=production

echo "[entrypoint] applying migrations"
bun run db:postgre:migrate

echo "[entrypoint] starting API"
exec "$@"
