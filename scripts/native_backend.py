"""Native Java 21 runtime. Requires Python, python-dotenv and PyYAML.

Use --help. State/logs stay outside the repository. start requires an explicit
isolated database map, or explicit acknowledgement of existing local databases.
Paid AI requires explicit bounded root settings; orphan cleanup stays disabled.
No container tooling is invoked.
"""
import argparse
import hashlib
import json
import os
import pathlib
import re
import shutil
import socket
import subprocess
import sys
import threading
import time
import urllib.request
import urllib.parse
import zipfile

import yaml
from dotenv.parser import parse_stream

ROOT = pathlib.Path(__file__).resolve().parents[1]
PORTS = {'identity-service':8081, 'bakery-service':8082, 'marketplace-service':8083,
         'subscription-service':8084, 'cake-ai-service':8085, 'order-service':8086,
         'chat-service':8087, 'api-gateway':8080}
CLIENTS = {'bakery-service':('BAKERY_CLIENT_SECRET','BAKERY_CLIENT_SECRET_HASH'),
           'subscription-service':('SUBSCRIPTION_CLIENT_SECRET','SUBSCRIPTION_CLIENT_SECRET_HASH'),
           'marketplace-service':('MARKETPLACE_CLIENT_SECRET','MARKETPLACE_CLIENT_SECRET_HASH'),
           'cake-ai-service':('CAKE_AI_CLIENT_SECRET','CAKE_AI_CLIENT_SECRET_HASH'),
           'order-service':('ORDER_SERVICE_CLIENT_SECRET','ORDER_CLIENT_SECRET_HASH'),
           'chat-service':('CHAT_SERVICE_CLIENT_SECRET','CHAT_SERVICE_CLIENT_SECRET_HASH')}

def dotenv(path):
    result = {}
    with path.open(encoding='utf-8-sig') as stream:
        for binding in parse_stream(stream):
            if binding.error or (binding.key and not re.fullmatch(r'[A-Za-z_][A-Za-z0-9_]*',binding.key)):
                raise ValueError(f'Invalid dotenv syntax at line {binding.original.line}')
            if binding.key:
                if binding.key in result:
                    raise ValueError(f'Duplicate dotenv variable: {binding.key}')
                result[binding.key] = binding.value or ''
    return result

def flatten(value, prefix=''):
    if isinstance(value,dict):
        for key, child in value.items():
            yield from flatten(child, (prefix+'.' if prefix else '')+str(key))
    else:
        yield prefix, value

def tools():
    java_home = os.environ.get('JAVA_HOME','')
    java = str(pathlib.Path(java_home)/'bin/java.exe') if java_home else shutil.which('java')
    if not java or not pathlib.Path(java).is_file():
        candidates = sorted(pathlib.Path(os.environ.get('ProgramFiles',r'C:\Program Files')).glob('Java/jdk-21*/bin/java.exe'))
        java = str(candidates[-1]) if candidates else None
    if not java: raise ValueError('Java 21 not found')
    version = subprocess.run([java,'-version'],capture_output=True,text=True)
    if not re.search(r'version "21[.\"]',version.stderr): raise ValueError('Java 21 is required')
    if '64-Bit' not in version.stderr: raise ValueError('Native runtime requires a 64-bit JDK')
    maven = shutil.which('mvn.cmd') or shutil.which('mvn')
    if not maven:
        candidates = sorted(pathlib.Path(os.environ.get('ProgramFiles',r'C:\Program Files')).glob('apache-maven-*/bin/mvn.cmd'))
        maven = str(candidates[-1]) if candidates else None
    return java,maven

def configuration(args):
    rootenv = dotenv(ROOT/'.env')
    effective = dict(rootenv)
    sources = {k:'ROOT_ENV' for k in rootenv}
    return effective,sources


def native_listeners(service, penv):
    address = penv['SERVER_ADDRESS']
    if address not in ('127.0.0.1', '::1'):
        raise ValueError('Native services must bind an explicit loopback address')
    port = int(penv['SERVER_PORT'])
    if port != PORTS[service]:
        raise ValueError('Native service port differs from the verified mapping: ' + service)
    addresses = [address]
    if service == 'api-gateway' and penv.get('GATEWAY_NATIVE_DUAL_LOOPBACK') == 'true':
        if address != '127.0.0.1': raise ValueError('Dual loopback requires primary IPv4 loopback')
        addresses.append('::1')
    return [(host, port) for host in addresses]


