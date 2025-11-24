#!/bin/bash

# Type Generator Helper Script
# This script loads environment variables and runs the type generator

set -e

# Get the root directory
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"

# Load environment variables
if [ -f "$ROOT_DIR/.env" ]; then
  export $(grep -v '^#' "$ROOT_DIR/.env" | xargs)
  echo "✅ Loaded environment from .env"
elif [ -f "$ROOT_DIR/.env.local" ]; then
  export $(grep -v '^#' "$ROOT_DIR/.env.local" | xargs)
  echo "✅ Loaded environment from .env.local"
elif [ -f "$ROOT_DIR/apps/admin/.env.local" ]; then
  export $(grep -v '^#' "$ROOT_DIR/apps/admin/.env.local" | xargs)
  echo "✅ Loaded environment from apps/admin/.env.local"
else
  echo "⚠️  No .env file found. Using system environment variables."
fi

# Check if CONVEX_URL is set
if [ -z "$CONVEX_URL" ] && [ -z "$NEXT_PUBLIC_CONVEX_URL" ]; then
  echo ""
  echo "❌ Error: CONVEX_URL not found"
  echo ""
  echo "Please set CONVEX_URL in one of the following ways:"
  echo "  1. Create a .env file in the root:"
  echo "     echo 'CONVEX_URL=https://your-deployment.convex.cloud' > .env"
  echo ""
  echo "  2. Export it in your shell:"
  echo "     export CONVEX_URL=https://your-deployment.convex.cloud"
  echo ""
  exit 1
fi

# Run the generator
cd "$ROOT_DIR"
pnpm --filter @repo/type-generator generate

