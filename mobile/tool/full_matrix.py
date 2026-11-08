"""Stable source inventory + explicitly reviewed Mobile wiring; runtime is separate."""
import datetime,json,re
from full_common import MOBILE,OUT,DOCS,save
j=json.loads((OUT/'source-api-inventory.json').read_text())
repos={
 'IDN':'features/auth/data/live_session.dart',
 'BKR':'features/catalog/data/live_bakery_repository.dart',
 'SUB':'features/subscription/data/live_subscription_repository.dart',
 'MKT':'features/marketplace/data/live_marketplace_repository.dart',
 'ORD':'features/orders/data/live_order_repository.dart',
 'CHT':'features/chat/data/live_chat_repository.dart',
 'CAI':'features/ai/data/live_ai_repository.dart',
}
public={'IDN-002','IDN-006','BKR-004','BKR-008','BKR-034','BKR-035','SUB-013','SUB-014','SUB-015'}
new={'ORD-001','ORD-005','ORD-006','ORD-007','MKT-010',*[f'CAI-{n:03}' for n in range(1,8)]}
blocked={'ORD-003':'ADDRESS_PUBLIC_CONTRACT_MISSING','ORD-008':'NO_COMPLETED_ORDER_FROM_SUPPORTED_UI','ORD-004':'NO_ORDER_FROM_SUPPORTED_UI',**{x:'NO_COMPLETED_ORDER_FROM_SUPPORTED_UI' for x in ['ORD-001','ORD-005','ORD-006','ORD-007']},'MKT-014':'ADDRESS_PUBLIC_CONTRACT_MISSING','MKT-006':'FIREBASE_UNAVAILABLE','MKT-007':'FIREBASE_UNAVAILABLE','CHT-005':'CHAT_HISTORY_SQL_42P18','MKT-010':'CAKE_AI_UNAVAILABLE',**{f'CAI-{n:03}':'CAKE_AI_SOURCE_BUILD_FAILED' for n in range(1,8)}}
screens={
 'IDN':'Đăng nhập / tạo tài khoản / Tài khoản / làm mới quyền / đăng xuất',
 'BKR':'Catalog công khai / Hồ sơ đối tác / Catalog tiệm / Admin duyệt tiệm',
 'SUB':'Gói dịch vụ / Gói của tiệm / Chi tiết đơn gói / chứng từ / Admin gói và duyệt',
 'MKT':'Yêu cầu / Chi tiết RFQ / báo giá / Admin giám sát / thiết kế AI',
 'ORD':'Đơn của tôi / Đơn tiệm / Admin Đơn và đánh giá / chi tiết đơn',
 'CHT':'Danh sách trò chuyện / hội thoại / soạn tin / tệp / đóng hội thoại',
 'CAI':'Tài khoản → Thiết kế AI; RFQ → AI → job → design; Admin RFQ → selected design',
}
events=[]
for p in (OUT/'sanitized-events').glob('*.json'):
 try:
  v=json.loads(p.read_text(encoding='utf-8-sig'));rows=v if isinstance(v,list) else v.get('events',[])
  events.extend({**x,'evidenceFile':str(p.relative_to(MOBILE))} for x in rows)
 except (ValueError,TypeError):pass
def matches(op,e):
 pattern=re.sub(r'\{[^}]+\}',r'[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}',op['path'])
 return e.get('method')==op['method'] and re.fullmatch(pattern,e.get('path','').split('?')[0]) is not None and (not e.get('service') or op['service'].removesuffix('-service')==e['service'])
for op in j['operations']:
 ident=op['id'];prefix=ident[:3];app=op['applicable'];adapter=repos[prefix]
 if ident in {'BKR-004','BKR-008','BKR-034','BKR-035'}:adapter='features/catalog/data/live_catalog_repository.dart'
 if ident in {'ORD-001','ORD-005','ORD-006','ORD-007'}:adapter='features/reviews/data/live_review_repository.dart'
 role='CUSTOMER / BAKERY_OWNER / ADMIN theo ownership và scope'
 if ident in public:role='Guest; người đăng nhập cũng được dùng'
 elif '/admin/' in op['path']:role='ADMIN'
 elif prefix=='CAI':role='CUSTOMER; ADMIN đọc job/design theo quyền'
 elif prefix=='BKR':role='BAKERY_OWNER + membership OWNER; onboarding cho CUSTOMER'
 elif prefix=='CHT':role='CUSTOMER / BAKERY_OWNER + participant'
 elif prefix=='SUB':role='CUSTOMER onboarding / BAKERY_OWNER theo bakery'
 rows=[e for e in events if matches(op,e)]
 android=[e for e in rows if e.get('layer')=='ANDROID_UI']
 host=[e for e in rows if e.get('layer')!='ANDROID_UI']
 def status(rows):return 'SUCCESS' if any(200<=e.get('status',0)<300 for e in rows) else 'ATTEMPTED_FAILED' if rows else 'NOT_VERIFIED'
 op.update({'adapter':app,'adapterSource':'lib/'+adapter if app else None,'newThisMission':ident in new,'reachableUi':app and ident!='CAI-001','uiEntry':screens[prefix] if app else 'Không đưa vào Mobile','rolesOwnership':role if app else 'Service/framework only','prerequisites':'Token hợp lệ; tài nguyên được phép; trạng thái theo service; xem blocker' if app else 'Service token/JWK ngoài Mobile','hostCurrent':status(host),'androidCurrent':status(android),'androidAttemptCount':len(android),'androidSuccessCount':sum(200<=e.get('status',0)<300 for e in android),'eventFiles':sorted(set(e['evidenceFile'] for e in rows)),'blocker':blocked.get(ident),'expectedTerminal':'Server trả contract hợp lệ; đọc lại trạng thái sau mutation; không phát lại ngầm' if app else 'Không gọi từ Mobile','criticalBranches':['loading','empty','validation','401/403','409','network','uncertain mutation'] if app else []})
 if ident=='CAI-001':op['uiEntry']+='; chỉ reachable khi có selectedDesignId; thiếu queue Admin PENDING'
 if ident=='MKT-010':op['uiEntry']='RFQ DRAFT → job từ request → APPROVED design → Chọn cho yêu cầu này'
 if ident=='CHT-008':op['blocker']='CHAT_HISTORY_REQUIRED_FOR_READ_CURSOR'
 conditional={'ORD-001','ORD-004','ORD-005','ORD-006','ORD-007','ORD-008','MKT-007','MKT-010','CHT-008','CAI-001','CAI-003','CAI-004','CAI-005','CAI-007'}
 op['uiWiringStatus']='EXCLUDED' if not app else 'WIRED_CONDITIONAL_RESOURCE_UNAVAILABLE' if ident in conditional else 'WIRED_ENTRY_REACHABLE_OPERATION_BLOCKED' if ident in {'CAI-002','CAI-006','MKT-014','ORD-003'} else 'WIRED'
 op['reachableUiInCurrentRuntime']=app and ident not in conditional
