"""Cold restore of a synthetic session; do not read the default user namespace."""
from pathlib import Path
import json,os,re,shutil,subprocess,time,urllib.parse
MOBILE=Path(__file__).resolve().parents[1];OUT=MOBILE/'docs/evidence/phases-5a-5b-5c'
def adb(*args):return subprocess.run(['adb','-s','emulator-5554',*args],capture_output=True,check=True,timeout=30)
adb('shell','input','keyevent','KEYCODE_WAKEUP');adb('shell','wm','dismiss-keyguard')
adb('shell','am','force-stop','com.example.bakery_mobile')
adb('shell','am','start','-W','-n','com.example.bakery_mobile/.MainActivity')
pid=adb('shell','pidof','com.example.bakery_mobile').stdout.decode().strip();url=None
for _ in range(45):
    logs=adb('logcat','-d','--pid='+pid,'-t','10000').stdout.decode(errors='replace')
    matches=re.findall(r'The Dart VM service is listening on (http://127\.0\.0\.1:\d+/[A-Za-z0-9_=-]+/)',logs)
    if matches:url=matches[-1];break
    time.sleep(1)
if not url:raise SystemExit('No test VM announcement; not claiming restore')
parsed=urllib.parse.urlsplit(url);forward=adb('forward','tcp:0','tcp:'+str(parsed.port)).stdout.decode().strip()
try:
    environment={**os.environ,'PHASE5_VM_URL':urllib.parse.urlunsplit((parsed.scheme,'127.0.0.1:'+forward,parsed.path,'',''))}
    dart=Path(shutil.which('dart')).parent/'cache/dart-sdk/bin/dart.exe'
    p=subprocess.run([str(dart),'run','tool/phase5_capture.dart'],cwd=MOBILE,env=environment,capture_output=True,text=True,encoding='utf-8',errors='replace',timeout=120)
    result={'exitCode':p.returncode,'result':'PASS' if p.returncode==0 else 'FAIL','defaultUserStoreRead':False,'sensitiveVmOutputPersisted':False}
    (OUT/'session-cold-command.json').write_text(json.dumps(result,indent=2),encoding='utf-8');print(json.dumps(result),flush=True)
finally:adb('forward','--remove','tcp:'+forward)
raise SystemExit(p.returncode)
