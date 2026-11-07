"""Start the unchanged Web in a private external copy; original frontend stays read-only."""
from pathlib import Path
import os, json, shutil, subprocess, tempfile, urllib.request, time
ROOT=Path(__file__).resolve().parents[2]
DEST=Path('H:/MSS/.runtime/bakery-mobile-phases-1-4/web')
try:
    pid=json.loads((DEST/'runtime-pid.json').read_text())['pid']
    tasks=subprocess.check_output(['tasklist','/FI',f'PID eq {pid}','/FO','CSV','/NH'],text=True)
    with urllib.request.urlopen('http://127.0.0.1:5174',timeout=3) as response:html=response.read().decode()
    if f'"{pid}"' in tasks and '/@vite/client' in html:
        result={'url':'http://127.0.0.1:5174','externalCopy':str(DEST),'status':'RUNNING_AND_VERIFIED_HTTP','pid':pid,'method':'REUSED existing reference Web process'}
        (ROOT/'mobile/docs/evidence/api-integration-phases-1-4/web-runtime.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
        print(json.dumps(result));raise SystemExit(0)
except (OSError,KeyError,ValueError):pass
if not (DEST/'node_modules/vite/dist/node/cli.js').exists():
    DEST.mkdir(exist_ok=True)
    result=subprocess.run(['robocopy',str(ROOT/'frontend'),str(DEST),'/E','/XD','.git',str(ROOT/'frontend/dist'),'/XF','.env*','/NFL','/NDL','/NJH','/NJS','/NP'],capture_output=True)
    if result.returncode>=8:raise SystemExit('External Web copy failed; no protected source edited.')
env=os.environ.copy()
for name,port in [('IDENTITY',18101),('BAKERY',18102),('SUBSCRIPTION',18104),('MARKETPLACE',18093),('ORDER',18096),('CHAT',18097)]: env['DEV_'+name+'_TARGET']=f'http://127.0.0.1:{port}'
log=(DEST/'runtime.log').open('ab')
p=subprocess.Popen(['node',str(DEST/'node_modules/vite/bin/vite.js'),'--host','127.0.0.1','--port','5174','--strictPort'],cwd=DEST,env=env,stdout=log,stderr=subprocess.STDOUT,creationflags=subprocess.CREATE_NO_WINDOW)
(DEST/'runtime-pid.json').write_text(json.dumps({'pid':p.pid}),encoding='utf-8')
status='NOT_VERIFIED'
for _ in range(25):
    try:
        with urllib.request.urlopen('http://127.0.0.1:5174',timeout=2) as r:
            if r.status==200:status='RUNNING_AND_VERIFIED_HTTP';break
    except Exception:time.sleep(1)
out={'url':'http://127.0.0.1:5174','externalCopy':str(DEST),'status':status,'pid':p.pid,'protectedSource':'frontend unchanged; cache/output external','method':'node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5174 --strictPort'}
(ROOT/'mobile/docs/evidence/api-integration-phases-1-4/web-runtime.json').write_text(json.dumps(out,indent=2),encoding='utf-8')
print(json.dumps(out))
