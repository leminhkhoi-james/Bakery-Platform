"""Stack disposable từ JAR build ngoài repo; không ghi vào stack/database sẵn có."""
from pathlib import Path
import json,os,secrets,subprocess,tempfile,time
import requests,yaml
ROOT=Path(__file__).resolve().parents[3];EV=ROOT/'docs/backend-audit/evidence'
WORK=Path(tempfile.gettempdir())/'bakery-backend-audit-20261107';PRIVATE=WORK/'runtime-private.json';COMPOSE=WORK/'runtime-compose.json'
PROJECT='bakery-audit-20261107'; DB=f'{PROJECT}-audit-db-1'
SERVICES=['identity-service','bakery-service','marketplace-service','subscription-service','order-service','chat-service']
PORTS=dict(zip(SERVICES,[18091,18092,18093,18094,18096,18097]))
def docker(*a,**kw):return subprocess.check_output(['docker',*a],stderr=subprocess.PIPE,**kw)
def inspect(name):return json.loads(docker('inspect',name))[0]
def restrict(path):
    principal=subprocess.check_output(['whoami'],text=True).strip()
    subprocess.run(['icacls',str(path),'/inheritance:r','/grant:r',principal+':F','/grant:r','*S-1-5-18:F'],capture_output=True,check=True)
