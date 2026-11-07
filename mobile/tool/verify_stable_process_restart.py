"""Restart the already-installed main app after a completed native UI login."""
from pathlib import Path
import json,subprocess,time
OUT=Path(__file__).resolve().parents[1]/'docs/evidence/api-integration-phases-1-4'
def adb(*args):return subprocess.run(['adb','-s','emulator-5554',*args],capture_output=True,check=True,timeout=30)
before=adb('shell','pidof','com.example.bakery_mobile').stdout.decode().strip()
adb('shell','am','force-stop','com.example.bakery_mobile')
adb('shell','am','start','-W','-n','com.example.bakery_mobile/.MainActivity')
# Cold Flutter/KeyStore initialization on this emulator is slow. This is a
# diagnostic capture, not an assertion based solely on elapsed time.
time.sleep(30)
time.sleep(15)
after=adb('shell','pidof','com.example.bakery_mobile').stdout.decode().strip()
adb('shell','input','tap','677','118')
time.sleep(3)
(OUT/'main-confirmed-cold-process-restart.png').write_bytes(adb('exec-out','screencap','-p').stdout)
report={'entrypoint':'lib/main.dart','method':'visually confirmed native main login before force-stop; normal OS activity start; no FlutterDriver extension','storageNamespace':'sweetcake.identity.v1','processChanged':bool(before and after and before!=after),'appDataCleared':False,'loginCredentialsInArgv':False,'screenshot':'main-confirmed-cold-process-restart.png','visualResult':'REQUIRES_REVIEW'}
(OUT/'main-confirmed-cold-process-restart.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(report),flush=True)
