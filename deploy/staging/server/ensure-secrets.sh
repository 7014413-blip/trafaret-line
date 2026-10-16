#!/usr/bin/env bash
# Runs on the server (as the site's own FastPanel user) before every staging build.
# Creates the folders of the staging copy and, once, its internal secrets: session secrets of
# the shop, the token for shop -> site calls and the site's publishable key. They never leave
# the server except the publishable key, which is public by design (it is in the site's
# JavaScript) and is printed so the build can embed it.

set -euo pipefail

ROOT="$HOME/trafaret-staging"
SECRETS="$ROOT/shared/secrets.env"

mkdir -p "$ROOT/shared/static" "$ROOT/shared/uploads" "$ROOT/shared/state" "$ROOT/tools" "$ROOT/incoming"
chmod 700 "$ROOT/shared"

random_hex() {
  head -c 32 /dev/urandom | od -An -tx1 | tr -d ' \n'
}

if [ ! -s "$SECRETS" ]; then
  umask 077
  {
    echo "JWT_SECRET=$(random_hex)"
    echo "COOKIE_SECRET=$(random_hex)"
    echo "INTERNAL_API_TOKEN=$(random_hex)"
    echo "STAGING_PUBLISHABLE_KEY=pk_$(random_hex)"
  } > "$SECRETS"
fi

grep '^STAGING_PUBLISHABLE_KEY=' "$SECRETS"
