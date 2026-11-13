"""Read-only protected boundary snapshot; evidence stays inside mobile."""
from pathlib import Path
import argparse,datetime,hashlib,json,os,subprocess
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'mobile/docs/evidence/phases-5a-5b-5c'
def snapshot():
    files={};directories={}
    skip={'.git','mobile','node_modules','target','build','.dart_tool','.gradle','__pycache__','.idea'}
    for folder,children,leaves in os.walk(ROOT):
        children[:]=sorted(n for n in children if n not in skip)
        directories[Path(folder).relative_to(ROOT).as_posix()]=children+sorted(leaves)
        for name in leaves:
            p=Path(folder)/name;s=p.stat()
            files[p.relative_to(ROOT).as_posix()]={'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'size':s.st_size,'mtimeNs':s.st_mtime_ns}
    external={}
    for base in [ROOT.parent/'.secrets/bakery-platform',ROOT.parent/'.runtime/bakery-mobile-phases-1-4']:
        if not base.exists():continue
        for folder,children,leaves in os.walk(base):
            children[:]=[n for n in children if n not in skip|{'browser-profile','cache','.m2'}]
            for name in leaves:
                p=Path(folder)/name
                if p.suffix.lower() in {'.env','.json','.yml','.yaml','.pem','.properties'}:
                    s=p.stat();external[str(p)]={'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'size':s.st_size,'mtimeNs':s.st_mtime_ns}
    def git(*args):return subprocess.check_output(['git',*args],cwd=ROOT,text=True).strip()
    return {'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'files':files,'directories':directories,'external':external,'git':{'head':git('rev-parse','HEAD'),'branch':git('branch','--show-current'),'status':git('status','--short'),'staged':git('diff','--cached','--name-only')}}
if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('mode',choices=['baseline','verify']);args=parser.parse_args()
    OUT.mkdir(parents=True,exist_ok=True);target=OUT/'protected-baseline.json';current=snapshot()
    if args.mode=='baseline':
        if target.exists():raise SystemExit('Baseline already exists; refusing overwrite')
        target.write_text(json.dumps(current,indent=2),encoding='utf-8')
        print(json.dumps({'protectedFiles':len(current['files']),'externalConfigFiles':len(current['external']),'git':current['git']}))
    else:
        old=json.loads(target.read_text());result={}
        for field in ['files','directories','external']:
            result[field+'Changed']=[p for p in set(old[field])|set(current[field]) if old[field].get(p)!=current[field].get(p)]
        result['headUnchanged']=old['git']['head']==current['git']['head'];result['staged']=current['git']['staged']
        result['diffCheckExitCode']=subprocess.run(['git','diff','--check'],cwd=ROOT,capture_output=True).returncode
        result['result']='PASS' if not any([result['filesChanged'],result['directoriesChanged'],result['externalChanged'],result['staged'],result['diffCheckExitCode'],not result['headUnchanged']]) else 'FAIL'
        (OUT/'protected-final.json').write_text(json.dumps(result,indent=2),encoding='utf-8');print(json.dumps(result));raise SystemExit(result['result']!='PASS')
