"""Coordinate-based diagnostic attempt, not a self-verifying test.

This setup ran before the UI settled and did not establish login. Preserve it
for reproduction of the harness issue; use visually confirmed native login and
verify_stable_process_restart.py for the successful cold-process verification.
"""
from pathlib import Path
import json,shlex,subprocess,time
MOBILE=Path(__file__).resolve().parents[1]
OUT=MOBILE/'docs/evidence/api-integration-phases-1-4'
user=json.loads(Path('H:/MSS/.runtime/bakery-mobile-phases-1-4/mobile-live-user.json').read_text())
def adb(*args):return subprocess.run(['adb','-s','emulator-5554',*args],capture_output=True,check=True,timeout=40)
def tap(x,y):adb('shell','input','tap',str(x),str(y));time.sleep(.5)
def start():
    adb('shell','am','force-stop','com.example.bakery_mobile')
    adb('shell','am','start','-W','-n','com.example.bakery_mobile/.MainActivity')
    time.sleep(12)
def shot(name):(OUT/name).write_bytes(adb('exec-out','screencap','-p').stdout)
def enter(x,y,value):
    tap(x,y)
    # Password is stdin to adb shell, absent from process argv, logs and defines.
    subprocess.run(['adb','-s','emulator-5554','shell','-T'],input='input text '+shlex.quote(value)+'\nexit\n',text=True,capture_output=True,check=True,timeout=20)
adb('install','-r',str(MOBILE/'build/app/outputs/flutter-apk/app-debug.apk'))
start();tap(677,118);tap(360,610)
enter(250,246,user['email']);enter(250,380,user['password'])
adb('shell','input','keyevent','4');time.sleep(.5);tap(360,710)
time.sleep(6);tap(677,118);time.sleep(2)
shot('main-namespaced-login-owner.png')
rows=[]
for n in [1,2]:
    before=adb('shell','pidof','com.example.bakery_mobile').stdout.decode().strip()
    start();after=adb('shell','pidof','com.example.bakery_mobile').stdout.decode().strip()
    tap(677,118);time.sleep(3)
    name=f'main-namespaced-cold-restart-{n}.png';shot(name)
    rows.append({'attempt':n,'processChanged':before!=after,'screenshot':name,'visualResult':'REQUIRES_REVIEW'})
report={'entrypoint':'lib/main.dart','apkInstalledWithReplace':True,'dataCleared':False,'credentialsInArgs':False,'tokenInjected':False,'storageNamespace':'sweetcake.identity.v1','restarts':rows}
(OUT/'main-namespaced-process-restarts.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(report),flush=True)
