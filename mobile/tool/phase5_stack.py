"""Extend the working Mobile runtime with existing images and existing databases.

No Compose file is created or changed. Credentials pass via child-process
environment (docker --env NAME), never command arguments or generated files.
"""
from pathlib import Path
import argparse,datetime,json,os,socket,subprocess,time,urllib.parse,urllib.request
ROOT=Path(__file__).resolve().parents[2];MOBILE=ROOT/'mobile';OUT=MOBILE/'docs/evidence/phases-5a-5b-5c'
def docker(*args,environment=None):
    p=subprocess.run(['docker',*args],env=environment,capture_output=True,text=True,encoding='utf-8',errors='replace',timeout=60)
    if p.returncode:raise RuntimeError('Docker '+args[0]+' failed; sensitive raw output suppressed')
    return p.stdout
def inspect(name):return json.loads(docker('inspect',name))[0]
def env(c):return dict(s.split('=',1) for s in c['Config']['Env'] if '=' in s)
def loopback_binding(c,internal):
    bindings=c['HostConfig']['PortBindings'].get(internal,[])
    if len(bindings)!=1 or bindings[0]['HostIp'] not in ['127.0.0.1','']:raise RuntimeError('Explicit loopback binding required')
    return int(bindings[0]['HostPort'])
def run(start=False,output=None,reuse_only=False):
    global OUT
    if output is not None:
        OUT=Path(output).resolve()
        if not OUT.is_relative_to(MOBILE.resolve()):raise RuntimeError('Evidence output must stay inside mobile')
    OUT.mkdir(parents=True,exist_ok=True)
    args=['python','-B',str(MOBILE/'tool/start_local_runtime.py'),'--output',str(OUT/'existing-mobile')]
    if not start:args.append('--check-only')
    checked=subprocess.run(args,cwd=MOBILE,capture_output=True,text=True,timeout=300)
    if checked.returncode:raise RuntimeError('Existing Mobile services unavailable; original config was not modified')
    report={'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'project':'existing Mobile + three standalone phase5 containers','actions':[],'services':{},'configurationFilesChanged':False,'newCredentialsGenerated':False}
    mobile={d:inspect('bakery-mobile-20261107-mobile-'+d+'-1') for d in ['identity','bakery','subscription']}
    shared=set.intersection(*(set(c['NetworkSettings']['Networks']) for c in mobile.values()))
    if len(shared)!=1:raise RuntimeError('Expected one shared Mobile network')
    mobileNetwork=shared.pop();canonicalIdentity=inspect('bakery-local-identity-service-1')
    offset=loopback_binding(mobile['identity'],'8080/tcp')-loopback_binding(canonicalIdentity,'8080/tcp')
    targetHosts={'identity-service':('mobile-identity',8080),'bakery-service':('mobile-bakery',8080),'subscription-service':('mobile-subscription',8080),'marketplace-service':('phase5-marketplace',8080),'order-service':('phase5-order',8080),'chat-service':('phase5-chat',8080)}
    for domain,c in mobile.items():report['services'][domain+'-service']={'container':c['Name'].lstrip('/'),'image':c['Image'],'origin':'http://127.0.0.1:'+str(loopback_binding(c,'8080/tcp')),'source':'existing working Mobile deployment'}
    # Supporting databases/storage were provisioned previously; reuse by name.
    for component in ['marketplace-db','order-db','chat-db','chat-storage']:
        c=inspect('bakery-local-'+component+'-1')
        if start and c['State']['Status']!='running':docker('start',c['Id']);report['actions'].append({'startedDependency':component})
        if start and component.endswith('-db'):
            for _ in range(60):
                if inspect(c['Id'])['State'].get('Health',{}).get('Status')=='healthy':break
                time.sleep(1)
            else:raise RuntimeError('Dependency database is not healthy: '+component)
        if component.endswith('-storage'):report['services'][component]={'container':c['Name'].lstrip('/'),'origin':'http://127.0.0.1:'+str(loopback_binding(c,'9000/tcp'))}
    for domain in ['marketplace','order','chat']:
        source=inspect('bakery-local-'+domain+'-service-1');environment=env(source);rewritten=[]
        for key,value in list(environment.items()):
            if not value.startswith('http://'):continue
            parsed=urllib.parse.urlsplit(value)
            if parsed.hostname in targetHosts:
                host,port=targetHosts[parsed.hostname];environment[key]=urllib.parse.urlunsplit(parsed._replace(netloc=f'{host}:{port}'));rewritten.append(key)
        internal=environment.get('SERVER_PORT','8080')+'/tcp';hostPort=loopback_binding(source,internal)+offset
        name='bakery-mobile-phase5-'+domain;alias='phase5-'+domain
        existing=docker('ps','-aq','--filter','name=^/'+name+'$').split()
        if not existing:
            if reuse_only:raise RuntimeError('Existing phase5 container missing; persistent configuration changes are disabled')
            if not start:raise RuntimeError('Phase5 extension not created; run with --start')
            with socket.socket() as s:
                if s.connect_ex(('127.0.0.1',hostPort))==0:raise RuntimeError('Derived local port is occupied; existing listener preserved')
            command=['create','--name',name,'--network',mobileNetwork,'--network-alias',alias,'--publish',f'127.0.0.1:{hostPort}:{internal.split("/")[0]}','--restart','unless-stopped','--label','bakery.mobile.phase=5','--label','bakery.mobile.source='+source['Id']]
            for key in environment:command+=['--env',key]
            for mount in source['Mounts']:
                if mount['Type']!='bind' or mount['RW'] or not Path(mount['Source']).is_file():raise RuntimeError('Source application has an unsupported writable or missing mount')
                command+=['--mount',f'type=bind,source={mount["Source"]},target={mount["Destination"]},readonly']
            entry=source['Config'].get('Entrypoint') or [];cmd=source['Config'].get('Cmd') or []
            if entry:command+=['--entrypoint',entry[0]]
            command+=[source['Image'],*entry[1:],*cmd]
            docker(*command,environment={**os.environ,**environment});report['actions'].append({'createdContainer':name,'imageReused':True})
        c=inspect(name)
        if c['Config']['Labels'].get('bakery.mobile.phase')!='5' or c['Image']!=source['Image'] or env(c)!=environment:raise RuntimeError('Existing extension differs; refusing replacement')
        for network in source['NetworkSettings']['Networks']:
            if network not in c['NetworkSettings']['Networks']:
                if not start:raise RuntimeError('Required database network not connected')
                docker('network','connect',network,name);report['actions'].append({'connectedNetwork':network,'container':name})
        if start and c['State']['Status']!='running':docker('start',name);report['actions'].append({'startedContainer':name})
        report['services'][domain+'-service']={'container':name,'image':c['Image'],'origin':f'http://127.0.0.1:{hostPort}','sourceContainer':source['Name'].lstrip('/'),'rewrittenVariableNames':rewritten,'credentialSource':'unchanged source-container environment','internalAlias':alias}
    storage=inspect('bakery-mobile-20261107-mobile-storage-1');report['services']['mobile-storage']={'container':storage['Name'].lstrip('/'),'origin':'http://127.0.0.1:'+str(loopback_binding(storage,'9000/tcp'))}
    for key,item in report['services'].items():
        path='/v3/api-docs' if key.endswith('-service') else '/minio/health/ready'
        for _ in range(90 if start else 1):
            try:
                with urllib.request.urlopen(item['origin']+path,timeout=3) as r:
                    item['readinessStatus']=r.status
                    if r.status==200:break
            except Exception as e:item['lastErrorType']=type(e).__name__
            if start:time.sleep(2)
        item.pop('lastErrorType',None) if item.get('readinessStatus')==200 else None
    report['result']='PASS' if all(v.get('readinessStatus')==200 for v in report['services'].values()) else 'BLOCKED_ENVIRONMENT'
    target=OUT/'runtime-start.json'
    if target.exists():target.rename(target.with_stem(target.stem+'-'+str(time.time_ns())))
    target.write_text(json.dumps(report,indent=2),encoding='utf-8')
    print(json.dumps({'result':report['result'],'actions':report['actions'],'origins':{k:v['origin'] for k,v in report['services'].items()}}),flush=True)
    return report
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--start',action='store_true');p.add_argument('--output');p.add_argument('--reuse-only',action='store_true');a=p.parse_args();r=run(a.start,a.output,a.reuse_only);raise SystemExit(r['result']!='PASS')