def ensure_ports_free(configurations):
    # Check every selected listener before starting any service. A conflicting
    # process is never adopted or terminated, including a listener in the other family.
    for service, penv in configurations.items():
        for address, port in native_listeners(service, penv):
            with socket.socket(socket.AF_INET6 if ':' in address else socket.AF_INET) as sock:
                if hasattr(socket, 'SO_EXCLUSIVEADDRUSE'):
                    sock.setsockopt(socket.SOL_SOCKET, socket.SO_EXCLUSIVEADDRUSE, 1)
                try: sock.bind((address, port))
                except OSError:
                    raise ValueError(f'Native bind {address}:{port} unavailable; no process stopped') from None

def process_env(service,args,env,sources):
    if service == 'cake-ai-service' and env.get('CAKE_AI_ENABLED') == 'true':
        limits = {'CAKE_AI_MAX_DESIGNS_PER_EXECUTION':1,'CAKE_AI_DAILY_EXECUTIONS_PER_CUSTOMER':2,
                  'CAKE_AI_DAILY_PROVIDER_REQUESTS':6,'CAKE_AI_IMAGE_OUTPUT_TOKENS':4096,
                  'CAKE_AI_MODERATION_OUTPUT_TOKENS':1024,'CAKE_AI_WORKERS':1}
        if env.get('CAKE_AI_REQUIRE_ADMIN_REVIEW') != 'true' or any(
                not env.get(key,'').isdigit() or not 1 <= int(env[key]) <= maximum
                for key,maximum in limits.items()):
            raise ValueError('Native paid Cake AI requires explicit bounded root settings and admin review')
    resources = ROOT/'backend'/service/'src/main/resources'
    text = '\n'.join(p.read_text(encoding='utf-8-sig') for p in resources.glob('application.*') if p.suffix in ('.yml','.yaml','.properties'))
    refs = set(re.findall(r'\$\{([A-Za-z_][A-Za-z0-9_]*)',text))
    base = {k:v for k,v in os.environ.items() if k.upper() in {
        'SYSTEMROOT','WINDIR','COMSPEC','PATH','TEMP','TMP','USERPROFILE','APPDATA',
        'LOCALAPPDATA','JAVA_HOME','PATHEXT','SYSTEMDRIVE','PROCESSOR_ARCHITECTURE','NUMBER_OF_PROCESSORS'}}
    penv = base | {k:v for k,v in env.items() if k in refs}
    provenance = {k:sources[k] for k in penv if k in sources}
    # Controller annotations bind this root setting outside application.yml.
    if 'BACKEND_CORS_ALLOWED_ORIGINS' in env:
        penv['BACKEND_CORS_ALLOWED_ORIGINS'] = env['BACKEND_CORS_ALLOWED_ORIGINS']
        provenance['BACKEND_CORS_ALLOWED_ORIGINS'] = sources['BACKEND_CORS_ALLOWED_ORIGINS']
    if service == 'identity-service':
        for _,hashed in CLIENTS.values():
            if env.get(hashed):
                penv[hashed]=env[hashed]; provenance[hashed]=sources[hashed]
    if service in CLIENTS:
        plain,_ = CLIENTS[service]
        if env.get(plain):
            # Generic names are process-scoped; never shared across services.
            if service in ('marketplace-service','cake-ai-service'):
                penv['SERVICE_CLIENT_SECRET']=env[plain]; provenance['SERVICE_CLIENT_SECRET']=plain
            else:
                penv[plain]=env[plain]; provenance[plain]=sources[plain]
    prefix = {'api-gateway':'GATEWAY','cake-ai-service':'CAKE_AI'}.get(service,service.removesuffix('-service').upper())
    penv.update({'SERVER_ADDRESS':env.get(prefix+'_NATIVE_BIND','127.0.0.1'),
                 'SERVER_PORT':env.get('SERVER_PORT_'+prefix,str(PORTS[service])),
                 'SPRING_APPLICATION_ADMIN_ENABLED':'true','SERVER_SHUTDOWN':'graceful',
                 'SPRING_LIFECYCLE_TIMEOUT_PER_SHUTDOWN_PHASE':'15s',
                 'MARKETPLACE_ORPHAN_CLEANUP_ENABLED':'false',
                 'CAKE_AI_ENABLED':env.get('CAKE_AI_ENABLED','false'),
                 'CAKE_AI_SCHEDULER_ENABLED':env.get('CAKE_AI_SCHEDULER_ENABLED','false'),
                 'CAKE_AI_CLEANUP_ENABLED':'false'})
    penv['SPRING_DATASOURCE_HIKARI_MAXIMUM_POOL_SIZE']=env.get('NATIVE_DB_POOL_MAX','3')
    penv['SPRING_DATASOURCE_HIKARI_MINIMUM_IDLE']=env.get('NATIVE_DB_POOL_MIN','1')
    if service == 'identity-service' and env.get('IDENTITY_JWT_PRIVATE_KEY_BASE64'):
        penv.pop('IDENTITY_JWT_PRIVATE_KEY_PATH',None)
        penv.pop('IDENTITY_JWT_PUBLIC_KEY_PATH',None)
    # Native-only, loopback-bound services behind the loopback Gateway.
    if service != 'api-gateway': penv['SERVER_FORWARD_HEADERS_STRATEGY']='framework'
    else:
        penv['SPRING_CLOUD_GATEWAY_SERVER_WEBMVC_TRUSTED_PROXIES']=r'127\.0\.0\.1|0:0:0:0:0:0:0:1|::1'
        # Docs routes set a prefix explicitly; appending duplicates it.
        penv['SPRING_CLOUD_GATEWAY_SERVER_WEBMVC_X_FORWARDED_REQUEST_HEADERS_FILTER_PREFIX_APPEND']='false'
    if env.get('NATIVE_DATABASE_PREFIX') and service != 'api-gateway':
        name=env['NATIVE_DATABASE_PREFIX']+prefix.lower()
        if not re.fullmatch(r'native_[a-z0-9_]+',name): raise ValueError('Invalid NATIVE_DATABASE_PREFIX')
        original=urllib.parse.urlparse(env[prefix+'_DB_URL'].removeprefix('jdbc:'))
        if original.hostname not in ('localhost','127.0.0.1','::1'): raise ValueError('Native PostgreSQL must use loopback')
        penv['SPRING_DATASOURCE_URL']='jdbc:postgresql://'+original.netloc+'/'+name
        provenance['SPRING_DATASOURCE_URL']='ROOT_ENV_NATIVE_DATABASE_PREFIX'
    elif args.database_map and service != 'api-gateway':
        databases=json.loads(pathlib.Path(args.database_map).read_text())
        name=databases[service]['database']
        if not re.fullmatch(r'native_[a-z0-9_]+',name): raise ValueError('Expected isolated native_* database')
        penv['SPRING_DATASOURCE_URL']='jdbc:postgresql://localhost:5432/'+name
        provenance['SPRING_DATASOURCE_URL']='EXPLICIT_ISOLATED_DATABASE_MAP'
    elif service != 'api-gateway' and not args.allow_existing_local_databases:
        raise ValueError('Provide --database-map; existing databases require explicit acknowledgement')
    elif service != 'api-gateway':
        prefix={'cake-ai-service':'CAKE_AI'}.get(service,service.removesuffix('-service').upper())
        jdbc=env.get(prefix+'_DB_URL','')
        parsed=urllib.parse.urlparse(jdbc.removeprefix('jdbc:'))
        if not jdbc.startswith('jdbc:postgresql://') or parsed.hostname not in ('localhost','127.0.0.1','::1'):
            raise ValueError('Existing native database must have an explicit local PostgreSQL URL: '+prefix+'_DB_URL')
    if args.firebase_sandbox and service in ('marketplace-service', 'cake-ai-service'):
        if not env.get('FIREBASE_CREDENTIALS_BASE64'): raise ValueError('Consolidate FIREBASE_CREDENTIALS_BASE64 in root .env')
        penv['FIREBASE_CREDENTIALS_BASE64']=env['FIREBASE_CREDENTIALS_BASE64']
        provenance['FIREBASE_CREDENTIALS_BASE64']='ROOT_ENV_IN_MEMORY_CREDENTIALS'
    elif service in ('marketplace-service', 'cake-ai-service'):
        # Without opt-in, prevent ADC fallback to unrelated workstation credentials.
        for name in ('FIREBASE_PROJECT_ID','FIREBASE_STORAGE_BUCKET',
                     'CAKE_AI_FIREBASE_PROJECT_ID','CAKE_AI_FIREBASE_BUCKET'):
            penv[name]=''
    return penv,provenance

