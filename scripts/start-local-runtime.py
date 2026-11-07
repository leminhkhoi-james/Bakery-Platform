"""Khởi chạy Docker local có cấu hình lưu bền; không in giá trị bí mật."""
from pathlib import Path
import argparse
import bcrypt
import getpass
import json
import os
import re
import secrets
import shutil
import subprocess
import sys
import time
import requests
import yaml

ROOT=Path(__file__).resolve().parents[1]
SECRET_ROOT=Path(os.environ.get('BAKERY_LOCAL_SECRET_DIR','H:/MSS/.secrets/bakery-platform'))
ENV=SECRET_ROOT/'local-runtime.env'
CLIENTS=SECRET_ROOT/'local-service-clients.yml'
MANIFEST=SECRET_ROOT/'local-runtime-sources.json'
PROJECT='bakery-local'
FILES=['compose.yaml','docker-compose.bakery-subscription.yml','docker-compose.order-service.yml',
       'docker-compose.chat-service.yml','compose.services.yaml','compose.no-firebase.yaml','compose.local-runtime.yaml']
MODULES=['identity-service','bakery-service','marketplace-service','subscription-service','order-service','chat-service','api-gateway']
SERVICES=[x for x in MODULES if x!='api-gateway']
PORTS={'identity-service':18081,'bakery-service':18082,'marketplace-service':18083,
       'subscription-service':18084,'order-service':18086,'chat-service':18087}


def read_env(p):
    values={}
    if p.exists():
        for line in p.read_text(encoding='utf-8-sig').splitlines():
            m=re.match(r'\s*(?:export\s+)?([A-Za-z_][\w]*)\s*=\s*(.*)',line)
            if m:values[m[1]]=m[2].strip().strip('\"\'')
    return values


def restrict(p):
    if os.name=='nt':
        principal=subprocess.check_output(['whoami'],text=True).strip()
        result=subprocess.run(['icacls',str(p),'/inheritance:r','/grant:r',principal+':F','/grant:r','*S-1-5-18:F'],capture_output=True,text=True)
        if result.returncode:raise RuntimeError('Không giới hạn được ACL của file cấu hình local')
    else:p.chmod(0o600)


