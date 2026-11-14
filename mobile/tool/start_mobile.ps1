[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][string]$EvidenceDirectory,
    [string]$DeviceId = 'emulator-5554',
    [switch]$PrepareOnly
)
$ErrorActionPreference = 'Stop'
$repository = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$launcher = Join-Path $repository 'scripts/native_clients.py'
# Root .env supplies every public API origin and tool path. This entry point
# never reads legacy runtime bundles or starts container infrastructure.
& python $launcher android-start --state-dir $EvidenceDirectory --device $DeviceId
if ($LASTEXITCODE -ne 0) { throw 'Native Android preparation failed.' }
if ($PrepareOnly) { exit 0 }
& python $launcher mobile-run --state-dir $EvidenceDirectory --device $DeviceId
exit $LASTEXITCODE
