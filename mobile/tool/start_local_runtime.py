"""Start an existing Compose deployment without rewriting config/secrets or recreating containers."""
from pathlib import Path
import argparse,datetime,hashlib,json,subprocess,sys,time,urllib.request,urllib.parse
ROOT=Path(__file__).resolve().parents[2]
parser=argparse.ArgumentParser()
parser.add_argument('--runtime',type=Path,default=ROOT.parent/'.runtime/bakery-mobile-phases-1-4')
parser.add_argument('--project')
parser.add_argument('--check-only',action='store_true')
parser.add_argument('--output',type=Path,default=ROOT/'mobile/docs/evidence/docker-api-diagnostic')
args=parser.parse_args();out=args.output.resolve()
if ROOT/'mobile' not in out.parents:raise SystemExit('Evidence must be inside mobile/')
out.mkdir(parents=True,exist_ok=True)
def docker(*cmd):
    p=subprocess.run(['docker',*cmd],capture_output=True,text=True,encoding='utf-8',errors='replace')
    if p.returncode:raise RuntimeError('Docker operation failed: '+cmd[0]+' (exit '+str(p.returncode)+'); no raw environment output recorded')
    return p.stdout
def inspect(name):return json.loads(docker('inspect',name))[0]
def env(item):return dict(v.split('=',1) for v in item['Config']['Env'] if '=' in v)
def normalized(value):return value.replace('\\','/').lower()
report={'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'checkOnly':args.check_only,'actions':[],'services':{},'source':{}}
try:
    docker('info','--format','{{.ServerVersion}}')
    composeFile=args.runtime/'compose.json'
    if not composeFile.is_file():raise RuntimeError('Existing runtime compose.json missing; this command never bootstraps or generates secrets')
    raw=json.loads(composeFile.read_text(encoding='utf-8'))
    names=docker('ps','-aq','--filter','label=com.docker.compose.service=mobile-identity').split()
    candidates=[inspect(n) for n in names]
    candidates=[c for c in candidates if (not args.project or c['Config']['Labels'].get('com.docker.compose.project')==args.project) and normalized(str(composeFile)) in normalized(c['Config']['Labels'].get('com.docker.compose.project.config_files',''))]
    if len(candidates)!=1:raise RuntimeError('Select one existing Mobile Compose project with --runtime/--project; no containers created')
    project=candidates[0]['Config']['Labels']['com.docker.compose.project'];report['project']=project
    ids=docker('ps','-aq','--filter','label=com.docker.compose.project='+project).split()
    containers={c['Config']['Labels']['com.docker.compose.service']:c for c in [inspect(n) for n in ids]}
    required=['bakery-db','subscription-db','mobile-storage','mobile-identity','mobile-bakery','mobile-subscription']
    if any(n not in containers for n in required):raise RuntimeError('Deployment incomplete: bootstrap must be performed separately under its own authorization')
    # Validate current source provenance without rebuilding protected modules.
    for service in ['identity-service','bakery-service','subscription-service']:
        changed=[];count=0
        for p in (ROOT/'backend'/service/'src').rglob('*'):
            if not p.is_file():continue
            other=args.runtime/'source/backend'/service/p.relative_to(ROOT/'backend'/service)
            if not other.is_file() or hashlib.sha256(p.read_bytes()).digest()!=hashlib.sha256(other.read_bytes()).digest():changed.append(p.relative_to(ROOT).as_posix())
            count+=1
        report['source'][service]={'checked':count,'different':changed}
        if changed:raise RuntimeError('Runtime source copy differs; not rebuilding protected source or rewriting external runtime')
    # Existing container environment is authoritative; never re-interpolate $ in
    # raw credential strings by re-running Compose up on an established runtime.
    mismatch={}
    for name in ['mobile-identity','mobile-bakery','mobile-subscription']:
        actual=env(containers[name]);configured=raw['services'][name].get('environment',{})
        mismatch[name]=[k for k,v in configured.items() if actual.get(k)!=str(v)]
    report['rawComposeVsContainerDifferentNames']=mismatch
    jdbc=env(containers['mobile-identity']).get('IDENTITY_DB_URL','')
    host=urllib.parse.urlsplit(jdbc.removeprefix('jdbc:')).hostname
    # The URL uses a Docker network alias, not necessarily a container name.
    dbIds=docker('ps','-aq','--filter','label=com.docker.compose.service=identity-db').split()
    dbCandidates=[]
    for db in [inspect(n) for n in dbIds]:
        shared=set(db['NetworkSettings']['Networks']) & set(containers['mobile-identity']['NetworkSettings']['Networks'])
        if any(host in (db['NetworkSettings']['Networks'][n].get('Aliases') or []) for n in shared):dbCandidates.append(db)
    if len(dbCandidates)!=1:raise RuntimeError('Identity database network alias cannot be resolved uniquely to an existing container')
    identityDb=dbCandidates[0]
    report['identityDatabaseContainer']=identityDb['Name'].lstrip('/')
    if not args.check_only:
        dependencies=[identityDb['Name'],*[containers[n]['Name'] for n in required[:3]]]
        for name in dependencies:
            if inspect(name)['State']['Status']!='running':docker('start',name);report['actions'].append({'startContainer':name.lstrip('/')})
        for name in [identityDb['Name'],containers['bakery-db']['Name'],containers['subscription-db']['Name']]:
            for _ in range(45):
                state=inspect(name)['State']
                if state.get('Health',{}).get('Status')=='healthy':break
                time.sleep(2)
            else:raise RuntimeError('PostgreSQL health not ready; application startup stopped')
        for name in required[3:]:
            if inspect(containers[name]['Id'])['State']['Status']!='running':docker('start',containers[name]['Id']);report['actions'].append({'startService':name})
    checks={'mobile-identity':('8080/tcp','/v3/api-docs'),'mobile-bakery':('8080/tcp','/api/v1/products'),'mobile-subscription':('8080/tcp','/api/v1/subscription-plans'),'mobile-storage':('9000/tcp','/minio/health/ready')}
    for name,(internal,path) in checks.items():
        mapping=containers[name]['HostConfig']['PortBindings'][internal]
        if len(mapping)!=1 or mapping[0]['HostIp'] not in ['127.0.0.1','']:raise RuntimeError('Verify host port mapping explicitly')
        port=int(mapping[0]['HostPort']);item={'port':port,'path':path,'status':'UNAVAILABLE'}
        for _ in range(1 if args.check_only else 60):
            try:
                with urllib.request.urlopen(f'http://127.0.0.1:{port}{path}',timeout=3) as response:
                    if response.status==200:item.update(status='READY_HTTP_200',httpStatus=200);break
            except Exception as e:
                item.setdefault('transientErrorTypes',[])
                if type(e).__name__ not in item['transientErrorTypes']:item['transientErrorTypes'].append(type(e).__name__)
            if not args.check_only:time.sleep(2)
        report['services'][name]=item
    report['result']='PASS' if all(v['status']=='READY_HTTP_200' for v in report['services'].values()) else 'BLOCKED_BY_ENVIRONMENT'
except Exception as e:
    report.update(result='BLOCKED_BY_ENVIRONMENT',errorType=type(e).__name__,reason=str(e) if isinstance(e,RuntimeError) else 'Inspect prerequisites; sensitive exception details omitted')
target=out/('runtime-before.json' if args.check_only else 'runtime-start.json')
if target.exists():target.replace(target.with_name(target.stem+'-previous-'+str(time.time_ns())+'.json'))
target.write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(report),flush=True)
sys.exit(0 if report['result']=='PASS' else 2)
