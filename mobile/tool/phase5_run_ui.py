"""Native driver launch with public origins from Docker metadata; keeps APK/data."""
from pathlib import Path
import base64,json,os,re,shutil,subprocess,sys,time
MOBILE=Path(__file__).resolve().parents[1];OUT=MOBILE/'docs/evidence/phases-5a-5b-5c'
runtime=json.loads((OUT/'runtime-start.json').read_text());command=[shutil.which('flutter'),'drive','--keep-app-running','--driver=tool/phase5_ui_driver.dart','--target=test_driver/phase5_app.dart','-d',os.environ.get('PHASE5_DEVICE','emulator-5554')]
for domain in ['identity','bakery','subscription','marketplace','order','chat']:command.append('--dart-define='+domain.upper()+'_URL='+runtime['services'][domain+'-service']['origin'])
if os.environ.get('PHASE5_STAGE')=='session-seed':command.append('--dart-define=PHASE5_PERSISTENT=true')
if os.environ.get('PHASE5_REUSE_APK')=='1':command+=['--use-application-binary='+str(MOBILE/'build/app/outputs/flutter-apk/app-debug.apk')]
for name in ['android-ui.json','ui-driver.log','ui-command.json']:
    p=OUT/name
    if p.exists():p.rename(p.with_stem(p.stem+'-'+str(time.time_ns())))
started=time.monotonic()
fixtureFile=OUT/'native-attachment.png';fixtureFile.write_bytes(base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j1ioAAAAASUVORK5CYII='))
pickerName='phase5-mobile-'+str(time.time_ns())+'.png'
subprocess.run(['adb','-s',os.environ.get('PHASE5_DEVICE','emulator-5554'),'push',str(fixtureFile),'/sdcard/Download/'+pickerName],capture_output=True,check=True)
with (OUT/'ui-driver.log').open('w',encoding='utf-8') as log:
    p=subprocess.Popen(command,cwd=MOBILE,env={**os.environ,'PHASE5_PICKER_FILENAME':pickerName},stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True,encoding='utf-8',errors='replace')
    for line in p.stdout:
        safe=re.sub(r'(?:https?|wss?)://127\.0\.0\.1:\d+/[A-Za-z0-9_=-]{8,}/','[LOCAL_VM_SERVICE]/',line);log.write(safe);log.flush()
        if any(s in safe for s in ['PASS:','Stopped at checkpoint','Built ']):print(safe.strip(),flush=True)
    p.wait()
(OUT/'ui-command.json').write_text(json.dumps({'command':command,'stage':os.environ.get('PHASE5_STAGE','all'),'cwd':str(MOBILE),'exitCode':p.returncode,'seconds':round(time.monotonic()-started,2)},indent=2),encoding='utf-8');raise SystemExit(p.returncode)
