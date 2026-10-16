#!/usr/bin/env bash
# pm2 entry of the staging storefront (Next.js standalone build).
set -euo pipefail
ROOT="$HOME/trafaret-staging"
set -a
. "$ROOT/shared/web.env"
set +a
cd "$ROOT/app/web"
exec "$ROOT/tools/node/bin/node" server.js
