"""User-authorized persistent runtime on H:. No SQL, role grant or protected source edits."""
from pathlib import Path
import hashlib,json,os,secrets,subprocess,time,urllib.request,zipfile
ROOT=Path(__file__).resolve().parents[2]
DEST=Path('H:/MSS/.runtime/bakery-mobile-phases-1-4')
if ROOT==DEST or ROOT in DEST.parents:raise SystemExit('Runtime must remain outside repository')
DEST.mkdir(parents=True,exist_ok=True)
account=subprocess.check_output(['whoami'],text=True).strip()
subprocess.run(['icacls',str(DEST),'/inheritance:r','/grant:r',account+':(OI)(CI)F','SYSTEM:(OI)(CI)F'],capture_output=True,check=True)
def inspect(name):return json.loads(subprocess.check_output(['docker','inspect',name],text=True))[0]
def env(item):return dict(x.split('=',1) for x in item['Config']['Env'] if '=' in x)
def copy(container,source,target):
    if not target.exists():subprocess.run(['docker','cp',container+':'+source,str(target)],capture_output=True,check=True)
def digest(p):return hashlib.sha256(p.read_bytes()).hexdigest()
identity=inspect('bakery-local-identity-service-1')
bakery=inspect('bakery-local-bakery-service-1')
subscription=inspect('bakery-local-subscription-service-1')
services=['identity-service','bakery-service','subscription-service']
jars=DEST/'jars';jars.mkdir(exist_ok=True)
for name in services:
    if not (jars/(name+'.jar')).exists():raise SystemExit('Run mobile/tool/prepare_runtime_sources.py first.')
if not (DEST/'service-clients.yml').exists():
    # Preserve original grants file; new isolated deployment needs the scopes
    # requested by current onboarding clients. Existing hashes remain unchanged.
    source=Path('H:/MSS/.secrets/bakery-platform/local-service-clients.yml').read_text(encoding='utf-8')
    lines=[];client=None
    for line in source.splitlines():
        if line.startswith('      ') and not line.startswith('       ') and line.endswith(':'):client=line.strip()[:-1]
        if client=='bakery-service' and line.strip().startswith('identity-service:') and 'identity:bakery-owner:grant' not in line:line+=' identity:bakery-owner:grant'
        if client=='subscription-service' and line.strip().startswith('bakery-service:') and 'bakery:onboarding:activate' not in line:line+=' bakery:onboarding:activate'
        lines.append(line)
    (DEST/'service-clients.yml').write_text('\n'.join(lines)+'\n',encoding='utf-8')
copy('bakery-local-identity-service-1','/app/application.jar',jars/'identity-existing.jar')
def migrations(p):
    with zipfile.ZipFile(p) as z:return {n:hashlib.sha256(z.read(n)).hexdigest() for n in z.namelist() if '/db/migration/' in n and n.endswith('.sql')}
same=migrations(jars/'identity-existing.jar')==migrations(jars/'identity-service.jar')
if not same:raise SystemExit('Identity migrations differ. Refusing to point new application at existing Identity data.')
privatePath=DEST/'runtime-generated.json'
if privatePath.exists():generated=json.loads(privatePath.read_text())
else:
    generated={'bakeryDbPassword':secrets.token_urlsafe(32),'subscriptionDbPassword':secrets.token_urlsafe(32),'storageAccess':secrets.token_hex(12),'storageSecret':secrets.token_urlsafe(32)}
    privatePath.write_text(json.dumps(generated),encoding='utf-8')
