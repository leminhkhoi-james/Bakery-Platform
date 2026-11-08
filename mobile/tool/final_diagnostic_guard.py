"""Final protected-file, external-config and known-secret verification; no values printed."""
from pathlib import Path
import hashlib,json,os,re,subprocess,zipfile
ROOT=Path(__file__).resolve().parents[2];MOBILE=ROOT/'mobile';OUT=MOBILE/'docs/evidence/docker-api-diagnostic'
baseline=json.loads((OUT/'protected-baseline.json').read_text());files={};directories={}
skip={'.git','mobile','node_modules','target','build','.dart_tool','.gradle','__pycache__','.idea'}
for folder,children,leaves in os.walk(ROOT):
 children[:]=sorted(d for d in children if d not in skip);directories[Path(folder).relative_to(ROOT).as_posix()]=children+sorted(leaves)
 for name in leaves:
  p=Path(folder)/name;s=p.stat();files[p.relative_to(ROOT).as_posix()]={'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'size':s.st_size,'mtimeNs':s.st_mtime_ns}
changed=[p for p in set(files)|set(baseline['files']) if files.get(p)!=baseline['files'].get(p)]
directoryChanges=[p for p in set(directories)|set(baseline['directories']) if directories.get(p)!=baseline['directories'].get(p)]
external=json.loads((OUT/'external-before-rehearsal.json').read_text());externalChanges=[]
for name,old in external.items():
 p=Path(name)
 if not p.is_file():externalChanges.append(name);continue
 s=p.stat();now={'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'size':s.st_size,'mtimeNs':s.st_mtime_ns}
 if now!=old:externalChanges.append(name)
known=[]
for p in [ROOT.parent/'.secrets/bakery-platform/local-smoke-users.json',ROOT.parent/'.runtime/bakery-mobile-phases-1-4/mobile-live-user.json',ROOT.parent/'.runtime/bakery-mobile-phases-1-4/runtime-generated.json']:
 if p.is_file():
  data=json.loads(p.read_text(encoding='utf-8-sig'));known.extend(v for k,v in data.items() if isinstance(v,str) and ('password' in k.lower() or k in ['storageAccess','storageSecret']))
compose=ROOT.parent/'.runtime/bakery-mobile-phases-1-4/compose.json'
for service in json.loads(compose.read_text())['services'].values():known.extend(v for k,v in service.get('environment',{}).items() if isinstance(v,str) and re.search('PASSWORD|SECRET|TOKEN',k))
privateKey=ROOT.parent/'.secrets/bakery-platform/identity-private.pem'
if privateKey.exists():known.append(privateKey.read_text().strip())
needles=[v.encode() for v in known if len(v)>=12];hits=[];manifest=[]
for folder,dirs,leaves in os.walk(MOBILE):
 dirs[:]=[d for d in dirs if d not in {'build','.dart_tool','.gradle','.idea','__pycache__'}]
 for name in leaves:
  p=Path(folder)/name;raw=p.read_bytes();relative=p.relative_to(MOBILE).as_posix()
  if any(n in raw for n in needles):hits.append(relative)
  elif p.suffix in ['.dart','.py','.ps1','.json','.md','.log','.txt','.yaml','.yml','.xml'] and re.search(rb'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.',raw):hits.append(relative)
  if name not in ['final-verification.json','diagnostic-manifest.json']:manifest.append({'path':relative,'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest()})
apk=MOBILE/'build/app/outputs/flutter-apk/app-debug.apk';apkHits=[];entryCount=0
with zipfile.ZipFile(apk) as archive:
 for entry in archive.infolist():
  if entry.is_dir():continue
  entryCount+=1
  if any(n in archive.read(entry) for n in needles):apkHits.append(entry.filename)
head=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip()
staged=subprocess.check_output(['git','diff','--cached','--name-only'],cwd=ROOT,text=True).splitlines()
diff=subprocess.run(['git','diff','--check'],cwd=ROOT,capture_output=True)
missing=[]
for p in [MOBILE/'README.md',MOBILE/'docs/BAKERY_MOBILE_DOCKER_API_CONNECTION_DIAGNOSTIC_VI.md',MOBILE/'docs/CURRENT_API_REGRESSION_DIAGNOSTIC_VI.md']:
 for link in re.findall(r'\]\(([^)]+)\)',p.read_text(encoding='utf-8')):
  target=link.split('#')[0]
  if target and '://' not in target and not (p.parent/target).exists():missing.append({'file':p.name,'target':target})
for p in (MOBILE/'tool').glob('*.py'):compile(p.read_bytes(),str(p),'exec')
result={'result':'PASS' if not any([changed,directoryChanges,externalChanges,hits,apkHits,staged,missing,diff.returncode]) and head==baseline['git']['head'] else 'FAIL','protectedFiles':len(files),'changedProtectedFiles':changed,'changedProtectedDirectories':directoryChanges,'externalConfigChangesSincePreRehearsal':externalChanges,'head':head,'headUnchanged':head==baseline['git']['head'],'stagedFiles':staged,'gitDiffCheckExitCode':diff.returncode,'knownSecretMatchFiles':hits,'apkEntriesScanned':entryCount,'apkSecretMatchEntries':apkHits,'apkSha256':hashlib.sha256(apk.read_bytes()).hexdigest(),'missingDocumentationLinks':missing,'pythonSyntax':'PASS','limitations':'Exact known secrets/pattern scan, not universal audit. Does not scan or erase chat/tool outputs. A default flutter-drive cleanup previously uninstalled app; old Android app-data preservation is not claimed.'}
(OUT/'final-verification.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
(OUT/'diagnostic-manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
print(json.dumps(result),flush=True);raise SystemExit(result['result']!='PASS')
