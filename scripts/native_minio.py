"""Owned native Windows MinIO instances, configured exclusively by root .env.

Never adopts an existing listener or rewrites an existing user's secret. Buckets
are private and each application identity receives only its own bucket policy.
"""
import argparse
import hashlib
import json
import os
import pathlib
import shutil
import socket
import subprocess
import sys
import threading
import time
import urllib.parse
import urllib.request

from minio import Minio, MinioAdmin
from minio.credentials import StaticProvider
from minio.error import MinioAdminException, S3Error
from native_backend import ROOT, dotenv, write_json


def loopback(value):
    url = urllib.parse.urlparse(value)
    if url.scheme != 'http' or url.hostname not in ('127.0.0.1', 'localhost', '::1') or not url.port or url.path not in ('','/'):
        raise ValueError('MinIO requires an explicit loopback HTTP origin')
    if url.username or url.password or url.query or url.fragment:
        raise ValueError('MinIO endpoint must not contain credentials or parameters')
    return url


def topology(env):
    result = {}
    for name in ('BAKERY', 'SHARED'):
        prefix = 'NATIVE_MINIO_' + name
        origin = loopback(env[prefix + '_ENDPOINT'])
        data = pathlib.Path(env[prefix + '_DATA_DIR']).resolve()
        if data.is_relative_to(ROOT) or not pathlib.Path(env[prefix + '_DATA_DIR']).is_absolute():
            raise ValueError('Native object data must use an absolute path outside the repository')
        result[name] = {'origin': origin.geturl().rstrip('/'), 'port': origin.port,
                        'host': origin.hostname, 'console': int(env[prefix + '_CONSOLE_PORT']), 'data': str(data)}
    mappings = [('bakery', 'BAKERY', 'BAKERY_MINIO'), ('subscription', 'SHARED', 'SUBSCRIPTION_MINIO'), ('chat', 'SHARED', 'CHAT_STORAGE')]
    ports=[]
    for item in result.values():ports.extend([item['port'],item['console']])
    if len(set(ports)) != len(ports):raise ValueError('MinIO API and console ports must be distinct')
    for app, instance, prefix in mappings:
        if loopback(env[prefix + '_ENDPOINT']).port != result[instance]['port']:
            raise ValueError('Application MinIO endpoint does not match native instance: ' + prefix)
        loopback(env[prefix + '_PUBLIC_ENDPOINT'])
        if not env.get(prefix + '_ACCESS_KEY') or not env.get(prefix + '_SECRET_KEY'):
            raise ValueError('Missing application storage credentials: ' + prefix)
    return result, mappings


def admin(env, item):
    return MinioAdmin(endpoint=urllib.parse.urlparse(item['origin']).netloc,
                      credentials=StaticProvider(env['NATIVE_MINIO_ADMIN_ACCESS_KEY'], env['NATIVE_MINIO_ADMIN_SECRET_KEY']), secure=False)


def s3(env, item, prefix='NATIVE_MINIO_ADMIN'):
    return Minio(urllib.parse.urlparse(item['origin']).netloc, access_key=env[prefix + '_ACCESS_KEY'],
                 secret_key=env[prefix + '_SECRET_KEY'], secure=False, region='us-east-1')


def healthy(item):
    try:
        with urllib.request.urlopen(item['origin']+'/minio/health/ready',timeout=2) as r:return r.status==200
    except Exception:return False


