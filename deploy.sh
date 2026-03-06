#!/usr/bin/env bash
set -euo pipefail

# Deploy DM Tool to Azure Static Web Apps

REPO_ROOT="$(cd "$(dirname "$0")" && pwd)"
FRONTEND_DIR="$REPO_ROOT/frontend"
API_DIR="$FRONTEND_DIR/api"

echo "==> Fetching deployment token..."
TOKEN=$(az staticwebapp secrets list \
  --name swa-dmtool-dev \
  --resource-group rg-dmtool-dev \
  --query "properties.apiKey" -o tsv)

if [ -z "$TOKEN" ]; then
  echo "ERROR: Failed to fetch token. Run 'az login' first."
  exit 1
fi

echo "==> Installing Python packages (Linux x86_64)..."
rm -rf "$API_DIR/.python_packages"
pip install -r "$API_DIR/requirements.txt" \
  --target "$API_DIR/.python_packages/lib/site-packages" \
  --platform manylinux2014_x86_64 \
  --only-binary=:all: \
  --python-version 3.10 \
  --quiet

echo "==> Building frontend..."
(cd "$FRONTEND_DIR" && npm run build)

echo "==> Deploying..."
(cd "$FRONTEND_DIR" && swa deploy ./dist/dm-tool/browser \
  --api-location ./api \
  --api-language python \
  --api-version 3.10 \
  --env production \
  --deployment-token "$TOKEN")

echo "==> Done! https://thankful-mud-016d3f303.6.azurestaticapps.net/"
