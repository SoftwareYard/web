#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

git pull
docker compose build
docker compose up -d
