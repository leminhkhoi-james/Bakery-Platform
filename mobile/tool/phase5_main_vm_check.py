"""Inspect only pause/render status of the normal entrypoint, no account data."""
from pathlib import Path
import base64,json,re,shutil,subprocess,time,urllib.parse,urllib.request
MOBILE=Path(__file__).resolve().parents[1];OUT=MOBILE/'docs/evidence/phases-5a-5b-5c'
def adb(*a):return subprocess.run([shutil.which('adb'),'-s','emulator-5554',*a],capture_output=True,check=True)
pid=adb('shell','pidof','com.example.bakery_mobile').stdout.decode().strip();logs=adb('logcat','-d','--pid='+pid,'-t','10000').stdout.decode(errors='replace')
matches=re.findall(r'The Dart VM service is listening on (http://127\.0\.0\.1:\d+/[A-Za-z0-9_=-]+/)',logs)
result={'entrypoint':'lib/main.dart','accountDataRead':False}
if matches:
    u=urllib.parse.urlsplit(matches[-1]);forward=adb('forward','tcp:0','tcp:'+str(u.port)).stdout.decode().strip()
    origin=urllib.parse.urlunsplit((u.scheme,'127.0.0.1:'+forward,u.path,'',''))
    def rpc(method,**params):
        with urllib.request.urlopen(origin+method+'?'+urllib.parse.urlencode(params),timeout=12) as r:return json.load(r)
    try:
        vm=rpc('getVM')['result'];result['isolatePauseKinds']=[]
        for isolate in vm['isolates']:
            data=rpc('getIsolate',isolateId=isolate['id'])['result'];result['isolatePauseKinds'].append(data.get('pauseEvent',{}).get('kind'))
        result['flutterViews']=len(rpc('_flutter.listViews').get('result',{}).get('views',[]))
        screenshot=rpc('_flutter.screenshot')
        if screenshot.get('result',{}).get('screenshot'):
            (OUT/'ui-main-engine.png').write_bytes(base64.b64decode(screenshot['result']['screenshot']));result['engineScreenshot']=True
        else:result['engineScreenshot']=False
    except Exception as e:result['safeErrorType']=type(e).__name__
    finally:adb('forward','--remove','tcp:'+forward)
else:result['vmAnnouncementFound']=False
(OUT/'normal-main-vm-status.json').write_text(json.dumps(result,indent=2),encoding='utf-8');print(json.dumps(result),flush=True)
