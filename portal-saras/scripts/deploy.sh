#!/bin/sh
set -e

printf "> Running S4RAS deployment on VM 208...\n"

MONOREPO_DIR="/home/portal/s4ras"
TARGET_DIR="/home/portal/Portal-SARAS"

if [ -d "$MONOREPO_DIR/.git" ]; then
  printf "> Syncing latest changes from monorepo (%s)...\n" "$MONOREPO_DIR"
  cd "$MONOREPO_DIR"
  git fetch origin main
  git reset --hard origin/main
  npm ci || npm install
  npm run build
  rsync -av --delete portal-saras/build/ "$TARGET_DIR/build/"
  rsync -av --delete portal-saras/scripts/ "$TARGET_DIR/scripts/"
  rsync -av --delete portal-saras/src/ "$TARGET_DIR/src/"
  rsync -av --delete portal-saras/public/ "$TARGET_DIR/public/"
  cp portal-saras/package.json "$TARGET_DIR/package.json"
  cp portal-saras/vite.config.mjs "$TARGET_DIR/vite.config.mjs"
else
  REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || echo ".")"
  cd "$REPO_ROOT"
  npm run build
fi

printf "> Restarting PM2 service portal-prod\n"
pm2 reload portal-prod --update-env

printf "> S4RAS Deployment complete\n"
