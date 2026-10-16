#!/usr/bin/env bash
# pm2 entry of the staging shop (Medusa): loads its settings and starts the built server.
set -euo pipefail
ROOT="$HOME/trafaret-staging"
set -a
. "$ROOT/shared/backend.env"
set +a
cd "$ROOT/app/backend"
exec "$ROOT/tools/node/bin/node" node_modules/@medusajs/cli/cli.js start
