"""Cấu hình chỉ xuất tên/status; không xuất environment values hoặc secrets."""
from pathlib import Path
import base64,collections,hashlib,json,re,subprocess,tempfile
import requests,yaml
class ComposeLoader(yaml.SafeLoader):pass
def compose_tag(loader,node):
    if isinstance(node,yaml.SequenceNode):return loader.construct_sequence(node)
    if isinstance(node,yaml.MappingNode):return loader.construct_mapping(node)
    return loader.construct_scalar(node)
for tag in ['!reset','!override']:ComposeLoader.add_constructor(tag,compose_tag)
ROOT=Path(__file__).resolve().parents[3];EV=ROOT/'docs/backend-audit/evidence';WORK=Path(tempfile.gettempdir())/'bakery-backend-audit-20261107'
runtime=json.loads((WORK/'runtime-compose.json').read_text());private=json.loads((WORK/'runtime-private.json').read_text())
configs=[];compose=[];drift=[]
for p in ROOT.glob('*compose*.y*ml'):
    s=p.read_text(encoding='utf-8');y=yaml.load(s,Loader=ComposeLoader) or {}
    compose.append({'source':p.relative_to(ROOT).as_posix(),'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'services':list(y.get('services',{})),'networks':list(y.get('networks',{})),'volumes':list(y.get('volumes',{})),'interpolationNames':sorted(set(re.findall(r'\$\{([A-Z][A-Z0-9_]*)',s))),'serviceEnvironmentNames':{k:sorted(v.get('environment',{})) if isinstance(v.get('environment',{}),dict) else [e.split('=')[0] for e in v.get('environment',[])] for k,v in y.get('services',{}).items()}})
for p in (ROOT/'backend').glob('*/src/main/resources/application*.y*ml'):
    service=p.relative_to(ROOT/'backend').parts[0];env=runtime['services'].get(service,{}).get('environment',{})
    for i,line in enumerate(p.read_text(encoding='utf-8').splitlines(),1):
        for match in re.finditer(r'\$\{([A-Z][A-Z0-9_]*)(?::([^}]*))?\}',line):
            name,default=match.groups();status='CONTAINER_VALUE' if env.get(name) else 'APPLICATION_DEFAULT' if default is not None else 'UNRESOLVED'
            if service=='cake-ai-service':status='COMPILE_BLOCKED; '+('DEFAULT_DECLARED' if default is not None else 'REQUIRES_CONFIGURATION')
            generated=name.endswith(('_DB_PASSWORD','_MINIO_ACCESS_KEY','_MINIO_SECRET_KEY')) or name in ['CHAT_STORAGE_ACCESS_KEY','CHAT_STORAGE_SECRET_KEY']
            configs.append({'service':service,'variable':name,'property':line.strip().split(':',1)[0],'source':p.relative_to(ROOT).as_posix(),'line':i,'resolution':status,'sensitive':bool(re.search(r'PASSWORD|SECRET|KEY|TOKEN|CREDENTIAL',name)),'generatedInAudit':generated,'verified':'SERVICE_BOOT+BUSINESS_CASES' if service in private['ports'] else 'NOT_RUNNING'})
for p in (ROOT/'backend').glob('*/src/main/java/**/*.java'):
    service=p.relative_to(ROOT/'backend').parts[0];env=runtime['services'].get(service,{}).get('environment',{})
    for i,line in enumerate(p.read_text(encoding='utf-8').splitlines(),1):
        for match in re.finditer(r'\$\{([A-Z][A-Z0-9_]*)(?::([^}]*))?\}',line):
            name,default=match.groups()
            configs.append({'service':service,'variable':name,'property':'Java @Value placeholder','source':p.relative_to(ROOT).as_posix(),'line':i,'resolution':'CONTAINER_VALUE' if env.get(name) else 'DEFAULT_DECLARED' if default is not None else 'UNRESOLVED','sensitive':bool(re.search(r'PASSWORD|SECRET|KEY|TOKEN|CREDENTIAL',name)),'generatedInAudit':False,'verified':'SERVICE_BOOT; EXTERNAL_INTEGRATION_NOT_IMPLIED' if service in private['ports'] else 'NOT_RUNNING'})
property_rows=[]
for c in json.loads((EV/'java-classes.json').read_text(encoding='utf-8')):
    if c['test']:continue
    ann=next((a for a in c['annotations'] if a.startswith('@ConfigurationProperties')),None)
    prefix=re.search(r'"([^"]+)"',ann).group(1) if ann and re.search(r'"([^"]+)"',ann) else None
    if not prefix:continue
    for f in c['fields']:
        kebab=re.sub(r'(?<!^)([A-Z])',r'-\1',f['name']).lower();prop=prefix+'.'+kebab
        property_rows.append({'service':c['module'],'property':prop,'environmentBinding':prop.replace('.','_').replace('-','').upper(),'type':f['type'],'defaultDeclared':any('DefaultValue' in a for a in f['annotations']),'source':c['source'],'line':f['line'],'verification':'COMPILE_BLOCKED' if c['module']=='cake-ai-service' else 'APPLICATION_SCHEMA; SEE_YAML_PLACEHOLDER_MAPPING'})
for p in (ROOT/'backend').glob('*/src/main/resources/db/migration/*.sql'):
    module=p.relative_to(ROOT/'backend').parts[0];canonical=ROOT/'database/postgresql'/module/p.name
    drift.append({'module':module,'migration':p.name,'canonicalExists':canonical.exists(),'bytesEqual':canonical.read_bytes()==p.read_bytes() if canonical.exists() else None,'normalizedEqual':canonical.read_text(encoding='utf-8').replace('\r\n','\n').strip()==p.read_text(encoding='utf-8').replace('\r\n','\n').strip() if canonical.exists() else None,'lineIndentNormalizedEqual':[x.strip() for x in canonical.read_text(encoding='utf-8').splitlines() if x.strip()]==[x.strip() for x in p.read_text(encoding='utf-8').splitlines() if x.strip()] if canonical.exists() else None})
reconcile=[]
apis=json.loads((EV/'api-inventory.json').read_text(encoding='utf-8'))
for service in sorted(set(a['module'] for a in apis)):
    row={'service':service,'source':sum(a['module']==service for a in apis)}
    for kind in ['existing','isolated']:
        p=EV/f'{kind}-openapi-{service}.json'
        if not p.exists():row[kind]='NOT_AVAILABLE';continue
        data=json.loads(p.read_text(encoding='utf-8'));ops={(verb.upper(),path) for path,verbs in data['paths'].items() for verb in verbs if verb in ['get','post','put','patch','delete']};src={(a['method'],a['path']) for a in apis if a['module']==service}
        row[kind]={'count':len(ops),'missingFromRuntime':sorted(src-ops),'extraRuntime':sorted(ops-src)}
    reconcile.append(row)
j=requests.get('http://127.0.0.1:18091/.well-known/jwks.json',timeout=10).json();bits=[int.from_bytes(base64.urlsafe_b64decode(k['n']+'=='),'big').bit_length() for k in j['keys']]
for file,data in [('compose-inventory.json',compose),('environment-matrix.json',configs),('configuration-properties.json',property_rows),('migration-canonical-comparison.json',drift),('api-reconciliation.json',reconcile),('jwt-public-metadata.json',{'algorithm':'RS256','rsaModulusBits':bits,'privateKeyExported':False})]:
    (EV/file).write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'composeFiles':len(compose),'configurationReferences':len(configs),'canonicalMigrationDrift':sum(not x['normalizedEqual'] for x in drift),'reconciliation':reconcile,'jwtBits':bits}))
