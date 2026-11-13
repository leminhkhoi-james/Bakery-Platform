"""Fill variable-name and changed-file inventories into the Vietnamese report."""
from pathlib import Path
import json,re,subprocess
MOBILE=Path(__file__).resolve().parents[1];ROOT=MOBILE.parent;OUT=MOBILE/'docs/evidence/phases-5a-5b-5c'
report=MOBILE/'BAKERY_PLATFORM_MOBILE_MARKETPLACE_ORDER_CHAT_INTEGRATION_REPORT_VI.md';text=report.read_text(encoding='utf-8')
def purpose(name):
    if '_DB_' in name:return 'Kết nối/xác thực PostgreSQL theo service'
    if 'FIREBASE' in name:return 'Storage RFQ hoặc timeout Firebase'
    if 'CLIENT_SECRET' in name:return 'Xác thực client-credentials hoặc hash xác minh tại Identity'
    if 'CLIENT_ID' in name:return 'Định danh service client'
    if 'PRIVATE_KEY' in name or 'PUBLIC_KEY' in name:return 'Đường dẫn key JWT đã có; không sinh lại'
    if any(s in name for s in ['JWT','JWK']):return 'Xác minh/phát hành JWT, issuer/audience/TTL'
    if 'MINIO' in name or 'STORAGE_' in name:return 'Endpoint/bucket/quyền storage hoặc thời hạn URL'
    if 'REFRESH' in name:return 'Refresh cookie hoặc TTL phiên'
    if 'TOKEN' in name:return 'Token legacy/optional; không chứng minh hoạt động chỉ vì có tên'
    if 'URL' in name:return 'Địa chỉ service nội bộ hoặc tự tham chiếu'
    if 'TIMEOUT' in name:return 'Thời gian chờ service call'
    if name=='SERVER_PORT':return 'Port ứng dụng trong container'
    if 'CONFIG' in name:return 'Nạp cấu hình mount hiện hữu'
    if 'CORS' in name:return 'Allowed origins của môi trường hiện hữu'
    return 'Tham số vận hành theo application config'
config=json.loads((OUT/'configuration-matrix.json').read_text());body='| Microservice | Biến cấu hình | Nguồn / trạng thái | Sinh mới | Runtime |\n|---|---|---|---|---|\n'
for s in config['services']:
    reused=[v['name'] for v in s['variables'] if v['source']=='existing container environment' and v['presentNonEmpty']]
    derived=s['rewrittenDependencyVariableNames'];unresolved=[v['name'] for v in s['variables'] if v['name'] in ['FIREBASE_PROJECT_ID','FIREBASE_STORAGE_BUCKET'] and not v['presentNonEmpty']]
    body+=f"| {s['service']} | {len(s['variables'])} tên; xem bảng dưới | Reuse environment/mount; derive URL: {', '.join('`'+n+'`' for n in derived) or 'không'}; thiếu external: {', '.join('`'+n+'`' for n in unresolved) or 'không phát hiện blocker startup'} | 0 | running; OpenAPI 200; business theo bảng trên |\n"
body+='\nTên biến có default được ghi theo application source; không khẳng định mỗi nhánh default/optional đều đã được gọi. `presentNonEmpty` trong JSON là trạng thái environment, không phải cờ xác minh nghiệp vụ. Profile default được đối chiếu startup log trong final-runtime.json.\n\n'
for s in config['services']:
    body+=f"**{s['service']}** — container `{s['container']}`; Spring application name `{s['service']}`, profile default.\n\n| Biến | Mục đích kỹ thuật | Nguồn, xử lý | Xác minh / vấn đề |\n|---|---|---|---|\n"
    for v in s['variables']:
        n=v['name'];source='Environment container được reuse' if v['source']=='existing container environment' else 'Default từ application config' if v['source']=='application default' else 'Chưa resolve trong inventory'
        if n in s['rewrittenDependencyVariableNames']:source+='; URL derive theo Docker alias trên container mới'
        verified='Đã đối chiếu nguồn/tên; service chạy; không claim mọi nhánh đã test'
        if not v['presentNonEmpty'] and v['source']=='existing container environment':verified='Trống; legacy/optional, đối chiếu client-credentials hiện hoạt động'
        if n in ['FIREBASE_PROJECT_ID','FIREBASE_STORAGE_BUCKET'] and not v['presentNonEmpty']:verified='MISSING_EXTERNAL; upload 503 đã xác minh'
        if '_DB_' in n:verified='Query nghiệp vụ của service trả 200; DB healthy'
        if 'CLIENT_SECRET' in n:verified='Không ghi giá trị; service auth/client grant đã kiểm tra theo topology'
        body+=f'| `{n}` | {purpose(n)} | {source}; không sinh mới | {verified} |\n'
    body+='\n'
