"""Regenerate operation counts from sanitized evidence, never response payloads."""
from pathlib import Path
import json,re
MOBILE=Path(__file__).resolve().parents[1];OUT=MOBILE/'docs/evidence/phases-5a-5b-5c'
inventory=json.loads((OUT/'api-inventory.json').read_text());rows=inventory['operations'];events=[]
patterns=['http-probe*.json','compatible-live-flows.json','additional-probe*.json','storage-history-diagnostic*.json','persistence-after-restart.json','android-ui*.json','session-cold-restore.json','session-final-logout.json']
for pattern in patterns:
    for p in OUT.glob(pattern):
        value=json.loads(p.read_text(encoding='utf-8-sig'))
        for e in value.get('events',[]):
            if 'path' in e and 'method' in e:events.append({**e,'evidence':p.name,'ui':e.get('layer')=='ANDROID_UI' or p.name.startswith('android-ui')})
def matching(row):
    pattern='^'+re.sub(r'\{[^}]+\}',r'[^/]+',row['route'])+'$'
    return [e for e in events if e['method']==row['method'] and re.match(pattern,e['path'].split('?')[0]) and (not e.get('service') or e['service']==row['domain'])]
for row in rows:
    observed=matching(row);row['httpStatuses']=sorted(set(e['status'] for e in observed))
    row['http2xx']=any(200<=e['status']<300 for e in observed)
    row['android2xx']=any(e['ui'] and 200<=e['status']<300 for e in observed)
    row['androidAttempted']=any(e['ui'] for e in observed)
    row['evidenceFiles']=sorted(set(e['evidence'] for e in observed))
    row['uiWired']=row['inScope'] and not (row['route'].endswith('/accept') or row['route'].endswith('/direct'))
counts={d:{'discovered':sum(r['domain']==d for r in rows),'inScope':sum(r['domain']==d and r['inScope'] for r in rows),'adapter':sum(r['domain']==d and r['adapterImplemented'] for r in rows),'uiWired':sum(r['domain']==d and r['uiWired'] for r in rows),'http2xx':sum(r['domain']==d and r['http2xx'] for r in rows),'android2xx':sum(r['domain']==d and r['android2xx'] for r in rows)} for d in ['marketplace','order','chat']}
(OUT/'integration-summary.json').write_text(json.dumps({'countingRule':inventory['countingRule'],'counts':counts,'operations':rows},indent=2),encoding='utf-8')
text='''# Ma trận tích hợp API Mobile — Phases 5A, 5B, 5C

Ngày xác minh: 08/11/2026. Đếm theo **microservice + HTTP method + route công khai chuẩn hóa**; không đếm internal call, storage download hoặc số lần gọi lặp. “Adapter” nghĩa là đã có phương thức trong repository Flutter, không đồng nghĩa workflow hoạt động hoàn chỉnh. “Nối UI” là có đường gọi từ UI đang triển khai; accept/direct chỉ có adapter và màn bị khóa vì thiếu hợp đồng địa chỉ. “Android 2xx” yêu cầu event từ NativeTransport của UI thật, không dùng unit/widget test thay thế.

Evidence cũ trên topology canonical vẫn chứng minh các RFQ operation đã trả 2xx; các lỗi membership/binary cũ đã được phân biệt với topology Mobile tương thích hiện tại. Toàn bộ source endpoint được đối chiếu live OpenAPI; không coi OpenAPI 200 là kiểm chứng nghiệp vụ.

## Thống kê

| Microservice | Phát hiện | Trong phạm vi / adapter | Nối UI | HTTP có 2xx | Android có 2xx |
|---|---:|---:|---:|---:|---:|
'''
for d,c in counts.items():text+=f"| {d} | {c['discovered']} | {c['adapter']} | {c['uiWired']} | {c['http2xx']} | {c['android2xx']} |\n"
text+='''
Mỗi request dùng JWT người dùng; vai trò, ownership, membership và participant được Backend kiểm tra. Mobile không gọi endpoint internal. Idempotency key tường minh dành cho accept/direct; Chat dùng `clientMessageId` và multipart metadata JSON. Không tự retry POST khi chưa xác định kết quả.

## Các operation và kết quả

'''
for domain in ['marketplace','order','chat']:
    text+=f'### {domain}\n\n| Method và route | Adapter / UI | HTTP quan sát | Android 2xx | Kết quả, giới hạn |\n|---|---|---|---|---|\n'
    for r in [r for r in rows if r['domain']==domain]:
        note='Đã kiểm chứng thao tác' if r['android2xx'] else 'Chưa chứng minh thành công qua Android'
        if not r['inScope']:note='OUT_OF_SCOPE — AI selected-design hoặc Review/Admin Review'
        elif r['route'].endswith('/accept') or r['route'].endswith('/direct'):note='BLOCKED_BACKEND — chưa có API công khai chọn địa chỉ; không gửi UUID bịa'
        elif '/cake-requests/' in r['route'] and '/images' in r['route']:note='BLOCKED_ENVIRONMENT — Firebase chưa cấu hình; upload 503, không có image hợp lệ để kiểm chứng delete'
        elif r['domain']=='chat' and r['method']=='GET' and r['route'].endswith('/messages'):note='BLOCKED_BACKEND — history 403, SQLState 42P18 với cả first page và cursor hợp lệ'
        elif r['domain']=='chat' and r['route'].endswith('/read'):note='HTTP 200; UI chưa đi tới read vì history bị lỗi'
        elif r['domain']=='order' and r['route']!='/api/v1/orders':note='NOT_VERIFIED — chưa tạo được Order hợp lệ để mở detail/chuyển state'
        elif r['domain']=='chat' and r['route'].endswith('/messages') and r['method']=='POST':note='TEXT/IMAGE 201; replay 200 cùng ID. Download public bị chặn bởi hostname Docker'
        text+=f"| `{r['method']} {r['route']}` | {'Có' if r['adapterImplemented'] else 'Không'} / {'Có' if r['uiWired'] else 'Không'} | {', '.join(map(str,r['httpStatuses'])) or 'Chưa gọi'} | {'Có' if r['android2xx'] else 'Không'} | {note} |\n"
    text+='\n'
