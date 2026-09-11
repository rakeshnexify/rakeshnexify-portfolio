#!/usr/bin/env bash
set -Eeuo pipefail

ACTION="${1:-}"
COMMIT="${2:-}"
ARCHIVE="${3:-}"

APP="/home8/uniquick/rakeshnexify-app"
REPO="/home8/uniquick/rakeshnexify-repo"
NODE_ENV_DIR="/home8/uniquick/nodevenv/rakeshnexify-app/24"
DEPLOY_ROOT="/home8/uniquick/rakeshnexify-deploy"
BACKUPS="$DEPLOY_ROOT/backups"
STAGING="$DEPLOY_ROOT/staging"
STATE_ROOT="$DEPLOY_ROOT/pending"

fail() {
  echo "ERROR: $*" >&2
  exit 1
}

validate_commit() {
  [[ "$COMMIT" =~ ^[0-9a-f]{40}$ ]] || fail "Invalid commit."
}

validate_common() {
  validate_commit
  [[ -d "$APP" ]] || fail "Production app missing."
  [[ -d "$REPO/.git" ]] || fail "cPanel Git repository missing."
  [[ -f "$APP/server/passenger.cjs" ]] || fail "Passenger bootstrap missing."
  [[ -x "$NODE_ENV_DIR/bin/node" ]] || fail "CloudLinux Node binary missing."
  [[ -x "$NODE_ENV_DIR/bin/npm" ]] || fail "CloudLinux npm binary missing."

  for tool in git tar cp mv rm mkdir touch grep find sort awk xargs cat; do
    command -v "$tool" >/dev/null 2>&1 || fail "Required tool missing: $tool"
  done
}

state_dir() {
  printf '%s/%s' "$STATE_ROOT" "$COMMIT"
}

read_state() {
  local dir
  dir="$(state_dir)"
  [[ -d "$dir" ]] || fail "Pending deployment state not found for $COMMIT."

  BACKUP_PATH="$(cat "$dir/backup")"
  OLD_MODULES_PATH="$(cat "$dir/old-modules")"
  ARCHIVE_PATH="$(cat "$dir/archive")"
  HAD_OLD_MODULES="$(cat "$dir/had-old-modules")"
  HAD_DEPLOYED_MARKER="$(cat "$dir/had-deployed-marker")"

  [[ "$BACKUP_PATH" == "$BACKUPS/"* ]] || fail "Invalid backup state."
  [[ "$OLD_MODULES_PATH" == "$DEPLOY_ROOT/rollback-node_modules-"* ]] || fail "Invalid node_modules state."
  [[ "$ARCHIVE_PATH" == "$DEPLOY_ROOT/incoming/"* ]] || fail "Invalid archive state."
  [[ "$HAD_OLD_MODULES" =~ ^[01]$ ]] || fail "Invalid node_modules flag."
  [[ "$HAD_DEPLOYED_MARKER" =~ ^[01]$ ]] || fail "Invalid deployed-marker flag."
}

restore_release() {
  read_state

  echo "==> Restoring previous production release"
  rm -rf "$APP/client/dist" "$APP/server/src" "$APP/server/node_modules"
  tar -xzf "$BACKUP_PATH" -C "$APP"

  if [[ "$HAD_OLD_MODULES" -eq 1 ]]; then
    [[ -d "$OLD_MODULES_PATH" ]] || fail "Rollback node_modules missing."
    mv "$OLD_MODULES_PATH" "$APP/server/node_modules"
  fi

  if [[ "$HAD_DEPLOYED_MARKER" -eq 0 ]]; then
    rm -f "$APP/.deployed-commit"
  fi

  touch "$APP/tmp/restart.txt"
}

prune_old_artifacts() {
  find "$BACKUPS" -maxdepth 1 -type f -name 'pre-*.tgz' -printf '%T@ %p\n' 2>/dev/null |
    sort -nr |
    awk 'NR>5 {sub(/^[^ ]+ /,""); print}' |
    xargs -r rm -f

  find "$DEPLOY_ROOT/incoming" -maxdepth 1 -type f -name 'rnx-*.tgz' -mtime +1 -delete 2>/dev/null || true
}

