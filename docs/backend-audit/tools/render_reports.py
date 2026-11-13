"""Báo cáo kết luận và workflow dựa bằng chứng thực, không suy diễn PASS."""
from pathlib import Path
import collections,json,re,subprocess
from audit_knowledge import TITLES,NOTES,WORKFLOWS
ROOT=Path(__file__).resolve().parents[3];OUT=ROOT/'docs/backend-audit';EV=OUT/'evidence'
def read(f):return json.loads((EV/f).read_text(encoding='utf-8'))
def write(p,s):p.write_text(s,encoding='utf-8')
def esc(s):return str(s).replace('|','\\|').replace('\r','').replace('\n','<br>')
def table(h,rs):return '\n| '+' | '.join(h)+' |\n|'+'|'.join('---' for _ in h)+'|\n'+''.join('| '+' | '.join(esc(x) for x in r)+' |\n' for r in rs)+'\n'
apis=read('api-inventory.json');aid={x['id']:x for x in apis};cases=read('runtime-cases.json');cl=read('java-classes.json');methods=read('java-methods.json');bykey={x['key']:x for x in methods};effects=read('api-data-effects.json');db=read('database-summary.json');summ=read('source-summary.json');env=read('environment-matrix.json');rec=read('api-reconciliation.json')
def sr(name,module=None,method=None):
    hits=[c for c in cl if not c['test'] and c['name']==name and (not module or c['module']==module)]
    if not hits:raise ValueError(name)
    c=hits[0];line=c['line']
    if method:
        m=next((bykey[k] for k in c['methods'] if bykey[k]['name']==method),None)
        if m:line=m['line']
    return f'[{name}:{line}](../../{c["source"]}#L{line})'
def ar(id):return f'[{id}](BACKEND_API_DETAILED_SPECIFICATION_VI.md#{id.lower()})'
def cr(id):return f'[{id}](BACKEND_API_RUNTIME_VERIFICATION_VI.md#{id.lower()})'
def title(a):return TITLES[a['id'].split('-')[0]][int(a['id'].split('-')[1])-1]
def pct(n,d):return f'{n}/{d} = {100*n/d:.2f}%'
executed={x['api'] for x in cases};anypass={x['api'] for x in cases if x['result']=='PASS'};ok={x['api'] for x in cases if x['result']=='PASS' and 200<=x.get('actualStatus',0)<300};passed=sum(x['result']=='PASS' for x in cases)
metrics={'totalApis':len(apis),'executedApis':len(executed),'apisWithAnyPassedCase':len(anypass),'apisWithPassed2xx':len(ok),'unexecutedApis':len(apis)-len(executed),'withoutPassed2xx':len(apis)-len(ok),'testCases':len(cases),'passedCases':passed,'failedCases':len(cases)-passed,'workflowTotal':len(WORKFLOWS),'workflowRuntimeCategories':dict(collections.Counter(w[5] for w in WORKFLOWS))}
write(EV/'audit-metrics.json',json.dumps(metrics,ensure_ascii=False,indent=2))

