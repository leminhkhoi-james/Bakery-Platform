"""Compare this mission's baseline; scan known secrets without revealing them."""
import hashlib,json,os,re,subprocess,zipfile
from pathlib import Path
from full_common import MOBILE,ROOT,OUT,DOCS,save
from phase5_integrity import snapshot

old=json.loads((OUT/'baseline.json').read_text());now=snapshot();boundary={}
for field in ['files','directories','external']:
    boundary[field+'Changed']=[p for p in set(old[field])|set(now[field]) if old[field].get(p)!=now[field].get(p)]
boundary.update({'headUnchanged':old['git']['head']==now['git']['head'],'branchUnchanged':old['git']['branch']==now['git']['branch'],'staged':now['git']['staged'],'protectedFileCount':len(old['files']),'externalConfigCount':len(old['external'])})
boundary['result']='PASS' if not any([boundary['filesChanged'],boundary['directoriesChanged'],boundary['externalChanged'],boundary['staged'],not boundary['headUnchanged'],not boundary['branchUnchanged']]) else 'FAIL'
known=[]
def collect(v,key=''):
    if isinstance(v,dict):
        for k,x in v.items():collect(x,k)
    elif isinstance(v,list):
        for x in v:collect(x,key)
    elif isinstance(v,str) and re.search('PASSWORD|SECRET|TOKEN|PRIVATE.?KEY|STORAGEACCESS|STORAGESECRET',key.upper()) and not re.search(r'(?:PATH|FILE|URL|URI|TTL)$',key.upper()) and len(v)>=10:known.append(v.encode())
for p in [ROOT.parent/'.secrets/bakery-platform/local-smoke-users.json',ROOT.parent/'.runtime/bakery-mobile-phases-1-4/mobile-live-user.json',ROOT.parent/'.runtime/bakery-mobile-phases-1-4/runtime-generated.json',ROOT.parent/'.runtime/bakery-mobile-phases-1-4/compose.json']:
    if p.is_file():collect(json.loads(p.read_text(encoding='utf-8-sig')))
for service in json.loads((OUT/'runtime-start.json').read_text())['services'].values():
    c=json.loads(subprocess.check_output(['docker','inspect',service['container']]))[0]
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
        if name not in ['final-verification.json','artifact-manifest.json']:manifest.append({'path':relative,'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest()})
apkResults=[]
for apk in [MOBILE/'.dart_tool/full-integration-apks/full-driver.apk',MOBILE/'.dart_tool/full-integration-apks/normal-main.apk']:
    entries=0;apkHits=[]
    with zipfile.ZipFile(apk) as archive:
        for entry in archive.infolist():
            if entry.is_dir():continue
            entries+=1
            if any(n in archive.read(entry) for n in known):apkHits.append(entry.filename)
    apkResults.append({'path':str(apk.relative_to(MOBILE)),'sha256':hashlib.sha256(apk.read_bytes()).hexdigest(),'entries':entries,'knownSecretMatchEntries':apkHits})
missing=[]
for p in [MOBILE/'README.md',*(DOCS.glob('*.md'))]:
    for link in re.findall(r'\]\(([^)]+)\)',p.read_text(encoding='utf-8')):
        target=link.split('#')[0].strip('<>')
        if target and '://' not in target and not (p.parent/target).exists():missing.append({'file':str(p.relative_to(MOBILE)),'target':target})
for p in (MOBILE/'tool').glob('full*.py'):compile(p.read_bytes(),str(p),'exec')
git=subprocess.check_output(['git','status','--porcelain=v1','--untracked-files=all'],cwd=ROOT,text=True).splitlines()
outside=[line for line in git if not line[3:].replace('\\','/').startswith('mobile/')]
# Root prompt was untracked before this mission. Compare status outside scope too.
initialLines=old['git']['status'].splitlines()
# snapshot() used strip(): restore the one leading status-space lost on line1.
if initialLines and re.match(r'^[MADRCU] ',initialLines[0]):initialLines[0]=' '+initialLines[0]
initialOutside=[line for line in initialLines if not line[3:].replace('\\','/').startswith('mobile/')]
diff=subprocess.run(['git','diff','--check'],cwd=ROOT,capture_output=True,text=True)
mobileOld=old['initialMobileFiles'];modified=[];removed=[]
for rel,meta in mobileOld.items():
    p=MOBILE/rel
    if not p.exists():removed.append(rel)
    elif hashlib.sha256(p.read_bytes()).hexdigest()!=meta['sha256']:modified.append(rel)
priorEvidenceChanged=[p for p in modified+removed if p.startswith('docs/evidence/') or p.endswith('_REPORT_VI.md') and not p.startswith('docs/full-integration/')]
result={'result':'PASS' if boundary['result']=='PASS' and not any([hits,missing,any(r['knownSecretMatchEntries'] for r in apkResults),sorted(outside)!=sorted(initialOutside),diff.returncode,removed,priorEvidenceChanged]) else 'FAIL','protectedBoundary':boundary,'outsideStatusUnchanged':sorted(outside)==sorted(initialOutside),'preexistingOutsideStatus':initialOutside,'knownSecretOrSensitivePatternMatchFiles':hits,'knownSecretCandidatesChecked':len(known),'apkScans':apkResults,'missingDocumentationLinks':missing,'pythonSyntax':'PASS','gitDiffCheckExitCode':diff.returncode,'initialMobileFiles':len(mobileOld),'initialMobileFilesModified':modified,'initialMobileFilesRemoved':removed,'historicalEvidenceChanged':priorEvidenceChanged,'scanLimit':'Known values and patterns across Mobile deliverable files and both APK archive entries. Excludes build caches except two APKs; no OCR/full media-text recognition; no universal security guarantee. Representative media privacy review documented separately.','committed':False,'pushed':False,'staged':False}
result['at']=now['at'];result['baselineRunId']=old['runId']
save('final-verification.json',result);save('artifact-manifest.json',manifest)
print(json.dumps({k:result[k] for k in ['result','protectedBoundary','outsideStatusUnchanged','knownSecretOrSensitivePatternMatchFiles','missingDocumentationLinks','initialMobileFilesRemoved','historicalEvidenceChanged','gitDiffCheckExitCode']},ensure_ascii=True),flush=True)
raise SystemExit(result['result']!='PASS')
