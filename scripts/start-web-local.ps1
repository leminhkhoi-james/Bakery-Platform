# Web thật dùng proxy dev hiện có; Gateway backend còn thiếu implementation.
$ErrorActionPreference = 'Stop'
Set-Location (Join-Path (Split-Path -Parent $PSScriptRoot) 'frontend')
$env:DEV_IDENTITY_TARGET = 'http://localhost:18081'
$env:DEV_BAKERY_TARGET = 'http://localhost:18082'
$env:DEV_MARKETPLACE_TARGET = 'http://localhost:18083'
$env:DEV_SUBSCRIPTION_TARGET = 'http://localhost:18084'
$env:DEV_CAKE_AI_TARGET = 'http://localhost:18085'
$env:DEV_ORDER_TARGET = 'http://localhost:18086'
$env:DEV_CHAT_TARGET = 'http://localhost:18087'
if (-not (Test-Path -LiteralPath 'node_modules')) {
    & npm.cmd ci --no-audit --no-fund
    if ($LASTEXITCODE -ne 0) { throw 'Không cài được dependency frontend từ lockfile.' }
}
& npm.cmd run dev -- --host 127.0.0.1 --strictPort
exit $LASTEXITCODE