# Findings: severity is impact of verified condition, not speculative exploit.
findings=[
('High','Gateway là bootstrap non-web, không forward API','RUNTIME_CONFIRMED','Toàn bộ mobile/web qua một base URL Gateway bị chặn.',sr('ApiGatewayApplication')+'; [pom Gateway](../../backend/api-gateway/pom.xml); [probe](evidence/gateway-probe.json)','JAR current source start rồi exit0; không Tomcat/Netty; GET18090 connection refused.','Thiết kế/triển khai routing và security Gateway trong nhiệm vụ remediation riêng; không coi build PASS là gateway hoạt động.'),
('High','Cake AI không compile: thiếu Google Storage dependencies và ApiResponse.accepted','BUILD_CONFIRMED','9 API AI không khởi chạy; các nhánh upload/generation/revision/moderation chưa sẵn sàng.',sr('FirebaseStorageAdapter','cake-ai-service')+'; '+sr('GenerationController','cake-ai-service','accepted')+'; [build](evidence/build-cake-ai.txt)','Build isolated -pl cake-ai-service -am -DskipTests package exit1; missing com.google.auth.oauth2/cloud.storage/http và accepted method.','Bổ sung dependency đúng module và thống nhất response factory sau review; cần build và chạy lại AI sandbox, không dùng cloud thật để che compile lỗi.'),
('High','Identity address thiếu id làm direct order luôn 422 với contract hiện tại','RUNTIME_CONFIRMED','CUSTOMER không tạo được direct catalog order dù địa chỉ hợp lệ; flow from-offer dùng Map vẫn chạy.',sr('UserContextService','identity-service')+'; '+sr('IdentityClient','order-service')+'; '+sr('OrderCreationServiceImpl')+'; '+cr('TC-0193')+'; [shape](evidence/address-contract-check.json)','Đăng nhập synthetic customer có address đầy đủ → POST /orders/direct →422 Delivery address is missing or incomplete; internal address200 nhưng hasId=false.','Thống nhất DTO Identity/Order bao gồm id và kiểm contract qua HTTP thật; audit không sửa implementation.'),
('High','Chat list message lỗi PostgreSQL bind timestamp','RUNTIME_AND_EXISTING_TEST_CONFIRMED','Danh sách tin nhắn không tải được; send/replay/read/delete hoạt động nhưng chat chưa đủ dùng.',sr('ChatMessageRepository','chat-service','findPageBefore')+'; '+cr('TC-0188')+'; '+cr('TC-0256')+'; [test](evidence/existing-tests.json)','GET conversation/messages hợp lệ →403; server lỗi could not determine data type of parameter $2. Test ChatServiceApplicationTests cũng gặp cùng lỗi. Cursor non-null case cũng chưa PASS.','Tách query không cursor hoặc bind/cast timestamp rõ ràng; xử lý error dispatch để response phản ánh đúng lỗi server; kiểm lại cả trang đầu và trang sau.'),
('High','Image và service-client config sẵn có lệch current source','CONFIG_AND_OPENAPI_CONFIRMED','Stack bakery-local thiếu6 API hiện tại; grants cũ thiếu identity:bakery-owner:grant và bakery:onboarding:activate, có thể ngăn onboarding mới.', '[reconciliation](evidence/api-reconciliation.json); [grants audit](evidence/isolated-configuration.json); '+sr('ServiceTokenService'),'Existing OpenAPI98, fresh isolated104; source113 gồm9AI. Runtime-mounted Identity clients cũ không có hai scope onboarding mới; audit chỉ hợp grants ở cấu hình TEMP của stack audit.','Đồng bộ version JAR và external service-client grants sau review. Không đổi hash/key hiện hữu và không cấp scope rộng hơn caller cần.'),
('Medium','HTTP403 che lỗi server do error dispatch bị security chặn','RUNTIME_CONFIRMED','Client có thể hiểu lỗi SQL thành thiếu quyền, dẫn đến logout/ẩn UI sai.',sr('SecurityConfig','chat-service')+'; '+sr('GlobalExceptionHandler','chat-service')+'; '+cr('TC-0256'),'HTTP403 Access is denied trong khi log PostgreSQL lỗi bind; không có business ownership rejection ở thời điểm lỗi.','Quy định error-dispatch/exception mapping và generic500 có correlation, giữ chi tiết SQL khỏi client.'),
('Medium','Grant Order→Bakery mặc định thiếu catalog quote','SOURCE_CONFIRMED_RUNTIME_OVERRIDE_PRESENT','Direct order còn có blocker scope khi dùng application.yml thuần; runtime cũ đã override scope này.', '[application Identity](../../backend/identity-service/src/main/resources/application.yml); [grants](evidence/isolated-configuration.json); '+sr('CatalogQuoteService'),'Source grants order-service/bakery-service không có bakery:catalog:quote, nhưng typed direct pipeline cần nó; external grant đang có đã được reuse.','Chuẩn hóa declarative grants với contract caller; không cấp blanket scope hoặc nhét service token vào Flutter.'),
('Medium','Thiếu public profile/address và admin user CRUD','INVENTORY_CONFIRMED','Các màn profile/address/admin-users local chưa có API; addressId cần cho đặt hàng không thể lấy qua public address book.',sr('AuthenticationController')+'; [inventory](evidence/api-inventory.json); [35 màn mobile](../mobile/MOBILE_SCREEN_INVENTORY_VI.md)','Inventory113 chỉ auth/me và internal user/address reads, không có public address CRUD/profile mutation/admin-users endpoints.','Chốt và triển khai API thiếu trong nhiệm vụ riêng; UI phải thể hiện chưa hỗ trợ, không nhúng credential nội bộ để workaround.'),
('Medium','Unknown JSON field có thể làm mất ghi chú do khác contract','RUNTIME_CONFIRMED_CONTRACT_RISK','AcceptOfferRequest dùng customerNote; gửi deliveryNote được bỏ qua. Replay với field không biết không đổi fingerprint.',sr('AcceptOfferRequest')+'; '+sr('OfferAcceptanceServiceImpl')+'; '+cr('TC-0264')+'; '+cr('TC-0282'),'Cùng key với deliveryNote khác vẫn200; đổi đúng customerNote→409. Internal Order dùng deliveryNote, public Marketplace dùng customerNote.','Mapping contract rõ ràng, contract tests và cân nhắc strict unknown-field policy; không đổi semantics âm thầm.'),
('Medium','Feature map chưa trở thành quota enforcement','SOURCE_SEARCH_CONFIRMED','Mobile không được coi maxProducts/maxAiGenerations là giới hạn đã được Backend bảo đảm.',sr('ProductServiceImpl')+'; '+sr('SubscriptionPlanServiceImpl')+'; '+sr('GenerationServiceImpl'),'Publish kiểm hasActiveSubscription; toàn corpus không có đọc maxProducts/maxAiGenerations để chặn quota theo số lượng.','Định nghĩa semantic từng feature và enforcement atomic trước quảng bá hạn mức; không bịa quota từ nhãn UI.'),
('Medium','Các adapter media chủ yếu kiểm magic bytes','SOURCE_CONFIRMED_NOT_EXPLOIT_TESTED','Có thể lưu file không decode được; không chứng minh RCE/XSS hay exploit storage.',sr('BakeryImageStorage')+'; '+sr('RequestImageServiceImpl')+'; '+sr('AttachmentValidator')+'; '+sr('PaymentProofStorage'),'JPEG/PNG/WebP/PDF dựa chữ ký header và MIME. AI ImageValidator có decode sâu hơn; không suy validator các service giống nhau.','Decode/giới hạn pixel/chuyển định dạng theo nhu cầu, kiểm file malformed và giữ filename sanitation. Chưa chạy malicious-file tests.'),
('Info','Canonical Bakery V1 khác indentation, không khác SQL','FORMATTING_ONLY_CONFIRMED','Raw byte/text comparison khác nhưng không có bằng chứng schema drift từ khác biệt này.', '[comparison](evidence/migration-canonical-comparison.json); [Bakery migration](../../backend/bakery-service/src/main/resources/db/migration/V1__init_schema.sql); [canonical](../../database/postgresql/bakery-service/V1__init_schema.sql)','1/17 file khác sau normalize newline; cùng nội dung khi strip indentation từng dòng. Không được mô tả thành schema mismatch hoặc test failure.','Giữ phân biệt byte equality và SQL equivalence khi kiểm sync; không sửa migration/checksum lịch sử chỉ để làm sạch định dạng.'),
('Low','Readiness endpoints bị từ chối ở4 service','RUNTIME_CONFIRMED','Docker Up/healthy theo OpenAPI không phản ánh readiness business từng dependency.',sr('SecurityConfig','bakery-service')+'; [health](evidence/isolated-readiness.json)','GET /actuator/health: Bakery/Subscription/Order/Chat401, Identity/MarketplaceUP200; business readiness được chứng minh riêng bằng API và DB.','Chuẩn hóa policy health/readiness và kiểm dependency phù hợp, không expose thông tin chi tiết nhạy cảm.'),
('Low','Paging/shape/status khác nhau giữa service','SOURCE_AND_OPENAPI_CONFIRMED','Một generic mobile paginator/envelope có thể parse sai hoặc hiển thị lệch trang.',sr('QueryPaging')+'; '+sr('GenerationReader')+'; '+sr('MessageController'),'Đa số page1; AI page0; chat cursor. Internal raw Map/DTO và ApiResponse lẫn nhau; OpenAPI200 có thể khác controller201/204/202.','Định nghĩa adapter theo contract từng endpoint, cùng contract tests; không tự đổi Backend trong audit.'),
('Low','Order application test có lỗi fixture bind Instant','EXISTING_TEST_CONFIRMED','Bộ test không hoàn toàn xanh; không chứng minh production order transition hỏng vì runtime transition đã PASS.', '[existing tests](evidence/existing-tests.json); [Order test](../../backend/order-service/src/test/java/com/se193262/orderservice/OrderServiceApplicationTests.java#L165)','JdbcTemplate fixture setObject(java.time.Instant) không suy ra SQL type. Test error xảy ra khi insert fixture trước assertions.','Dùng binding timestamp đúng kiểu trong bài test ở nhiệm vụ riêng; chạy lại regression, không xóa assertion để xanh.'),
('Info','Logout không thu hồi access JWT tức thì','RUNTIME_CONFIRMED_EXPECTED_JWT_MODEL','Token bị lộ còn dùng được đến expiry; cần thiết kế UX/security rõ.',sr('TokenSessionService')+'; '+cr('TC-0225'),'Logout revoke refresh và clear cookie; gọi auth/me bằng access token cũ vẫn200.','Xác nhận threat model/TTL và nếu cần thì thiết kế revoke/version check; hiện không gọi đây là chức năng revoke access token.'),
('Info','Hai pipeline tạo order từ offer không cùng đường gọi','SOURCE_CALL_TRACE_CONFIRMED','Dễ đọc nhầm method typed không được route gọi và ghi sai contract.',sr('OfferOrderController')+'; '+sr('OfferOrderServiceImpl')+'; '+sr('OrderCreationServiceImpl'),'Controller internal gọi OfferOrderService, còn createFromAcceptedOffer typed không tìm thấy controller gọi; response/address validation hai nhánh khác nhau.','Giữ contract source-to-route rõ; cân nhắc hợp nhất sau review, không refactor trong audit.'),
]
for i,f in enumerate(findings,1):assert f[0] in ['Critical','High','Medium','Low','Info']
fcounts=collections.Counter(f[0] for f in findings)
fdoc=['# Phát hiện kiểm toán Backend\n','Mức độ đánh giá theo ảnh hưởng hiện tại. Không có finding Critical đã chứng minh. Source-confirmed không đồng nghĩa exploit đã được thử. Mọi khuyến nghị dưới đây chưa được áp dụng vào source.\n',table(['Mức','Số lượng'],[(k,fcounts[k]) for k in ['Critical','High','Medium','Low','Info']]),table(['ID','Mức','Phát hiện','Độ xác minh'],[(f'F-{i:03d}',f[0],f[1],f[2]) for i,f in enumerate(findings,1)])]
for i,(severity,name,status,impact,evidence,repro,recommendation) in enumerate(findings,1):
    fdoc += [f'<a id="f-{i:03d}"></a>\n',f'## F-{i:03d} · {severity} · {name}\n',f'Trạng thái: **{status}**.\n\nẢnh hưởng: {impact}\n\nBằng chứng: {evidence}.\n\nTái hiện/đối chiếu: {repro}\n\nKhuyến nghị: {recommendation}\n\nGiới hạn: audit read-only, chưa triển khai remediation; chỉ fixture disposable được phép ghi.\n']
