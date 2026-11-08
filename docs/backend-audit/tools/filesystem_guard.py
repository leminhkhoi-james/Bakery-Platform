"""Baseline filesystem đầy đủ; không ghi vào ba cây ứng dụng được bảo vệ."""
from pathlib import Path
import hashlib, json, os, subprocess, sys, time

ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT/'docs/backend-audit/evidence'
OUT.mkdir(parents=True,exist_ok=True)
BASE = OUT/'filesystem-baseline.json'
def digest(path):
    h=hashlib.sha256()
    with path.open('rb') as f:
        for chunk in iter(lambda:f.read(2**20),b''): h.update(chunk)
    return h.hexdigest()
def scan():
    files,dirs,errors={},{},[]
    for tree in ['backend','frontend','mobile']:
        for folder,names,leaves in os.walk(ROOT/tree,followlinks=False):
            d=Path(folder); dirs[d.relative_to(ROOT).as_posix()]=sorted(names+leaves)
            for name in leaves:
                p=d/name; key=p.relative_to(ROOT).as_posix()
                try:
                    s=p.stat(); files[key]={'size':s.st_size,'mtime_ns':s.st_mtime_ns,'sha256':digest(p)}
                except OSError as e: errors.append({'path':key,'error':type(e).__name__})
    tracked=subprocess.check_output(['git','ls-files','-z'],cwd=ROOT).decode().split('\0')
    for key in tracked:
        if not key or key.startswith(('docs/','backend/','frontend/','mobile/')):continue
        p=ROOT/key
        if p.is_file():
            s=p.stat(); files[key]={'size':s.st_size,'mtime_ns':s.st_mtime_ns,'sha256':digest(p)}
    return {'files':files,'directories':dirs,'readErrors':errors}
start=time.monotonic()
if '--verify' not in sys.argv:
    if BASE.exists(): raise SystemExit('Baseline đã có; không ghi đè.')
    result=scan();result.update({'head':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'branch':subprocess.check_output(['git','branch','--show-current'],cwd=ROOT,text=True).strip(),'gitStatus':subprocess.check_output(['git','status','--porcelain=v1','-uall'],cwd=ROOT,text=True),'seconds':round(time.monotonic()-start,2)})
    BASE.write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps({'files':len(result['files']),'directories':len(result['directories']),'readErrors':result['readErrors'],'head':result['head'],'seconds':result['seconds']}))
else:
    old=json.loads(BASE.read_text(encoding='utf-8'));current=scan()
    changes=[p for p in set(old['files'])|set(current['files']) if old['files'].get(p)!=current['files'].get(p)]
    directory_changes=[p for p in set(old['directories'])|set(current['directories']) if old['directories'].get(p)!=current['directories'].get(p)]
    status=subprocess.check_output(['git','status','--porcelain=v1','-uall'],cwd=ROOT,text=True)
    result={'changedProtectedFiles':changes,'changedProtectedDirectories':directory_changes,'readErrors':current['readErrors'],'filesChecked':len(current['files']),'gitStatusAfter':status,'seconds':round(time.monotonic()-start,2)}
    (OUT/'filesystem-integrity.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps(result,ensure_ascii=False))
    if changes or directory_changes or current['readErrors']:sys.exit(1)