def prepare():
    SECRET_ROOT.mkdir(parents=True,exist_ok=True)
    if ENV.exists():
        values=read_env(ENV)
        if not CLIENTS.exists() or not MANIFEST.exists():
            raise RuntimeError('Cấu hình lưu bền thiếu file đi kèm; giữ nguyên để kiểm tra, không sinh lại secret')
        print('Tái sử dụng cấu hình local lưu bền; không thay key, password hay volume.')
    else:
        existing={**read_env(ROOT/'backend/.env'),**read_env(ROOT/'.env')}
        values={};sources={}
        def obtain(key,default=None,generate=False):
            if existing.get(key):values[key]=existing[key];sources[key]='REUSED_EXISTING_COMPOSE_ENV'
            elif generate:values[key]=secrets.token_urlsafe(32);sources[key]='GENERATED_CSPRNG_256_BITS'
            else:values[key]=default or '';sources[key]='DERIVED_SOURCE_AND_COMPOSE'
        for service in ['IDENTITY','MARKETPLACE','BAKERY','SUBSCRIPTION','ORDER','CHAT','CAKE_AI']:
            obtain(service+'_DB_USERNAME',service.lower().replace('_','-').replace('-',''))
            obtain(service+'_DB_PASSWORD',generate=True)
        for key,filename in [('IDENTITY_JWT_PRIVATE_KEY_FILE','identity-private.pem'),('IDENTITY_JWT_PUBLIC_KEY_FILE','identity-public.pem')]:
            obtain(key,str(SECRET_ROOT/filename))
            if not Path(values[key]).is_file():raise RuntimeError('Thiếu khóa RSA có sẵn: '+key)
        # Không thay cặp khóa ký đã thiết lập. Chỉ sinh credential dịch vụ local còn thiếu.
        hashes={}
        for service in ['MARKETPLACE','ORDER','CHAT','BAKERY','SUBSCRIPTION']:
            key='CHAT_SERVICE_CLIENT_SECRET' if service=='CHAT' else service+'_CLIENT_SECRET'
            obtain(key,generate=True)
            hash_key='CHAT_SERVICE_CLIENT_SECRET_HASH' if service=='CHAT' else service+'_CLIENT_SECRET_HASH'
            if existing.get(hash_key):
                try:matches=bcrypt.checkpw(values[key].encode(),existing[hash_key].encode())
                except ValueError:matches=False
                if matches:
                    values[hash_key]=existing[hash_key];sources[hash_key]='REUSED_EXISTING_COMPOSE_ENV'
                else:
                    # Chỉ dẫn xuất lại hash cho cùng secret trong stack local mới;
                    # không thay secret hoặc ghi đè .env của chủ repository.
                    values[hash_key]=bcrypt.hashpw(values[key].encode(),bcrypt.gensalt(rounds=12)).decode()
                    sources[hash_key]='REPAIRED_BCRYPT_FROM_UNCHANGED_EXISTING_SECRET'
            else:
                values[hash_key]=bcrypt.hashpw(values[key].encode(),bcrypt.gensalt(rounds=12)).decode()
                sources[hash_key]='DERIVED_BCRYPT_FROM_MATCHING_CLIENT_SECRET'
            hashes[service]=values[hash_key]
        values['ORDER_SERVICE_CLIENT_SECRET']=values['ORDER_CLIENT_SECRET'];sources['ORDER_SERVICE_CLIENT_SECRET']='SAME_ORDER_CLIENT_CREDENTIAL'
        for service in ['BAKERY','SUBSCRIPTION']:
            obtain(service+'_MINIO_ACCESS_KEY',generate=True);obtain(service+'_MINIO_SECRET_KEY',generate=True)
        obtain('CHAT_STORAGE_ACCESS_KEY',generate=True);obtain('CHAT_STORAGE_SECRET_KEY',generate=True)
        for key in ['FIREBASE_PROJECT_ID','FIREBASE_STORAGE_BUCKET','FIREBASE_CREDENTIALS_FILE']:
            obtain(key)
        # Compose gốc có nội suy bắt buộc; mount Firebase đã bỏ bằng override chính thức.
        # Project/bucket vẫn để trống trong container: adapter từ chối 503 trước remote call.
        if not values['FIREBASE_PROJECT_ID']:values['FIREBASE_PROJECT_ID']='disabled-local-mode'
        if not values['FIREBASE_STORAGE_BUCKET']:values['FIREBASE_STORAGE_BUCKET']='disabled-local-mode'
        if not values['FIREBASE_CREDENTIALS_FILE']:values['FIREBASE_CREDENTIALS_FILE']=str(SECRET_ROOT/'firebase-not-configured.json')
        values['LOCAL_SERVICE_CLIENTS_FILE']=str(CLIENTS);sources['LOCAL_SERVICE_CLIENTS_FILE']='EXTERNAL_READ_ONLY_MOUNT'
        values['MARKETPLACE_SERVICE_PORT']='18083';sources['MARKETPLACE_SERVICE_PORT']='LOOPBACK_NONCONFLICTING_HOST_PORT'
        grants={
            'marketplace-service':{'bakery-service':'bakery:profile:read bakery:membership:read bakery:catalog:quote','subscription-service':'subscription:entitlement:read','cake-ai-service':'cake-ai:design:validate','order-service':'order:create-from-offer'},
            'order-service':{'marketplace-service':'marketplace:offer:read','identity-service':'identity:user:read identity:address:read','bakery-service':'bakery:profile:read bakery:membership:read bakery:catalog:quote'},
            'chat-service':{'marketplace-service':'marketplace:request:chat:authorize','bakery-service':'bakery:membership:read'},
            'bakery-service':{'identity-service':'identity:user:read','subscription-service':'subscription:entitlement:read'},
            'subscription-service':{'bakery-service':'bakery:profile:read bakery:membership:read'}}
        clients={name:{'secret-hash':hashes[name.split('-')[0].upper()],'grants':g} for name,g in grants.items()}
        # Khớp OAuth scope thực tế của Order CatalogQuote API; không tăng quyền ngoài nhu cầu đã đọc.
        CLIENTS.write_text(yaml.safe_dump({'security':{'service-clients':{'clients':clients}}},sort_keys=False),encoding='utf-8')
        def quoted(value):
            if '\n' in value or "'" in value:raise RuntimeError('Giá trị env có ký tự cần escape; không tự ghi sai cấu hình')
            return "'"+value.replace('\\','/')+"'"
        ENV.write_text('\n'.join(k+'='+quoted(v) for k,v in values.items())+'\n',encoding='utf-8')
        MANIFEST.write_text(json.dumps({'variables':sources,'signing_key':'REUSED_EXISTING_RS256_RSA_3072',
            'new_database_volumes':True,'source_config_scope_addition':'order-service → bakery:catalog:quote',
            'external_unresolved':['FIREBASE_CREDENTIALS_FILE','CAKEAI_APIKEY','CAKEAI_FIREBASEPROJECTID','CAKEAI_FIREBASEBUCKET','GOOGLE_APPLICATION_CREDENTIALS']},ensure_ascii=False,indent=2),encoding='utf-8')
        for p in [ENV,CLIENTS,MANIFEST]:restrict(p)
        print('Đã lưu cấu hình local bên ngoài Git; tái sử dụng RSA và credential hiện hữu.')
    for module in MODULES:
        jars=ROOT/'backend'/module/'target'
        jar=jars/(module+'-0.0.1-SNAPSHOT-exec.jar')
        if not jar.exists():jar=jars/(module+'-0.0.1-SNAPSHOT.jar')
        if not jar.exists():raise RuntimeError('Chưa có jar đã build: '+module+'; dùng lệnh package trong tài liệu runtime')
        context=jars/'docker-runtime';context.mkdir(exist_ok=True)
        shutil.copy2(jar,context/'application.jar')
        shutil.copy2(ROOT/'docker/java-local-runtime/Dockerfile',context/'Dockerfile')
        (context/'.dockerignore').write_text('*\n!Dockerfile\n!application.jar\n',encoding='utf-8')


