"""Run the README procedure in a fresh PowerShell; sanitize debug endpoints."""
from pathlib import Path
import json,os,re,subprocess,time,sys
MOBILE=Path(__file__).resolve().parents[1];OUT=MOBILE/'docs/evidence/phases-5a-5b-5c'
commands={
 'readme-discovery':['powershell','-NoProfile','-Command',"Get-Location; Test-Path pubspec.yaml; Get-Command python,flutter,adb | Select-Object Name,Source; flutter --version; flutter doctor -v; flutter emulators; adb devices -l; docker info --format '{{.ServerVersion}}'; docker compose ls --all"],
 'readme-start':['powershell','-NoProfile','-ExecutionPolicy','Bypass','-File','.\\tool\\start_mobile.ps1','-NoResident']}
if '--start-only' in sys.argv:commands={'readme-start':commands['readme-start']}
recordFile=OUT/'readme-rehearsal.json'
records=json.loads(recordFile.read_text()) if recordFile.exists() else []
for name,command in commands.items():
    target=OUT/(name+'.log')
    if target.exists():target.rename(target.with_stem(target.stem+'-'+str(time.time_ns())))
    started=time.monotonic()
    with target.open('w',encoding='utf-8') as log:
        p=subprocess.Popen(command,cwd=MOBILE,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True,encoding='utf-8',errors='replace')
        for line in p.stdout:
            safe=re.sub(r'(?:https?|wss?)://127\.0\.0\.1:\d+/[A-Za-z0-9_=-]{8,}/','[LOCAL_VM_SERVICE]/',line)
            log.write(safe);log.flush()
        p.wait()
    record={'command':command,'cwd':str(MOBILE),'exitCode':p.returncode,'seconds':round(time.monotonic()-started,2),'log':target.name};records.append(record)
    (OUT/'readme-rehearsal.json').write_text(json.dumps(records,indent=2),encoding='utf-8');print(json.dumps(record),flush=True)
    if p.returncode:raise SystemExit(p.returncode)
