param(
    [Parameter(Position=0)][ValidateSet('build','start','verify','status','stop')][string]$Action = 'status',
    [Parameter(ValueFromRemainingArguments=$true)][string[]]$Options
)
$ErrorActionPreference = 'Stop'
$python = Get-Command python -ErrorAction Stop
& $python.Source (Join-Path $PSScriptRoot 'native_backend.py') $Action @Options
exit $LASTEXITCODE
