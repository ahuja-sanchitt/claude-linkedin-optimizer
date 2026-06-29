#!/usr/bin/env bash
# Builds the LinkedIn Optimizer extension and reveals the .mcpb to install.
# Usage:  bash scripts/install-desktop.sh
#
# Claude Desktop installs .mcpb extensions from its own UI, so the final step is
# manual on purpose: this builds the bundle and tells you where to load it from.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MCPB_DIR="$ROOT/mcpb"

echo "==> Installing build dependencies..."
( cd "$MCPB_DIR" && npm install --silent )

echo "==> Building and packing the extension..."
( cd "$MCPB_DIR" && npm run pack )

MCPB="$MCPB_DIR/linkedin-optimizer.mcpb"
[ -f "$MCPB" ] || { echo "Pack failed: $MCPB not found." >&2; exit 1; }

# Reveal the file in the file manager (best-effort).
open -R "$MCPB" 2>/dev/null || xdg-open "$MCPB_DIR" 2>/dev/null || true

echo ""
echo "Built: $MCPB"
echo ""
echo "To install in Claude Desktop:"
echo "  Settings > Extensions (Desktop app) > Advanced settings > Install Extension"
echo "  then select the file above. Start a new chat afterward."
