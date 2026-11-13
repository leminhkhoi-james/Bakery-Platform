"""Current diagnostic checks; preserve original integration evidence."""
from pathlib import Path
import json,shutil,subprocess,sys,time
MOBILE=Path(__file__).resolve().parents[1];OUT=MOBILE/'docs/evidence/docker-api-diagnostic'
flutter=shutil.which('flutter');dart=shutil.which('dart')
steps={'pub-get':[flutter,'pub','get'],'format':[dart,'format','--output=none','--set-exit-if-changed','lib','test','integration_test','test_driver',*[str(p.relative_to(MOBILE)) for p in (MOBILE/'tool').glob('*.dart')]],'analyze':[flutter,'analyze'],'test':[flutter,'test','--reporter','expanded'],'build':[flutter,'build','apk','--debug']}
file=OUT/'checks.json';results=json.loads(file.read_text()) if file.exists() else {}
for name in sys.argv[1:] or steps:
 start=time.monotonic()
 with (OUT/f'{name}.txt').open('w',encoding='utf-8') as log:p=subprocess.run(steps[name],cwd=MOBILE,stdout=log,stderr=subprocess.STDOUT)
 results[name]={'command':' '.join(steps[name]),'exitCode':p.returncode,'seconds':round(time.monotonic()-start,2),'evidence':name+'.txt'}
 file.write_text(json.dumps(results,indent=2),encoding='utf-8');print(json.dumps(results[name]),flush=True)
 if p.returncode:raise SystemExit(p.returncode)
