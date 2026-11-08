[CmdletBinding()]
param(
    [string]$RuntimeDirectory = '',
    [string]$DeviceId = '',
    [string]$AvdId = '',
    [switch]$PrepareOnly,
    [switch]$NoResident
)
$ErrorActionPreference = 'Stop'
$mobileDirectory = Split-Path $PSScriptRoot -Parent
Set-Location -LiteralPath $mobileDirectory
$runtimeArguments = @('-B', (Join-Path $PSScriptRoot 'start_local_runtime.py'))
if ($RuntimeDirectory) { $runtimeArguments += @('--runtime', $RuntimeDirectory) }
& python @runtimeArguments
if ($LASTEXITCODE -ne 0) { throw 'Backend readiness failed. Flutter was not started.' }
$runtimeState = Get-Content -LiteralPath 'docs/evidence/docker-api-diagnostic/runtime-start.json' -Raw | ConvertFrom-Json
$adbExecutable = (Get-Command adb -ErrorAction Stop).Source
$androidSdk = Split-Path (Split-Path $adbExecutable -Parent) -Parent
$emulatorExecutable = Join-Path $androidSdk 'emulator/emulator.exe'
if (-not (Test-Path -LiteralPath $emulatorExecutable)) { throw 'Emulator executable missing in the SDK that provides adb.' }
function Get-EmulatorsByState([string]$DesiredState) {
    foreach ($deviceLine in (& $adbExecutable devices)) {
        $deviceColumns = $deviceLine.Split([char[]]@([char]9, [char]32), [System.StringSplitOptions]::RemoveEmptyEntries)
        if ($deviceColumns.Count -ge 2 -and $deviceColumns[0] -like 'emulator-*' -and $deviceColumns[1] -eq $DesiredState) {
            Write-Output $deviceColumns[0]
        }
    }
}
function Get-OnlineEmulators { Get-EmulatorsByState 'device' }
$online = @(Get-OnlineEmulators)
if (-not $DeviceId -and $online.Count -eq 1) { $DeviceId = $online[0] }
if (-not $DeviceId -and $online.Count -gt 1) { throw 'Several emulators are online. Select -DeviceId from adb devices -l.' }
if (-not $DeviceId) {
    if (@(Get-EmulatorsByState 'offline').Count -gt 0) { throw 'An emulator is offline. Recover or cold boot that AVD before starting another instance.' }
    $installedAvds = @((& $emulatorExecutable -list-avds) | Where-Object { $_ -match '^[A-Za-z0-9_.-]+$' })
    if (-not $AvdId -and $installedAvds.Count -eq 1) { $AvdId = $installedAvds[0] }
    if (-not $AvdId -or $AvdId -notin $installedAvds) { throw 'Select -AvdId from emulator -list-avds.' }
    Start-Process -FilePath $emulatorExecutable -ArgumentList @('-avd', $AvdId, '-no-boot-anim') -WindowStyle Hidden
    for ($attempt = 0; $attempt -lt 90; $attempt++) {
        $online = @(Get-OnlineEmulators)
        if ($online.Count -eq 1) { $DeviceId = $online[0]; break }
        Start-Sleep -Seconds 2
    }
}
if (-not $DeviceId) { throw 'No online emulator became available.' }
$booted = $false
for ($attempt = 0; $attempt -lt 90; $attempt++) {
    $boot = (& $adbExecutable -s $DeviceId shell getprop sys.boot_completed 2>$null) -join ''
    $animation = (& $adbExecutable -s $DeviceId shell getprop init.svc.bootanim 2>$null) -join ''
    if ($boot.Trim() -eq '1' -and $animation.Trim() -eq 'stopped') { $booted = $true; break }
    Start-Sleep -Seconds 2
}
if (-not $booted) { throw 'Android has not finished booting. No Flutter install was attempted.' }
$ports = @($runtimeState.services.PSObject.Properties | ForEach-Object { [int]$_.Value.port } | Sort-Object -Unique)
foreach ($port in $ports) {
    & $adbExecutable -s $DeviceId reverse "tcp:$port" "tcp:$port"
    if ($LASTEXITCODE -ne 0) { throw "ADB reverse failed for port $port." }
}
& $adbExecutable -s $DeviceId reverse --list
$identityPort = $runtimeState.services.'mobile-identity'.port
$bakeryPort = $runtimeState.services.'mobile-bakery'.port
$subscriptionPort = $runtimeState.services.'mobile-subscription'.port
$flutterArguments = @('run', '-d', $DeviceId, '--debug',
    "--dart-define=IDENTITY_URL=http://127.0.0.1:$identityPort",
    "--dart-define=BAKERY_URL=http://127.0.0.1:$bakeryPort",
    "--dart-define=SUBSCRIPTION_URL=http://127.0.0.1:$subscriptionPort")
if ($NoResident) { $flutterArguments += '--no-resident' }
[ordered]@{ deviceId=$DeviceId; androidSdk=$androidSdk; bootCompleted=$boot.Trim(); bootAnimation=$animation.Trim(); ports=$ports; publicFlutterArguments=$flutterArguments; prepareOnly=[bool]$PrepareOnly } |
    ConvertTo-Json -Depth 4 | Set-Content -LiteralPath 'docs/evidence/docker-api-diagnostic/mobile-start.json' -Encoding UTF8
if ($PrepareOnly) { Write-Output 'Backend, Android boot and adb reverse are ready.'; exit 0 }
& flutter pub get
if ($LASTEXITCODE -ne 0) { throw 'flutter pub get failed.' }
& flutter @flutterArguments
exit $LASTEXITCODE