text+='''## Hợp đồng request, response và nguồn

Chi tiết schema đầy đủ được giữ nguyên trong các OpenAPI công khai đã lấy từ runtime. Các link dưới đây tới controller và schema, không chứa response business hoặc credential. Query không được “sáng tạo” từ UI; danh sách dùng page/size/filter/scope theo controller; Chat history dùng `before` + `limit`, response `items` + `nextCursor` + `hasMore`.

'''
for r in rows:
    text+=f"- `{r['domain']} {r['method']} {r['route']}`: [controller, dòng {r['line']}](../../{r['controller']}#L{r['line']}); DTO: {', '.join('`'+d+'`' for d in r['dtoNames']) or 'Không có body DTO'}. [OpenAPI](evidence/phases-5a-5b-5c/{r['contractEvidence']}).\n"
text+='''
## Điều kiện và đối chiếu nghiệp vụ

| Nhóm | Request và validation chính | Response / state / lỗi |
|---|---|---|
| RFQ | `OPEN_CUSTOM` hoặc `TARGETED_PRODUCT_CUSTOM`; title ≤180, description ≤10000, neededAt tương lai, deliveryCity/deliveryDistrict; budget không âm, khoảng min/max hợp lệ; targeted lấy bakery/product/option UUID thật | ID server, preference/images/options snapshot; DRAFT mới được sửa/ảnh; publish → OPEN; cancel theo Backend. Không thay lỗi eligibility thành danh sách rỗng |
| Offer | bakeryId đã xác minh membership; cakePrice/deliveryFee/item giá hợp lệ; estimatedCompletionAt/expiresAt có timezone và tương lai; RFQ còn mở/đủ điều kiện | Giá tổng Backend là nguồn chính; PENDING và chưa hết hạn mới sửa/rút; duplicate gửi lại bị 409; withdraw → WITHDRAWN |
| Accept | addressId thực + delivery note/time theo DTO; key ổn định cho một ý định | Marketplace điều phối Order qua internal service; không dùng Cart/direct để thay thế. UI khóa vì không có public address API; chưa kiểm chứng distributed recovery |
| Direct Order | productId, quantity, option/add-on UUID thật; addressId, thời gian và ghi chú; key ổn định | Cart chỉ tạm tính bằng số nguyên tiền lẻ; revalidate catalog; server quyết định snapshot/giá. Chưa POST direct vì thiếu địa chỉ được cấp quyền |
| Order management | scope mine/bakery, bakeryId thật; status-transitions gửi targetStatus/reason | PENDING→CONFIRMED/CANCELLED; CONFIRMED→BAKING/CANCELLED; BAKING→READY→DELIVERING→COMPLETED. Customer chỉ hủy ở trạng thái Backend cho phép; Backend xét quyền cuối cùng |
| Chat | conversation từ RFQ/bakery đúng context; Customer tạo/lấy, Owner tìm existing authorized conversation. Multipart metadata + tối đa 5 file ×10 MiB JPEG/PNG/WEBP/PDF | Server message ID/clientMessageId; cursor merge/dedupe; own-delete tombstone; closed khóa gửi mới. Giữ logical ID/payload khi chưa rõ kết quả; pending chỉ tồn tại qua navigation cùng phiên |

## Bằng chứng và giới hạn

- [Số đếm có thể tái tạo](evidence/phases-5a-5b-5c/integration-summary.json); chạy `python -B tool/phase5_matrix.py` từ `mobile`.
- Native test thực hiện bằng màn hình/repository/transport thật; hook chỉ điều hướng và đọc event method/path/status/ID/state. Session test dùng namespace riêng, không đọc secure session mặc định.
- HTTP host kiểm chứng read-state 200; Android chưa kiểm chứng read-state/pagination thành công vì lỗi history. Unit/widget test chỉ chứng minh hành vi client với test doubles.
- Host dùng connection override giữ nguyên signed Host để chẩn đoán storage: không phải cách sửa ứng dụng và không tính là Mobile download thành công.
- Các event âm 400/403/404/409/503 được lưu để đối chiếu; không cộng vào API đã xác minh thành công. Không claim 100% coverage hoặc Order/Chat end-to-end hoàn chỉnh.
'''
(MOBILE/'docs/API_INTEGRATION_MATRIX_PHASES_5A_5B_5C_VI.md').write_text(text,encoding='utf-8')
print(json.dumps(counts),flush=True)
