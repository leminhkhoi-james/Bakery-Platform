"""Index native captures with hashes and explicitly qualified event correlation."""
import collections,datetime,hashlib,json,re
from PIL import Image,ImageStat
from full_common import DOCS,OUT,RUN,save

def utc(x):return datetime.datetime.fromisoformat(x.replace('Z','+00:00'))
coverage=json.loads((OUT/'api-coverage.json').read_text())['operations']
fixture=json.loads((OUT/'fixture-manifest.json').read_text())
# Only non-sensitive role IDs, not credentials, are used for timeline labeling.
from full_common import ROOT
users=json.loads((ROOT.parent/'.secrets/bakery-platform/local-smoke-users.json').read_text(encoding='utf-8-sig'))
roles={users[k]['id']:k.upper() for k in ['customer','owner','admin']}
roles[fixture['ownerId']]='CUSTOMER+BAKERY_OWNER (same Journey A user)'
events=[]
for p in (OUT/'sanitized-events').glob('*.json'):
    v=json.loads(p.read_text(encoding='utf-8-sig'));rows=v if isinstance(v,list) else v.get('events',[])
    events.extend({**e,'file':p.name} for e in rows if e.get('layer')=='ANDROID_UI' and e.get('at'))
events.sort(key=lambda e:e['at'])
def match(e,o):return e.get('method')==o['method'] and re.fullmatch(re.sub(r'\{[^}]+\}',r'[0-9a-fA-F-]{36}',o['path']),e.get('path','').split('?')[0])
rows=[]
for p in sorted((OUT/'screenshots').glob('*.png')):
    at=datetime.datetime.fromtimestamp(p.stat().st_mtime,datetime.timezone.utc)
    with Image.open(p) as im:
        im.load();size=im.size;std=sum(ImageStat.Stat(im.convert('RGB')).stddev)/3
    before=[e for e in events if utc(e['at'])<=at]
    actor='Guest / no captured authenticated state'
    for e in reversed(before):
        if e['path']=='/api/v1/auth/logout' and e['status']==200:break
        if e['path']=='/api/v1/auth/me' and e['status']==200:
            actor=next((roles[x] for x in e.get('ids',[]) if x in roles),'Authenticated synthetic actor (not mapped)');break
    diagnostic=any(x in p.name for x in ['failure','picker','inspection'])
    if 'normal-main' in p.name:actor='Normal app namespace not inspected; public Home/splash'
    if diagnostic:actor='Diagnostic; timeline actor not asserted'
    nearby=[e for e in before[-15:] if (at-utc(e['at'])).total_seconds()<=5]
    ids=sorted({o['id'] for e in nearby for o in coverage if o['applicable'] and match(e,o)})
    result='CAPTURED_CHECKPOINT'
    if diagnostic:result='DIAGNOSTIC_RETAINED'
    elif p.name in ['readme-normal-main-home.png','final-normal-main-home.png']:result='SPLASH_NOT_READY_RETAINED'
    elif p.name in ['remaining-admin-offer-readonly.png','remaining-ai-unavailable.png']:result='SUPERSEDED_UI_CAPTURE_RETAINED'
    elif any(x in p.name for x in ['blocked','unavailable','orders-empty']):result='BLOCKED_OR_EMPTY_NOT_BUSINESS_PASS'
    row={'path':str(p.relative_to(DOCS)).replace('\\','/'),'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'runId':RUN,'capturedAtUtc':at.isoformat(),'timestampSource':'Host file-write mtime, UTC; not device EXIF','actor':actor,'actorSource':'Latest successful GET auth/me or logout in native event timeline; diagnostic/normal captures explicitly qualified','scenarioStep':p.stem,'apiIdsNearCapture':ids,'eventFiles':sorted(set(e['file'] for e in nearby)),'resourceReferences':sorted(set(x for e in nearby for x in e.get('ids',[]))),'result':result,'width':size[0],'height':size[1],'decoded':True,'imageStd':round(std,3),'unalteredNativeCapture':True,'correlationLimit':'Five-second preceding event window is association, not proof every nearby API is visible in the image'}
    rows.append(row)
save('screenshots-index.json',rows)
lines=['# Chỉ mục ảnh và evidence thật','',f'Run `{RUN}`: **{len(rows)} PNG** nguyên bản trong `screenshots/`, tất cả giải mã được. Hash SHA-256 đầy đủ và resource/event metadata: [screenshots-index.json](evidence/{RUN}/screenshots-index.json). Thời điểm là mtime ghi file host UTC (giờ Việt Nam = UTC+7), không giả là EXIF từ thiết bị. Ảnh lỗi/picker/splash và UI đã sửa được giữ, không cộng thành test PASS.','','Actor suy từ GET me/logout gần nhất trong event timeline; capture diagnostic và normal app được ghi hạn chế riêng. Cột API liên quan lấy cửa sổ tối đa 5 giây trước capture; ảnh không chứng minh độc lập mọi API lân cận. JSON chứa resource ID công khai synthetic và đường dẫn event. Ảnh font1.3 đã kiểm tra riêng, fixed-light vẫn giữ khi OS night=yes; settings được phục hồi. Không dùng montage/mock/AI render làm evidence.','','| Ảnh / bước | UTC | Actor / context | API gần capture | Kết quả | SHA-256 |','|---|---|---|---|---|---|']
for r in rows:lines.append(f"| [{r['scenarioStep']}]({r['path']}) | {r['capturedAtUtc']} | {r['actor']} | {', '.join(r['apiIdsNearCapture']) or 'Không có event gần; xem scenario'} | {r['result']} | `{r['sha256']}` |")
lines+=['','Ảnh rút từ MP4 đặt riêng trong `evidence/'+RUN+'/video-frames/`, được đánh dấu derivative media trong video manifest; không cộng vào số screenshot native trên. Smoke video/ảnh của recorder nằm riêng trong `recorder-smoke/`, không tính acceptance.','','Bằng chứng chính: [inventory source](evidence/'+RUN+'/source-api-inventory.json), [API coverage](evidence/'+RUN+'/api-coverage.json), [fixture chain](evidence/'+RUN+'/fixture-manifest.json), [build driver](evidence/'+RUN+'/driver-build.json), [runtime](evidence/'+RUN+'/source-runtime-manifest.json), [gate](evidence/'+RUN+'/acceptance-gate.json). Các log đã che local debug endpoint; token/password không nằm trong payload event.']
(DOCS/'EVIDENCE_INDEX_VI.md').write_text('\n'.join(lines)+'\n',encoding='utf-8')
print({'nativePng':len(rows),'diagnosticOrSuperseded':sum(r['result'] in ['DIAGNOSTIC_RETAINED','SPLASH_NOT_READY_RETAINED','SUPERSEDED_UI_CAPTURE_RETAINED'] for r in rows)})