def provision(env, items, mappings):
    evidence=[]
    for app, instance, prefix in mappings:
        item=items[instance];client=admin(env,item);root=s3(env,item)
        bucket=env[prefix+'_BUCKET'];access=env[prefix+'_ACCESS_KEY']
        if not root.bucket_exists(bucket):root.make_bucket(bucket)
        # No public policy is installed. Refuse a pre-existing public bucket.
        try:
            policy=root.get_bucket_policy(bucket)
            if policy:raise ValueError('Unexpected bucket policy; manual review required: '+bucket)
        except S3Error as error:
            if error.code!='NoSuchBucketPolicy':raise
        created=False
        try:client.user_info(access)
        except MinioAdminException as error:
            if 'XMinioAdminNoSuchUser' not in str(error):raise
            client.user_add(access,env[prefix+'_SECRET_KEY']);created=True
        if not created:
            # Check the established identity before any policy operation.
            s3(env,item,prefix).bucket_exists(bucket)
        policy_name='bakery-native-'+app
        policy={'Version':'2012-10-17','Statement':[
            {'Effect':'Allow','Action':['s3:GetBucketLocation','s3:ListBucket','s3:ListBucketMultipartUploads'],'Resource':['arn:aws:s3:::'+bucket]},
            {'Effect':'Allow','Action':['s3:GetObject','s3:PutObject','s3:DeleteObject','s3:AbortMultipartUpload','s3:ListMultipartUploadParts'],'Resource':['arn:aws:s3:::'+bucket+'/*']},
        ]}
        client.policy_add(policy_name,policy=policy);client.policy_set(policy_name,user=access)
        verified=s3(env,item,prefix).bucket_exists(bucket)
        evidence.append({'consumer':app,'instance':instance,'bucket':bucket,'credentialSource':'ROOT_ENV',
                         'identityCreated':created,'private':True,'authenticatedBucketAccess':verified,'policy':policy})
    return evidence


