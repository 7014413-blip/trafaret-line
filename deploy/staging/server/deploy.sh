#!/usr/bin/env bash
# Runs on the server (as the site's own FastPanel user) after GitHub Actions has copied a new
# build into ~/trafaret-staging/incoming. Nothing outside the user's home folder is touched:
# Node.js and pm2 live in ~/trafaret-staging/tools, the database is the one made in FastPanel.
#
#   1. Node.js 22 and pm2 are installed into tools/ the first time.
#   2. The shop's packages are installed, its database is migrated, the shop is set up once
#      (seed, storefront key, admin login).
#   3. The new build replaces the running one; if it does not answer, the previous build is
#      put back and the deploy fails.
#
# Settings come from shared/deploy.env (written by the workflow from GitHub secrets) and
# shared/secrets.env (made on the server by ensure-secrets.sh). An optional shared/db.env written
# by the server admin (DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT) wins over the GitHub values.

set -euo pipefail

ROOT="$HOME/trafaret-staging"
SHARED="$ROOT/shared"
TOOLS="$ROOT/tools"
INCOMING="$ROOT/incoming"
APP="$ROOT/app"
PREVIOUS="$ROOT/previous"
NODE_DIR="$TOOLS/node"
PM2_DIR="$TOOLS/pm2"
export PM2_HOME="$TOOLS/pm2-home"
ADMIN_EMAIL="admin@trafaret-line.com.ua"
SITE_LOGIN="trafaret"

log() {
  echo "[staging] $*"
}

load_settings() {
  set -a
  . "$SHARED/deploy.env"
  . "$SHARED/secrets.env"
  # The server admin may keep the database login on the server itself instead of in GitHub.
  if [ -f "$SHARED/db.env" ]; then
    . "$SHARED/db.env"
  fi
  set +a
  : "${STAGING_PASSWORD:?STAGING_PASSWORD is empty}"
  : "${DB_NAME:?DB_NAME is empty}"
  : "${DB_USER:?DB_USER is empty}"
  : "${DB_PASSWORD:?DB_PASSWORD is empty}"
  : "${SITE_DOMAIN:?SITE_DOMAIN is empty}"
  : "${API_DOMAIN:?API_DOMAIN is empty}"
  DB_HOST="${DB_HOST:-127.0.0.1}"
  DB_PORT="${DB_PORT:-5432}"
  WEB_PORT="${WEB_PORT:-3110}"
  API_PORT="${API_PORT:-9110}"
}

install_node() {
  if [ -x "$NODE_DIR/bin/node" ] && "$NODE_DIR/bin/node" -v | grep -q '^v22\.'; then
    return
  fi
  log "Installing Node.js 22 into $NODE_DIR"
  local base="https://nodejs.org/dist/latest-v22.x"
  local work
  work="$(mktemp -d)"
  curl -fsSL "$base/SHASUMS256.txt" -o "$work/SHASUMS256.txt"
  local file
  file="$(grep -o 'node-v22\.[0-9.]*-linux-x64\.tar\.xz' "$work/SHASUMS256.txt" | head -n 1)"
  [ -n "$file" ] || { echo "Node.js 22 archive not found in $base" >&2; exit 1; }
  curl -fsSL "$base/$file" -o "$work/$file"
  (cd "$work" && grep " $file\$" SHASUMS256.txt | sha256sum -c -)
  rm -rf "$NODE_DIR"
  mkdir -p "$NODE_DIR"
  tar -xJf "$work/$file" -C "$NODE_DIR" --strip-components=1
  rm -rf "$work"
}

install_pm2() {
  if [ -x "$PM2_DIR/node_modules/.bin/pm2" ]; then
    return
  fi
  log "Installing pm2 into $PM2_DIR"
  mkdir -p "$PM2_DIR"
  npm install --prefix "$PM2_DIR" --no-audit --no-fund pm2@6
}

pm2() {
  "$PM2_DIR/node_modules/.bin/pm2" "$@"
}

url_encode() {
  node -e 'process.stdout.write(encodeURIComponent(process.argv[1]))' "$1"
}

# Writes NAME=value lines quoted for bash, so passwords with spaces, $ or quotes stay intact.
env_line() {
  printf '%s=%q\n' "$1" "$2"
}

write_env_files() {
  local db_url="postgres://$(url_encode "$DB_USER"):$(url_encode "$DB_PASSWORD")@$DB_HOST:$DB_PORT/$(url_encode "$DB_NAME")"
  umask 077
  {
    env_line NODE_ENV production
    env_line PORT "$API_PORT"
    env_line DATABASE_URL "$db_url"
    env_line STORE_CORS "https://$SITE_DOMAIN"
    env_line ADMIN_CORS "https://$API_DOMAIN"
    env_line AUTH_CORS "https://$API_DOMAIN"
    env_line JWT_SECRET "$JWT_SECRET"
    env_line COOKIE_SECRET "$COOKIE_SECRET"
    env_line STOREFRONT_URL "https://$SITE_DOMAIN"
    env_line BACKEND_PUBLIC_URL "https://$API_DOMAIN"
    env_line INTERNAL_API_TOKEN "$INTERNAL_API_TOKEN"
    env_line STAGING_PUBLISHABLE_KEY "$STAGING_PUBLISHABLE_KEY"
    env_line FONTS_DIR "$APP/web/public/fonts"
    env_line CUSTOM_FONTS_DIR "$SHARED/uploads/fonts"
  } > "$SHARED/backend.env"
  {
    env_line NODE_ENV production
    env_line PORT "$WEB_PORT"
    env_line HOSTNAME 127.0.0.1
    env_line NEXT_TELEMETRY_DISABLED 1
    env_line NEXT_PUBLIC_MEDUSA_URL "https://$API_DOMAIN"
    env_line NEXT_PUBLIC_MEDUSA_PK "$STAGING_PUBLISHABLE_KEY"
    env_line MEDUSA_INTERNAL_URL "http://127.0.0.1:$API_PORT"
    env_line NEXT_PUBLIC_SITE_URL "https://$SITE_DOMAIN"
    env_line STAGING_BASIC_AUTH "$SITE_LOGIN:$STAGING_PASSWORD"
    env_line INTERNAL_API_TOKEN "$INTERNAL_API_TOKEN"
  } > "$SHARED/web.env"
  umask 022
}

