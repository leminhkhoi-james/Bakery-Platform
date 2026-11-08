"""Build source hiện tại trong TEMP; tuyệt đối không gọi Maven tại backend gốc."""
from pathlib import Path
import hashlib,json,os,shutil,subprocess,tempfile,time
ROOT=Path(__file__).resolve().parents[3];EV=ROOT/'docs/backend-audit/evidence'
WORK=Path(tempfile.gettempdir())/'bakery-backend-audit-20261107'
COPY=WORK/'source/backend'
if not COPY.exists():
    shutil.copytree(ROOT/'backend',COPY,ignore=shutil.ignore_patterns('target','.git','.env','*.log'))
    pairs=[]
    for p in COPY.rglob('*'):
        if not p.is_file():continue
        relative=p.relative_to(COPY);original=ROOT/'backend'/relative
        sha=lambda path:hashlib.sha256(path.read_bytes()).hexdigest()
        assert sha(p)==sha(original)
        pairs.append({'source':original.relative_to(ROOT).as_posix(),'sha256':sha(p)})
    (EV/'isolated-source-copy.json').write_text(json.dumps({'workspace':str(WORK),'files':pairs},ensure_ascii=False,indent=2),encoding='utf-8')
commands=[('business-services','identity-service,bakery-service,marketplace-service,subscription-service,order-service,chat-service,api-gateway'),('cake-ai','cake-ai-service')]
results=[]
for name,modules in commands:
    command=[str(COPY/'mvnw.cmd'),'-B','-ntp','-pl',modules,'-am','-DskipTests','package']
    env=dict(os.environ);env['JAVA_HOME']=r'C:\Program Files\Java\jdk-21'
    start=time.monotonic()
    with (EV/f'build-{name}.txt').open('w',encoding='utf-8') as f:completed=subprocess.run(command,cwd=COPY,env=env,stdout=f,stderr=subprocess.STDOUT)
    result={'name':name,'exitCode':completed.returncode,'seconds':round(time.monotonic()-start,2),'workingDirectory':str(COPY),'command':'mvnw.cmd '+' '.join(command[1:]),'evidence':f'build-{name}.txt'}
    results.append(result);(EV/'isolated-build.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(result),flush=True)
