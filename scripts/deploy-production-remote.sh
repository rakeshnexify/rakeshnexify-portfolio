#!/usr/bin/env bash
set -Eeuo pipefail

COMMIT="${1:-}"
ARCHIVE="${2:-}"

APP="/home8/uniquick/rakeshnexify-app"
REPO="/home8/uniquick/rakeshnexify-repo"
NODE_ENV_DIR="/home8/uniquick/nodevenv/rakeshnexify-app/24"
DEPLOY_ROOT="/home8/uniquick/rakeshnexify-deploy"
BACKUPS="$DEPLOY_ROOT/backups"
STAGING="$DEPLOY_ROOT/staging"
SITE="https://rakeshnexify.com/api/health"

fail() {
  echo "ERROR: $*" >&2
  exit 1
}

[[ "$COMMIT" =~ ^[0-9a-f]{40}$ ]] || fail "Invalid commit."
[[ -f "$ARCHIVE" ]] || fail "Release archive not found."
[[ -d "$APP" ]] || fail "Production app missing."
[[ -d "$REPO/.git" ]] || fail "cPanel Git repository missing."
[[ -f "$APP/server/passenger.cjs" ]] || fail "Passenger bootstrap missing."

for tool in git tar curl cp mv rm mkdir touch sha256sum; do
  command -v "$tool" >/dev/null 2>&1 || fail "Required tool missing: $tool"
done

cd "$REPO"
[[ -z "$(git status --porcelain)" ]] || fail "Remote Git clone is dirty."
[[ "$(git rev-parse HEAD)" == "$COMMIT" ]] || fail "Remote Git HEAD does not match deployment commit."

source "$NODE_ENV_DIR/bin/activate"
command -v node >/dev/null 2>&1 || fail "Node environment unavailable."
command -v npm >/dev/null 2>&1 || fail "npm unavailable."

mkdir -p "$BACKUPS" "$STAGING" "$APP/client" "$APP/server" "$APP/tmp"

STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP="$BACKUPS/pre-$COMMIT-$STAMP.tgz"
STAGE="$STAGING/$COMMIT-$STAMP"

cleanup() {
  rm -rf "$STAGE" 2>/dev/null || true
}
trap cleanup EXIT

mkdir -p "$STAGE"

echo "==> Validating release archive"
tar -tzf "$ARCHIVE" >/dev/null

echo "==> Creating rollback backup"
backup_items=()
for item in package.json package-lock.json client/dist server/src server/package.json server/package-lock.json server/passenger.cjs; do
  if [[ -e "$APP/$item" ]]; then
    backup_items+=("$item")
  fi
done
( cd "$APP" && tar -czf "$BACKUP" "${backup_items[@]}" )

echo "==> Extracting staged release"
tar -xzf "$ARCHIVE" -C "$STAGE"

[[ -f "$STAGE/package.json" ]] || fail "Staged root package.json missing."
[[ -f "$STAGE/client/dist/index.html" ]] || fail "Staged client dist missing."
[[ -d "$STAGE/server/src" ]] || fail "Staged server/src missing."
[[ -f "$STAGE/server/passenger.cjs" ]] || fail "Staged passenger.cjs missing."
[[ ! -e "$STAGE/.env" ]] || fail "Release contains root .env."
[[ ! -e "$STAGE/client/.env" ]] || fail "Release contains client .env."
[[ ! -e "$STAGE/server/.env" ]] || fail "Release contains server .env."

old_root_lock=""
old_server_lock=""
[[ -f "$APP/package-lock.json" ]] && old_root_lock="$(sha256sum "$APP/package-lock.json" | awk '{print $1}')"
[[ -f "$APP/server/package-lock.json" ]] && old_server_lock="$(sha256sum "$APP/server/package-lock.json" | awk '{print $1}')"

rollback() {
  echo "==> Health check failed. Rolling back."
  rm -rf "$APP/client/dist" "$APP/server/src"
  tar -xzf "$BACKUP" -C "$APP"

  if [[ -f "$APP/package-lock.json" ]]; then
    (
      cd "$APP"
      npm install --omit=dev --no-audit --no-fund
    ) || true
  fi

  if [[ -f "$APP/server/package-lock.json" && -d "$APP/server/node_modules" ]]; then
    npm ci --omit=dev --no-audit --no-fund --prefix "$APP/server" || true
  fi

  touch "$APP/tmp/restart.txt"
  sleep 4
  if curl -fsS --max-time 15 "$SITE" >/dev/null; then
    echo "ROLLBACK PASS: Previous production release restored."
  else
    echo "ROLLBACK WARNING: Previous release restored but health check still fails." >&2
  fi
}
trap 'rollback' ERR

echo "==> Installing staged application files"
rm -rf "$APP/client/dist" "$APP/server/src"
mv "$STAGE/client/dist" "$APP/client/dist"
mv "$STAGE/server/src" "$APP/server/src"

cp -f "$STAGE/package.json" "$APP/package.json"
[[ -f "$STAGE/package-lock.json" ]] && cp -f "$STAGE/package-lock.json" "$APP/package-lock.json"
cp -f "$STAGE/server/package.json" "$APP/server/package.json"
[[ -f "$STAGE/server/package-lock.json" ]] && cp -f "$STAGE/server/package-lock.json" "$APP/server/package-lock.json"
cp -f "$STAGE/server/passenger.cjs" "$APP/server/passenger.cjs"

new_root_lock=""
new_server_lock=""
[[ -f "$APP/package-lock.json" ]] && new_root_lock="$(sha256sum "$APP/package-lock.json" | awk '{print $1}')"
[[ -f "$APP/server/package-lock.json" ]] && new_server_lock="$(sha256sum "$APP/server/package-lock.json" | awk '{print $1}')"

if [[ "$old_root_lock" != "$new_root_lock" ]]; then
  echo "==> Root dependencies changed"
  (
    cd "$APP"
    npm install --omit=dev --no-audit --no-fund
  )
fi

if [[ "$old_server_lock" != "$new_server_lock" ]]; then
  echo "==> Server dependencies changed"
  npm ci --omit=dev --no-audit --no-fund --prefix "$APP/server"
fi

echo "$COMMIT" > "$APP/.deployed-commit"

echo "==> Restarting Passenger"
touch "$APP/tmp/restart.txt"

echo "==> Production health check"
healthy=0
for attempt in 1 2 3 4 5 6 7 8 9 10; do
  if curl -fsS --max-time 15 "$SITE" | grep -q '"success":true'; then
    healthy=1
    break
  fi
  sleep 3
done

[[ "$healthy" -eq 1 ]] || false

trap - ERR

rm -f "$ARCHIVE"
find "$BACKUPS" -maxdepth 1 -type f -name 'pre-*.tgz' -printf '%T@ %p\n' 2>/dev/null |
  sort -nr |
  awk 'NR>5 {sub(/^[^ ]+ /,""); print}' |
  xargs -r rm -f

echo "PASS: $COMMIT is live and healthy."