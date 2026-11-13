[CmdletBinding()]
param(
    [string]$RuntimeDirectory = '',
    [string]$DeviceId = '',
    [string]$AvdId = '',
    [string]$EvidenceDirectory = '',
    [string]$CakeAiUrl = '',
    [string]$ChatStorageUrl = 'http://localhost:19006',
    [ValidateSet('unknown','local-fallback','provider-configured')]
    [string]$CakeAiMode = 'unknown',
    [switch]$PrepareOnly,
    [switch]$NoResident,
    [switch]$ReuseRunningServices,
    [switch]$LegacyPhases14
)
$ErrorActionPreference = 'Stop'
$mobileDirectory = Split-Path $PSScriptRoot -Parent
Set-Location -LiteralPath $mobileDirectory
$phase5Runtime = -not $LegacyPhases14 -and -not $RuntimeDirectory
if ($ReuseRunningServices -and (-not $phase5Runtime -or -not $CakeAiUrl -or -not $EvidenceDirectory)) {
    throw 'Explicit running-stack reuse requires CakeAiUrl and isolated EvidenceDirectory in the six-service mode.'
}
$runtimeTool = if ($phase5Runtime) { 'phase5_stack.py' } else { 'start_local_runtime.py' }
$runtimeArguments = @('-B', (Join-Path $PSScriptRoot $runtimeTool))
if ($phase5Runtime) { $runtimeArguments += '--start' }
if ($EvidenceDirectory) {
    if (-not $phase5Runtime) { throw 'Isolated evidence output currently requires the six-service runtime.' }
    $resolvedEvidence = [System.IO.Path]::GetFullPath((Join-Path $mobileDirectory $EvidenceDirectory))
    if (-not $resolvedEvidence.StartsWith($mobileDirectory + [System.IO.Path]::DirectorySeparatorChar, [System.StringComparison]::OrdinalIgnoreCase)) { throw 'Evidence directory must stay inside mobile.' }
    $runtimeArguments += @('--output', $resolvedEvidence, '--reuse-only')
}
if ($ReuseRunningServices) {
    $runtimeArguments = @('-B', (Join-Path $PSScriptRoot 'cake_ai_readiness.py'), '--output', $resolvedEvidence)
}
if ($RuntimeDirectory) { $runtimeArguments += @('--runtime', $RuntimeDirectory) }
& python @runtimeArguments
if ($LASTEXITCODE -ne 0) { throw 'Backend readiness failed. Flutter was not started.' }
$runtimeReport = if ($phase5Runtime) { 'docs/evidence/phases-5a-5b-5c/runtime-start.json' } else { 'docs/evidence/docker-api-diagnostic/runtime-start.json' }
if ($EvidenceDirectory) { $runtimeReport = Join-Path $resolvedEvidence 'runtime-start.json' }
$runtimeState = Get-Content -LiteralPath $runtimeReport -Raw | ConvertFrom-Json
if ($CakeAiUrl) {
    $cakeOrigin = [uri]$CakeAiUrl
    if ($cakeOrigin.UserInfo -or $cakeOrigin.Query -or $cakeOrigin.Fragment -or $cakeOrigin.AbsolutePath -ne '/' -or $cakeOrigin.Host -notin @('127.0.0.1','localhost','10.0.2.2') -or $cakeOrigin.Scheme -ne 'http') {
        throw 'Local Cake AI URL must be a public loopback HTTP origin without credentials or path.'
    }
    $cakeHealth = Invoke-RestMethod -Uri ($CakeAiUrl.TrimEnd('/') + '/actuator/health/readiness') -TimeoutSec 5
    if ($cakeHealth.status -ne 'UP') { throw 'Cake AI is not application-ready.' }
}
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
    $deviceBoot = (& $adbExecutable -s $DeviceId shell getprop dev.bootcomplete 2>$null) -join ''
    # -no-boot-anim can leave init.svc.bootanim absent on a real cold boot.
    # Require both completed flags for that case; never accept a running animation.
    $animationReady = $animation.Trim() -eq 'stopped' -or (-not $animation.Trim() -and $deviceBoot.Trim() -eq '1')
    if ($boot.Trim() -eq '1' -and $animationReady) { $booted = $true; break }
    Start-Sleep -Seconds 2
}
if (-not $booted) { throw 'Android has not finished booting. No Flutter install was attempted.' }
$packageManagerReady = $false
for ($attempt = 0; $attempt -lt 15; $attempt++) {
    $packages = (& $adbExecutable -s $DeviceId shell pm path android 2>$null) -join ''
    if ($LASTEXITCODE -eq 0 -and $packages -match '^package:') { $packageManagerReady = $true; break }
    Start-Sleep -Seconds 1
}
if (-not $packageManagerReady) { throw 'Android PackageManager is not ready. No Flutter install was attempted.' }
$ports = if ($phase5Runtime) { @($runtimeState.services.PSObject.Properties | Where-Object { $_.Value.origin } | ForEach-Object { ([uri]$_.Value.origin).Port } | Sort-Object -Unique) } else { @($runtimeState.services.PSObject.Properties | ForEach-Object { [int]$_.Value.port } | Sort-Object -Unique) }
if ($CakeAiUrl) { $ports = @($ports + $cakeOrigin.Port | Sort-Object -Unique) }
if ($phase5Runtime -and $ChatStorageUrl) {
    $storageOrigin = [uri]$ChatStorageUrl
    if ($storageOrigin.UserInfo -or $storageOrigin.Query -or $storageOrigin.Fragment -or $storageOrigin.AbsolutePath -ne '/') {
        throw 'Chat storage URL must be an origin without credentials, path or signed query.'
    }
    if ($storageOrigin.Scheme -eq 'http' -and $storageOrigin.Host -in @('localhost','127.0.0.1')) {
        $ports = @($ports + $storageOrigin.Port | Sort-Object -Unique)
    } elseif ($storageOrigin.Scheme -ne 'https') {
        throw 'Use loopback HTTP with adb reverse or a public HTTPS Chat storage origin.'
    }
}
foreach ($port in $ports) {
    & $adbExecutable -s $DeviceId reverse "tcp:$port" "tcp:$port"
    if ($LASTEXITCODE -ne 0) { throw "ADB reverse failed for port $port." }
}
& $adbExecutable -s $DeviceId reverse --list
$flutterArguments = @('run', '-d', $DeviceId, '--debug')
if ($CakeAiUrl) { $flutterArguments += @("--dart-define=CAKE_AI_URL=$($CakeAiUrl.TrimEnd('/'))", "--dart-define=CAKE_AI_MODE=$CakeAiMode") }
if ($phase5Runtime) {
    foreach ($domain in @('identity','bakery','subscription','marketplace','order','chat')) {
        $origin = $runtimeState.services.PSObject.Properties["$domain-service"].Value.origin
        $flutterArguments += "--dart-define=$($domain.ToUpper())_URL=$origin"
    }
} else {
    foreach ($domain in @('identity','bakery','subscription')) {
        $port = $runtimeState.services.PSObject.Properties["mobile-$domain"].Value.port
        $flutterArguments += "--dart-define=$($domain.ToUpper())_URL=http://127.0.0.1:$port"
    }
}
if ($NoResident) { $flutterArguments += '--no-resident' }
[ordered]@{ deviceId=$DeviceId; androidSdk=$androidSdk; bootCompleted=$boot.Trim(); bootAnimation=$animation.Trim(); deviceBootComplete=$deviceBoot.Trim(); packageManagerReady=$packageManagerReady; ports=$ports; publicFlutterArguments=$flutterArguments; prepareOnly=[bool]$PrepareOnly } |
    ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $(if ($EvidenceDirectory) { Join-Path $resolvedEvidence 'mobile-start.json' } elseif ($phase5Runtime) { 'docs/evidence/phases-5a-5b-5c/mobile-start.json' } else { 'docs/evidence/docker-api-diagnostic/mobile-start.json' }) -Encoding UTF8
if ($PrepareOnly) { Write-Output 'Backend, Android boot and adb reverse are ready.'; exit 0 }
& flutter pub get
if ($LASTEXITCODE -ne 0) { throw 'flutter pub get failed.' }
& flutter @flutterArguments
exit $LASTEXITCODE