write(OUT/'BACKEND_AUDIT_FINDINGS_VI.md','\n'.join(fdoc))

# Workflow templates: 23 fields each, source and runtime deliberately distinct.
wdoc=['# Workflow nghiệp vụ và state machine Backend\n',f'Định nghĩa workflow là một mục tiêu hoặc vòng đời có actor, entry, trạng thái và boundary nhất quán. Nhóm các endpoint CRUD cùng aggregate để tránh đếm mỗi HTTP request như một workflow. Có **{len(WORKFLOWS)} workflow**; không tính tính năng UI chưa có API thành workflow đã triển khai.\n',table(['Runtime category','Số workflow'],sorted(metrics['workflowRuntimeCategories'].items())),
'VERIFIED = đường đại diện của mục tiêu đã PASS, không có nghĩa tất cả branches đã test. PARTIAL = một phần flow PASS nhưng thiếu nhánh/dependency; DEFECT = lỗi triển khai đã tái hiện; BLOCKED = dependency/compile ngăn mục tiêu; NOT_VERIFIED = chỉ trace source, chưa cố tình trigger scheduler/failure window. Các category này không thay thế source coverage. 37 mục đã có source entry/trace; binding heuristic và callback limitations được nêu tại báo cáo chính.\n']
for i,(name,ids,steps,invariants,tx,status) in enumerate(WORKFLOWS,1):
    operations=[aid[x] for x in ids];tables=sorted({t for id in ids for t in effects[id]});ts=[c for c in cases if c['api'] in ids and c['kind']!='ANONYMOUS_SURFACE'];modules=sorted({a['module'] for a in operations})
    sources=list(dict.fromkeys(f'[{Path(bykey[k]["source"]).name}:{bykey[k]["line"]}](../../{bykey[k]["source"]}#L{bykey[k]["line"]})' for a in operations for k in a['traceMethods']))
    extra={17:[('OfferAcceptanceServiceImpl',None,'recover'),('AcceptanceTransactions',None,None)],18:[('MarketplaceScheduler',None,'expire'),('MarketplaceExpirationService',None,'expireOffer'),('MarketplaceExpirationService',None,'closeRequest')],20:[('GenerationQueue',None,'claim'),('GenerationWorker',None,'run'),('GenerationScheduler',None,None)],29:[('SubscriptionLifecycleJob',None,'reconcile')],37:[('RequestImageServiceImpl',None,'cleanOrphans'),('GenerationScheduler',None,None),('MessagePersistenceService',None,'registerAfterCommitCleanup'),('BakeryImageStorage',None,None)]}
    sources += [sr(name,module,method) for name,module,method in extra.get(i,[])]
    wdoc += [f'<a id="wf-{i:02d}"></a>\n',f'## WF-{i:02d} — {name}\n',table(['#','Trường','Phân tích'],[
    (1,'Workflow ID',f'WF-{i:02d}'),(2,'Tên',name),(3,'Mục đích',name+' theo contract nguồn hiện có, không suy rộng sang chức năng chưa triển khai.'),
    (4,'Actors',', '.join(sorted({x.get('actor','service/worker') for x in ts})) if ts else 'Theo role/scope entry và ownership trong đặc tả API; scheduler/worker khi workflow xử lý nền.'),
    (5,'Điều kiện trước',invariants),(6,'Entry API',', '.join(ar(x) for x in ids)),(7,'Service tham gia',', '.join(modules)+'; xem remote clients bên dưới API processing trace.'),
    (8,'Các bước',steps),(9,'Validation',invariants+'; DTO/type/null/default đầy đủ ở phần C từng API.'),
    (10,'Database operations',', '.join(tables)+'; READ/WRITE/LOCK theo API-data-effects, entity cascade và SQL catalogue; không gộp remote write vào caller transaction.'),
    (11,'Inter-service calls',tx+'; danh sách remote method cụ thể ở phần E/F các API liên quan.'),
    (12,'Chuyển trạng thái',steps+'; state diagrams/tables phía dưới quy định cạnh hợp lệ.'),
    (13,'Điều kiện thành công','Hoàn tất mục tiêu với persisted state/response của API; runtime status '+status+' chỉ áp đường đại diện đã có evidence.'),
    (14,'Lỗi',invariants+'; error/status theo phần H và case runtime, không coi mọi4xx là lỗi implementation.'),
    (15,'Rollback/compensation',tx),(16,'Concurrency/idempotency',tx+'; header key/clientMessageId phải theo contract, không đổi payload khi retry cùng key.'),
    (17,'Side effects','JWT/cookie, object storage, local histories/receipts hoặc HTTP notify tùy bước; không có evidence gửi email/ngân hàng thật. Các effect cụ thể nằm trong trace của entry API.'),
    (18,'Response cuối',', '.join(ar(x) for x in ids)+' — phần D có nested fields/status và I có HTTP thực.'),
    (19,'API liên quan',', '.join(ids)),(20,'Bảng liên quan',', '.join(tables)+'; bảng collection/history/lease theo phần database và scheduler.'),
    (21,'Flutter','Tích hợp theo quyền/state/side effect của workflow, không suy chức năng từ demo. '+('Bị chặn hoặc cần xử lý defect trước mở flow.' if status in ['BLOCKED','DEFECT'] else 'Chỉ dùng public application API, giữ session/key và refresh state sau mutation.')),
    (22,'Nguồn','; '.join(sources)),(23,'Runtime',status+'; '+', '.join(cr(c['caseId'])+' '+c['result'] for c in ts)+'; '+('Scheduler/failure window chưa được trigger riêng.' if status=='NOT_VERIFIED' else ''))])]
