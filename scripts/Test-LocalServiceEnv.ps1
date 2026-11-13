# Verify the same module .env files used when running the services from an IDE.
$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot
Set-Location $repo
& (Join-Path $PSScriptRoot 'Start-BakerySubscription.ps1') -InfrastructureOnly -NoBuild
$java = (Get-Command java -ErrorAction Stop).Source
$processes = [System.Collections.Generic.List[System.Diagnostics.Process]]::new()
try {
    foreach ($module in @('bakery-service', 'subscription-service')) {
        $directory = Join-Path $repo "backend/$module"
        $jar = Join-Path $directory "target/$module-0.0.1-SNAPSHOT-exec.jar"
        if (-not (Test-Path -LiteralPath $jar)) { throw "Package $module before checking local environment files." }
        $process = Start-Process -FilePath $java -ArgumentList ('-jar "' + $jar + '"') `
            -WorkingDirectory $directory -WindowStyle Hidden -PassThru `
            -RedirectStandardOutput (Join-Path $directory 'target/local-env.stdout.log') `
            -RedirectStandardError (Join-Path $directory 'target/local-env.stderr.log')
        $processes.Add($process)
    }
    $deadline = [datetime]::UtcNow.AddMinutes(2)
    foreach ($uri in @('http://localhost:8082/v3/api-docs', 'http://localhost:8084/api/v1/subscription-plans')) {
        $ready = $false
        while ([datetime]::UtcNow -lt $deadline) {
            if ($processes | Where-Object { $_.HasExited }) { throw 'A local Java service exited; inspect target/local-env logs.' }
            try {
                $response = Invoke-WebRequest -Uri $uri -TimeoutSec 5 -SkipHttpErrorCheck
                if ([int]$response.StatusCode -eq 200) { $ready = $true; break }
            } catch { }
            Start-Sleep -Seconds 2
        }
        if (-not $ready) { throw 'Local Java services did not become ready with module .env files.' }
    }
    & (Join-Path $PSScriptRoot 'Test-LocalJwt.ps1') -BakerySubscriptionOnly -WithStorage -ComposeProject bakery-owner-dev
    Write-Output 'LOCAL ENV VERIFICATION PASSED: host Java + Docker PostgreSQL/MinIO/Identity'
} finally {
    foreach ($process in $processes) {
        if (-not $process.HasExited) { Stop-Process -Id $process.Id -ErrorAction SilentlyContinue }
        $process.Dispose()
    }
}
