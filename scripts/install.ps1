# Installs the LinkedIn Optimizer MCP server into Claude Code (user scope).
# Usage:  powershell -ExecutionPolicy Bypass -File scripts\install.ps1
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot

Write-Host "==> Creating virtual environment..."
python -m venv "$root\.venv"
$py = "$root\.venv\Scripts\python.exe"

Write-Host "==> Installing dependencies..."
& $py -m pip install --quiet --upgrade pip
& $py -m pip install --quiet -r "$root\requirements.txt"

Write-Host "==> Registering server with Claude Code (user scope)..."
claude mcp add --scope user linkedin-optimizer -- "$py" "$root\server.py"

Write-Host ""
Write-Host "Done. Restart Claude Code, then run:  /linkedin-optimizer:optimize_linkedin"