diagrams={
'service-relationships':'''flowchart LR
  Client[Client mobile trong tuong lai] -. Gateway chua route .-> Gateway[Gateway bootstrap]
  Client --> Identity
  Client --> Bakery
  Client --> Marketplace
  Client --> Order
  Client --> Chat
  Client --> Subscription
  Bakery --> Identity
  Bakery --> Subscription
  Subscription --> Bakery
  Marketplace --> Bakery
  Marketplace --> Subscription
  Marketplace --> Order
  Marketplace -. AI dang blocked .-> CakeAI
  CakeAI -. context .-> Marketplace
  Order --> Identity
  Order --> Bakery
  Order --> Marketplace
  Chat --> Marketplace
  Chat --> Bakery
  Bakery --> BakeryDB[(bakery_db)]
  Marketplace --> MarketplaceDB[(marketplace_db)]
  Order --> OrderDB[(order_db)]
  Identity --> IdentityDB[(identity_db)]
  Chat --> ChatDB[(chat_db)]
  Subscription --> SubDB[(subscription_db)]
  CakeAI -. schema only .-> AiDB[(cake_ai_db)]''',
'acceptance-sequence':'''sequenceDiagram
  participant C as CUSTOMER
  participant M as Marketplace
  participant MDB as Marketplace DB
  participant O as Order
  participant ODB as Order DB
  participant I as Identity
  participant B as Bakery
  C->>M: accept + Idempotency-Key + customerNote
  M->>MDB: reserve PREPARED + fingerprint
  M->>MDB: claim lease token
  M->>O: from-offer + accept-offer:offerId
  O->>M: read order-source
  O->>I: user and delivery address
  O->>B: bakery profile
  O->>ODB: order + snapshots + history + idempotency
  O-->>M: orderId/orderNumber
  alt lease still owned
    M->>MDB: SUCCEEDED, ACCEPTED, OFFER_SELECTED
    M-->>C: 200 acceptance result
  else timeout or partial failure
    M->>MDB: RETRYING or terminal FAILED
    Note over M,O: Retry uses same key, no XA rollback
  end''',
'onboarding-sequence':'''sequenceDiagram
  participant U as CUSTOMER
  participant B as Bakery
  participant A as ADMIN
  participant S as Subscription
  participant I as Identity
  U->>B: submit onboarding
  B->>B: PENDING_APPROVAL + member activation pending
  A->>B: approve ACTIVE
  U->>S: order plan + payment evidence
  A->>S: approve payment
  S->>S: commit ACTIVE period
  S->>B: notify activation after commit
  B->>I: grant BAKERY_OWNER
  B->>B: mark activation complete
  U->>I: refresh/login to receive new roles''',
'order-state':'''stateDiagram-v2
  [*] --> PENDING
  PENDING --> CONFIRMED
  PENDING --> CANCELLED
  CONFIRMED --> BAKING
  CONFIRMED --> CANCELLED
  BAKING --> READY
  READY --> DELIVERING
  DELIVERING --> COMPLETED
  COMPLETED --> [*]
  CANCELLED --> [*]''',
'marketplace-state':'''stateDiagram-v2
  state RFQ {
    [*] --> DRAFT
    DRAFT --> OPEN
    DRAFT --> CANCELLED
    OPEN --> CANCELLED
    OPEN --> CLOSED
    OPEN --> OFFER_SELECTED
  }
  state Offer {
    [*] --> PENDING
    PENDING --> ACCEPTED
    PENDING --> REJECTED
    PENDING --> WITHDRAWN
    PENDING --> EXPIRED
  }''',
'acceptance-state':'''stateDiagram-v2
  [*] --> PREPARED
  PREPARED --> SUCCEEDED
  PREPARED --> RETRYING
  PREPARED --> FAILED
  RETRYING --> RETRYING
  RETRYING --> SUCCEEDED
  RETRYING --> FAILED''',
'subscription-state':'''stateDiagram-v2
  state SubscriptionOrder {
    [*] --> PENDING_PAYMENT
    PENDING_PAYMENT --> PAYMENT_REVIEW
    PENDING_PAYMENT --> EXPIRED
    PAYMENT_REVIEW --> COMPLETED
    PAYMENT_REVIEW --> PENDING_PAYMENT
    PAYMENT_REVIEW --> EXPIRED
  }
  state Period {
    [*] --> ACTIVE
    [*] --> SCHEDULED
    SCHEDULED --> ACTIVE
    ACTIVE --> EXPIRED_PERIOD
    SCHEDULED --> EXPIRED_PERIOD
  }''',
'ai-state':'''stateDiagram-v2
  [*] --> QUEUED
  QUEUED --> PROCESSING
  QUEUED --> CANCELLED
  PROCESSING --> SUCCEEDED
  PROCESSING --> FAILED
  PROCESSING --> CANCELLED
  SUCCEEDED --> QUEUED: new revision
  FAILED --> QUEUED: new revision''',
'logical-data-links':'''flowchart LR
  User[Identity users] -. logical UUID .-> Membership[Bakery members]
  User -. logical UUID .-> RFQ[Marketplace RFQ]
  Product[Bakery product] -. snapshot .-> Offer[Marketplace offer]
  RFQ -. snapshot .-> Order[Order customer_orders]
  Offer -. idempotent order creation .-> Order
  Address[Identity address] -. immutable snapshot .-> Delivery[Order delivery_address_snapshots]
  RFQ -. context UUID .-> Conversation[Chat conversation]
  RFQ -. context UUID .-> Job[Cake AI job]
  Plan[Subscription plan] --> SubOrder[Subscription order]
  SubOrder --> Period[Subscription period]
  Period -. entitlement REST .-> Product'''}
