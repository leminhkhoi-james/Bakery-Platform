param([switch]$SkipPackage, [string]$Project = 'bakery-gateway')
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$modules = @('identity-service', 'bakery-service', 'marketplace-service', 'subscription-service', 'order-service', 'chat-service', 'cake-ai-service', 'api-gateway')
Push-Location $projectRoot
try {
    if (-not $SkipPackage) {
        Push-Location (Join-Path $projectRoot 'backend')
        try {
            & mvn -q -pl ($modules -join ',') -am -DskipTests package
            if ($LASTEXITCODE -ne 0) { throw 'Maven package failed' }
        } finally { Pop-Location }
    }
    foreach ($module in $modules) {
        $target = Join-Path $projectRoot "backend/$module/target"
        $jar = Join-Path $target "$module-0.0.1-SNAPSHOT-exec.jar"
        if (-not (Test-Path -LiteralPath $jar)) { $jar = Join-Path $target "$module-0.0.1-SNAPSHOT.jar" }
        if (-not (Test-Path -LiteralPath $jar)) { throw "Missing executable JAR for $module" }
        $context = Join-Path $target 'docker-runtime'
        New-Item -ItemType Directory -Force -Path $context | Out-Null
        Copy-Item -LiteralPath $jar -Destination (Join-Path $context 'application.jar')
        Copy-Item -LiteralPath (Join-Path $projectRoot 'docker/java-local-runtime/Dockerfile') -Destination (Join-Path $context 'Dockerfile')
        Set-Content -LiteralPath (Join-Path $context '.dockerignore') -Value "*`n!Dockerfile`n!application.jar" -Encoding utf8
    }
    $composeArguments = @('compose', '-p', $Project, '-f', 'compose.yaml', '-f', 'docker-compose.bakery-subscription.yml', '-f', 'docker-compose.order-service.yml', '-f', 'docker-compose.chat-service.yml', '-f', 'compose.services.yaml', '-f', 'compose.gateway.yaml')
    & docker @composeArguments config --quiet
    if ($LASTEXITCODE -ne 0) { throw 'Invalid Compose configuration' }
    & docker @composeArguments up --build -d --wait --wait-timeout 240
    if ($LASTEXITCODE -ne 0) { throw 'Stack did not become healthy; inspect docker compose logs' }
} finally { Pop-Location }
