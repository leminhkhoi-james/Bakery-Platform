"""Rà coverage, liên kết, JSON, Git scope và secret exact-match (không in giá trị)."""
from pathlib import Path
import collections,hashlib,json,re,subprocess,tempfile,urllib.parse
ROOT=Path(__file__).resolve().parents[3];OUT=ROOT/'docs/backend-audit';EV=OUT/'evidence';WORK=Path(tempfile.gettempdir())/'bakery-backend-audit-20261107'
def read(name):return json.loads((EV/name).read_text(encoding='utf-8'))
apis=read('api-inventory.json');cases=read('runtime-cases.json');main=ROOT/'docs/BAKERY_PLATFORM_BACKEND_FULL_SYSTEM_AND_API_AUDIT_VI.md'
markdown=[main,*OUT.rglob('*.md')];errors=[];links=0;anchors={}
for p in markdown:
    s=p.read_text(encoding='utf-8');visible=re.sub(r'```.*?```','',s,flags=re.S)
    anchors[p.resolve()]=set(re.findall(r'<a id="([^"]+)"',s))
    # GitHub heading anchors sufficient for our explicit IDs; no infer arbitrary non-ASCII anchors.
    for h in re.findall(r'^#{1,6}\s+(.+)$',visible,re.M):anchors[p.resolve()].add(re.sub(r'[^\w\- ]','',h.lower()).replace(' ','-'))
for p in markdown:
    s=re.sub(r'```.*?```','',p.read_text(encoding='utf-8'),flags=re.S)
    for target in re.findall(r'\[[^\]\n]*\]\(([^)\n]+)\)',s):
        if target.startswith(('https://','http://','mailto:')):continue
        target=urllib.parse.unquote(target.strip('<>'));file,_,anchor=target.partition('#');dest=(p.parent/file).resolve() if file else p.resolve();links+=1
        if not dest.exists():errors.append({'file':p.relative_to(ROOT).as_posix(),'target':target,'error':'MISSING_TARGET'});continue
        if anchor and not anchor.startswith('L') and dest in anchors and anchor not in anchors[dest]:errors.append({'file':p.relative_to(ROOT).as_posix(),'target':target,'error':'MISSING_ANCHOR'})
detail=(OUT/'BACKEND_API_DETAILED_SPECIFICATION_VI.md').read_text(encoding='utf-8')
segments=re.split(r'<a id="(?:bkr|cai|cht|idn|mkt|ord|sub)-\d{3}"></a>',detail)[1:]
if len(segments)!=113:errors.append({'error':'API_SECTION_COUNT','actual':len(segments)})
for a,segment in zip(apis,segments):
    for letter in 'ABCDEFGHIJK':
        if not re.search(r'^### '+letter+r'\.',segment,re.M):errors.append({'api':a['id'],'error':'MISSING_'+letter})
if len(re.findall(r'^## \d+\.',main.read_text(encoding='utf-8'),re.M))!=25:errors.append({'error':'MAIN_25_SECTIONS'})
wf=(OUT/'BACKEND_BUSINESS_WORKFLOWS_VI.md').read_text(encoding='utf-8')
if len(re.findall(r'<a id="wf-\d+">',wf))!=37:errors.append({'error':'WORKFLOW_COUNT'})
for i,section in enumerate(re.split(r'<a id="wf-\d+"></a>',wf)[1:],1):
    for field in range(1,24):
        if f'| {field} |' not in section:errors.append({'workflow':i,'error':'FIELD_'+str(field)})
bad_json=[]
for p in EV.glob('*.json'):
    try:json.loads(p.read_text(encoding='utf-8'))
    except Exception:bad_json.append(p.name)
if bad_json:errors.append({'error':'INVALID_JSON','files':bad_json})
# Private values never leave this process. Match long actual secret strings in every new artifact.
secret_values=set()
private=json.loads((WORK/'runtime-private.json').read_text(encoding='utf-8'));spec=json.loads((WORK/'runtime-compose.json').read_text(encoding='utf-8'))
def collect(obj,key=''):
    if isinstance(obj,dict):
        for k,v in obj.items():collect(v,k)
    elif isinstance(obj,list):
        for v in obj:collect(v,key)
    elif isinstance(obj,str) and len(obj)>=12 and re.search(r'password|secret|token|storageAccess',key,re.I):secret_values.add(obj)
collect(private)
for v in spec['services'].values():
    for k,value in v.get('environment',{}).items():
        if re.search(r'PASSWORD|SECRET|SANDBOX_CODE',k) and isinstance(value,str) and len(value)>=12:secret_values.add(value)
state=WORK/'test-state.json'
if state.exists():collect(json.loads(state.read_text(encoding='utf-8')))
secret_matches=[];pattern_matches=[]
for p in [main,*OUT.rglob('*')]:
    if not p.is_file() or '__pycache__' in p.parts:continue
    data=p.read_bytes()
    for value in secret_values:
        if value.encode() in data:secret_matches.append(p.relative_to(ROOT).as_posix());break
    text=data.decode('utf-8',errors='replace')
    # Long JWTs and PEM key material, not harmless code string 'BEGIN PRIVATE KEY'.
    if re.search(r'eyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}',text) or re.search(r'-----BEGIN (?:RSA )?PRIVATE KEY-----\s+[A-Za-z0-9+/=\r\n]{80,}',text):pattern_matches.append(p.relative_to(ROOT).as_posix())
if secret_matches or pattern_matches:errors.append({'error':'SECRET_MATCH','files':sorted(set(secret_matches+pattern_matches))})
status=subprocess.check_output(['git','status','--porcelain=v1','-uall'],cwd=ROOT,text=True)
outside=[]
for line in status.splitlines():
    path=line[3:].strip('"')
    if not path.startswith('docs/'):outside.append(path)
if outside:errors.append({'error':'GIT_CHANGES_OUTSIDE_DOCS','files':outside})
staged=subprocess.check_output(['git','diff','--cached','--name-only'],cwd=ROOT,text=True).splitlines()
if staged:errors.append({'error':'STAGED_FILES','files':staged})
protected=read('filesystem-integrity.json')
if protected['changedProtectedFiles'] or protected['changedProtectedDirectories'] or protected['readErrors']:errors.append({'error':'PROTECTED_FILESYSTEM_CHANGED'})
result={'status':'PASS' if not errors else 'FAIL','markdownFiles':len(markdown),'linksChecked':links,'apiSections':len(segments),'workflowSections':37,'sourceOperations':len(apis),'executedOperations':len({x['api'] for x in cases}),'business2xxOperations':len({x['api'] for x in cases if x['result']=='PASS' and x.get('actualStatus',0) in range(200,300)}),'jsonEvidenceFiles':len(list(EV.glob('*.json'))),'secretValuesCheckedCount':len(secret_values),'secretMatchFiles':sorted(set(secret_matches+pattern_matches)),'gitOutsideDocsChanges':outside,'stagedFiles':staged,'protectedFilesChecked':protected['filesChecked'],'errors':errors}
(EV/'artifact-validation.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
(EV/'git-final-status.txt').write_text(status,encoding='utf-8')
print(json.dumps(result,ensure_ascii=True));raise SystemExit(0 if not errors else 1)