for name,text in diagrams.items():
    write(OUT/'diagrams'/(name+'.mmd'),text+'\n')
    wdoc += ['## Sơ đồ '+name+'\n','Quan hệ nét đứt là REST/context/snapshot logic, không phải FK vật lý xuyên DB. Sơ đồ AI là hành vi nguồn, chưa runtime.\n','```mermaid\n'+text+'\n```\n']
wdoc += ['## Các state machine còn lại\n',table(['Aggregate','Cạnh hợp lệ','Lưu ý quyền'],[
('Bakery','DRAFT→PENDING_APPROVAL; PENDING_APPROVAL→ACTIVE/DRAFT; ACTIVE→SUSPENDED; SUSPENDED→ACTIVE; bất kỳ chưa CLOSED→CLOSED','Submit owner; đổi status admin; ACTIVE có checklist'),
('Product','DRAFT/HIDDEN→PUBLISHED; PUBLISHED→HIDDEN; mọi trạng thái chưa ARCHIVED→ARCHIVED','OWNER cùng bakery, publish còn entitlement/media/options'),
('Payment','SUBMITTED→APPROVED hoặc REJECTED','ADMIN, amount/currency match, UUID review key khi approve'),
('Conversation','OPEN→CLOSED','Customer chính hoặc active bakery OWNER; không reopen'),
('Review','PUBLISHED/HIDDEN/DELETED theo entity/service','Customer update/delete và ADMIN status; không create lại khi đã có review'),
('Moderation','PENDING/APPROVED/REJECTED','AI automated decision hoặc ADMIN; selected design chỉ APPROVED')]),
'## Invariants xuyên service\n\nMột order/offer và một accepted offer/request được bảo vệ bằng local unique/lease/idempotency. Không có FK xuyên DB hay distributed rollback. Role OWNER trong JWT không thay membership check. ACTIVE subscription theo time interval và snapshot, không theo tên gói UI. RFQ neededAt/deadline và offer completion/expiry được kiểm lại tại command. Giá Order do service quote/snapshot, client không truyền total đáng tin.\n\nCác luồng không có implementation: backend cart đa bakery, checkout/payment mua bánh qua ngân hàng, websocket/push, profile/address CRUD public, admin users CRUD, revenue/reporting tổng hợp, AI3D. Không đưa chúng vào tổng37 workflow đã có source.\n']
write(OUT/'BACKEND_BUSINESS_WORKFLOWS_VI.md','\n'.join(wdoc))

