"""Execute README startup in new PowerShell processes, preserving sanitized evidence."""
from pathlib import Path
import json,re,subprocess,time,sys,shutil
MOBILE=Path(__file__).resolve().parents[1];OUT=MOBILE/'docs/evidence/docker-api-diagnostic';rows=[]
steps=[('prerequisites',['powershell','-NoProfile','-NonInteractive','-Command',"Get-Location; Test-Path pubspec.yaml; Get-Command python,flutter,adb,emulator | Select-Object Name,Source; flutter --version; flutter doctor -v; flutter emulators; adb devices -l; docker info --format '{{.ServerVersion}}'; docker compose ls --all"]),('canonical',['powershell','-NoProfile','-ExecutionPolicy','Bypass','-File',str(MOBILE/'tool/start_mobile.ps1'),'-NoResident'])]
if len(sys.argv)>1:steps=[s for s in steps if s[0]==sys.argv[1]]
record=OUT/'readme-rehearsal.json'
rows=json.loads(record.read_text()) if record.exists() else []
for name,command in steps:
 start=time.monotonic()
 old=OUT/f'rehearsal-{name}.log'
 if old.exists():shutil.copyfile(old,OUT/f'rehearsal-{name}-previous-{time.time_ns()}.log')
 with (OUT/f'rehearsal-{name}.log').open('w',encoding='utf-8') as log:
  p=subprocess.Popen(command,cwd=MOBILE,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True,encoding='utf-8',errors='replace')
  for line in p.stdout:
   line=re.sub(r'http://127\.0\.0\.1:\d+/[A-Za-z0-9_=-]{8,}/','[LOCAL_VM_SERVICE]/',line);log.write(line);log.flush()
  p.wait()
 rows.append({'step':name,'command':command,'cwd':str(MOBILE),'freshPowerShell':True,'exitCode':p.returncode,'seconds':round(time.monotonic()-start,2)})
 (OUT/'readme-rehearsal.json').write_text(json.dumps(rows,indent=2),encoding='utf-8');print(json.dumps(rows[-1]),flush=True)
 if p.returncode:raise SystemExit(p.returncode)