def serve(env, state):
    items,mappings=topology(env)
    executable=pathlib.Path(env['NATIVE_MINIO_EXECUTABLE']).resolve()
    digest=hashlib.sha256(executable.read_bytes()).hexdigest()
    if digest!=env['NATIVE_MINIO_SHA256']:raise ValueError('MinIO executable checksum mismatch')
    if executable.read_bytes()[:2]!=b'MZ':raise ValueError('MinIO executable is not Windows PE')
    secret_values=[v for k,v in env.items() if any(s in k for s in ('PASSWORD','SECRET','ACCESS_KEY')) and len(v)>3]
    children={};records={}
    def pump(proc,path):
        with path.open('w',encoding='utf-8') as log:
            for line in proc.stdout:
                for value in secret_values:line=line.replace(value,'[REDACTED]')
                log.write(line);log.flush()
    try:
        for name,item in items.items():
            for port in (item['port'],item['console']):
                with socket.socket(socket.AF_INET6 if ':' in item['host'] else socket.AF_INET) as sock:
                    if sock.connect_ex((item['host'],port))==0:raise ValueError('Port already occupied; no process adopted: '+str(port))
            data=pathlib.Path(item['data']);marker=data/'.bakery-native-owner.json'
            if data.exists() and any(data.iterdir()) and not marker.exists():raise ValueError('Unowned storage directory: '+str(data))
            data.mkdir(parents=True,exist_ok=True)
            disk=shutil.disk_usage(data)
            required=max(int(env.get('NATIVE_MINIO_MIN_FREE_BYTES','10737418240')),disk.total//20)
            if disk.free<required:raise ValueError('Insufficient free space for native MinIO: '+name)
            if marker.exists() and json.loads(marker.read_text()).get('instance')!=name:raise ValueError('Storage ownership mismatch')
            if not marker.exists():write_json(marker,{'instance':name,'purpose':'Bakery Platform native local development'})
            penv={k:v for k,v in os.environ.items() if k.upper() in ('SYSTEMROOT','WINDIR','PATH','TEMP','TMP','USERPROFILE','LOCALAPPDATA','APPDATA')}
            penv.update(MINIO_ROOT_USER=env['NATIVE_MINIO_ADMIN_ACCESS_KEY'],MINIO_ROOT_PASSWORD=env['NATIVE_MINIO_ADMIN_SECRET_KEY'],
                        MINIO_BROWSER='off',MINIO_UPDATE='off',GOMEMLIMIT=env.get('NATIVE_MINIO_MEMORY_LIMIT','256MiB'),GOMAXPROCS=env.get('NATIVE_MINIO_PROCESSORS','2'))
            host='['+item['host']+']' if ':' in item['host'] else item['host']
            command=[str(executable),'server','--address',f'{host}:{item["port"]}','--console-address',f'{host}:{item["console"]}',str(data)]
            proc=subprocess.Popen(command,env=penv,cwd=state,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True,encoding='utf-8',errors='replace',creationflags=subprocess.CREATE_NO_WINDOW)
            children[name]=proc
            threading.Thread(target=pump,args=(proc,state/(name.lower()+'.log')),daemon=True).start()
            records[name]=item|{'pid':proc.pid,'executable':str(executable),'sha256':digest,
                                'diskFreeBytesAtStart':disk.free,'diskTotalBytes':disk.total,'requiredFreeBytes':required}
            write_json(state/'processes.json',records)
            for _ in range(30):
                if healthy(item) or proc.poll() is not None:break
                time.sleep(1)
            if not healthy(item):raise ValueError('Native MinIO readiness failed: '+name)
        provisioned=[]
        for mapping in mappings:
            try:provisioned.extend(provision(env,items,[mapping]))
            except MinioAdminException as error:
                try:code=json.loads(error._body).get('Code','UNKNOWN_ADMIN_ERROR')
                except Exception:code='ADMIN_HTTP_'+str(error._code)
                provisioned.append({'consumer':mapping[0],'status':'BLOCKED_CONFIGURATION','errorCode':code})
        write_json(state/'provision.json',provisioned)
        (state/'ready.marker').touch()
        while not (state/'stop.request').exists():
            if any(p.poll() is not None for p in children.values()):raise ValueError('Owned MinIO exited unexpectedly')
            time.sleep(1)
    finally:
        for name,proc in children.items():
            if proc.poll() is None:
                try:admin(env,items[name]).service_stop()
                except Exception:pass
                try:proc.wait(timeout=15)
                except subprocess.TimeoutExpired:proc.terminate();proc.wait(timeout=10)
            records[name]['exitCode']=proc.returncode
        write_json(state/'processes.json',records);(state/'stopped.marker').touch()


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action',choices=['start','serve','status','stop'])
    parser.add_argument('--state-dir',required=True)
    args=parser.parse_args();state=pathlib.Path(args.state_dir).resolve();env=dotenv(ROOT/'.env')
    if state.is_relative_to(ROOT):raise ValueError('Runtime state must remain outside repository')
    state.mkdir(parents=True,exist_ok=True);items,_=topology(env)
    if args.action=='serve':return serve(env,state)
    if args.action=='start':
        if (state/'processes.json').exists() and not (state/'stopped.marker').exists():raise ValueError('Native MinIO state already active')
        for name in ('stop.request','stopped.marker','ready.marker'):(state/name).unlink(missing_ok=True)
        with (state/'supervisor.log').open('w',encoding='utf-8') as log:
            proc=subprocess.Popen([sys.executable,str(pathlib.Path(__file__).resolve()),'serve','--state-dir',str(state)],stdout=log,stderr=log,creationflags=subprocess.CREATE_NO_WINDOW)
        for _ in range(60):
            if proc.poll() is not None:raise ValueError('MinIO startup failed; inspect owned state')
            if (state/'ready.marker').exists():
                checks=json.loads((state/'provision.json').read_text())
                print(json.dumps({'supervisorPid':proc.pid,'state':str(state),'nativeHealth':'UP',
                                  'allConsumerCredentialsValidated':all(x.get('authenticatedBucketAccess') for x in checks)}));return
            time.sleep(1)
        raise ValueError('Native MinIO readiness timeout')
    if args.action=='stop':
        (state/'stop.request').touch()
        for _ in range(60):
            if (state/'stopped.marker').exists():print('Owned MinIO stopped');return
            time.sleep(1)
        raise ValueError('MinIO shutdown timeout; no unrelated process stopped')
    print(json.dumps({k: {'origin':v['origin'],'healthy':healthy(v)} for k,v in items.items()},indent=2))


if __name__=='__main__':
    try:main()
    except Exception as error:
        # Admin exceptions may contain identifiers. Never persist their raw response.
        detail=''
        if isinstance(error,MinioAdminException):
            try:detail=': '+str(json.loads(error._body).get('Code','UNKNOWN_ADMIN_ERROR'))
            except Exception:detail=': ADMIN_HTTP_'+str(error._code)
        elif isinstance(error,ValueError):detail=': '+str(error)
        import traceback
        location=traceback.extract_tb(error.__traceback__)[-1]
        print('Native MinIO failed: '+type(error).__name__+detail+' at '+location.name+':'+str(location.lineno),file=sys.stderr)
        raise SystemExit(1)
