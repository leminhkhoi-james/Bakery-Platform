"""Real Flutter Android driver. No mock transport, hidden business writes or roles."""
import argparse,datetime,json,os,re,shutil,subprocess,time
from full_common import MOBILE,OUT,save
from full_apk import cache_current,verified_cache
p=argparse.ArgumentParser();p.add_argument('stage');p.add_argument('--reuse-apk',action='store_true');a=p.parse_args()
drivers={'journey-a':'tool/full_journey_a_driver.dart','remaining':'tool/full_remaining_driver.dart','extra':'tool/full_extra_driver.dart','review':'tool/full_review_driver.dart','review-fix':'tool/full_review_fix_driver.dart','walkthrough':'tool/full_walkthrough_driver.dart','persistence':'tool/full_persistence_driver.dart'}
driver=drivers[a.stage];runtime=json.loads((OUT/'runtime-start.json').read_text(encoding='utf-8-sig'))
for relative in ['sanitized-events/'+a.stage+'-android.json','test-results/'+a.stage+'-android.json','test-results/'+a.stage+'-command.json']:
    old=OUT/relative
    if old.exists():old.rename(old.with_stem(old.stem+'-retained-'+str(time.time_ns())))
command=[shutil.which('flutter'),'drive','--keep-app-running','--driver='+driver,'--target=test_driver/full_app.dart','-d','emulator-5554']
for domain in ['identity','bakery','subscription','marketplace','order','chat']:command+=['--dart-define='+domain.upper()+'_URL='+runtime['services'][domain+'-service']['origin']]
command+=['--dart-define=FULL_PERSISTENT=true']
if a.reuse_apk:command+=['--use-application-binary='+str(verified_cache())]
adb=shutil.which('adb') or r'D:\HomeMind\audit-tools\android-sdk\platform-tools\adb.exe'
for source,target in [(MOBILE/'assets/demo/cake_01.jpg','sweetcake-mobile-cake.jpg'),(MOBILE/'docs/evidence/api-integration-phases-1-4/proof.png','sweetcake-mobile-proof.png')]:
    if source.is_file():subprocess.run([adb,'-s','emulator-5554','push',str(source),'/sdcard/Download/'+target],capture_output=True,check=True)
# A clearly synthetic proof, never an actual bank receipt/payment claim.
from PIL import Image,ImageDraw
proof=OUT/'synthetic-proof.png'
if not proof.exists():
    img=Image.new('RGB',(720,400),'white');ImageDraw.Draw(img).text((32,50),'LOCAL SYNTHETIC TEST\nNO REAL TRANSFER\nSweetCake mobile verification',fill='black',spacing=20);img.save(proof)
subprocess.run([adb,'-s','emulator-5554','push',str(proof),'/sdcard/Download/sweetcake-mobile-proof.png'],capture_output=True,check=True)
folder=OUT/'test-results';folder.mkdir(parents=True,exist_ok=True)
logfile=folder/(a.stage+'-driver.log')
if logfile.exists():logfile=folder/(a.stage+'-driver-'+str(time.time_ns())+'.log')
started=time.monotonic()
built_current=False
with logfile.open('w',encoding='utf-8') as log:
    proc=subprocess.Popen(command,cwd=MOBILE,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True,encoding='utf-8',errors='replace')
    for line in proc.stdout:
        safe=re.sub(r'(?:https?|wss?)://(?:127\.0\.0\.1|localhost):\d+/[A-Za-z0-9_=-]{8,}/?', '[LOCAL_VM_SERVICE]/',line)
        if 'DevTools' in safe or 'uri=ws%3A' in safe:safe='[LOCAL_DEBUG_ENDPOINT_REDACTED]\n'
        if 'Built build' in safe:built_current=True
        log.write(safe);log.flush()
        if any(x in safe for x in ['PASS:','Live UI stopped','Built ','FAIL:','BLOCKED:']):print(safe.strip(),flush=True)
    proc.wait()
if not a.reuse_apk and (proc.returncode==0 or built_current) and (MOBILE/'build/app/outputs/flutter-apk/app-debug.apk').is_file():cache_current()
save('test-results/'+a.stage+'-command.json',{'command':command,'driver':driver,'exitCode':proc.returncode,'seconds':round(time.monotonic()-started,2),'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'log':str(logfile.relative_to(OUT))})
raise SystemExit(proc.returncode)
