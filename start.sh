#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
task_root="$PWD"
export PATH="$task_root/.tools/node_modules/node/bin:$task_root/.tools/node_modules/.bin:$PATH"
command -v codex >/dev/null || { echo 'Install the official Codex CLI and run codex login first.' >&2; exit 1; }
cd app
exec pnpm exec agent-native dev --host 127.0.0.1 --port 8081 --strictPort
