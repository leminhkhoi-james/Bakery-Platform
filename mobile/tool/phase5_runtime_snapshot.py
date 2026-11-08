"""Sanitized final Docker/Android snapshot; no environment or raw application logs."""
from pathlib import Path
import json,re,shutil,subprocess
MOBILE=Path(__file__).resolve().parents[1];OUT=MOBILE/'docs/evidence/phases-5a-5b-5c'
runtime=json.loads((OUT/'runtime-start.json').read_text());names=[v['container'] for v in runtime['services'].values()]
names+=['bakery-local-identity-db-1','bakery-mobile-20261107-bakery-db-1','bakery-mobile-20261107-subscription-db-1','bakery-local-marketplace-db-1','bakery-local-order-db-1','bakery-local-chat-db-1']
rows=[]
for name in names:
    c=json.loads(subprocess.check_output(['docker','inspect',name]))[0]
    logs=subprocess.run(['docker','logs','--tail','2000',name],capture_output=True,text=True,encoding='utf-8',errors='replace') if 'db-' not in name and 'storage-' not in name else None
    signals=[]
    if logs:
        for line in (logs.stdout+logs.stderr).splitlines():
            if 'No active profile set' in line:signals.append('default profile confirmed in startup log')
    rows.append({'container':name,'state':c['State']['Status'],'health':c['State'].get('Health',{}).get('Status','not defined'),'networks':list(c['NetworkSettings']['Networks']),'volumeNames':[m['Name'] for m in c['Mounts'] if m['Type']=='volume'],'portBindings':c['HostConfig']['PortBindings'],'profileSignals':sorted(set(signals))})
def adb(*a):return subprocess.run([shutil.which('adb'),'-s','emulator-5554',*a],capture_output=True,check=True)
pid=adb('shell','pidof','com.example.bakery_mobile').stdout.decode().strip()
logs=adb('logcat','-d','--pid='+pid,'-t','10000').stdout.decode(errors='replace')
android={'device':'emulator-5554','bootCompleted':adb('shell','getprop','sys.boot_completed').stdout.decode().strip(),'bootAnimation':adb('shell','getprop','init.svc.bootanim').stdout.decode().strip(),'reverseMappings':adb('reverse','--list').stdout.decode().splitlines(),'normalApplicationPidPresent':bool(pid),'criticalLogSignalCounts':{s:logs.count(s) for s in ['Unhandled Exception','FATAL EXCEPTION','Error caught by widgets library','RenderFlex overflowed']},'rawLogsPersisted':False,'defaultUserProfileInspected':False}
adb('shell','input','keyevent','KEYCODE_WAKEUP');adb('shell','wm','dismiss-keyguard')
(OUT/'ui-main-home.png').write_bytes(adb('exec-out','screencap','-p').stdout)
(OUT/'final-runtime.json').write_text(json.dumps({'containers':rows,'android':android,'scope':'Normal lib/main.dart after fresh PowerShell README procedure'},indent=2),encoding='utf-8')
print(json.dumps({'runningContainers':len(rows),'allRunning':all(r['state']=='running' for r in rows),'android':android}),flush=True)
