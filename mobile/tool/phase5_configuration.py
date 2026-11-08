"""Record configuration names/statuses only; never serialize environment values."""
from pathlib import Path
import json,re,subprocess
MOBILE=Path(__file__).resolve().parents[1];ROOT=MOBILE.parent;OUT=MOBILE/'docs/evidence/phases-5a-5b-5c'
runtime=json.loads((OUT/'runtime-start.json').read_text());rows=[]
for name,item in runtime['services'].items():
    if not name.endswith('-service'):continue
    c=json.loads(subprocess.check_output(['docker','inspect',item['container']]))[0]
    env=dict(v.split('=',1) for v in c['Config']['Env'] if '=' in v)
    placeholders={}
    for p in (ROOT/'backend'/name/'src/main/resources').glob('application*'):
        if not p.is_file():continue
        for key,default in re.findall(r'\$\{([A-Z][A-Z0-9_]*)(:[^}]*)?\}',p.read_text()):
            placeholders.setdefault(key,[]).append({'file':p.name,'defaultPresent':bool(default)})
    variables=[]
    keys=set(placeholders)|{k for k in env if re.search(r'^(SPRING_|DB_|JWT_|IDENTITY_|BAKERY_|SUBSCRIPTION_|MARKETPLACE_|ORDER_|CHAT_|FIREBASE_|MINIO_|STORAGE_|SERVER_|SERVICE_)',k)}
    for key in sorted(keys):
        variables.append({'name':key,'source':'existing container environment' if key in env else 'application default' if any(v['defaultPresent'] for v in placeholders.get(key,[])) else 'unresolved','presentNonEmpty':bool(env.get(key,'')),'sourceReferences':placeholders.get(key,[]),'generated':False})
    rows.append({'service':name,'container':item['container'],'springProfile':env.get('SPRING_PROFILES_ACTIVE','default; no explicit profile env'),'publicOrigin':item['origin'],'runtime':c['State']['Status'],'openApiStatus':item['readinessStatus'],'networks':list(c['NetworkSettings']['Networks']),'mountTypes':[{'type':m['Type'],'readOnly':not m['RW'],'target':m['Destination']} for m in c['Mounts']],'variables':variables,'rewrittenDependencyVariableNames':item.get('rewrittenVariableNames',[]),'generatedSecretCount':0})
result={'services':rows,'configurationValuesPersisted':False,'newCredentialsGenerated':False,'allBusinessFlowsReady':False,'limitations':['public address contract absent','chat history SQL error','chat signed URL internal hostname','Firebase configuration absent']}
(OUT/'configuration-matrix.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
print(json.dumps({'services':[{'name':r['service'],'profile':r['springProfile'],'variables':len(r['variables']),'status':r['runtime']} for r in rows]}),flush=True)