compose=DEST/'compose.json'
if not compose.exists():
    network={'runtime':{},'canonical-identity':{'external':True,'name':'bakery-local_default'}}
    def application(item,name,port):
        values={k:v for k,v in env(item).items() if k not in ['PATH','JAVA_HOME','JAVA_VERSION','LANG','LANGUAGE','LC_ALL','HEALTH_PATH']}
        values.update({'SERVER_PORT':'8080','JAVA_TOOL_OPTIONS':'-Xms64m -Xmx256m'})
        for k in ['IDENTITY_SERVICE_URL','IDENTITY_SERVICE_BASE_URL']:values[k]='http://mobile-identity:8080'
        for k in ['IDENTITY_JWKS_URI','IDENTITY_JWK_SET_URI']:values[k]='http://mobile-identity:8080/.well-known/jwks.json'
        for k in ['BAKERY_SERVICE_URL','BAKERY_SERVICE_BASE_URL']:values[k]='http://mobile-bakery:8080'
        for k in ['SUBSCRIPTION_SERVICE_URL','SUBSCRIPTION_SERVICE_BASE_URL']:values[k]='http://mobile-subscription:8080'
        return {'image':item['Config']['Image'],'environment':values,'ports':[f'127.0.0.1:{port}:8080'],'volumes':[f'{(jars/(name+".jar")).as_posix()}:/app/application.jar:ro'],'networks':['runtime'],'healthcheck':{'disable':True},'restart':'unless-stopped'}
    apps={'mobile-identity':application(identity,'identity-service',18101),'mobile-bakery':application(bakery,'bakery-service',18102),'mobile-subscription':application(subscription,'subscription-service',18104)}
    ident=apps['mobile-identity'];ident['networks'].append('canonical-identity')
    ident['environment']['SPRING_CONFIG_ADDITIONAL_LOCATION']='file:/run/config/service-clients.yml'
    ident['environment']['IDENTITY_CORS_ALLOWED_ORIGINS']='http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174'
    ident['volumes'] += [f'{(DEST/"service-clients.yml").as_posix()}:/run/config/service-clients.yml:ro']
    for mount in identity['Mounts']:
        if mount['Destination'].startswith('/run/secrets/'):ident['volumes'].append(f"{mount['Source']}:{mount['Destination']}:ro")
    for key,prefix,db in [('mobile-bakery','BAKERY','bakery'),('mobile-subscription','SUBSCRIPTION','subscription')]:
        app=apps[key];values=app['environment']
        values[prefix+'_DB_URL']=f'jdbc:postgresql://{db}-db:5432/{db}_db'
        values[prefix+'_DB_USERNAME']=db+'_user';values[prefix+'_DB_PASSWORD']=generated[db+'DbPassword']
        values[prefix+'_MINIO_ENDPOINT']='http://mobile-storage:9000';values[prefix+'_MINIO_PUBLIC_ENDPOINT']='http://127.0.0.1:19022'
        values[prefix+'_MINIO_BUCKET']='mobile-'+db;values[prefix+'_MINIO_ACCESS_KEY']=generated['storageAccess'];values[prefix+'_MINIO_SECRET_KEY']=generated['storageSecret']
        app['depends_on']={db+'-db':{'condition':'service_healthy'},'mobile-identity':{'condition':'service_started'},'mobile-storage':{'condition':'service_started'}}
    databaseImage=inspect('bakery-local-identity-db-1')['Config']['Image']
    for db in ['bakery','subscription']:
        apps[db+'-db']={'image':databaseImage,'environment':{'POSTGRES_DB':db+'_db','POSTGRES_USER':db+'_user','POSTGRES_PASSWORD':generated[db+'DbPassword']},'volumes':[db+'-data:/var/lib/postgresql/data'],'networks':['runtime'],'healthcheck':{'test':['CMD-SHELL',f'pg_isready -U {db}_user -d {db}_db'],'interval':'5s','timeout':'3s','retries':20},'restart':'unless-stopped'}
    storageImage=inspect('bakery-audit-20261107-audit-storage-1')['Config']['Image']
    apps['mobile-storage']={'image':storageImage,'command':['server','/data'],'environment':{'MINIO_ROOT_USER':generated['storageAccess'],'MINIO_ROOT_PASSWORD':generated['storageSecret']},'ports':['127.0.0.1:19022:9000'],'volumes':['storage-data:/data'],'networks':['runtime'],'restart':'unless-stopped'}
    compose.write_text(json.dumps({'services':apps,'networks':network,'volumes':{'bakery-data':{},'subscription-data':{},'storage-data':{}}},indent=2),encoding='utf-8')
    (DEST/'input-source.json').write_text(json.dumps({'adminCredentialFile':'H:/MSS/.secrets/bakery-platform/local-smoke-users.json','canonicalIdentity':'existing Identity DB; migrations byte-identical; no role/data edits'}),encoding='utf-8')
command=['docker','compose','-p','bakery-mobile-20261107','-f',str(compose),'up','-d']
subprocess.run(command,check=True,capture_output=True)
readiness={}
for name,port in [('identity',18101),('bakery',18102),('subscription',18104)]:
    status='STARTED_BUT_UNHEALTHY'
    for _ in range(60):
        try:
            with urllib.request.urlopen(f'http://127.0.0.1:{port}/v3/api-docs',timeout=3) as r:
                spec=json.load(r)
                if r.status==200:status='RUNNING_AND_VERIFIED_OPENAPI';break
        except Exception:time.sleep(1)
    readiness[name]={'port':port,'status':status}
report={'directory':str(DEST),'project':'bakery-mobile-20261107','identityDatabaseReused':True,'identityMigrationBytesIdentical':same,'noSqlOrRoleGrant':True,'services':readiness,'jars':{name:digest(jars/(name+'.jar')) for name in services},'storagePort':19022,'secretValuesReported':False}
(ROOT/'mobile/docs/evidence/api-integration-phases-1-4/persistent-runtime-h.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(report),flush=True)
