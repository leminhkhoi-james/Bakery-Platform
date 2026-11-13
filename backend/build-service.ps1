[CmdletBinding()]
param(
    [ValidateSet('cake-ai-service', 'chat-service', 'marketplace-service')]
    [string]$Service = 'cake-ai-service',
    [string]$JavaHome = $env:JAVA_HOME,
    [string]$MavenCommand = '',
    [string]$MavenRepository = '',
    [switch]$SkipTests
)
$ErrorActionPreference = 'Stop'
$backendDirectory = $PSScriptRoot
$previousJavaHome = $env:JAVA_HOME
$previousPath = $env:PATH
$previousDirectory = Get-Location
$temporaryDirectory = $null
try {
    if ($JavaHome) {
        $javaExecutable = Join-Path $JavaHome 'bin/java.exe'
        if (-not (Test-Path -LiteralPath $javaExecutable)) { throw 'JavaHome must contain a JDK with bin/java.exe.' }
        $env:JAVA_HOME = $JavaHome
        $env:PATH = (Join-Path $JavaHome 'bin') + [IO.Path]::PathSeparator + $env:PATH
    } else {
        $javaExecutable = (Get-Command java -ErrorAction Stop).Source
    }
    $javaVersion = (& $javaExecutable --version | Out-String)
    if ($javaVersion -notmatch '^(?:openjdk|java) 21(?:[.\s])') {
        throw 'This build requires JDK 21. Pass -JavaHome pointing to the installed JDK 21; system settings are not changed.'
    }
    if (-not $MavenCommand) {
        $maven = Get-Command mvn.cmd -ErrorAction SilentlyContinue
        $MavenCommand = if ($maven) { $maven.Source } else { Join-Path $backendDirectory 'mvnw.cmd' }
    }
    # Always start at the parent and include current shared source. A module-only
    # build against an arbitrary installed SNAPSHOT is not this supported workflow.
    $mavenArguments = @('-B', '-ntp', '-f', (Join-Path $backendDirectory 'pom.xml'), '-pl', $Service, '-am', 'clean', 'package')
    if ($SkipTests) { $mavenArguments += '-DskipTests' }
    if ($MavenRepository) {
        $mavenArguments += "-Dmaven.repo.local=$([IO.Path]::GetFullPath($MavenRepository))"
    }
    Set-Location -LiteralPath $backendDirectory
    & $MavenCommand @mavenArguments
    if ($LASTEXITCODE -ne 0) { throw 'Maven reactor build failed. No artifact is certified.' }
    $classifier = if ($Service -eq 'chat-service') { '' } else { '-exec' }
    $jarPath = Join-Path $backendDirectory "$Service/target/$Service-0.0.1-SNAPSHOT$classifier.jar"
    if (-not (Test-Path -LiteralPath $jarPath)) { throw 'Expected executable artifact is missing.' }
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $archive = [IO.Compression.ZipFile]::OpenRead($jarPath)
    try {
        $manifestEntry = $archive.GetEntry('META-INF/MANIFEST.MF')
        $reader = [IO.StreamReader]::new($manifestEntry.Open())
        try { $manifest = $reader.ReadToEnd() } finally { $reader.Dispose() }
        if ($manifest -notmatch 'Main-Class: .*JarLauncher' -or $manifest -notmatch 'Start-Class: ') {
            throw 'Artifact is not a Spring Boot executable JAR.'
        }
        if ($Service -ne 'chat-service') {
            $shared = @($archive.Entries | Where-Object { $_.FullName -match '^BOOT-INF/lib/platform-support-[^/]+[.]jar$' })
            if ($shared.Count -ne 1) { throw 'Executable must contain exactly one platform-support artifact.' }
            $temporaryDirectory = Join-Path ([IO.Path]::GetTempPath()) ('bakery-reactor-' + [guid]::NewGuid().ToString('N'))
            New-Item -ItemType Directory -Path $temporaryDirectory | Out-Null
            $sharedPath = Join-Path $temporaryDirectory 'platform-support.jar'
            [IO.Compression.ZipFileExtensions]::ExtractToFile($shared[0], $sharedPath)
            $javapExecutable = Join-Path (Split-Path $javaExecutable -Parent) 'javap.exe'
            $signature = (& $javapExecutable -classpath $sharedPath 'com.se193262.platform.dto.ApiResponse' 2>&1 | Out-String)
            if ($LASTEXITCODE -ne 0 -or $signature -notmatch '\baccepted\(T\)') {
                throw 'Packaged platform-support does not provide the current ApiResponse.accepted(T) contract.'
            }
        }
        if ($Service -eq 'cake-ai-service') {
            foreach ($library in @('google-cloud-storage', 'google-auth-library-oauth2-http')) {
                if (-not ($archive.Entries.FullName -match "^BOOT-INF/lib/$library-[^/]+[.]jar$")) {
                    throw "Missing packaged compile/runtime library: $library"
                }
            }
        }
    } finally { $archive.Dispose() }
    Write-Output "Verified current reactor executable: $jarPath"
    if ($Service -ne 'chat-service') { Write-Output 'Packaged ApiResponse.accepted(T) verified; no global SNAPSHOT installation or cache deletion.' }
} finally {
    if ($temporaryDirectory) {
        $resolvedTemporary = [IO.Path]::GetFullPath($temporaryDirectory)
        $resolvedTempRoot = [IO.Path]::GetFullPath([IO.Path]::GetTempPath())
        if ($resolvedTemporary.StartsWith($resolvedTempRoot, [StringComparison]::OrdinalIgnoreCase)) {
            Remove-Item -LiteralPath (Join-Path $resolvedTemporary 'platform-support.jar') -ErrorAction SilentlyContinue
            Remove-Item -LiteralPath $resolvedTemporary -ErrorAction SilentlyContinue
        }
    }
    $env:JAVA_HOME = $previousJavaHome
    $env:PATH = $previousPath
    Set-Location -LiteralPath $previousDirectory
}
