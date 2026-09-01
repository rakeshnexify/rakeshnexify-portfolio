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
[[ -x "$NODE_ENV_DIR/bin/node" ]] || fail "CloudLinux Node binary missing."
[[ -x "$NODE_ENV_DIR/bin/npm" ]] || fail "CloudLinux npm binary missing."

for tool in git tar curl cp mv rm mkdir touch grep; do
  command -v "$tool" >/dev/null 2>&1 || fail "Required tool missing: $tool"
done

export PATH="$NODE_ENV_DIR/bin:$PATH"
export NODE_ENV="production"

cd "$REPO"
[[ -z "$(git status --porcelain)" ]] || fail "Remote Git clone is dirty."
[[ "$(git rev-parse HEAD)" == "$COMMIT" ]] || fail "Remote Git HEAD does not match deployment commit."

curl -fsS --max-time 15 "$SITE" | grep -q '"success":true' || fail "Current production is not healthy."

mkdir -p "$BACKUPS" "$STAGING" "$APP/client" "$APP/server" "$APP/tmp"

STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP="$BACKUPS/pre-$COMMIT-$STAMP.tgz"
STAGE="$STAGING/$COMMIT-$STAMP"
OLD_MODULES="$DEPLOY_ROOT/rollback-node_modules-$COMMIT-$STAMP"
MUTATED=0
HAD_OLD_MODULES=0

cleanup() {
  rm -rf "$STAGE" 2>/dev/null || true
}
trap cleanup EXIT

rollback() {
  local code=$?
  if [[ "$MUTATED" -eq 1 ]]; then
    echo "==> Deployment failed. Rolling back."
    rm -rf "$APP/client/dist" "$APP/server/src" "$APP/server/node_modules"
    tar -xzf "$BACKUP" -C "$APP"

    if [[ "$HAD_OLD_MODULES" -eq 1 && -d "$OLD_MODULES" ]]; then
      mv "$OLD_MODULES" "$APP/server/node_modules"
    fi

    touch "$APP/tmp/restart.txt"
    sleep 4

    if curl -fsS --max-time 15 "$SITE" | grep -q '"success":true'; then
      echo "ROLLBACK PASS: Previous production release restored."
    else
      echo "ROLLBACK WARNING: Previous release restored but health check still fails." >&2
    fi
  fi
  exit "$code"
}
trap rollback ERR

mkdir -p "$STAGE"

echo "==> Validating release archive"
tar -tzf "$ARCHIVE" >/dev/null

echo "==> Extracting staged release"
tar -xzf "$ARCHIVE" -C "$STAGE"

[[ -f "$STAGE/client/dist/index.html" ]] || fail "Staged client dist missing."
[[ -d "$STAGE/server/src" ]] || fail "Staged server/src missing."
[[ -f "$STAGE/server/package.json" ]] || fail "Staged server package.json missing."
[[ -f "$STAGE/server/package-lock.json" ]] || fail "Staged server package-lock.json missing."
[[ -f "$STAGE/server/passenger.cjs" ]] || fail "Staged passenger.cjs missing."
[[ ! -e "$STAGE/.env" ]] || fail "Release contains root .env."
[[ ! -e "$STAGE/client/.env" ]] || fail "Release contains client .env."
[[ ! -e "$STAGE/server/.env" ]] || fail "Release contains server .env."

echo "==> Installing production server dependencies in staging"
(
  cd "$STAGE/server"
  npm ci --omit=dev --no-audit --no-fund
)

[[ -d "$STAGE/server/node_modules" ]] || fail "Staged server node_modules missing."
[[ -d "$STAGE/server/node_modules/dotenv" ]] || fail "dotenv missing from staged server dependencies."

echo "==> Creating rollback backup"
backup_items=()
for item in client/dist server/src server/package.json server/package-lock.json server/passenger.cjs; do
  if [[ -e "$APP/$item" ]]; then
    backup_items+=("$item")
  fi
done
( cd "$APP" && tar -czf "$BACKUP" "${backup_items[@]}" )

echo "==> Installing staged application files"
MUTATED=1

if [[ -d "$APP/server/node_modules" ]]; then
  HAD_OLD_MODULES=1
  rm -rf "$OLD_MODULES"
  mv "$APP/server/node_modules" "$OLD_MODULES"
fi

rm -rf "$APP/client/dist" "$APP/server/src"
mv "$STAGE/client/dist" "$APP/client/dist"
mv "$STAGE/server/src" "$APP/server/src"
mv "$STAGE/server/node_modules" "$APP/server/node_modules"

cp -f "$STAGE/server/package.json" "$APP/server/package.json"
cp -f "$STAGE/server/package-lock.json" "$APP/server/package-lock.json"
cp -f "$STAGE/server/passenger.cjs" "$APP/server/passenger.cjs"

echo "$COMMIT" > "$APP/.deployed-commit"

echo "==> Restarting Passenger"
touch "$APP/tmp/restart.txt"

echo "==> Production health check"
healthy=0
for attempt in 1 2 3 4 5 6 7 8 9 10 11 12; do
  if curl -fsS --max-time 15 "$SITE" | grep -q '"success":true'; then
    healthy=1
    break
  fi
  sleep 3
done

[[ "$healthy" -eq 1 ]] || false

trap - ERR
MUTATED=0

rm -rf "$OLD_MODULES"
rm -f "$ARCHIVE"

find "$BACKUPS" -maxdepth 1 -type f -name 'pre-*.tgz' -printf '%T@ %p\n' 2>/dev/null |
  sort -nr |
  awk 'NR>5 {sub(/^[^ ]+ /,""); print}' |
  xargs -r rm -f

find "$DEPLOY_ROOT/incoming" -maxdepth 1 -type f -name 'rnx-*.tgz' -mtime +1 -delete 2>/dev/null || true

echo "PASS: $COMMIT is live and healthy."