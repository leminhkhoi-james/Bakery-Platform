param([switch]$NoBuild, [switch]$LocalBuild, [switch]$InfrastructureOnly, [switch]$Verify, [switch]$Stop)
$ErrorActionPreference = 'Stop'
Set-Location (Split-Path -Parent $PSScriptRoot)

# Separate persistent volumes keep databases from the previous schema untouched.
$project = 'bakery-owner-dev'
$compose = @('-p', $project, '-f', 'compose.yaml', '-f', 'docker-compose.bakery-subscription.yml',
    '-f', 'docker-compose.order-service.yml', '-f', 'docker-compose.chat-service.yml',
    '-f', 'compose.services.yaml', '-f', 'compose.no-firebase.yaml')
$allServices = @('identity-service', 'bakery-service', 'subscription-service',
    'identity-db', 'bakery-db', 'subscription-db', 'bakery-storage', 'subscription-storage')
if ($Stop) {
    & docker compose @compose stop @allServices
    if ($LASTEXITCODE -ne 0) { throw 'Could not stop the Bakery/Subscription stack' }
    return
}

& docker info --format '{{.ServerVersion}}' > $null
if ($LASTEXITCODE -ne 0) { throw 'Start Docker Desktop with the Linux engine before running this script.' }
if ($LocalBuild) {
    if ($NoBuild) { throw 'Choose LocalBuild or NoBuild, not both.' }
    & mvn -o -f backend/pom.xml -pl identity-service,bakery-service,subscription-service -am -DskipTests package
    if ($LASTEXITCODE -ne 0) { throw 'Local Maven packaging failed; check the local dependency cache.' }
    foreach ($module in @('identity-service', 'bakery-service', 'subscription-service')) {
        $jar = Join-Path $PWD "backend/$module/target/$module-0.0.1-SNAPSHOT-exec.jar"
        if (-not (Test-Path -LiteralPath $jar)) { throw "Missing executable jar for $module" }
        $context = Join-Path $PWD "backend/$module/target/docker-runtime"
        $null = New-Item -ItemType Directory -Path $context -Force
        Copy-Item -LiteralPath $jar -Destination (Join-Path $context 'application.jar')
        Copy-Item -LiteralPath (Join-Path $PWD 'docker/java-local-runtime/Dockerfile') -Destination (Join-Path $context 'Dockerfile')
        [System.IO.File]::WriteAllText((Join-Path $context '.dockerignore'), "*`n!Dockerfile`n!application.jar`n")
    }
    $compose += '-f', 'compose.bakery-local-build.yaml'
}
& docker compose @compose config --quiet
if ($LASTEXITCODE -ne 0) { throw 'Compose configuration is incomplete; check the root .env and key file paths.' }
if ($InfrastructureOnly -and $Verify) { throw 'Verify requires the application containers; omit InfrastructureOnly.' }

$selected = if ($InfrastructureOnly) {
    @('identity-service', 'bakery-db', 'subscription-db', 'bakery-storage', 'subscription-storage')
} else { @('identity-service', 'bakery-service', 'subscription-service') }
if ($InfrastructureOnly) {
    & docker compose @compose stop bakery-service subscription-service
    if ($LASTEXITCODE -ne 0) { throw 'Could not release application ports for local Java execution.' }
}
$up = @('up', '-d')
if ($NoBuild) { $up += '--no-build' } else { $up += '--build' }
& docker compose @compose @up @selected
if ($LASTEXITCODE -ne 0) { throw 'Could not start the Bakery/Subscription development stack.' }

$urls = @('http://localhost:8081/.well-known/jwks.json')
if (-not $InfrastructureOnly) {
    $urls += 'http://localhost:8082/v3/api-docs', 'http://localhost:8084/api/v1/subscription-plans'
}
$deadline = [datetime]::UtcNow.AddMinutes(3)
foreach ($url in $urls) {
    $ready = $false
    while ([datetime]::UtcNow -lt $deadline) {
        try {
            $response = Invoke-WebRequest -Uri $url -TimeoutSec 5 -SkipHttpErrorCheck
            if ([int]$response.StatusCode -eq 200) { $ready = $true; break }
        } catch { }
        Start-Sleep -Seconds 2
    }
    if (-not $ready) { throw "Service readiness failed at $url; inspect Compose logs for project $project." }
}
Write-Output "READY project=$project; existing local/default-project databases were preserved."
Write-Output 'Identity: http://localhost:8081; Bakery DB: localhost:5436; Subscription DB: localhost:5437'
if ($Verify) {
    & (Join-Path $PSScriptRoot 'Test-LocalJwt.ps1') -BakerySubscriptionOnly -WithStorage -ComposeProject $project
    if ($LASTEXITCODE -ne 0) { throw 'Bakery/Subscription HTTP verification failed.' }
}