deploy_release() {
  validate_common
  [[ -f "$ARCHIVE" ]] || fail "Release archive not found."

  export PATH="$NODE_ENV_DIR/bin:$PATH"
  export NODE_ENV="production"

  cd "$REPO"
  [[ -z "$(git status --porcelain)" ]] || fail "Remote Git clone is dirty."
  [[ "$(git rev-parse HEAD)" == "$COMMIT" ]] || fail "Remote Git HEAD does not match deployment commit."

  mkdir -p "$BACKUPS" "$STAGING" "$STATE_ROOT" "$APP/client" "$APP/server" "$APP/tmp"

  if find "$STATE_ROOT" -mindepth 1 -maxdepth 1 -type d -print -quit | grep -q .; then
    fail "Another deployment is pending external verification."
  fi

  local stamp backup stage old_modules dir
  local had_old_modules=0
  local had_deployed_marker=0
  local mutated=0

  stamp="$(date +%Y%m%d-%H%M%S)"
  backup="$BACKUPS/pre-$COMMIT-$stamp.tgz"
  stage="$STAGING/$COMMIT-$stamp"
  old_modules="$DEPLOY_ROOT/rollback-node_modules-$COMMIT-$stamp"
  dir="$(state_dir)"

  cleanup_stage() {
    rm -rf "$stage" 2>/dev/null || true
  }

  internal_rollback() {
    local code=$?
    trap - ERR
    set +e

    if [[ "$mutated" -eq 1 && -d "$dir" ]]; then
      echo "==> Remote apply failed. Restoring previous release."
      restore_release
      local restore_code=$?
      if [[ "$restore_code" -eq 0 ]]; then
        echo "ROLLBACK ACTION PASS: Previous files restored; external health verification is required."
      else
        echo "ROLLBACK ACTION CRITICAL: Failed to restore previous files." >&2
      fi
    fi

    rm -rf "$dir" 2>/dev/null || true
    rm -f "$ARCHIVE" 2>/dev/null || true
    cleanup_stage
    exit "$code"
  }

  trap cleanup_stage EXIT
  trap internal_rollback ERR

  mkdir -p "$stage"

  echo "==> Validating release archive"
  tar -tzf "$ARCHIVE" >/dev/null

  echo "==> Extracting staged release"
  tar -xzf "$ARCHIVE" -C "$stage"

  [[ -f "$stage/client/dist/index.html" ]] || fail "Staged client dist missing."
  [[ -d "$stage/server/src" ]] || fail "Staged server/src missing."
  [[ -f "$stage/server/package.json" ]] || fail "Staged server package.json missing."
  [[ -f "$stage/server/package-lock.json" ]] || fail "Staged server package-lock.json missing."
  [[ -f "$stage/server/passenger.cjs" ]] || fail "Staged passenger.cjs missing."
  [[ ! -e "$stage/.env" ]] || fail "Release contains root .env."
  [[ ! -e "$stage/client/.env" ]] || fail "Release contains client .env."
  [[ ! -e "$stage/server/.env" ]] || fail "Release contains server .env."

  if git diff --no-index --quiet -- "$stage/server/package.json" "$APP/server/package.json" &&
     git diff --no-index --quiet -- "$stage/server/package-lock.json" "$APP/server/package-lock.json"; then
    echo "==> Reusing current production server dependencies (manifests unchanged)"
    [[ -d "$APP/server/node_modules" ]] || fail "Current production server node_modules missing."
    [[ -d "$APP/server/node_modules/dotenv" ]] || fail "Current production dotenv dependency missing."
    cp -a "$APP/server/node_modules" "$stage/server/node_modules"
  else
    echo "==> Server dependency manifests changed; validating CloudLinux npm before install"
    if ! npm --version >/dev/null 2>&1; then
      fail "CloudLinux npm is unavailable; dependency-changing deployment blocked before production mutation."
    fi

    echo "==> Installing production server dependencies in staging"
    (
      cd "$stage/server"
      npm ci --omit=dev --no-audit --no-fund
    )
  fi

  [[ -d "$stage/server/node_modules" ]] || fail "Staged server node_modules missing."
  [[ -d "$stage/server/node_modules/dotenv" ]] || fail "dotenv missing from staged server dependencies."

  echo "==> Creating rollback backup"
  backup_items=()
  for item in client/dist server/src server/package.json server/package-lock.json server/passenger.cjs .deployed-commit; do
    if [[ -e "$APP/$item" ]]; then
      backup_items+=("$item")
    fi
  done
  ( cd "$APP" && tar -czf "$backup" "${backup_items[@]}" )

  if [[ -d "$APP/server/node_modules" ]]; then
    had_old_modules=1
  fi
  if [[ -f "$APP/.deployed-commit" ]]; then
    had_deployed_marker=1
  fi

  mkdir -p "$dir"
  printf '%s\n' "$backup" > "$dir/backup"
  printf '%s\n' "$old_modules" > "$dir/old-modules"
  printf '%s\n' "$ARCHIVE" > "$dir/archive"
  printf '%s\n' "$had_old_modules" > "$dir/had-old-modules"
  printf '%s\n' "$had_deployed_marker" > "$dir/had-deployed-marker"

  echo "==> Installing staged application files"
  mutated=1

  if [[ "$had_old_modules" -eq 1 ]]; then
    rm -rf "$old_modules"
    mv "$APP/server/node_modules" "$old_modules"
  fi

  rm -rf "$APP/client/dist" "$APP/server/src"
  mv "$stage/client/dist" "$APP/client/dist"
  mv "$stage/server/src" "$APP/server/src"
  mv "$stage/server/node_modules" "$APP/server/node_modules"

  cp -f "$stage/server/package.json" "$APP/server/package.json"
  cp -f "$stage/server/package-lock.json" "$APP/server/package-lock.json"
  cp -f "$stage/server/passenger.cjs" "$APP/server/passenger.cjs"

  echo "$COMMIT" > "$APP/.deployed-commit"

  echo "==> Restarting Passenger"
  touch "$APP/tmp/restart.txt"

  trap - ERR

  # cleanup_stage closes over the function-local $stage variable.
  # Run it while $stage is still in scope, then remove the EXIT trap so
  # Bash does not invoke it after deploy_release returns under set -u.
  cleanup_stage
  trap - EXIT

  echo "PENDING_EXTERNAL_HEALTH: $COMMIT applied. Desktop must verify public health before finalize."
}

