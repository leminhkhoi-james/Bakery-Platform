"""Restart only the test app process; keep APK/user data/default secure store."""
import json,os,re,shutil,subprocess,time,urllib.parse
from full_common import MOBILE,save
adb=shutil.which('adb') or r'D:\HomeMind\audit-tools\android-sdk\platform-tools\adb.exe'
def call(*args):return subprocess.run([adb,'-s','emulator-5554',*args],capture_output=True,check=True,timeout=30)
for expected in ['customer','guest']:
    call('shell','am','force-stop','com.example.bakery_mobile');call('shell','am','start','-W','-n','com.example.bakery_mobile/.MainActivity')
    pid=call('shell','pidof','com.example.bakery_mobile').stdout.decode().strip();url=None
    for _ in range(45):
        raw=call('logcat','-d','--pid='+pid,'-t','10000').stdout.decode(errors='replace')
        matches=re.findall(r'The Dart VM service is listening on (http://127\.0\.0\.1:\d+/[A-Za-z0-9_=-]+/)',raw)
        if matches:url=matches[-1];break
        time.sleep(1)
    if not url:raise SystemExit('No test VM announcement; cold restore NOT_VERIFIED')
    parsed=urllib.parse.urlsplit(url);forward=call('forward','tcp:0','tcp:'+str(parsed.port)).stdout.decode().strip()
    try:
        env={**os.environ,'FULL_COLD_EXPECT':expected,'FULL_VM_URL':urllib.parse.urlunsplit((parsed.scheme,'127.0.0.1:'+forward,parsed.path,'',''))}
        dart=shutil.which('dart') or r'D:\HomeMind\audit-tools\flutter\bin\dart.bat'
        p=subprocess.run([dart,'run','tool/full_cold_capture.dart'],cwd=MOBILE,env=env,capture_output=True,text=True,encoding='utf-8',errors='replace',timeout=150)
        save('test-results/cold-'+expected+'-command.json',{'exitCode':p.returncode,'defaultUserStoreRead':False,'vmAddressPersisted':False,'appDataCleared':False,'result':'PASS' if p.returncode==0 else 'FAIL'})
        print({'coldProcess':expected,'exitCode':p.returncode},flush=True)
        if p.returncode:raise SystemExit(p.returncode)
    finally:call('forward','--remove','tcp:'+forward)
