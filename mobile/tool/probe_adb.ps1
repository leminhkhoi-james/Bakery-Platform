$adbExecutable=(Get-Command adb).Source
$lines=@(& $adbExecutable devices)
foreach($line in $lines) { [pscustomobject]@{Line=$line;Matches=($line -match '^emulator-\d+\s+device\b')} }
function Get-OnlineEmulators {
    @((& $adbExecutable devices) | Where-Object { $_ -match '^emulator-\d+\s+device\b' } | ForEach-Object { ($_ -split '\s+')[0] })
}
$online=@(Get-OnlineEmulators)
Write-Output ('Count='+$online.Count)
Write-Output $online
