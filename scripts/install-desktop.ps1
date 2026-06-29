# Builds the LinkedIn Optimizer extension and reveals the .mcpb to install.
# Usage:  powershell -ExecutionPolicy Bypass -File scripts\install-desktop.ps1
#
# Claude Desktop installs .mcpb extensions from its own UI, so the final step is
# manual on purpose: this builds the bundle and opens Explorer with the file
# selected, then tells you where to load it.
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$mcpbDir = Join-Path $root "mcpb"

Write-Host "==> Installing build dependencies..."
Push-Location $mcpbDir
npm install --silent

Write-Host "==> Building and packing the extension..."
npm run pack
Pop-Location

$mcpb = Join-Path $mcpbDir "linkedin-optimizer.mcpb"
if (-not (Test-Path $mcpb)) { throw "Pack failed: $mcpb not found." }

# Reveal the file in Explorer (reliable, unlike opening the .mcpb directly,
# which only works if .mcpb is associated with Claude Desktop).
Start-Process explorer.exe "/select,`"$mcpb`""

Write-Host ""
Write-Host "Built: $mcpb"
Write-Host ""
Write-Host "To install in Claude Desktop:"
Write-Host "  Settings > Extensions (Desktop app) > Advanced settings > Install Extension"
Write-Host "  then select the file above. Start a new chat afterward."
