#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
task_root="$PWD"
npm install --prefix .tools --no-audit --no-fund node@22.22.0 pnpm@10.29.1
export PATH="$task_root/.tools/node_modules/node/bin:$task_root/.tools/node_modules/.bin:$PATH"
pnpm --dir app install --frozen-lockfile
cd app
PLAYWRIGHT_BROWSERS_PATH="$task_root/.browsers" pnpm exec playwright-core install chromium
printf '\nProofDeck installed. Run codex login if needed, then ./start.sh from the project root.\n'
