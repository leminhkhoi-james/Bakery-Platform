"""Rehearse the documented existing-deployment startup in a fresh PowerShell."""
import hashlib,json,os,re,shutil,subprocess,time
from full_common import MOBILE,OUT,save
from full_apk import verified_cache
verified_cache() # Preserve correct test entry before normal main replaces build output.
flutter=shutil.which('flutter') or r'D:\HomeMind\audit-tools\flutter\bin\flutter.bat'
adb=shutil.which('adb') or r'D:\HomeMind\audit-tools\android-sdk\platform-tools\adb.exe'
env={**os.environ,'PATH':str(__import__('pathlib').Path(flutter).parent)+';'+str(__import__('pathlib').Path(adb).parent)+';'+os.environ['PATH']}
checks=[]
for name,command in [
 ('flutter-version',[flutter,'--version']),('doctor',[flutter,'doctor','-v']),('emulators',[flutter,'emulators']),
 ('devices',[adb,'devices','-l']),('docker-daemon',['docker','info','--format','{{.ServerVersion}}']),('compose-projects',['docker','compose','ls','--all','--format','json']),
 ('package-manager',[adb,'-s','emulator-5554','shell','pm','path','android']),('reverse',[adb,'-s','emulator-5554','reverse','--list'])]:
    p=subprocess.run(command,cwd=MOBILE,env=env,capture_output=True,text=True,encoding='utf-8',errors='replace',timeout=120)
    checks.append({'check':name,'command':command,'exitCode':p.returncode,'output':p.stdout.strip()})
folder=OUT/'runbook';folder.mkdir(parents=True,exist_ok=True)
command=['powershell','-NoProfile','-ExecutionPolicy','Bypass','-File','tool/start_mobile.ps1','-DeviceId','emulator-5554','-EvidenceDirectory',str(folder.relative_to(MOBILE)),'-NoResident']
started=time.monotonic()
with (folder/'normal-start.log').open('w',encoding='utf-8') as log:
    p=subprocess.Popen(command,cwd=MOBILE,env=env,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True,encoding='utf-8',errors='replace')
    for line in p.stdout:
        safe=re.sub(r'(?:https?|wss?)://(?:127\.0\.0\.1|localhost):\d+/[A-Za-z0-9_=-]{8,}/?', '[LOCAL_VM_SERVICE]/',line)
        if 'DevTools' in safe or 'uri=ws%3A' in safe:safe='[LOCAL_DEBUG_ENDPOINT_REDACTED]\n'
        log.write(safe);log.flush()
        if any(x in safe for x in ['Built build','Backend, Android','Launching lib']):print(safe.strip(),flush=True)
    p.wait()
time.sleep(3)
pid=subprocess.run([adb,'-s','emulator-5554','shell','pidof','com.example.bakery_mobile'],capture_output=True,text=True).stdout.strip()
png=subprocess.check_output([adb,'-s','emulator-5554','exec-out','screencap','-p'])
(OUT/'screenshots/readme-normal-main-home.png').write_bytes(png)
apk=MOBILE/'build/app/outputs/flutter-apk/app-debug.apk'
save('test-results/runbook.json',{'checks':checks,'startupCommand':command,'cwd':str(MOBILE),'freshNoProfilePowerShell':True,'startupExitCode':p.returncode,'seconds':round(time.monotonic()-started,2),'normalMainEntrypoint':True,'appProcessAlive':bool(pid),'normalApkSha256':hashlib.sha256(apk.read_bytes()).hexdigest(),'normalApkBytes':apk.stat().st_size,'defaultSessionContentsInspected':False,'cleanCloneClaim':False,'result':'STARTED_PENDING_VISUAL_VERIFICATION' if p.returncode==0 and pid else 'FAIL'})
print({'startupExitCode':p.returncode,'normalMainProcessAlive':bool(pid)},flush=True)
raise SystemExit(p.returncode or (not pid))