def compose(*args):return subprocess.run(['docker','compose','-p',PROJECT,'-f',str(COMPOSE),*args],capture_output=True,text=True)
if not PRIVATE.exists():
    occupied=docker('ps','-aq','--filter',f'label=com.docker.compose.project={PROJECT}').decode().strip()
    if occupied:raise SystemExit('Project isolation đã tồn tại mà thiếu private manifest; không ghi đè.')
    private={'project':PROJECT,'dbPassword':secrets.token_urlsafe(32),'dbUsers':{},'storageAccess':secrets.token_hex(12),'storageSecret':secrets.token_urlsafe(32),'userPassword':secrets.token_urlsafe(24),'ports':PORTS}
    configs={}; originals={}
    for service in SERVICES:
        c=inspect('bakery-local-'+service+'-1');assert c['Config']['Labels']['com.docker.compose.project']=='bakery-local'
        originals[service]=c
        configs[service]={k:v for k,v in (x.split('=',1) for x in c['Config']['Env']) if k not in ['PATH','JAVA_HOME','JAVA_VERSION','LANG','LANGUAGE','LC_ALL','HEALTH_PATH']}
        private['dbUsers'][service]={'name':service.split('-')[0], 'database':service.split('-')[0]+'_db','password':secrets.token_urlsafe(32)}
    identity=originals['identity-service'];client_config=yaml.safe_load(docker('exec',identity['Id'],'cat','/run/config/service-clients.yml'))
    # Grant theo application.yml hiện tại, giữ credential có sẵn; chỉ cấu hình bản isolated.
    app=yaml.safe_load((ROOT/'backend/identity-service/src/main/resources/application.yml').read_text(encoding='utf-8'))
    current=app['security.service-clients']['clients']
    source_grants=[]
    for name,entry in current.items():
        if name in client_config['security']['service-clients']['clients']:
            target=client_config['security']['service-clients']['clients'][name]
            for audience,scopes in entry['grants'].items():
                merged=sorted(set((target.get('grants',{}).get(audience,'')+' '+scopes).split()))
                target.setdefault('grants',{})[audience]=' '.join(merged)
                source_grants.append({'client':name,'audience':audience,'scopeNames':merged})
    config_path=WORK/'service-clients.yml';config_path.write_text(yaml.safe_dump(client_config),encoding='utf-8');restrict(config_path)
    spec={'services':{'audit-db':{'image':'postgres:17-alpine','environment':{'POSTGRES_USER':'audit_admin','POSTGRES_PASSWORD':private['dbPassword'],'POSTGRES_DB':'postgres'},'volumes':['audit-postgres:/var/lib/postgresql/data'],'healthcheck':{'test':['CMD-SHELL','pg_isready -U audit_admin -d postgres'],'interval':'3s','timeout':'3s','retries':30}},'audit-storage':{'image':'bakery-platform-minio:local','environment':{'MINIO_ROOT_USER':private['storageAccess'],'MINIO_ROOT_PASSWORD':private['storageSecret']},'command':['server','/data','--console-address',':9001'],'volumes':['audit-storage:/data'],'ports':['127.0.0.1:19012:9000']}},'volumes':{'audit-postgres':{},'audit-storage':{}},'networks':{'default':{'internal':True}}}
    common={'SERVER_PORT':'8080','JAVA_TOOL_OPTIONS':'-Xms64m -Xmx192m -XX:MaxMetaspaceSize=128m -XX:ActiveProcessorCount=2 -XX:+UseSerialGC','IDENTITY_JWT_ISSUER':'bakery-platform-identity','IDENTITY_JWT_USER_AUDIENCE':'bakery-platform-api','IDENTITY_SERVICE_URL':'http://identity-service:8080','IDENTITY_SERVICE_BASE_URL':'http://identity-service:8080','IDENTITY_JWKS_URI':'http://identity-service:8080/.well-known/jwks.json','IDENTITY_JWK_SET_URI':'http://identity-service:8080/.well-known/jwks.json','BAKERY_SERVICE_URL':'http://bakery-service:8080','BAKERY_SERVICE_BASE_URL':'http://bakery-service:8080','SUBSCRIPTION_SERVICE_URL':'http://subscription-service:8080','SUBSCRIPTION_SERVICE_BASE_URL':'http://subscription-service:8080','MARKETPLACE_SERVICE_URL':'http://marketplace-service:8080','MARKETPLACE_SERVICE_BASE_URL':'http://marketplace-service:8080','ORDER_SERVICE_URL':'http://order-service:8080','ORDER_SERVICE_BASE_URL':'http://order-service:8080','CAKE_AI_SERVICE_BASE_URL':'http://cake-ai-service:8080'}
    for service in SERVICES:
        env={**configs[service],**common};db=private['dbUsers'][service];prefix=service.split('-')[0].upper()
        env.update({prefix+'_DB_URL':f'jdbc:postgresql://audit-db:5432/{db["database"]}',prefix+'_DB_USERNAME':db['name'],prefix+'_DB_PASSWORD':db['password']})
        mounts=[]
        if service=='identity-service':
            env['SPRING_CONFIG_ADDITIONAL_LOCATION']='optional:file:/run/config/service-clients.yml';env['IDENTITY_REFRESH_COOKIE_SECURE']='false'
            mounts.append({'type':'bind','source':str(config_path),'target':'/run/config/service-clients.yml','read_only':True})
            for m in identity['Mounts']:
                if m['Destination'].startswith('/run/secrets/'):
                    mounts.append({'type':'bind','source':m['Source'],'target':m['Destination'],'read_only':True})
        if service in ['bakery-service','subscription-service']:
            env.update({prefix+'_MINIO_ENDPOINT':'http://audit-storage:9000',prefix+'_MINIO_PUBLIC_ENDPOINT':'http://127.0.0.1:19012',prefix+'_MINIO_ACCESS_KEY':private['storageAccess'],prefix+'_MINIO_SECRET_KEY':private['storageSecret']})
        if service=='chat-service':env.update({'CHAT_STORAGE_ENDPOINT':'http://audit-storage:9000','CHAT_STORAGE_ACCESS_KEY':private['storageAccess'],'CHAT_STORAGE_SECRET_KEY':private['storageSecret']})
        if service=='marketplace-service':
            env.update({'FIREBASE_PROJECT_ID':'','FIREBASE_STORAGE_BUCKET':''});env.pop('GOOGLE_APPLICATION_CREDENTIALS',None)
        jar=WORK/'source/backend'/service/'target'/(service+'-0.0.1-SNAPSHOT-exec.jar')
        if not jar.exists():jar=jar.with_name(service+'-0.0.1-SNAPSHOT.jar')
        assert jar.exists(),service
        mounts.append({'type':'bind','source':str(jar),'target':'/app/application.jar','read_only':True})
        spec['services'][service]={'image':originals[service]['Config']['Image'],'environment':env,'volumes':mounts,'ports':[f'127.0.0.1:{PORTS[service]}:8080'],'healthcheck':{'disable':True},'restart':'no'}
    PRIVATE.write_text(json.dumps(private,indent=2),encoding='utf-8');restrict(PRIVATE)
    COMPOSE.write_text(json.dumps(spec,indent=2),encoding='utf-8');restrict(COMPOSE)
    (EV/'isolated-configuration.json').write_text(json.dumps({'project':PROJECT,'ports':PORTS,'networkInternal':True,'databaseNames':[x['database'] for x in private['dbUsers'].values()],'credentialPolicy':'CSPRNG riêng cho DB/MinIO audit; tái dùng credential service và RSA hiện hữu qua mount readonly; không ghi vào repo','grantSource':'application.yml hiện tại, hợp với grants runtime sẵn có; chỉ bản audit tách biệt','serviceGrants':source_grants,'externalDependencies':'Firebase/AI không có credential được cấu hình; không mô phỏng thành công.'},ensure_ascii=False,indent=2),encoding='utf-8')
