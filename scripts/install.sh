#!/usr/bin/env bash
# Installs the LinkedIn Optimizer MCP server into Claude Code (user scope).
# Usage:  bash scripts/install.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "==> Creating virtual environment..."
python3 -m venv "$ROOT/.venv"
PY="$ROOT/.venv/bin/python"

echo "==> Installing dependencies..."
"$PY" -m pip install --quiet --upgrade pip
"$PY" -m pip install --quiet -r "$ROOT/requirements.txt"

echo "==> Registering server with Claude Code (user scope)..."
claude mcp add --scope user linkedin-optimizer -- "$PY" "$ROOT/server.py"

echo ""
echo "Done. Restart Claude Code, then run:  /linkedin-optimizer:optimize_linkedin"
