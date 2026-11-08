"""Chỉ đọc metadata Docker, health, OpenAPI và schema local hiện hữu."""
from pathlib import Path
import collections,hashlib,json,re,subprocess,urllib.request
ROOT=Path(__file__).resolve().parents[3];EV=ROOT/'docs/backend-audit/evidence'
def docker(*args):return subprocess.check_output(['docker',*args],stderr=subprocess.PIPE)
all_ids=docker('ps','-aq','--filter','label=com.docker.compose.project=bakery-local').decode().split()
inspected=json.loads(docker('inspect',*all_ids));rows=[];schemas=[]
for c in inspected:
    labels=c['Config'].get('Labels',{}); assert labels.get('com.docker.compose.project')=='bakery-local'
    service=labels.get('com.docker.compose.service','');env=dict(x.split('=',1) for x in c['Config'].get('Env',[]) if '=' in x)
    row={'service':service,'container':c['Name'].lstrip('/'),'image':c['Config']['Image'],'imageId':c['Image'],'status':c['State']['Status'],'health':c['State'].get('Health',{}).get('Status'),'ports':c['NetworkSettings']['Ports'],'environmentNames':sorted(env),'networks':list(c['NetworkSettings']['Networks']),'mounts':[{'type':m['Type'],'destination':m['Destination'],'readOnly':not m['RW'],'volume':m.get('Name')} for m in c['Mounts']]}
    if service.endswith('-service') and c['State']['Running']:
        port=env.get('SERVER_PORT', '8084' if service=='subscription-service' else '8082' if service=='bakery-service' else '8080')
        for name,path in [('health','/actuator/health'),('openapi','/v3/api-docs')]:
            try:
                raw=docker('exec',c['Id'],'curl','-sS','--max-time','15','-w','\n%{http_code}',f'http://127.0.0.1:{port}{path}').decode()
                body,status=raw.rsplit('\n',1);row[name+'HttpStatus']=int(status)
                data=json.loads(body)
                if name=='health':row['applicationHealth']=data.get('status')
                elif status=='200':
                    operations=[{'method':verb.upper(),'path':path} for path,verbs in data.get('paths',{}).items() for verb in verbs if verb.lower() in ['get','post','put','patch','delete','options','head']]
                    (EV/f'existing-openapi-{service}.json').write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8');row['openapiOperations']=operations
            except Exception as e:row[name+'Error']=type(e).__name__
    if service.endswith('-db') and c['State']['Running']:
        sql="""BEGIN READ ONLY;
SELECT json_build_object('version',version(),'database',current_database(),
'tables',(SELECT json_agg(row_to_json(t)) FROM (SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' ORDER BY table_name)t),
'columns',(SELECT json_agg(row_to_json(t)) FROM (SELECT table_name,column_name,data_type,udt_name,is_nullable,column_default,character_maximum_length,numeric_precision,numeric_scale FROM information_schema.columns WHERE table_schema='public' ORDER BY table_name,ordinal_position)t),
'constraints',(SELECT json_agg(row_to_json(t)) FROM (SELECT conrelid::regclass::text AS table_name,conname,contype,pg_get_constraintdef(oid) AS definition FROM pg_constraint WHERE connamespace='public'::regnamespace ORDER BY conrelid::regclass::text,conname)t),
'indexes',(SELECT json_agg(row_to_json(t)) FROM (SELECT tablename,indexname,indexdef FROM pg_indexes WHERE schemaname='public' ORDER BY tablename,indexname)t));
COMMIT;"""
        run=subprocess.run(['docker','exec','-i',c['Id'],'sh','-c','psql -X -Atq -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"'],input=sql,text=True,capture_output=True)
        if run.returncode==0:
            data=json.loads(run.stdout);data['service']=service
            migration_sql='BEGIN READ ONLY; SELECT coalesce(json_agg(t),\'[]\'::json) FROM (SELECT installed_rank,version,description,type,script,checksum,success FROM flyway_schema_history ORDER BY installed_rank)t; COMMIT;'
            m=subprocess.run(['docker','exec','-i',c['Id'],'sh','-c','psql -X -Atq -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"'],input=migration_sql,text=True,capture_output=True)
            data['flyway']=json.loads(m.stdout) if m.returncode==0 else None;schemas.append(data)
        else:row['schemaReadStatus']='FAILED'
    rows.append(row)
(EV/'existing-runtime.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2),encoding='utf-8')
(EV/'existing-database-metadata.json').write_text(json.dumps(schemas,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'containers':len(rows),'servicesReady':[r['service'] for r in rows if r.get('applicationHealth')=='UP'],'databasesReadOnly':len(schemas),'applicationTables':sum(len(s['tables'])-sum(t['table_name']=='flyway_schema_history' for t in s['tables']) for s in schemas)}))
