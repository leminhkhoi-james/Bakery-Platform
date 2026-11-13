"""Reuse canonical six-domain local containers; never run Compose interpolation."""
from pathlib import Path
import argparse,datetime,json,subprocess,time,urllib.request
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'mobile/docs/evidence/phases-5a-5b-5c'
def docker(*args):
    p=subprocess.run(['docker',*args],capture_output=True,text=True,encoding='utf-8',errors='replace',timeout=50)
    if p.returncode:raise RuntimeError('Docker '+args[0]+' failed; raw output suppressed')
    return p.stdout
def inspect(name):return json.loads(docker('inspect',name))[0]
def run(start=False):
    names=docker('ps','-aq','--filter','label=com.docker.compose.project=bakery-local').split()
    containers={c['Config']['Labels']['com.docker.compose.service']:c for c in [inspect(n) for n in names]}
    domains=['identity','bakery','subscription','marketplace','order','chat']
    required=[d+'-db' for d in domains]+['bakery-storage','subscription-storage','chat-storage']+[d+'-service' for d in domains]
    if any(n not in containers for n in required):raise RuntimeError('Canonical deployment incomplete; existing containers required')
    report={'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'project':'bakery-local','startRequested':start,'actions':[],'services':{}}
    for group in [required[:9],required[9:12],required[12:]]:
        if start:
            for name in group:
                c=inspect(containers[name]['Id'])
                if c['State']['Status']!='running':docker('start',c['Id']);report['actions'].append({'start':name})
            for name in [n for n in group if n.endswith('-db')]:
                for _ in range(60):
                    if inspect(containers[name]['Id'])['State'].get('Health',{}).get('Status')=='healthy':break
                    time.sleep(1)
                else:raise RuntimeError('Database health unavailable: '+name)
    for name in required:
        c=inspect(containers[name]['Id']);environment=dict(v.split('=',1) for v in c['Config']['Env'] if '=' in v)
        ports={k:[v['HostIp']+':'+v['HostPort'] for v in values] for k,values in c['HostConfig'].get('PortBindings',{}).items() if values}
        item={'container':c['Name'].lstrip('/'),'id':c['Id'],'image':c['Image'],'state':c['State']['Status'],'health':c['State'].get('Health',{}).get('Status'),'ports':ports,'profile':environment.get('SPRING_PROFILES_ACTIVE'),'environmentNames':sorted(environment),'networks':list(c['NetworkSettings']['Networks']),'mounts':[{'destination':m['Destination'],'type':m['Type'],'readOnly':not m['RW']} for m in c['Mounts']]}
        if name.endswith('-service') or name.endswith('-storage'):
            internal=environment.get('SERVER_PORT','8080')+'/tcp' if name.endswith('-service') else '9000/tcp';bindings=c['HostConfig']['PortBindings'].get(internal,[])
            if len(bindings)!=1 or bindings[0]['HostIp'] not in ['127.0.0.1','']:raise RuntimeError('Expected loopback host binding: '+name)
            port=int(bindings[0]['HostPort']);item['origin']=f'http://127.0.0.1:{port}'
            path='/v3/api-docs' if name.endswith('-service') else '/minio/health/ready'
            for _ in range(60 if start else 1):
                try:
                    with urllib.request.urlopen(item['origin']+path,timeout=3) as r:
                        item['readinessStatus']=r.status
                        if r.status==200:break
                except Exception as e:item['errorType']=type(e).__name__
                if start:time.sleep(2)
            item.pop('errorType',None) if item.get('readinessStatus')==200 else None
        report['services'][name]=item
    report['result']='PASS' if all(report['services'][d+'-service'].get('readinessStatus')==200 for d in domains) else 'BLOCKED_ENVIRONMENT'
    OUT.mkdir(parents=True,exist_ok=True);target=OUT/('runtime-start.json' if start else 'runtime-baseline.json')
    if target.exists():target.rename(target.with_stem(target.stem+'-'+str(time.time_ns())))
    target.write_text(json.dumps(report,indent=2),encoding='utf-8')
    print(json.dumps({'result':report['result'],'actions':report['actions'],'services':{k:{n:v.get(n) for n in ['state','health','origin','readinessStatus']} for k,v in report['services'].items()}}),flush=True)
    return report
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--start',action='store_true');a=p.parse_args();report=run(a.start);raise SystemExit(report['result']!='PASS')