# Runtime logs: retain only fixed exception strings, no SQL values or request data.
logrows=[]
for service in ['identity-service','bakery-service','marketplace-service','subscription-service','order-service','chat-service']:
    r=subprocess.run(['docker','logs','bakery-audit-20261107-'+service+'-1'],capture_output=True,text=True,encoding='utf-8',errors='replace');text=r.stdout+r.stderr
    logrows.append({'service':service,'startupLogged':bool(re.search(r'Started \w+Application',text)),'defaultProfileLogged':'default profile' in text,'postgresNullBindErrorCount':text.count('ERROR: could not determine data type of parameter $2')})
write(EV/'runtime-startup-and-errors.json',json.dumps(logrows,indent=2))
assumptions={'TC-0102':'Payment options public matcher; corrected TC-0216.', 'TC-0123':'Expected status phải204; corrected TC-0217.', 'TC-0131':'Expected status phải204; corrected TC-0218.', 'TC-0151':'Fixture thiếu category.slug; corrected TC-0152.', 'TC-0154':'Fixture thiếu add-on.category; corrected TC-0155.', 'TC-0169':'Fixture requestType sai OPEN thay OPEN_CUSTOM; corrected TC-0170.', 'TC-0176':'RFQ đã OPEN nên409 trước storage; draft đúng TC-0259→503.', 'TC-0191':'Source cho chính customer close; corrected TC-0255.', 'TC-0224':'Logout trả200 theo controller; corrected TC-0273.', 'TC-0241':'Route {id} chưa được thay đúng, dùng zero UUID; corrected TC-0270.', 'TC-0245':'Route {id} chưa được thay đúng; corrected TC-0272.', 'TC-0254':'Replay internal note khác fingerprint; correct null note TC-0281.', 'TC-0264':'deliveryNote là unknown field; customerNote đúng contract TC-0282→409.'}
classification=[]
for c in cases:
    if c['result']!='PASS':classification.append({'caseId':c['caseId'],'category':'HARNESS_ASSUMPTION_CORRECTED' if c['caseId'] in assumptions else 'IMPLEMENTATION_FAILURE','explanation':assumptions.get(c['caseId'],'Direct order contract hoặc Chat SQL defect đã tái hiện; giữ nguyên FAIL trong raw metrics.')})
