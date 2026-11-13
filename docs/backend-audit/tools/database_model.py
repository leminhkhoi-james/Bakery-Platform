"""Schema thực trong DB audit; Cake AI chỉ apply migration vào DB schema-only riêng."""
from runtime_cases import ROOT,EV,DB,PROJECT,PRIVATE,sql
import collections,json,re,subprocess
manifest=[]
for p in sorted((ROOT/'backend').glob('*/src/main/resources/db/migration/*.sql')):
    s=p.read_text(encoding='utf-8')
    manifest.append({'source':p.relative_to(ROOT).as_posix(),'module':p.relative_to(ROOT/'backend').parts[0],'createTables':re.findall(r'CREATE\s+TABLE\s+(?:IF NOT EXISTS\s+)?([a-z_]+)',s,re.I),'lines':len(s.splitlines())})
tables=[(x['module'],t) for x in manifest for t in x['createTables']]
dbs=[(s,d['database'],'APPLICATION_FLYWAY') for s,d in PRIVATE['dbUsers'].items()]
exists=subprocess.check_output(['docker','exec',DB,'psql','-U','audit_admin','-d','postgres','-Atqc',"SELECT 1 FROM pg_database WHERE datname='cake_ai_audit_schema';"]).decode().strip()
if not exists:
    subprocess.run(['docker','exec',DB,'psql','-U','audit_admin','-d','postgres','-v','ON_ERROR_STOP=1','-qc','CREATE DATABASE cake_ai_audit_schema;'],check=True,capture_output=True)
    for item in [x for x in manifest if x['module']=='cake-ai-service']:
        q=(ROOT/item['source']).read_text(encoding='utf-8')
        r=subprocess.run(['docker','exec','-i',DB,'psql','-U','audit_admin','-d','cake_ai_audit_schema','-v','ON_ERROR_STOP=1','-q'],input=q,text=True,capture_output=True)
        if r.returncode:raise RuntimeError('Migration Cake AI audit thất bại: '+r.stderr[:200])
dbs.append(('cake-ai-service','cake_ai_audit_schema','DDL_ONLY_NO_RUNNING_APPLICATION'))
query="""BEGIN READ ONLY;
SELECT json_build_object('database',current_database(),'version',version(),
'tables',(SELECT json_agg(t) FROM (SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' ORDER BY table_name)t),
'columns',(SELECT json_agg(t) FROM (SELECT table_name,column_name,data_type,udt_name,is_nullable,column_default,character_maximum_length,numeric_precision,numeric_scale FROM information_schema.columns WHERE table_schema='public' ORDER BY table_name,ordinal_position)t),
'constraints',(SELECT json_agg(t) FROM (SELECT conrelid::regclass::text AS table_name,conname,contype,pg_get_constraintdef(oid) AS definition FROM pg_constraint WHERE connamespace='public'::regnamespace ORDER BY conrelid::regclass::text,conname)t),
'indexes',(SELECT json_agg(t) FROM (SELECT tablename,indexname,indexdef FROM pg_indexes WHERE schemaname='public' ORDER BY tablename,indexname)t));COMMIT;"""
schemas=[]
for service,db,mode in dbs:
    r=subprocess.run(['docker','exec','-i',DB,'psql','-X','-Atq','-U','audit_admin','-d',db,'-v','ON_ERROR_STOP=1'],input=query,text=True,capture_output=True,check=True)
    d=json.loads(r.stdout);d['service']=service;d['mode']=mode
    if mode=='APPLICATION_FLYWAY':
        r=subprocess.run(['docker','exec',DB,'psql','-X','-Atqc',"SELECT json_agg(t) FROM (SELECT version,description,script,checksum,success FROM flyway_schema_history ORDER BY installed_rank)t;",'-U','audit_admin','-d',db],text=True,capture_output=True,check=True);d['flyway']=json.loads(r.stdout)
    schemas.append(d)
summary={'databasePerService':len(dbs),'sourceApplicationTables':len(tables),'byService':dict(collections.Counter(s for s,t in tables)),'migrationFiles':len(manifest),'liveAuditApplicationTables':sum(len([t for t in d['tables'] if t['table_name']!='flyway_schema_history']) for d in schemas if d['mode']=='APPLICATION_FLYWAY'),'schemaOnlyCakeAiTables':sum(len(d['tables']) for d in schemas if d['mode']!='APPLICATION_FLYWAY')}
for file,data in [('database-migrations.json',manifest),('isolated-database-metadata.json',schemas),('database-summary.json',summary)]:
    (EV/file).write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(summary))
