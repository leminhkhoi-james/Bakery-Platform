"""Execute documented local commands in fresh PowerShell processes; no secret output."""
from pathlib import Path
import json, os, subprocess, sys, time, urllib.request

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT/'mobile/docs/evidence/api-integration-phases-1-4'
reportFile=OUT/'readme-rehearsal.json'
rows = json.loads(reportFile.read_text(encoding='utf-8'))['steps'] if reportFile.exists() else []
steps = [
 ('docker', ROOT, 'docker info --format "{{.ServerVersion}}"'),
 ('identity-db', ROOT, 'docker start bakery-local-identity-db-1'),
 ('jars', ROOT, 'if (-not (Test-Path H:\\MSS\\.runtime\\bakery-mobile-phases-1-4\\jars\\identity-service.jar)) { python -B mobile/tool/prepare_runtime_sources.py }'),
 ('runtime', ROOT, 'python -B mobile/tool/recreate_runtime_h.py'),
 ('preflight', ROOT, 'python -B mobile/tool/runtime_preflight.py'),
 ('web', ROOT, 'python -B mobile/tool/run_reference_web.py'),
 ('doctor', ROOT/'mobile', 'flutter doctor -v'),
 ('emulators', ROOT/'mobile', 'flutter emulators'),
 ('devices', ROOT/'mobile', 'flutter devices; adb devices; adb -s emulator-5554 shell getprop sys.boot_completed'),
 ('reverse', ROOT/'mobile', '; '.join('adb -s emulator-5554 reverse tcp:{0} tcp:{0}'.format(p) for p in [18101,18102,18104,19022])),
 ('pub-get', ROOT/'mobile', 'flutter pub get'),
 ('ui', ROOT/'mobile', "$env:MOBILE_LIVE_STAGE='rehearsal'; python -B tool/run_live_verification.py"),
 ('restart-bakery', ROOT, 'docker compose -p bakery-mobile-20261107 -f H:\\MSS\\.runtime\\bakery-mobile-phases-1-4\\compose.json restart mobile-bakery'),
]
if len(sys.argv)>1:
    steps=steps[next(i for i,s in enumerate(steps) if s[0]==sys.argv[1]):]
for name, cwd, command in steps:
    started=time.monotonic()
    completed=subprocess.run(['powershell','-NoProfile','-NonInteractive','-Command',command+'; if ($null -ne $LASTEXITCODE) { exit $LASTEXITCODE }'],cwd=cwd,capture_output=True,text=True,encoding='utf-8',errors='replace')
    # These steps never print environment values, auth headers or credential files.
    logFile=OUT/f'rehearsal-{name}.txt'
    if logFile.exists():logFile.replace(OUT/f'rehearsal-{name}-previous-{int(time.time())}.txt')
    logFile.write_text(completed.stdout+completed.stderr,encoding='utf-8')
    rows.append({'step':name,'cwd':str(cwd),'command':command,'exitCode':completed.returncode,'seconds':round(time.monotonic()-started,2),'freshShell':True,'evidence':f'rehearsal-{name}.txt'})
    (OUT/'readme-rehearsal.json').write_text(json.dumps({'steps':rows,'machine':'existing Windows installation and cached infrastructure; not clean machine','androidStudio':'NOT_VERIFIED'},indent=2),encoding='utf-8')
    print(json.dumps(rows[-1]),flush=True)
    if completed.returncode and name!='doctor':sys.exit(completed.returncode)
for _ in range(60):
    try:
        with urllib.request.urlopen('http://127.0.0.1:18102/v3/api-docs',timeout=3) as response:
            if response.status==200:break
    except Exception:time.sleep(1)
else:raise SystemExit('Bakery readiness not recovered')
subprocess.run([sys.executable,'-B','mobile/tool/verify_live_records.py'],cwd=ROOT,check=True)
print('Restart readiness and persisted records reconciled',flush=True)