def compose(*args,check=True,capture=False):
    cmd=['docker','compose','--env-file',str(ENV),'-p',PROJECT]
    for f in FILES:cmd.extend(['-f',f])
    return subprocess.run(cmd+list(args),cwd=ROOT,check=check,capture_output=capture,text=True)


def verify():
    findings=[]
    for module,port in PORTS.items():
        status=0
        for _ in range(40):
            try:status=requests.get(f'http://localhost:{port}/v3/api-docs',timeout=3).status_code
            except requests.RequestException:status=0
            if status==200:break
            time.sleep(1)
        findings.append({'service':module,'hostPort':port,'openapiStatus':status,
            'runtime':'RUNNING_WITH_LIMITATIONS' if status==200 else 'FAILED'})
    for module in SERVICES:
        db=module.replace('-service','')+'-db'
        result=compose('exec','-T',db,'sh','-c','psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Atc "SELECT count(*) FROM flyway_schema_history WHERE success"',check=False,capture=True)
        item=next(x for x in findings if x['service']==module)
        item['successfulMigrations']=result.stdout.strip() if result.returncode==0 else 'NOT_VERIFIED'
    output=ROOT/'docs/audit/evidence/docker-runtime.json';output.parent.mkdir(parents=True,exist_ok=True)
    output.write_text(json.dumps(findings,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps(findings,ensure_ascii=False,indent=2))
    if any(x['openapiStatus']!=200 for x in findings):raise RuntimeError('Có service chưa sẵn sàng')


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action',choices=['prepare','build','up','verify','restart','stop','status','gateway-attempt'])
    args=parser.parse_args()
    if args.action=='prepare':prepare();compose('config','--quiet')
    elif args.action=='build':compose('build','--parallel',*SERVICES,'bakery-storage','subscription-storage','chat-storage')
    elif args.action=='up':compose('up','-d','--no-build',*SERVICES)
    elif args.action=='verify':verify()
    elif args.action=='gateway-attempt':compose('build','api-gateway');compose('up','-d','api-gateway')
    elif args.action=='restart':compose('restart',*SERVICES)
    elif args.action=='stop':compose('stop')
    elif args.action=='status':compose('ps','-a')
