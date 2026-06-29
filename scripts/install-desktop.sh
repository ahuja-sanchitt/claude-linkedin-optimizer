#!/usr/bin/env bash
# Builds the LinkedIn Optimizer extension and launches the Claude Desktop installer.
# Usage:  bash scripts/install-desktop.sh
#
# Note: Claude Desktop installs .mcpb extensions through a confirmation dialog by
# design, so this can't be fully silent -- it builds the bundle, then opens it so
# the app's "Install" dialog appears. Click Install, then start a new chat.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MCPB_DIR="$ROOT/mcpb"

echo "==> Installing build dependencies..."
( cd "$MCPB_DIR" && npm install --silent )

echo "==> Building and packing the extension..."
( cd "$MCPB_DIR" && npm run pack )

MCPB="$MCPB_DIR/linkedin-optimizer.mcpb"
[ -f "$MCPB" ] || { echo "Pack failed: $MCPB not found." >&2; exit 1; }

echo "==> Opening the installer in Claude Desktop..."
open "$MCPB" 2>/dev/null || xdg-open "$MCPB" 2>/dev/null \
  || echo "Could not auto-open. Install it manually: Settings > Extensions > Install, then pick $MCPB"

echo ""
echo "When Claude Desktop shows the install dialog, click Install."
echo "Then open a NEW chat and the LinkedIn Optimizer tools are available."
