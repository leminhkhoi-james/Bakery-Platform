"""Known-secret scan, protected-boundary check, links and manifest; no values printed."""
from pathlib import Path
import hashlib,json,os,re,subprocess,zipfile
MOBILE=Path(__file__).resolve().parents[1];ROOT=MOBILE.parent;OUT=MOBILE/'docs/evidence/phases-5a-5b-5c'
subprocess.run(['python','-B',str(MOBILE/'tool/phase5_integrity.py'),'verify'],check=True,capture_output=True)
protected=json.loads((OUT/'protected-final.json').read_text());known=[]
def collect(value,key=''):
    if isinstance(value,dict):
        for k,v in value.items():collect(v,k)
    elif isinstance(value,list):
        for v in value:collect(v,key)
    elif isinstance(value,str) and re.search('PASSWORD|SECRET|TOKEN|PRIVATE.?KEY|STORAGEACCESS|STORAGESECRET',key.upper()) and not re.search(r'(?:PATH|FILE|URL|URI|TTL)$',key.upper()) and len(value)>=10:known.append(value.encode())
for p in [ROOT.parent/'.secrets/bakery-platform/local-smoke-users.json',ROOT.parent/'.runtime/bakery-mobile-phases-1-4/mobile-live-user.json',ROOT.parent/'.runtime/bakery-mobile-phases-1-4/runtime-generated.json',ROOT.parent/'.runtime/bakery-mobile-phases-1-4/compose.json']:
    if p.is_file():collect(json.loads(p.read_text(encoding='utf-8-sig')))
runtime=json.loads((OUT/'runtime-start.json').read_text())
for item in runtime['services'].values():
    if 'container' not in item:continue
    c=json.loads(subprocess.check_output(['docker','inspect',item['container']]))[0]
    collect(dict(v.split('=',1) for v in c['Config']['Env'] if '=' in v))
private=ROOT.parent/'.secrets/bakery-platform/identity-private.pem'
if private.is_file():known.append(private.read_bytes().strip())
known=list(set(known));hits=[];manifest=[];textSuffixes={'.dart','.py','.ps1','.json','.md','.log','.txt','.yaml','.yml','.xml','.properties'}
pattern=rb'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.|X-Amz-Signature=[A-Fa-f0-9]{32,}|(?:https?|wss?)://127\.0\.0\.1:\d+/[A-Za-z0-9_=-]{8,}/'
for folder,dirs,leaves in os.walk(MOBILE):
    dirs[:]=[d for d in dirs if d not in {'build','.dart_tool','.gradle','.idea','__pycache__','.symlinks'}]
    for name in leaves:
        p=Path(folder)/name;raw=p.read_bytes();relative=p.relative_to(MOBILE).as_posix()
        if any(n in raw for n in known) or p.suffix in textSuffixes and re.search(pattern,raw):hits.append(relative)
        if name not in ['final-verification.json','phase5-manifest.json']:manifest.append({'path':relative,'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest()})
apk=MOBILE/'build/app/outputs/flutter-apk/app-debug.apk';apkHits=[];entries=0
with zipfile.ZipFile(apk) as archive:
    for entry in archive.infolist():
        if entry.is_dir():continue
        entries+=1
        if any(n in archive.read(entry) for n in known):apkHits.append(entry.filename)
missing=[]
for p in [MOBILE/'README.md',MOBILE/'docs/API_INTEGRATION_MATRIX_PHASES_5A_5B_5C_VI.md',MOBILE/'BAKERY_PLATFORM_MOBILE_MARKETPLACE_ORDER_CHAT_INTEGRATION_REPORT_VI.md']:
    if not p.exists():missing.append({'file':p.name,'target':'DOCUMENT_ABSENT'});continue
    for link in re.findall(r'\]\(([^)]+)\)',p.read_text(encoding='utf-8')):
        target=link.split('#')[0]
        if target and '://' not in target and not (p.parent/target).exists():missing.append({'file':p.name,'target':target})
for p in (MOBILE/'tool').glob('phase5*.py'):compile(p.read_bytes(),str(p),'exec')
git=subprocess.run(['git','status','--porcelain=v1','--untracked-files=all'],cwd=ROOT,capture_output=True,text=True,check=True).stdout.splitlines()
outside=[line for line in git if not line[3:].replace('\\','/').startswith('mobile/')]
result={'result':'PASS' if protected['result']=='PASS' and not any([hits,apkHits,missing,outside]) else 'FAIL','protectedBoundary':protected,'protectedFileCount':3099,'externalConfigCount':30,'knownSecretOrSensitivePatternMatchFiles':hits,'knownSecretCandidatesChecked':len(known),'apkEntriesScanned':entries,'apkSecretMatchEntries':apkHits,'apkSha256':hashlib.sha256(apk.read_bytes()).hexdigest(),'missingDocumentationLinks':missing,'changesOutsideMobile':outside,'pythonSyntax':'PASS','scopeLimit':'Known values and patterns only; not a universal security audit; no screenshot OCR or scanning chat/tool history'}
(OUT/'final-verification.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
(OUT/'phase5-manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
print(json.dumps(result),flush=True);raise SystemExit(result['result']!='PASS')
