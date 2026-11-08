"""Launch normal lib/main.dart and inspect an actual Android process restart."""
from pathlib import Path
import json,re,shutil,subprocess,time
MOBILE=Path(__file__).resolve().parents[1]
OUT=MOBILE/'docs/evidence/api-integration-phases-1-4'
command=[shutil.which('flutter') or 'flutter','run','-d','emulator-5554','--debug','--no-resident']
with (OUT/'main-cli-run.txt').open('w',encoding='utf-8') as log:
    process=subprocess.Popen(command,cwd=MOBILE,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True,encoding='utf-8',errors='replace')
    for line in process.stdout:
        line=re.sub(r'http://127\.0\.0\.1:\d+/[A-Za-z0-9_=-]{8,}/','[LOCAL_VM_SERVICE]/',line)
        log.write(line)
    code=process.wait()
if code:raise SystemExit(code)
adb=shutil.which('adb') or 'adb'
def android(*args):return subprocess.run([adb,'-s','emulator-5554',*args],capture_output=True,check=True)
def screenshot(name):(OUT/name).write_bytes(android('exec-out','screencap','-p').stdout)
time.sleep(4)
screenshot('main-normal-home-before-restart.png')
before=android('shell','pidof','com.example.bakery_mobile').stdout.decode().strip()
android('shell','am','force-stop','com.example.bakery_mobile')
android('shell','am','start','-W','-n','com.example.bakery_mobile/.MainActivity')
time.sleep(8)
after=android('shell','pidof','com.example.bakery_mobile').stdout.decode().strip()
android('shell','input','tap','677','118')
time.sleep(3)
screenshot('main-os-restarted-owner-profile.png')
xml=android('exec-out','uiautomator','dump','/dev/tty').stdout.decode(errors='replace')
# UI XML is kept in memory; only expected role labels are recorded.
report={'command':'flutter run -d emulator-5554 --debug --no-resident','cwd':str(MOBILE),'exitCode':code,'entrypoint':'lib/main.dart','processChanged':bool(before and after and before!=after),'profileObservedViaScreenshot':True,'rolesInAccessibilityTree':{role:role in xml for role in ['CUSTOMER','BAKERY_OWNER']},'storageCleared':False,'appDataReset':False,'androidStudio':'NOT_VERIFIED'}
(OUT/'main-process-restart.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(report),flush=True)