save('api-coverage.json',j)
freeze=OUT/'acceptance-freeze.json'
if not freeze.exists():
 save('acceptance-freeze.json',{'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'phase':'Before final cross-role acceptance run; initial Journey A implementation probe already started and retained separately','operations':[{k:o[k] for k in ['id','service','method','path','applicable','rolesOwnership','uiEntry','prerequisites','expectedTerminal','criticalBranches']} for o in j['operations']],'journeys':{'A':'new Customer → onboarding → Admin approve → subscription proof → Admin review → role activation → publish product → different Customer discovers same ID','B':'product/cart/address → direct Order → Owner fulfill → Customer review → Admin moderate','C':'RFQ → Offer → Chat/read/media → accept → same Order → fulfill/review','D':'real authorized AI job/revision/result/moderation → select design in same RFQ','E':'Admin/Owner independent branches, renewal/reject/archive/membership/oversight','F':'refresh/concurrency/logout/restart/account switch/draft/uncertain reconciliation'},'gate':'FULL_PASS only if all applicable required roles/operations/journeys pass current Android and persistence/runbook/video checks; otherwise PARTIAL_BLOCKED'})
lines=['# Đối chiếu toàn bộ Backend API và Mobile','',f"Source hiện tại: {j['total']} controller operation; {j['applicable']} áp dụng Mobile. ID giữ nguyên inventory cũ; không thêm endpoint tưởng tượng. Adapter không đồng nghĩa Android thành công. `acceptance-freeze.json` ghi thời điểm và điều kiện từng operation; Journey A ban đầu là implementation probe, không gắn nhãn acceptance đã đóng băng từ trước.",'','| API ID | Service · method · path | Vai trò / ownership | Source Backend | Adapter | UI / discovery | Host hiện tại | Android hiện tại | Blocker |','|---|---|---|---|---|---|---|---|---|']
for o in j['operations']:
 lines.append('| '+' | '.join([o['id'],f"{o['service']} · {o['method']} `{o['path']}`",o['rolesOwnership'],f"`{o['source']}:{o['line']}`",f"`{o['adapterSource']}`" if o['adapter'] else 'Excluded',o['uiEntry'],o['hostCurrent'],o['androidCurrent'],o['blocker'] or '—'])+' |')
lines+=['','Chi tiết JSON có annotations, DTO, handler, hash source, prerequisite, nhánh bắt buộc, eventFiles và số attempt/success. `uiWiringStatus` phân biệt nút/menu đã đi tới được với form/detail có điều kiện nhưng chưa có resource hợp lệ. Boolean source wiring không phải current runtime acceptance. SUCCESS trong cột Android chỉ là ít nhất một HTTP2xx thật; không tự đánh dấu đủ mọi nhánh/role/persistence. Danh sách framework: JWK trong controller được loại khỏi mẫu số Mobile; actuator/OpenAPI/error do framework sinh không được đếm thành operation nghiệp vụ. Không có public Address CRUD, Admin user management, global review queue, global pending-AI queue; đây là thiếu capability riêng, không thêm denominator.','','93 adapter gồm 81 adapter giữ lại và 12 adapter bổ sung. Chọn thiết kế/AI/Review có source-verified UI nhưng runtime bị chặn không được tính thành công. Admin AI moderation chỉ có đường đi điều kiện qua RFQ.selectedDesign; không có discovery hoàn chỉnh cho PENDING chưa được chọn.']
(DOCS/'API_COVERAGE_MATRIX_VI.md').write_text('\n'.join(lines)+'\n',encoding='utf-8')
print({'controller':j['total'],'applicable':j['applicable'],'adapters':sum(o['adapter'] for o in j['operations']),'androidSuccessUnique':sum(o['androidCurrent']=='SUCCESS' for o in j['operations']),'newAdapters':len(new)})
