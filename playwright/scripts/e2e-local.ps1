# Builds the app with Node 12 and runs the Playwright tests with Node 20, using nvm-windows.
# nvm-windows switches Node for the whole machine, so the two steps run one after the other.
# Usage (from the playwright folder):  npm run e2e:local   or   .\scripts\e2e-local.ps1 -Project chromium
param(
  [string]$Project = 'chromium',
  [string]$TestNode = '20',
  [switch]$SkipBuild
)

$ErrorActionPreference = 'Stop'
$root = Resolve-Path (Join-Path $PSScriptRoot '..\..')
$appNode = (Get-Content (Join-Path $root '.nvmrc')).Trim()

if (-not $SkipBuild) {
  Write-Host "Building the app with Node $appNode" -ForegroundColor Cyan
  nvm use $appNode | Out-Host
  Push-Location $root
  try {
    if (-not (Test-Path 'node_modules')) { npm ci; if ($LASTEXITCODE) { throw 'npm ci failed' } }
    npx ng build --prod
    if ($LASTEXITCODE) { throw 'ng build failed' }
  } finally { Pop-Location }
}

Write-Host "Running Playwright with Node $TestNode" -ForegroundColor Cyan
nvm use $TestNode | Out-Host
Push-Location (Join-Path $root 'playwright')
try {
  if (-not (Test-Path 'node_modules')) { npm ci; if ($LASTEXITCODE) { throw 'npm ci failed' } }
  npx playwright test --project=$Project
  exit $LASTEXITCODE
} finally { Pop-Location }
