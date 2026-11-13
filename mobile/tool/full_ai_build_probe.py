"""Build unchanged source in mobile cache; never writes backend/target or raw logs."""
import hashlib,shutil,subprocess,time
from full_common import ROOT,MOBILE,save
cache=MOBILE/'.dart_tool/full-ai-source-probe';cache.mkdir(parents=True,exist_ok=True)
copied={}
for p in (ROOT/'backend').glob('*/pom.xml'):
    dest=cache/p.relative_to(ROOT/'backend');dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(p,dest)
for module in ['', 'platform-support','cake-ai-service']:
    source=ROOT/'backend'/module;target=cache/module;target.mkdir(parents=True,exist_ok=True)
    files=[source/'pom.xml']
    if module: files+=list((source/'src').rglob('*'))
    for p in files:
        if not p.is_file():continue
        relative=p.relative_to(ROOT/'backend');dest=cache/relative;dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(p,dest)
        copied[relative.as_posix()]=hashlib.sha256(p.read_bytes()).hexdigest()
started=time.monotonic()
p=subprocess.run([shutil.which('mvn'),'--batch-mode','-f',str(cache/'pom.xml'),'-pl','cake-ai-service','-am','-DskipTests','compile'],capture_output=True,text=True,encoding='utf-8',errors='replace',timeout=600)
raw=p.stdout+p.stderr
signals=[line for line in raw.splitlines() if ('[ERROR]' in line and any(x in line for x in ['package com.google','cannot find symbol','cake-ai-service','BUILD FAILURE']))]
save('test-results/cake-ai-unchanged-source-build.json',{'command':'mvn --batch-mode -f mobile/.dart_tool/full-ai-source-probe/pom.xml -pl cake-ai-service -am -DskipTests compile','exitCode':p.returncode,'seconds':round(time.monotonic()-started,2),'copiedSourceHashes':copied,'sanitizedCompilerSignals':signals[:35],'backendSourceModified':False})
print({'exitCode':p.returncode,'signals':signals[:12]})
