#!/bin/sh
set -e

export NODE_ENV=production

echo "[entrypoint] applying migrations"
./migrate

echo "[entrypoint] starting API"
exec ./server