def jar_for(service,args):
    target=pathlib.Path(args.backend_dir or ROOT/'backend')/service/'target'
    jars=list(target.glob('*-exec.jar')) or list(target.glob('*.jar'))
    for jar in jars:
        with zipfile.ZipFile(jar) as archive:
            if b'Main-Class:' in archive.read('META-INF/MANIFEST.MF'): return jar.resolve()
    raise ValueError('Executable JAR not found: '+service+'; run build first')

def write_json(path,value):
    temp=path.with_suffix('.tmp')
    temp.write_text(json.dumps(value,indent=2),encoding='utf-8'); temp.replace(path)

def probe(service,env=None):
    env = env or dotenv(ROOT/'.env')
    prefix={'api-gateway':'GATEWAY','cake-ai-service':'CAKE_AI'}.get(service,service.removesuffix('-service').upper())
    address=env.get(prefix+'_NATIVE_BIND','127.0.0.1')
    host='['+address+']' if ':' in address else address
    port=env.get('SERVER_PORT_'+prefix,str(PORTS[service]))
    try:
        with urllib.request.urlopen(f'http://{host}:{port}/actuator/health/readiness',timeout=3) as response:
            return json.load(response).get('status')=='UP'
    except Exception: return False

def serve(args):
    state=pathlib.Path(args.state_dir); state.mkdir(parents=True,exist_ok=True)
    env,sources=configuration(args); java,_=tools(); processes={}; records={}
    configurations = {service:process_env(service,args,env,sources)
                      for service in PORTS if not args.services or service in args.services}
    ensure_ports_free({service:values[0] for service,values in configurations.items()})
    secrets=[v for k,v in env.items() if re.search('PASSWORD|SECRET|KEY|CREDENTIAL|TMN_CODE',k) and len(v)>3]
    def pump(proc,path):
        with path.open('w',encoding='utf-8') as log:
            for line in proc.stdout:
                for value in secrets: line=line.replace(value,'[REDACTED]')
                line=re.sub(r'eyJ[\w-]+\.[\w-]+\.[\w-]+','[JWT_REDACTED]',line)
                line=re.sub(r'(https?://[^\s?]+)\?[^\s]+',r'\1?[QUERY_REDACTED]',line)
                log.write(line); log.flush()
    try:
        for service,port in PORTS.items():
            if args.services and service not in args.services: continue
            penv,provenance=configurations[service]; jar=jar_for(service,args)
            address=penv['SERVER_ADDRESS']; port=int(penv['SERVER_PORT'])
            cwd=state/service; cwd.mkdir(exist_ok=True)
            prefix={'api-gateway':'GATEWAY','cake-ai-service':'CAKE_AI'}.get(service,service.removesuffix('-service').upper())
            jvm=['-Xms'+env.get(prefix+'_JVM_XMS','48m'),'-Xmx'+env.get(prefix+'_JVM_XMX','192m'),
                 '-XX:ActiveProcessorCount='+env.get('NATIVE_JVM_PROCESSORS','2'),
                 '-XX:ReservedCodeCacheSize='+env.get('NATIVE_JVM_CODE_CACHE','64m'),
                 '-Xss'+env.get('NATIVE_JVM_STACK','512k')]
            proc=subprocess.Popen([java,*jvm,'-jar',str(jar)],cwd=cwd,env=penv,
                    stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True,encoding='utf-8',errors='replace',creationflags=subprocess.CREATE_NO_WINDOW)
            processes[service]=proc
            threading.Thread(target=pump,args=(proc,state/(service+'.log')),daemon=True).start()
            records[service]={'pid':proc.pid,'port':port,'address':address,'jvm':jvm,'jar':str(jar),'sha256':hashlib.sha256(jar.read_bytes()).hexdigest(),'environment_sources':provenance}
            write_json(state/'processes.json',records)
            for _ in range(90):
                if probe(service,env) or proc.poll() is not None: break
                time.sleep(1)
            if proc.poll() is not None: raise ValueError('Native service exited: '+service)
        while not (state/'stop.request').exists():
            for service,proc in processes.items(): records[service]['exit_code']=proc.poll()
            write_json(state/'processes.json',records); time.sleep(1)
    finally:
        for service,proc in reversed(list(processes.items())):
            graceful=proc.poll()==0
            if proc.poll() is None:
                result=subprocess.run([java,'--add-modules','jdk.attach',str(ROOT/'scripts/NativeShutdown.java'),str(proc.pid)],capture_output=True,timeout=30)
                # JMX may close its reply channel while Spring shuts down successfully.
                try: proc.wait(timeout=20); graceful=proc.returncode==0
                except subprocess.TimeoutExpired: proc.terminate(); proc.wait(timeout=10)
            records[service]['graceful_shutdown']=graceful
            records[service]['final_exit_code']=proc.returncode
        write_json(state/'processes.json',records)
        (state/'stopped.marker').touch()

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action',choices=['build','start','serve','verify','status','stop'])
    parser.add_argument('--state-dir',default=str(pathlib.Path(os.environ['LOCALAPPDATA'])/'BakeryPlatform/native'))
    parser.add_argument('--database-map',help='Outside-repository JSON: service -> {database: native_*}')
    parser.add_argument('--backend-dir',help='Optional isolated build workspace')
    parser.add_argument('--firebase-sandbox',action='store_true',help='Requires separate authorization for cloud writes')
    parser.add_argument('--allow-existing-local-databases',action='store_true')
    parser.add_argument('--wait-timeout',type=int,default=180,help='Maximum startup readiness wait in seconds')
    parser.add_argument('--services',nargs='+',choices=list(PORTS),help='Restart selected services in a separate owned state directory')
    args=parser.parse_args(); state=pathlib.Path(args.state_dir).resolve()
    if state.is_relative_to(ROOT): raise ValueError('Runtime state must remain outside repository')
    if args.action=='build':
        _,maven=tools()
        if not maven: raise ValueError('Maven not found')
        raise SystemExit(subprocess.call([maven,'-DskipTests','package'],cwd=args.backend_dir or ROOT/'backend'))
    if args.action=='serve': return serve(args)
    if args.action=='start':
        configuration(args)  # fail before launching if dotenv is malformed
        env,sources=configuration(args)
        ensure_ports_free({service:process_env(service,args,env,sources)[0]
                           for service in (args.services or PORTS)})
        state.mkdir(parents=True,exist_ok=True)
        if (state/'processes.json').exists() and not (state/'stopped.marker').exists(): raise ValueError('State is already active; use status/stop')
        for name in ('stop.request','stopped.marker'):
            (state/name).unlink(missing_ok=True)
        command=[sys.executable,str(pathlib.Path(__file__).resolve()),'serve',*sys.argv[2:]]
        proc=subprocess.Popen(command,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,creationflags=subprocess.CREATE_NO_WINDOW)
        deadline=time.monotonic()+args.wait_timeout
        while time.monotonic()<deadline:
            if all(probe(service) for service in (args.services or PORTS)):
                print(json.dumps({'supervisor_pid':proc.pid,'state_dir':str(state),'readiness':'ALL_UP'})); return
            if proc.poll() is not None: raise ValueError('Native supervisor exited; inspect owned runtime state/logs')
            time.sleep(1)
        raise ValueError('Readiness timeout; owned processes retained for diagnosis: '+str(state))
    if args.action=='stop':
        (state/'stop.request').touch()
        for _ in range(240):
            if (state/'stopped.marker').exists(): print('Owned native processes stopped'); return
            time.sleep(1)
        raise ValueError('Shutdown did not complete; inspect owned process records')
    records=json.loads((state/'processes.json').read_text()) if (state/'processes.json').exists() else {}
    selected=args.services or list(records) or list(PORTS)
    result={service:{'pid':records.get(service,{}).get('pid'),'port':PORTS[service],'readiness':probe(service)} for service in selected}
    print(json.dumps(result,indent=2))
    if args.action=='verify' and not all(row['readiness'] for row in result.values()): raise SystemExit(1)

if __name__=='__main__':
    try: main()
    except (ValueError,KeyError,OSError) as error:
        # Exceptions contain variable names/paths, never dotenv values.
        print(type(error).__name__+': '+str(error),file=sys.stderr); raise SystemExit(1)