install_backend_packages() {
  local backend="$INCOMING/backend"
  if [ -d "$APP/backend/node_modules" ] && cmp -s "$APP/backend/package-lock.json" "$backend/package-lock.json"; then
    log "Shop packages unchanged, reusing them"
    cp -al "$APP/backend/node_modules" "$backend/node_modules"
  else
    log "Installing shop packages"
    (cd "$backend" && npm ci --omit=dev --ignore-scripts --no-audit --no-fund)
  fi
  ln -sfn "$SHARED/static" "$backend/static"
  ln -sfn "$SHARED/uploads" "$backend/uploads"
}

medusa_in_incoming() {
  (
    set -a
    . "$SHARED/backend.env"
    set +a
    export FONTS_DIR="$INCOMING/web/public/fonts"
    cd "$INCOMING/backend"
    node node_modules/@medusajs/cli/cli.js "$@"
  )
}

prepare_shop() {
  log "Migrating the shop database"
  medusa_in_incoming db:migrate
  log "Setting up the shop (seed on an empty database, storefront key)"
  medusa_in_incoming exec ./src/scripts/staging-setup.js
  if [ ! -f "$SHARED/state/admin-created" ]; then
    log "Creating the admin login $ADMIN_EMAIL"
    if medusa_in_incoming user -e "$ADMIN_EMAIL" -p "$STAGING_PASSWORD" > "$SHARED/state/admin-user.log" 2>&1 \
      || grep -qi "already exists" "$SHARED/state/admin-user.log"; then
      touch "$SHARED/state/admin-created"
    else
      cat "$SHARED/state/admin-user.log" >&2
      exit 1
    fi
  fi
}

start_processes() {
  pm2 delete tl-staging-backend > /dev/null 2>&1 || true
  pm2 delete tl-staging-web > /dev/null 2>&1 || true
  pm2 start "$APP/deploy/run-backend.sh" --name tl-staging-backend --interpreter bash --time
  pm2 start "$APP/deploy/run-web.sh" --name tl-staging-web --interpreter bash --time
  pm2 save --force
}

wait_for() {
  local name="$1" url="$2" auth="${3:-}"
  local i
  for i in $(seq 1 90); do
    if curl -fsS -o /dev/null ${auth:+-u "$auth"} "$url"; then
      log "$name answers"
      return 0
    fi
    sleep 2
  done
  log "$name did not answer at $url"
  return 1
}

healthy() {
  wait_for "Shop" "http://127.0.0.1:$API_PORT/health" \
    && wait_for "Site" "http://127.0.0.1:$WEB_PORT/" "$SITE_LOGIN:$STAGING_PASSWORD"
}

keep_after_reboot() {
  if ! command -v crontab > /dev/null 2>&1; then
    log "crontab is not available: after a server reboot run this deploy again from GitHub Actions"
    return
  fi
  local line="@reboot PM2_HOME=$PM2_HOME $PM2_DIR/node_modules/.bin/pm2 resurrect"
  if ! crontab -l 2>/dev/null | grep -Fq "$PM2_DIR/node_modules/.bin/pm2 resurrect"; then
    (crontab -l 2>/dev/null; echo "$line") | crontab -
  fi
}

main() {
  [ -d "$INCOMING/backend" ] && [ -d "$INCOMING/web" ] && [ -d "$INCOMING/deploy" ] \
    || { echo "No new build in $INCOMING" >&2; exit 1; }
  load_settings
  install_node
  export PATH="$NODE_DIR/bin:$PATH"
  install_pm2
  write_env_files
  install_backend_packages
  prepare_shop
  chmod +x "$INCOMING/deploy/"*.sh

  log "Switching to the new build"
  rm -rf "$PREVIOUS"
  [ -d "$APP" ] && mv "$APP" "$PREVIOUS"
  mv "$INCOMING" "$APP"
  mkdir -p "$INCOMING"
  start_processes

  if ! healthy; then
    pm2 logs --nostream --lines 80 || true
    if [ -d "$PREVIOUS" ]; then
      log "Putting the previous build back"
      rm -rf "$INCOMING"
      mv "$APP" "$INCOMING"
      mv "$PREVIOUS" "$APP"
      start_processes
    fi
    exit 1
  fi
  keep_after_reboot
  log "Staging is up: https://$SITE_DOMAIN (shop admin https://$API_DOMAIN/app)"
}

main "$@"