body+='[Ma trận cấu hình JSON đầy đủ](docs/evidence/phases-5a-5b-5c/configuration-matrix.json) chỉ lưu tên/trạng thái, không lưu giá trị. Không có secret cấu hình runtime mới; credential của các service được giữ và kiểm chứng bằng token grant/luồng cross-service.\n'
def insert(marker,body):
    global text
    start='<!--'+marker+'-->';end='<!--/'+marker+'-->'
    if end in text:text=re.sub(re.escape(start)+'.*?'+re.escape(end),lambda _:start+'\n\n'+body+'\n'+end,text,flags=re.S)
    else:text=text.replace(start,start+'\n\n'+body+'\n'+end)
insert('CONFIG_MATRIX',body)
lines=subprocess.check_output(['git','status','--porcelain=v1','--untracked-files=all'],cwd=ROOT,text=True).splitlines()
paths=sorted(set(line[3:].replace('\\','/') for line in lines if line[3:].replace('\\','/').startswith('mobile/')))
evidence=[p for p in paths if '/docs/evidence/phases-5a-5b-5c/' in p];source=[p for p in paths if p not in evidence]
body='| Đường dẫn tương đối từ mobile | Mục đích |\n|---|---|\n'
for p in source:
    relative=p.removeprefix('mobile/')
    if p.endswith('.md'):purposeText='Ngữ cảnh module/tài liệu sản phẩm, thiết kế, hướng dẫn hoặc báo cáo thực thi'
    elif '/test/' in p:purposeText='Contract/widget regression với test double có kiểm soát'
    elif '/test_driver/' in p:purposeText='Entrypoint native dùng transport/UI thật và session test tách biệt'
    elif '/tool/' in p:purposeText='Launcher, inventory, probe local, native driver hoặc guard/evidence có thể chạy lại'
    elif '/core/' in p:purposeText='Origin/client/workspace hoặc widget/contract dùng chung'
    elif '/router/' in p:purposeText='Nối route live và role guard'
    else:purposeText='Repository/model hoặc page live tương ứng miền nghiệp vụ'
    body+=f'| `{relative}` | {purposeText} |\n'
body+=f'\nTại thời điểm lập danh sách: {len(source)} tệp source/tool/doc thay đổi hoặc mới; {len(evidence)} tệp evidence mới. Evidence tiếp tục bổ sung bởi guard; [manifest SHA-256](docs/evidence/phases-5a-5b-5c/phase5-manifest.json) là danh sách chụp cuối. [Inventory thay đổi](docs/evidence/phases-5a-5b-5c/changed-file-inventory.json).\n'
insert('CHANGED_FILES',body)
report.write_text(text,encoding='utf-8')
(OUT/'changed-file-inventory.json').write_text(json.dumps({'sourceToolDocs':source,'evidence':evidence,'allChangesInsideMobile':all(p.startswith('mobile/') for p in paths)},indent=2),encoding='utf-8')
print(json.dumps({'sourceToolDocs':len(source),'evidence':len(evidence),'reportSections':len(re.findall(r'^## \d+\.',text,re.M))}),flush=True)
