"""No credentials persisted or passed through defines; sanitized Flutter driver log."""
from pathlib import Path
import os,re,shutil,subprocess,sys,time
mobile=Path(__file__).resolve().parents[1];out=mobile/'docs/evidence/docker-api-diagnostic'
stage=os.environ.get('DIAGNOSTIC_STAGE','before')
archive=out/'runs'/(stage+'-'+str(time.time_ns()))
for name in [f'{stage}-driver.log',f'{stage}-ui.json']:
 if (out/name).exists():
  archive.mkdir(parents=True,exist_ok=True);shutil.copyfile(out/name,archive/name)
command=[shutil.which('flutter') or 'flutter','drive','--keep-app-running','--driver=tool/diagnostic_ui_driver.dart','--target=test_driver/diagnostic_app.dart','-d',os.environ.get('DIAGNOSTIC_DEVICE','emulator-5554')]
if os.environ.get('DIAGNOSTIC_REUSE_APK')=='1':command+=['--use-application-binary='+str(mobile/'build/app/outputs/flutter-apk/app-debug.apk')]
if stage=='session':command+=['--dart-define=DIAGNOSTIC_PERSISTENT=true']
with (out/f'{stage}-driver.log').open('w',encoding='utf-8') as log:
 p=subprocess.Popen(command,cwd=mobile,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True,encoding='utf-8',errors='replace')
 for line in p.stdout:
  line=re.sub(r'http://127\.0\.0\.1:\d+/[A-Za-z0-9_=-]{8,}/','[LOCAL_VM_SERVICE]/',line)
  log.write(line);log.flush()
  if 'PASS:' in line or 'failed;' in line or 'Built ' in line:print(line.strip(),flush=True)
 p.wait()
print('Diagnostic exit code:',p.returncode,flush=True)
sys.exit(p.returncode)