finalize_release() {
  validate_common
  read_state

  [[ -f "$APP/.deployed-commit" ]] || fail "Deployed commit marker missing."
  [[ "$(tr -cd '0-9a-fA-F' < "$APP/.deployed-commit")" == "$COMMIT" ]] || fail "Deployed commit marker mismatch."

  echo "==> Finalizing externally verified release"

  if [[ "$HAD_OLD_MODULES" -eq 1 ]]; then
    rm -rf "$OLD_MODULES_PATH"
  fi

  rm -f "$ARCHIVE_PATH"
  rm -rf "$(state_dir)"

  prune_old_artifacts
  echo "FINALIZE PASS: $COMMIT retained as production."
}

rollback_release() {
  validate_common
  read_state

  restore_release

  rm -f "$ARCHIVE_PATH"
  rm -rf "$(state_dir)"

  echo "ROLLBACK ACTION PASS: Previous release files restored and Passenger restart requested."
  echo "External desktop health verification is required."
}

case "$ACTION" in
  deploy)
    deploy_release
    ;;
  finalize)
    validate_commit
    finalize_release
    ;;
  rollback)
    validate_commit
    rollback_release
    ;;
  *)
    fail "Usage: $0 {deploy|finalize|rollback} <40-char-commit> [archive]"
    ;;
esac