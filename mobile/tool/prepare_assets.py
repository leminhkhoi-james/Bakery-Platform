"""Chuẩn bị asset local từ artwork/reference Web; không có download lúc chạy app."""
from pathlib import Path
import requests,re,json,hashlib,shutil,concurrent.futures
ROOT=Path(__file__).resolve().parents[2];M=ROOT/'mobile';records=[]
for source,name in [('frontend/src/assets/brand-logo.png','brand_logo.png'),('frontend/public/cat-logo-transparent.png','cat_mascot.png'),('frontend/public/images/fairy-bg.jpg','fairy_background.jpg')]:
    target=M/'assets/images'/name;target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(ROOT/source,target)
    records.append({'asset':target.relative_to(M).as_posix(),'source':source,'rights':'Artwork có sẵn của dự án, dùng lại nội bộ theo yêu cầu; cần xác nhận quyền phát hành trước release.'})
for family,target in [('plusjakartasans','PlusJakartaSans.ttf'),('dancingscript','DancingScript.ttf')]:
    info=requests.get('https://api.github.com/repos/google/fonts/contents/ofl/'+family,timeout=30);info.raise_for_status()
    entry=next(x for x in info.json() if x['name'].endswith('.ttf') and 'Italic' not in x['name'])
    b=requests.get(entry['download_url'],timeout=30);b.raise_for_status();p=M/'assets/fonts'/target;p.write_bytes(b.content)
    license=requests.get('https://raw.githubusercontent.com/google/fonts/main/ofl/'+family+'/OFL.txt',timeout=30);license.raise_for_status();(M/'assets/fonts'/(family+'-OFL.txt')).write_text(license.text,encoding='utf-8')
    records.append({'asset':p.relative_to(M).as_posix(),'source':entry['download_url'],'gitBlob':entry['sha'],'rights':'SIL OFL 1.1, license đi kèm, font nguyên bản không chỉnh sửa.'})
urls=re.findall(r'"image"\s*:\s*"(https://lh3.googleusercontent.com/aida-public/[^\"]+)"',(ROOT/'frontend/src/mockData/customer/cakes.js').read_text(encoding='utf-8'))[:8]
def photo(pair):
    i,url=pair;p=M/'assets/demo'/f'cake_{i:02d}.jpg';p.parent.mkdir(exist_ok=True)
    r=requests.get(url,timeout=30);r.raise_for_status()
    if not r.headers.get('Content-Type','').startswith('image/'):raise RuntimeError('Không phải ảnh reference')
    p.write_bytes(r.content)
    return {'asset':p.relative_to(M).as_posix(),'source':url,'referenceFile':'frontend/src/mockData/customer/cakes.js','rights':'Cùng ảnh minh họa có sẵn trong Web mock; không coi là sản phẩm thật hay license phát hành đã xác minh.'}
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:records+=list(pool.map(photo,enumerate(urls,1)))
for x in records:
    p=M/x['asset'];x['bytes']=p.stat().st_size;x['sha256']=hashlib.sha256(p.read_bytes()).hexdigest()
(ROOT/'mobile/docs/demo-preview/evidence/assets.json').write_text(json.dumps(records,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'localAssets':len(records),'photos':len(urls),'fontDownloadsAtRuntime':False}))
