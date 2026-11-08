"""Build exact source outside repository after loss of transient runtime artifacts."""
from pathlib import Path
import shutil,subprocess,json,hashlib
ROOT=Path(__file__).resolve().parents[2]
DEST=Path('H:/MSS/.runtime/bakery-mobile-phases-1-4')
SOURCE=DEST/'source/backend'
shutil.copytree(ROOT/'backend',SOURCE,dirs_exist_ok=True,ignore=shutil.ignore_patterns('target','.git','.env*','*.log'))
manifest={p.relative_to(ROOT/'backend').as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in (ROOT/'backend').rglob('*') if p.is_file() and 'target' not in p.parts and not p.name.startswith('.env')}
(DEST/'source-manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
with (DEST/'build.log').open('w',encoding='utf-8') as log:
    result=subprocess.run([str(SOURCE/'mvnw.cmd'),'-o','-pl','identity-service,bakery-service,subscription-service','-am','-DskipTests','package'],cwd=SOURCE,stdout=log,stderr=subprocess.STDOUT)
if result.returncode:raise SystemExit('External Maven build failed; inspect private runtime build.log (no source changed).')
for name in ['identity-service','bakery-service','subscription-service']:
    jar=next((SOURCE/name/'target').glob('*-exec.jar'))
    shutil.copyfile(jar,DEST/'jars'/(name+'.jar'))
print('Built 3 exact-source JARs on H:; no tests rerun, original backend unchanged.')
