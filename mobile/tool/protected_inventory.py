"""Bảo vệ first-party ngoài mobile, kể cả docs untracked từ audit trước."""
from pathlib import Path
import hashlib,json,os,subprocess,sys,time
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'mobile/docs/evidence/api-integration-phases-1-4';OUT.mkdir(parents=True,exist_ok=True)
BASE=OUT/'protected-baseline.json'
SKIP={'.git','mobile','node_modules','target','build','.dart_tool','.gradle','__pycache__','.idea'}
def scan():
    files={};dirs={};errors=[]
    for folder,children,leaves in os.walk(ROOT,followlinks=False):
        children[:]=sorted(x for x in children if x not in SKIP)
        rel=Path(folder).relative_to(ROOT).as_posix();dirs[rel]=children+sorted(leaves)
        for name in leaves:
            p=Path(folder)/name;key=p.relative_to(ROOT).as_posix()
            try:
                raw=p.read_bytes();s=p.stat();files[key]={'sha256':hashlib.sha256(raw).hexdigest(),'size':s.st_size,'mtimeNs':s.st_mtime_ns}
            except OSError as e:errors.append({'path':key,'error':type(e).__name__})
    return {'files':files,'directories':dirs,'readErrors':errors}
start=time.monotonic();current=scan()
git={'branch':subprocess.check_output(['git','branch','--show-current'],cwd=ROOT,text=True).strip(),'head':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'status':subprocess.check_output(['git','status','--porcelain=v1','-uall'],cwd=ROOT,text=True)}
if '--verify' not in sys.argv:
    if BASE.exists():raise SystemExit('Baseline đã tồn tại, không ghi đè.')
    current.update(git);BASE.write_text(json.dumps(current,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps({'files':len(current['files']),'directories':len(current['directories']),'readErrors':current['readErrors'],'branch':git['branch'],'head':git['head'],'seconds':round(time.monotonic()-start,2)}))
else:
    before=json.loads(BASE.read_text(encoding='utf-8'))
    changes=[p for p in set(before['files'])|set(current['files']) if before['files'].get(p)!=current['files'].get(p)]
    dirs=[p for p in set(before['directories'])|set(current['directories']) if before['directories'].get(p)!=current['directories'].get(p)]
    result={'status':'PASS' if not changes and not dirs and not current['readErrors'] else 'FAIL','filesChecked':len(current['files']),'changedFiles':changes,'changedDirectories':dirs,'readErrors':current['readErrors'],'initialGitStatus':before['status'],'finalGitStatus':git['status'],'baselineHead':before['head'],'currentHead':git['head'],'seconds':round(time.monotonic()-start,2)}
    (OUT/'protected-integrity.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps({k:v for k,v in result.items() if 'GitStatus' not in k}));raise SystemExit(result['status']!='PASS')
