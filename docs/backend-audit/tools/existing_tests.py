"""Chạy test hiện hữu chỉ trong source copy ngoài repo; xuất summary đã lọc."""
from pathlib import Path
import hashlib,json,os,re,shutil,subprocess,tempfile,time,xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[3];EV=ROOT/'docs/backend-audit/evidence'
WORK=Path(tempfile.gettempdir())/'bakery-backend-audit-20261107';source=WORK/'source/backend'
assert source.is_relative_to(Path(tempfile.gettempdir())) and not source.is_relative_to(ROOT)
env=os.environ.copy();env['JAVA_HOME']=r'C:\Program Files\Java\jdk-21';env['MAVEN_OPTS']='-Xmx384m -XX:ActiveProcessorCount=2'
command=['cmd','/d','/c','mvnw.cmd','-B','-ntp','-pl','identity-service,bakery-service,marketplace-service,subscription-service,order-service,chat-service,api-gateway','-am','test']
if (EV/'existing-tests.json').exists():
    previous=json.loads((EV/'existing-tests.json').read_text(encoding='utf-8'))
    (EV/'existing-tests-initial.json').write_text(json.dumps(previous,ensure_ascii=False,indent=2),encoding='utf-8')
    # MigrationSyncTest đọc canonical SQL theo vị trí tương đối ngoài backend.
    # Bổ sung đúng corpus read-only đó vào bản copy; không đổi bài test/ứng dụng.
    for p in (ROOT/'database').rglob('*.sql'):
        dest=WORK/'source/database'/p.relative_to(ROOT/'database');dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(p,dest)
    excluded=sorted(set(x['suite'].split('.')[-1] for x in previous['suites'] if not x['errors'] and not x['failures']))
    command+=['-fae','-Dsurefire.failIfNoSpecifiedTests=false','-Dtest='+','.join('!'+x for x in excluded)]
started=time.monotonic()
with (WORK/'existing-tests-private.log').open('w',encoding='utf-8') as stream:r=subprocess.run(command,cwd=source,env=env,stdout=stream,stderr=subprocess.STDOUT)
rows=[]
for p in source.glob('*/target/surefire-reports/TEST-*.xml'):
    t=ET.parse(p).getroot();row={'module':p.relative_to(source).parts[0],'suite':t.get('name'),'tests':int(t.get('tests',0)),'errors':int(t.get('errors',0)),'failures':int(t.get('failures',0)),'skipped':int(t.get('skipped',0)),'failureTypes':[]}
    for f in t.iter():
        if f.tag in ['failure','error']:row['failureTypes'].append({'type':f.get('type'),'message':re.sub(r'eyJ[A-Za-z0-9_.-]+','[JWT_REDACTED]',f.get('message',''))[:240]})
    rows.append(row)
out={'exitCode':r.returncode,'seconds':round(time.monotonic()-started,2),'commandArguments':command[3:],'cwd':'TEMP source copy','suites':rows,'totals':{k:sum(x[k] for x in rows) for k in ['tests','errors','failures','skipped']}}
(EV/'existing-tests.json').write_text(json.dumps(out,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps({k:v for k,v in out.items() if k!='suites'}))