write(EV/'runtime-failure-classification.json',json.dumps(classification,ensure_ascii=False,indent=2))
r=['# Kiểm chứng runtime Backend\n',
'Mục tiêu là thực thi ứng dụng thật từ current source trong project Docker disposable; không ghi dữ liệu lên bakery-local. Request qua6 cổng loopback đi thẳng service vì Gateway chưa có forwarding. Các case scheduler/recovery có assertion DB được gắn loại riêng, không giả HTTP2xx. Không kiểm chứng Web/Flutter integration và không tạo mock Backend để tính PASS.\n',
'## Môi trường và phương pháp\n\nBuild source copy bên ngoài repo tại `%TEMP%\\bakery-backend-audit-20261107\\source\\backend`; kiểm hash copy. JAR mới mount readonly vào image Java local có cache. Project `bakery-audit-20261107`, network bridge riêng `bakery-audit-20261107-runtime`, named volumes audit-postgres/audit-storage riêng. Sáu service dùng6 DB/users trong một Postgres17 instance audit. RSA3072bits và credential service hiện hữu reuse; DB/storage/test passwords CSPRNG riêng, manifest chỉ TEMP với ACL current user+SYSTEM. Không ghi env/password/JWT/cookie vào evidence.\n\nBan đầu internal bridge không publish host ports trên Docker Desktop; chỉ sửa Compose TEMP sang bridge riêng và bind127.0.0.1. Mọi endpoint URL được assert Docker-local/loopback; Firebase project/bucket trống và không nạp ADC/AI key. Đây không phải network egress firewall. Không có request tới cloud/payment/email thật.\n\nFixture:5 user synthetic tạo qua register; chỉ thêm ADMIN role và2 địa chỉ bằng SQL trong DB audit vì chưa có public API. OWNER được cấp qua onboarding + admin duyệt bakery + chứng từ tổng hợp + admin duyệt subscription. BANK_TRANSFER trong test là chuỗi chứng từ, không chuyển khoản. Không dùng fixtureSQL này để tuyên bố public address/profile API hoạt động.\n',
'## Metrics có mẫu số rõ\n\nCase concurrency gồm4 request nhưng tính1 testcase; health/OpenAPI không được cộng vào application API cases hoặc happy-path coverage.\n',table(['Chỉ số','Kết quả','Ý nghĩa'],[
('RuntimeEndpointCoverage',pct(len(executed),len(apis)),'Có ít nhất1 case đã thực thi, gồm negative-auth'),
('RuntimeSuccessCoverage',pct(len(anypass),len(apis)),'Có ít nhất1 case PASS, kể cả expected401/403/404; KHÔNG là happy-path coverage'),
('Business2xxCoverage',pct(len(ok),len(apis)),'Có ít nhất1 case PASS với HTTP2xx thật'),
('TestCasePassRate raw',pct(passed,len(cases)),'Giữ cả lỗi giả định harness và lỗi sản phẩm, không sửa lịch sử FAIL'),
('Không thực thi',len(apis)-len(executed),'9 API Cake AI compile blocked'),
('Chưa có2xx PASS',len(apis)-len(ok),'Bao gồm9 compile blocked và7 API khác'),
('Case FAIL do harness/assumption',len(assumptions),'Đã phân tích/corrected hoặc kiểm đúng precondition, không xóa evidence'),
('Case implementation FAIL',len(classification)-len(assumptions),'1 direct order +3 Chat list variants; không suy thành4 lỗi độc lập')]),
'## Tình trạng từng component\n',table(['Component','Startup','Internal/host','Readiness','Functional'],[
('audit-db','Docker postgres:17-alpine','5432 / không publish','pg_isready PASS','6 DB Flyway + schema-onlyAI; metadata và6 DB assertions PASS'),
('audit-storage','Docker MinIO local cached','9000 /127.0.0.1:19012','Uploads trả201','Logo/cover/product/add-on thật trong audit; chưa kiểm mọi presigned download'),
('Identity','Fresh JAR in Docker','8080 /18091','actuatorUP200','Register/login/rotation/replay/logout/serviceJWT/internal PASS'),
('Bakery','Fresh JAR in Docker','8080 /18092','health401; business API PASS','Onboarding, catalog, media, quotes, ownership PASS'),
('Marketplace','Fresh JAR in Docker','8080 /18093','actuatorUP200','RFQ/offer/accept/order replay PASS; Firebase/AI503 có chủ đích'),
('Subscription','Fresh JAR in Docker','8080 /18094','health401; business API PASS','Order/payment review/reject/renewal SCHEDULED PASS'),
('Order','Fresh JAR in Docker','8080 /18096','health401','From-offer/lifecycle/review PASS; direct422 defect'),
('Chat','Fresh JAR in Docker','8080 /18097','health401','Create/send/replay/delete/read/close PASS; list message403 SQL defect'),
('Cake AI','Build isolated','không listen','FAILED','Không giả claim runtime/provider/storage PASS'),
('API Gateway','Fresh JAR probe container','8080 dự kiến /18090','exit0, connection refused','Bootstrap non-web, chưa route'),
('Web/Flutter','Không khởi chạy/build','không áp dụng','NOT_VERIFIED','Audit Backend-only; bảo vệ source/build trongfrontend/mobile')]),
'## Đối chiếu operation source và runtime\n',table(['Service','Source API','Existing OpenAPI','Fresh OpenAPI'],[(x['service'],x['source'],x['existing']['count'] if isinstance(x['existing'],dict) else x['existing'],x['isolated']['count'] if isinstance(x['isolated'],dict) else x['isolated']) for x in rec]),
'Existing stack98 operation, fresh104, static113. Historical107 tương đương98+9AI ở version cũ; không dùng làm tổng current source. OpenAPI được so sánh bằng cặp method/path theo service, không chỉ đếm số.\n',
'## Các API chưa có happy path2xx\n',table(['API','Mục tiêu','Lý do'],[(ar(a['id']),title(a),'Compile blocked' if a['module']=='cake-ai-service' else 'Defect422 address' if a['id']=='ORD-003' else 'Defect SQL→403' if a['id']=='CHT-005' else 'Firebase/AI dependency hoặc chưa có ảnh hợp lệ để delete' if a['id'] in ['MKT-006','MKT-007','MKT-010'] else 'Internal scope/client dependency happy path chưa được cấp/chạy; mới verify anonymous rejection') for a in apis if a['id'] not in ok]),
'## Quy trình chạy lại an toàn\n\nCác lệnh dưới là cho môi trường audit riêng và giả định manifest TEMP/cached images/RSA mounts còn tồn tại. Không tự tạo/reuse credential nếu private manifest mất. Các script có guard project/database/path và dừng khi không đủ isolation. Đây không phải deployment hoàn chỉnh qua Gateway.\n\n```powershell\npython docs/backend-audit/tools/source_model.py\npython docs/backend-audit/tools/isolated_build.py\npython docs/backend-audit/tools/isolated_runtime.py\npython docs/backend-audit/tools/runtime_probe.py\n```\n\n`isolated_build.py` chỉ build source copy ngoài repo, không gọi Maven tại backend. `runtime_cases.py` có phase bootstrap/bakery/catalog/marketplace/orders; extended/final cases thêm nhánh. **Không chạy lại các mutation phases trên fixture đã kết thúc**: product đã ARCHIVED, plan đã ARCHIVED, RFQ đã accepted. Để nghiên cứu thêm cần project/fixture namespace mới được isolate đúng; script hiện gắn ngày cố định, không được đổi sang project hiện hữu bakery-local.\n\nRestart service audit, không thay dữ liệu:\n\n```powershell\n$bakeryAuditCompose = Join-Path $env:TEMP "bakery-backend-audit-20261107/runtime-compose.json"\ndocker compose -p bakery-audit-20261107 -f $bakeryAuditCompose restart chat-service\npython docs/backend-audit/tools/runtime_probe.py\n```\n\nKhông chạy down-v/prune/reset volumes. Không chạy scripts/start-local-runtime.py trong nhiệm vụ read-only vì script prepare ghi backend/*/target/docker-runtime. Không stage/commit TEMP private manifests. Không khẳng định host reboot/recovery đã được test; manifest TEMP chỉ phục vụ audit, không phải cấu hình production bền vững.\n',
'## Existing test suite và build\n\nBusiness services+Gateway package PASS; CakeAI FAIL. Lần test đầu26 testcase,1 error do thiếu canonical database ở source copy; bổ sung SQL corpus vào TEMP rồi chạy các suite chưa PASS bằng Maven -fae, giữ các suite đã PASS không lặp. Tổng XML độc lập cuối:148 tests,146 PASS,2 errors,0 assertion failures,0 skipped. Không cộng26 ban đầu vào148 và không tính suite chưa compile thành test đã pass.\n\nHai error: Chat SQL timestamp tương tự runtime defect; Order test fixture JdbcTemplate không infer java.time.Instant. Order business transitions/review quaHTTP đã PASS, vì vậy không đồng nhất lỗi fixture với production order defect. CakeAI và toàn integration module chưa chạy thành công, không báo full Maven reactor xanh. Xem [test evidence](evidence/existing-tests.json), [initial evidence](evidence/existing-tests-initial.json).\n',
'## Assertion dữ liệu sau luồng\n\n[6 assertions](evidence/runtime-db-assertions.json): một order/offer; orderCOMPLETED/completedAt có mặt; total=subtotal+deliveryFee và subtotal=sum(items.line_total); acceptanceSUCCEEDED; OWNER đã cấp; kỳSCHEDULED tồn tại tại thời điểm kiểm ban đầu. 4 replay acceptance song song đều200 và chỉ1 order; đây là replay concurrency, chưa phải race accept2 offer đầu tiên hay failure injection giữa hai commit.\n\nBổ sung recovery: stop chỉ Order container thuộc project audit →accept503/RETRYING →start Order →scheduler tự SUCCEEDED, một order. Expiry: đổi mốc ngày của fixture tổng hợp rồi để job nguồn đổi RFQ/offer thành CLOSED/EXPIRED, subscription order EXPIRED, period cũ EXPIRED và SCHEDULED thành ACTIVE. Vì vậy period từng SCHEDULED trong assertion trước nay đã ACTIVE. Một lần chuẩn bị date fixture bị check expires_at>created_at từ chối; đã điều chỉnh cả created_at hợp lệ, không drop constraint và không chạy lại recovery. [Method evidence](evidence/scheduler-test-method.json) và casesTC0312–0323 ghi rõ phạm vi.\n',
'## Danh mục mọi testcase\n']
for c in cases:
    r += [f'<a id="{c["caseId"].lower()}"></a>\n',f'### {c["caseId"]} · {c["api"]} · {c["name"]}\n',f'Loại `{c["kind"]}`; actor alias `{c.get("actor","service/parallel")}`; HTTP thực `{c.get("actualStatus",c.get("actualStatuses","DB/worker assertion, không có HTTP riêng"))}`; expected `{c.get("expectedStatus","assert count/state")}`; **{c["result"]}**. '+('Thông điệp lỗi: `'+c['error']+'`. ' if c.get('error') else '')+(assumptions.get(c['caseId'],''))+'\n']
write(OUT/'BACKEND_API_RUNTIME_VERIFICATION_VI.md','\n'.join(r))

print(json.dumps({'metrics':metrics,'findingsBySeverity':dict(fcounts),'reportsWritten':3}))
