#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

git pull
docker compose build
docker compose run --rm api npx prisma migrate deploy
docker compose up -d
