#!/bin/sh
set -e

cd "$(git rev-parse --show-toplevel)"

printf "> Running portal deployment...\n"

printf "> Building React app\n"
# Ensure the backend API env var is set for the build (React bakes REACT_APP_* at build time)
export REACT_APP_BACKEND_API_URL=${REACT_APP_BACKEND_API_URL:-https://api.s4ras.site}
echo "> Using REACT_APP_BACKEND_API_URL=$REACT_APP_BACKEND_API_URL"
export REACT_APP_DEPLOY_TOKEN=${REACT_APP_DEPLOY_TOKEN:?"REACT_APP_DEPLOY_TOKEN must be set"}
echo "> Deploy token configured"
npm run build

printf "> Restarting PM2 service portal-prod\n"
if pm2 describe portal-prod > /dev/null 2>&1; then
  # reload to pick up updated environment variables from ecosystem file
  pm2 startOrReload ecosystem.config.js
else
  pm2 startOrReload ecosystem.config.js
fi

printf "> Deployment complete\n"
