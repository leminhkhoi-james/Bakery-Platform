"""Cold process restore using a synthetic Owner and separate secure-store namespace."""
from pathlib import Path
import json,os,re,shutil,subprocess,time,urllib.parse
MOBILE=Path(__file__).resolve().parents[1];OUT=MOBILE/'docs/evidence/docker-api-diagnostic'
def adb(*args):return subprocess.run(['adb','-s','emulator-5554',*args],capture_output=True,check=True,timeout=30)
expected=json.loads((OUT/'session-ui.json').read_text())['state']['userId']
adb('shell','am','force-stop','com.example.bakery_mobile')
adb('shell','am','start','-W','-n','com.example.bakery_mobile/.MainActivity')
pid=adb('shell','pidof','com.example.bakery_mobile').stdout.decode().strip()
url=None
for _ in range(45):
 s=adb('logcat','-d','--pid='+pid,'-t','10000').stdout.decode(errors='replace')
 urls=re.findall(r'The Dart VM service is listening on (http://127\.0\.0\.1:\d+/[A-Za-z0-9_=-]+/)',s)
 if urls:url=urls[-1];break
 time.sleep(1)
if not url:raise SystemExit('No debug VM announcement; not claiming restore')
parsed=urllib.parse.urlsplit(url)
# Create only a host debug forward; no credential passed in command-line args.
forward=adb('forward','tcp:0','tcp:'+str(parsed.port)).stdout.decode().strip()
environment=dict(os.environ);environment.update(DIAGNOSTIC_VM_URL=urllib.parse.urlunsplit((parsed.scheme,'127.0.0.1:'+forward,parsed.path,'','')),DIAGNOSTIC_CAPTURE_WAIT_USER='1',DIAGNOSTIC_CAPTURE_FILE='cold-process-state.json')
p=subprocess.run([shutil.which('dart'),'run','tool/capture_diagnostic_state.dart'],cwd=MOBILE,env=environment,capture_output=True,text=True,encoding='utf-8',errors='replace')
if p.returncode:raise SystemExit('Cold process debug capture failed; sensitive connection details omitted')
state=json.loads((OUT/'cold-process-state.json').read_text());ok=state['userId']==expected and 'BAKERY_OWNER' in state['roles']
(OUT/'cold-process-check.json').write_text(json.dumps({'result':'PASS' if ok else 'FAIL','expectedSyntheticUserId':expected,'actualUserId':state['userId'],'testReadsRealUserStore':False,'earlierDefaultDriveCleanup':'APK was uninstalled by default tool cleanup before keep-app-running was added; prior local app data preservation is not claimed','namespace':'sweetcake.diagnostic.v1','refreshAndMe':[r for r in state['events'] if r['path'] in ['/api/v1/auth/refresh','/api/v1/auth/me']]},indent=2),encoding='utf-8')
adb('forward','--remove','tcp:'+forward)
print(json.dumps({'result':'PASS' if ok else 'FAIL','userIdMatched':ok,'separateSecureNamespace':True}),flush=True)
raise SystemExit(not ok)