private=json.loads(PRIVATE.read_text(encoding='utf-8'))
# Docker Desktop không publish host ports trên bridge internal. Dùng bridge riêng,
# chỉ bind loopback; mọi URL nghiệp vụ trỏ service audit, Firebase credentials trống.
spec=json.loads(COMPOSE.read_text(encoding='utf-8'))
if spec['networks']['default'].get('internal'):
    spec['networks']['default']={'name':PROJECT+'-runtime'}
    for service in SERVICES:
        env=spec['services'][service]['environment']
        assert not env.get('FIREBASE_PROJECT_ID') and not env.get('FIREBASE_STORAGE_BUCKET')
        for name,value in env.items():
            if name.endswith(('_URL','_URI','_ENDPOINT')) and value.startswith('http'):
                assert value.split('/')[2].split(':')[0] in SERVICES+['cake-ai-service','audit-storage','127.0.0.1'],name
    COMPOSE.write_text(json.dumps(spec,indent=2),encoding='utf-8')
    report=json.loads((EV/'isolated-configuration.json').read_text(encoding='utf-8'));report['networkInternal']=False;report['networkSafety']='Bridge riêng, host ports chỉ loopback; toàn bộ URL runtime được assert local/internal, không nạp Firebase/AI credential.'
    (EV/'isolated-configuration.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
r=compose('up','-d','audit-db','audit-storage')
if r.returncode:raise RuntimeError('Không khởi động được hạ tầng audit; không in cấu hình private.')
for _ in range(30):
    ready=subprocess.run(['docker','exec',DB,'pg_isready','-U','audit_admin','-d','postgres'],capture_output=True)
    if ready.returncode==0:break
    time.sleep(1)
else:raise RuntimeError('PostgreSQL audit chưa sẵn sàng')
c=inspect(DB);assert c['Config']['Labels']['com.docker.compose.project']==PROJECT
for service,db in private['dbUsers'].items():
    query=f"SELECT 1 FROM pg_database WHERE datname='{db['database']}';"
    present=docker('exec',DB,'psql','-X','-Atq','-U','audit_admin','-d','postgres','-c',query).decode().strip()
    if present:continue
    sql=f"CREATE USER \"{db['name']}\" WITH PASSWORD '{db['password']}'; CREATE DATABASE \"{db['database']}\" OWNER \"{db['name']}\";"
    created=subprocess.run(['docker','exec','-i',DB,'psql','-X','-q','-v','ON_ERROR_STOP=1','-U','audit_admin','-d','postgres'],input=sql,text=True,capture_output=True)
    if created.returncode:raise RuntimeError('Không tạo được DB disposable; không in SQL credential.')
r=compose('up','-d',*SERVICES)
if r.returncode:
    # stderr Compose chỉ là lỗi mount/image, không chứa full environment.
    print(r.stderr[:2000]);raise RuntimeError('Khởi chạy service audit thất bại')
print(json.dumps({'project':PROJECT,'servicesStarted':SERVICES,'databaseIsolationVerified':True,'originalVolumesReused':False,'workspace':str(WORK)}),flush=True)
