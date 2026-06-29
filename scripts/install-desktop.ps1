# Builds the LinkedIn Optimizer extension and launches the Claude Desktop installer.
# Usage:  powershell -ExecutionPolicy Bypass -File scripts\install-desktop.ps1
#
# Note: Claude Desktop installs .mcpb extensions through a confirmation dialog by
# design, so this can't be fully silent -- it builds the bundle, then opens it so
# the app's "Install" dialog appears. Click Install, then start a new chat.
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

Write-Host "==> Opening the installer in Claude Desktop..."
Start-Process $mcpb

Write-Host ""
Write-Host "When Claude Desktop shows the install dialog, click Install."
Write-Host "Then open a NEW chat and the LinkedIn Optimizer tools are available."
