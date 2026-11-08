"""Run native UI driver, redact host-only credentials before persisting tool logs."""
from pathlib import Path
import json,os,re,shutil,subprocess,sys,struct,zlib,time
MOBILE=Path(__file__).resolve().parents[1]
OUT=MOBILE/'docs/evidence/api-integration-phases-1-4';OUT.mkdir(parents=True,exist_ok=True)
credentialFile=Path(os.environ.get('BAKERY_ADMIN_CREDENTIAL_FILE','H:/MSS/.secrets/bakery-platform/local-smoke-users.json'))
credentials=json.loads(credentialFile.read_text(encoding='utf-8-sig'))
private={'userPassword':credentials['password']}
synthetic=Path(os.environ['TEMP'])/'sweetcake-mobile-proof.png'
def chunk(tag,data):return struct.pack('!I',len(data))+tag+data+struct.pack('!I',zlib.crc32(tag+data)&0xffffffff)
synthetic.write_bytes(b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('!2I5B',64,64,8,2,0,0,0))+chunk(b'tEXt',b'Description\x00SYNTHETIC LOCAL TEST - NO REAL FUNDS')+chunk(b'IDAT',zlib.compress((b'\x00'+b'\x6b\x21\x2e'*64)*64))+chunk(b'IEND',b''))
adb=shutil.which('adb') or 'adb'
for source,name in [(MOBILE/'assets/demo/cake_01.jpg','sweetcake-mobile-cake.jpg'),(synthetic,'sweetcake-mobile-proof.png')]:
    subprocess.run([adb,'-s','emulator-5554','push',str(source),'/sdcard/Download/'+name],capture_output=True,check=True)
    subprocess.run([adb,'-s','emulator-5554','shell','am','broadcast','-a','android.intent.action.MEDIA_SCANNER_SCAN_FILE','-d','file:///sdcard/Download/'+name],capture_output=True)
def redact(line):
    secrets=[private['userPassword']]
    f=Path('H:/MSS/.runtime/bakery-mobile-phases-1-4/mobile-live-user.json')
    if f.exists():
        try:secrets.append(json.loads(f.read_text())['password'])
        except Exception:pass
    for value in secrets:line=line.replace(value,'[REDACTED]')
    line=re.sub(r'http://127\.0\.0\.1:\d+/[A-Za-z0-9_=-]{8,}/','[LOCAL_VM_SERVICE]/',line)
    return line
command=[shutil.which('flutter') or 'flutter','drive','--driver=tool/live_ui_driver.dart','--target=test_driver/live_app.dart','-d','emulator-5554']
archive=OUT/'runs'/str(int(time.time()));archive.mkdir(parents=True,exist_ok=True)
for name in ['android-ui-driver.log','android-ui-requests.json','android-ui-results.json']:
    if (OUT/name).exists():shutil.copyfile(OUT/name,archive/name)
with (OUT/'android-ui-driver.log').open('w',encoding='utf-8') as log:
    p=subprocess.Popen(command,cwd=MOBILE,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True,encoding='utf-8',errors='replace')
    for line in p.stdout:
        safe=redact(line);log.write(safe);log.flush()
        if any(x in safe for x in ['PASS:','stopped at','Built ','Error:','FAILURE:']):print(safe.strip(),flush=True)
    p.wait()
print(json.dumps({'exitCode':p.returncode,'evidence':'android-ui-driver.log'}),flush=True)
sys.exit(p.returncode)
