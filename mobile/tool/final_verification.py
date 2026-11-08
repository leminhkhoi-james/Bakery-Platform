"""Final boundary/secret verification. Never prints a matched sensitive value."""
from pathlib import Path
import hashlib,json,os,re,subprocess,zipfile
ROOT=Path(__file__).resolve().parents[2];MOBILE=ROOT/'mobile'
OUT=MOBILE/'docs/evidence/api-integration-phases-1-4'
subprocess.run(['python','-B',str(MOBILE/'tool/protected_inventory.py'),'--verify'],check=True)
credentialFile=Path(os.environ.get('BAKERY_ADMIN_CREDENTIAL_FILE','H:/MSS/.secrets/bakery-platform/local-smoke-users.json'))
secrets=[]
if credentialFile.exists():
    credentials=json.loads(credentialFile.read_text(encoding='utf-8-sig'));secrets.append(credentials.get('password',''))
runtime=Path('H:/MSS/.runtime/bakery-mobile-phases-1-4')
compose=runtime/'compose.json'
if compose.exists():
    for service in json.loads(compose.read_text())['services'].values():
        secrets.extend(v for k,v in service.get('environment',{}).items() if re.search('PASSWORD|SECRET|TOKEN',k) and isinstance(v,str))
keyFile=Path('H:/MSS/.secrets/bakery-platform/identity-private.pem')
if keyFile.exists():secrets.append(keyFile.read_text().strip())
for filename,keys in [('mobile-live-user.json',['password']),('runtime-generated.json',['bakeryDbPassword','subscriptionDbPassword','storageAccess','storageSecret'])]:
    p=runtime/filename
    if p.exists():
        values=json.loads(p.read_text());secrets.extend(values.get(k,'') for k in keys)
hits=[];manifest=[]
skip={'build','.dart_tool','.gradle','.idea','__pycache__'}
for folder,dirs,files in os.walk(MOBILE):
    dirs[:]=[d for d in dirs if d not in skip]
    for name in files:
        p=Path(folder)/name;relative=p.relative_to(ROOT).as_posix();raw=p.read_bytes()
        knownMatch=any(s and len(s)>=12 and s.encode() in raw for s in secrets)
        if knownMatch:hits.append(relative)
        if not knownMatch and p.suffix in ['.dart','.py','.md','.json','.txt','.log','.yaml','.yml','.html','.xml','.properties','.plist','.kts','.gradle','.swift','.ps1','.sh','.toml','.env']:
            text=raw.decode('utf-8',errors='replace')
            if re.search(r'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.',text):hits.append(relative)
        if p.name not in ['file-manifest.json','final-boundary-and-secrets.json','protected-integrity.json']:manifest.append({'path':relative,'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest()})
staged=subprocess.check_output(['git','diff','--cached','--name-only'],cwd=ROOT,text=True).splitlines()
apk=MOBILE/'build/app/outputs/flutter-apk/app-debug.apk';apkHits=[];entries=0
if apk.exists():
    needles=[s.encode() for s in secrets if s and len(s)>=12]
    with zipfile.ZipFile(apk) as archive:
        for entry in archive.infolist():
            if entry.is_dir():continue
            raw=archive.read(entry);entries+=1
            if any(n in raw for n in needles):apkHits.append(entry.filename)
result={'status':'PASS' if not hits and not staged and not apkHits and entries else 'FAIL','secretMatchFiles':hits,'stagedFiles':staged,'filesInspected':len(manifest),'apkEntriesInspected':entries,'apkSecretMatchEntries':apkHits,'scope':'Exact known runtime/test/service passwords, credentials, private PEM and JWT patterns in deliverables; exact known secrets in decompressed debug APK entries. Not a universal secret audit. Other build/cache excluded.'}
(OUT/'final-boundary-and-secrets.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
(OUT/'file-manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
print(json.dumps(result));raise SystemExit(result['status']!='PASS')
