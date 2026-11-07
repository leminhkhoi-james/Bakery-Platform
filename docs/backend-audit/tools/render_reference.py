"""Sinh tài liệu tham chiếu từ AST, OpenAPI và metadata PostgreSQL đã thu thập."""
from pathlib import Path
import collections,hashlib,json,re
from audit_knowledge import TITLES,NOTES,WORKFLOWS,TABLE_PURPOSE
ROOT=Path(__file__).resolve().parents[3];OUT=ROOT/'docs/backend-audit';EV=OUT/'evidence';REF=OUT/'reference';REF.mkdir(exist_ok=True)
def read(name):return json.loads((EV/name).read_text(encoding='utf-8'))
def write(path,text):path.write_text(text,encoding='utf-8')
apis=read('api-inventory.json');classes=[c for c in read('java-classes.json') if not c['test']];methods=read('java-methods.json');bykey={m['key']:m for m in methods};cases=read('runtime-cases.json');schemas=read('isolated-database-metadata.json');summary=read('source-summary.json')
sources={x['source']:(ROOT/x['source']).read_text(encoding='utf-8') for x in read('source-manifest.json')}
cm={(c['source'],c['name']):c for c in classes};names=collections.defaultdict(list)
for c in classes:names[c['module'],c['name']].append(c)
def esc(t):return str(t).replace('|','\\|').replace('\n','<br>').replace('\r','')
def table(headers,rows):return '\n| '+' | '.join(headers)+' |\n|'+'|'.join('---' for _ in headers)+'|\n'+''.join('| '+' | '.join(esc(c) for c in row)+' |\n' for row in rows)+'\n'
def link(s,line=1):return f'[{Path(s).name}:{line}](../../{s}#L{line})'
def title(a):return TITLES[a['id'].split('-')[0]][int(a['id'].split('-')[1])-1]
def note(a):return NOTES.get(a['id'],'')
def split_args(text):
    items=[];start=0;depth=0;quoted=False;escape=False
    for i,ch in enumerate(text):
        if escape:escape=False;continue
        if ch=='\\' and quoted:escape=True;continue
        if ch=='"':quoted=not quoted
        if quoted:continue
        if ch in '([{':depth+=1
        elif ch in ')]}':depth-=1
        elif ch==',' and depth==0:items.append(text[start:i].strip());start=i+1
    items.append(text[start:].strip());return items
def traced(a):return [bykey[k] for k in a['traceMethods']]
methodids={m['key']:'m'+str(i) for i,m in enumerate(methods) if '/src/main/' in m['source']}
def ml(m):return f'[{m["class"]}.{m["name"]}](reference/SOURCE_PROCESSING_CATALOG_VI.md#{methodids[m["key"]]})'
def classlink(c):return link(c['source'],c['line'])
entitytables={}
for c in classes:
    for ann in c['annotations']:
        t=re.search(r'@Table\s*\(\s*name\s*=\s*"([^"]+)"',ann)
        if t:entitytables[c['module'],c['name']]=t[1]
repotables={}
for c in classes:
    t=re.search(r'(?:JpaRepository|CrudRepository)\s*<\s*(\w+)',sources[c['source']])
    if t and (c['module'],t[1]) in entitytables:repotables[c['module'],c['name']]=entitytables[c['module'],t[1]]
alltables={(s['service'],x['table_name']) for s in schemas for x in s['tables'] if x['table_name']!='flyway_schema_history'}
def effects(a):
    found={}
    for m in traced(a):
        c=cm.get((m['source'],m['class']));fields={f['name']:f['type'] for f in c['fields']} if c else {}
        for inv in m['invocations']:
            typ=fields.get(inv['object'],'');t=repotables.get((m['module'],typ))
            if not t:continue
            mode='READ' if re.match(r'(find|get|exists|count|search)',inv['name']) else 'WRITE' if re.match(r'(save|delete|insert|update|mark|expire|flush|grant)',inv['name']) else 'CHECK/LOCK'
            found.setdefault(t,[]).append((mode,m,inv['name']))
        text=m['body']+' '+' '.join(m['annotations'])
        for verb,t in re.findall(r'\b(from|join|update|into|delete from)\s+([a-z_][a-z_0-9]*)',text,re.I):
            if (a['module'],t) in alltables:found.setdefault(t,[]).append(('READ' if verb.lower() in ['from','join'] else 'WRITE',m,'SQL '+verb))
    return found
def auth(a):
    aid=a['id'];p=a['path'];prefix=aid[:3]
    if aid in ['IDN-001','IDN-002','IDN-005','IDN-006']:return 'Không cần access JWT; login/register vẫn validation; refresh yêu cầu cookie hợp lệ.'
    if aid=='IDN-007':return 'Không cần Bearer ở filter; body clientId/clientSecret + audience/scope được ServiceTokenService xác thực.'
    if a['visibility']=='INTERNAL':return 'Service JWT đúng issuer/audience/token_type và scope của method/security matcher; không dùng user JWT. X-Correlation-Id bắt buộc tại matcher chuyên biệt Bakery/Subscription/Order; xem nguyên văn policy bên dưới.'
    if '/admin/' in p:return 'User JWT ADMIN; không suy ra ADMIN có quyền ownership ở các endpoint owner ngoài /admin/.'
    if aid in ['BKR-004','BKR-008','BKR-034','BKR-035','SUB-013','SUB-014','SUB-015']:return 'Public GET; nếu gửi Bearer sai thì Resource Server vẫn có thể 401 trước permitAll.'
    if prefix=='BKR':return 'User JWT CUSTOMER và membership phù hợp cho onboarding.' if aid in ['BKR-006','BKR-007','BKR-022'] else 'User JWT BAKERY_OWNER; route có bakeryId kiểm membership ACTIVE/OWNER trong DB. Endpoint create kiểm role, service gọi Identity user.'
    if prefix=='SUB':return 'User JWT CUSTOMER/BAKERY_OWNER; read có ADMIN. Quyền bakery còn kiểm BakeryAccessClient, không chỉ role trong JWT.'
    if prefix=='CHT':return 'User JWT; create cần CUSTOMER; close CUSTOMER/BAKERY_OWNER. Các thao tác kiểm participant hoặc active OWNER qua Bakery; foreign customer thường 404.'
    anns=[x for m in traced(a) for x in m['annotations'] if 'PreAuthorize' in x]+[x for x in a['controllerAnnotations'] if 'PreAuthorize' in x]
    return 'User JWT; actor/customer/owner/admin và resource visibility kiểm trong service. '+('; '.join(anns) if anns else 'Xem policy method và Actor/Access trong trace.')

# Catalogue đầy đủ method, annotation transaction/SQL và các field/model. Không bỏ các nhánh dài.
catalog=['# Danh mục xử lý mã nguồn Backend\n','Mỗi anchor là một method nguồn hiện tại, giữ số dòng để kiểm chứng. Đây là phụ lục bằng chứng kỹ thuật; binding call graph là heuristic theo kiểu, interface và module, không thay thế Java compiler. Getter/setter vẫn có trong catalogue; mã test không trộn vào luồng production. Không chứa cấu hình secrets bên ngoài.\n']
for m in methods:
    if m['key'] not in methodids:continue
    c=cm.get((m['source'],m['class']))
    catalog += [f'<a id="{methodids[m["key"]]}"></a>\n',f'## {m["module"]} · {m["class"]}.{m["name"]}\n',f'Nguồn: {link(m["source"],m["line"])}. Kiểu trả về `{m["return"]}`.\n',f'```java\n{m["signature"]}\n{m["body"]}\n```\n']
    if c and c['annotations']:catalog.append('Annotation class: '+', '.join('`'+x+'`' for x in c['annotations'])+'\n')
write(REF/'SOURCE_PROCESSING_CATALOG_VI.md','\n'.join(catalog).replace('](../../backend/','](../../../backend/'))
models=['# DTO, entity, enum và cấu trúc lớp\n','Khai báo giữ nguyên type/validation/nullability Java. Thiếu @NotNull không có nghĩa nghiệp vụ cho phép null; các ràng buộc thủ công nằm trong API/processing catalogue. Entity nullable và PostgreSQL là hai nguồn cần đối chiếu, không đồng nhất tự động.\n']
for c in classes:
    models += [f'## {c["module"]} · {c["name"]}\n',f'{classlink(c)}; {c["kind"]}. '+', '.join('`'+x+'`' for x in c['annotations'])+'\n']
    if c.get('values'):models.append('Enum: '+', '.join('`'+x+'`' for x in c['values'])+'\n')
    if c['fields']:models.append(table(['Field','Kiểu','Validation/mapping','Nguồn'],[(x['name'],x['type'],'; '.join(x['annotations']),link(x['source'],x['line'])) for x in c['fields']]))
write(REF/'SOURCE_MODELS_VI.md','\n'.join(models).replace('](../../backend/','](../../../backend/'))

openapis={}
for service in summary['byService']:
    p=EV/f'isolated-openapi-{service}.json'
    if p.exists():openapis[service]=read(p.name)
def operation(a):return openapis.get(a['module'],{}).get('paths',{}).get(a['path'],{}).get(a['method'].lower(),{})
def flat(schema,definitions,path='$',required=False,seen=()):
    if '$ref' in schema:
        name=schema['$ref'].rsplit('/',1)[1]
        if name in seen:return [(path,'ref '+name,'Theo schema đệ quy','')]
        return flat(definitions.get(name,{}),definitions,path,required,seen+(name,))
    typ=schema.get('type','object' if 'properties' in schema else 'unknown')
    constraints={k:v for k,v in schema.items() if k not in ['type','properties','items','description','required','additionalProperties']}
    out=[(path,typ,'bắt buộc' if required else 'không được schema đánh dấu bắt buộc',json.dumps(constraints,ensure_ascii=False) if constraints else '')]
    if 'properties' in schema:
        for k,v in schema['properties'].items():out+=flat(v,definitions,path+'.'+k,k in schema.get('required',[]),seen)
    if 'items' in schema:out+=flat(schema['items'],definitions,path+'[]',False,seen)
    if schema.get('additionalProperties'):out.append((path+'.*','map value',False,str(schema['additionalProperties'])))
    return out
def schema_example(s,defs,seen=()):
    if '$ref' in s:
        n=s['$ref'].rsplit('/',1)[1]
        return None if n in seen else schema_example(defs.get(n,{}),defs,seen+(n,))
    if 'properties' in s:return {k:('[REDACTED]' if any(n in k.lower() for n in ['token','password','secret','cookie']) else schema_example(v,defs,seen)) for k,v in s['properties'].items()}
    if s.get('type')=='array':return [schema_example(s.get('items',{}),defs,seen)]
    if s.get('enum'):return s['enum'][0]
    if s.get('format')=='uuid':return '00000000-0000-0000-0000-000000000001'
    if s.get('format')=='date-time':return '2030-01-01T00:00:00Z'
    if s.get('type') in ['number','integer']:return 1
    if s.get('type')=='boolean':return False
    if s.get('type')=='string':return 'synthetic'
    return {}

doc=['# Đặc tả chi tiết toàn bộ Backend API — tiếng Việt\n',f'Baseline `addfd7746021ef5267b3946e7b1e9cdc6545496a`, nhánh `dev`; {len(apis)} operation duy nhất = service + HTTP method + route đã ghép. 42 controller; không đếm alias Gateway, actuator hoặc OpenAPI.\n',
'Mỗi API có A–K riêng. Bảng schema lấy từ OpenAPI của JAR build từ baseline; Cake AI dùng declaration DTO nguồn vì compile thất bại. Required trong OpenAPI không đảm bảo đầy đủ validation thủ công: phần G và catalogue xử lý là bắt buộc. Response example là JSON tổng hợp theo schema, không phải response thật hay fixture có credentials.\n',
'Phụ lục [processing đầy đủ](reference/SOURCE_PROCESSING_CATALOG_VI.md), [mọi field/model](reference/SOURCE_MODELS_VI.md), [policy bảo mật](BACKEND_AUTHORIZATION_AND_SECURITY_VI.md), [DB và constraints](BACKEND_DATABASE_AND_DATA_FLOW_VI.md). Call graph không giải hoàn hảo method reference/lambda/var/framework callbacks; SQL/JPA automatic queries và các nhánh scheduler được đối chiếu riêng.\n',
table(['ID','Service','Method và route','Nghiệp vụ'],[(f'[{a["id"]}](#{a["id"].lower()})',a['module'],a['method']+' '+a['path'],title(a)) for a in apis])]
for a in apis:
    op=operation(a);defs=openapis.get(a['module'],{}).get('components',{}).get('schemas',{});trace=traced(a);effects_a=effects(a);tc=[x for x in cases if x['api']==a['id']]
    related=[f'WF-{i:02d}' for i,w in enumerate(WORKFLOWS,1) if a['id'] in w[1]]
    doc += [f'<a id="{a["id"].lower()}"></a>\n',f'## {a["id"]} — {title(a)}\n',
    f'### A. Nhận diện và mục đích\n\n`{a["method"]} {a["path"]}` — `{a["module"]}`; handler `{a["controller"]}.{a["handler"]}`. '+('API chỉ dành service, không gọi từ Flutter.' if a['visibility']=='INTERNAL' else 'Bề mặt HTTP ứng dụng; public surface không đồng nghĩa truy cập ẩn danh.')+' Workflow: '+', '.join(related)+'.\n',
    '### B. Xác thực, quyền và ownership\n\n'+auth(a)+'\n',
    'Annotation controller/method: '+', '.join('`'+x+'`' for x in a['controllerAnnotations']+a['annotations'])+'. Chính sách filter, token validation và rejection 401/403 ở [security reference](BACKEND_AUTHORIZATION_AND_SECURITY_VI.md).\n',
    '### C. Request hoàn chỉnh\n\n'+f'Mapping: `{a["mapping"]}`. Signature controller (bao gồm default query/header/path, binding và @Valid):\n\n```java\n{a["parameters"]}\n```\n']
    parameters=op.get('parameters',[])
    if parameters:doc.append(table(['Tên','Vị trí','Bắt buộc','Type/default/enum/limits'],[(p['name'],p.get('in'),p.get('required',False),json.dumps(p.get('schema',{}),ensure_ascii=False)) for p in parameters]))
    contents=op.get('requestBody',{}).get('content',{})
    for media,body in contents.items():doc += [f'Content-Type `{media}`.\n',table(['Đường dẫn field','Kiểu','Required theo schema','Giới hạn/format/enum/default'],flat(body.get('schema',{}),defs))]
    if a['id'] in ['MKT-001','MKT-011']:
        doc.append('Map query thực được parse: `page` default1 >=1; `size` default20 1..100; `sort` default createdAt,desc, hướng asc/desc và thêm id làm tie-break. '+('RFQ: scope mine/available (admin policy riêng), status RequestStatus, requestType RequestType, city/district string, neededFrom/neededTo ISO Instant; sort createdAt/neededAt/budgetMin/budgetMax.' if a['id']=='MKT-001' else 'Offer: scope received/sent; cakeRequestId/bakeryId UUID; status OfferStatus; sort createdAt/totalPrice/expiresAt.')+' Enum sai/UUID sai/paging sai bị400.\n')
    if 'MultipartFile' in a['parameters']:
        limits='Bakery: JPEG/PNG/WebP, 1byte..5MiB/file, magic bytes và declared MIME khớp; product tối đa10 ảnh tổng, primaryIndex hợp lệ.' if a['module']=='bakery-service' else 'Chat: tối đa5 files, 1byte..10MiB/file; JPEG/PNG/WebP/PDF, IMAGE không cho PDF, TEXT không cho file.' if a['module']=='chat-service' else 'Marketplace:1..10 files/request upload, từng file1byte..10MiB, JPEG/PNG/WebP magic; displayOrder cùng số file và không âm.' if a['module']=='marketplace-service' else 'Subscription proof: tùy chọn, 1byte..10MiB, JPEG/PNG/WebP/PDF theo magic/MIME.' if a['module']=='subscription-service' else 'AI sourceImages tối đa5 file, từng file<=10MiB; ImageValidator decode và giới hạn dimensions/pixels theo nguồn; DTO generation parameters normalized.'
        doc.append(limits+' Multipart server total/max-file-size còn chịu Spring config; xem environment matrix và application.yml.\n')
    if not contents:
        doc.append('Không có body schema runtime. '+('Cake AI: xem DTO declaration bên dưới; không được suy rằng endpoint không có body.' if a['module']=='cake-ai-service' else 'Căn cứ binding signature để phân biệt body rỗng, Map hoặc multipart không được suy diễn bởi OpenAPI.')+'\n')
    # Đồng thời liệt kê declaration DTO tham chiếu trực tiếp và transitively, kể cả nested records.
    tokens=set(re.findall(r'\b[A-Z]\w*\b',a['parameters']+' '+a['response']));dto=[];seen=set()
    while tokens:
        name=tokens.pop()
        for c in names.get((a['module'],name),[])+names.get(('platform-support',name),[]):
            ck=(c['source'],c['name'])
            if ck in seen:continue
            seen.add(ck)
            if c['kind'] in ['record_declaration','enum_declaration'] or '/dto/' in c['source']:
                dto.append(c)
                for f in c['fields']:tokens.update(re.findall(r'\b[A-Z]\w*\b',f['type']))
    for c in dto:
        doc.append(f'Khai báo `{c["name"]}` — {classlink(c)}. '+('Enum: '+', '.join(c.get('values',[])) if c.get('values') else '')+'\n')
        if c['fields']:doc.append(table(['Field','Kiểu Java','Validation/mapping nguồn'],[(f['name'],f['type'],'; '.join(f['annotations'])) for f in c['fields']]))
    doc += ['### D. Response, status và lỗi\n\n'+f'Kiểu controller `{a["response"]}`. Envelope chuẩn phần lớn gồm statusCode/message/data/timestamp; internal có thể trả DTO/Map thẳng, 204 không có body. Không cố bóc data đối với raw response.\n']
    successes=sorted(set(x['actualStatus'] for x in tc if x.get('actualStatus',0) in range(200,300)))
    if successes:doc.append('HTTP thành công đã quan sát: '+', '.join(str(x) for x in successes)+'. Xem I cho điều kiện case; đây không xác nhận mọi nhánh.\n')
    if a['id'] in ['IDN-002','IDN-005','IDN-003']:doc.append('Header session: Set-Cookie tên mặc định refresh_token (cấu hình IDENTITY_REFRESH_COOKIE_NAME), path /api/v1/auth, HttpOnly/SameSite/Secure theo config; body không chứa refresh secret. Logout clear cookie.\n')
    maps=[]
    for m in trace:
        if not any(t in m['return'] for t in ['Map<','Map <']):continue
        for inv in m['invocations']:
            args=split_args(inv['arguments'][1:-1])
            if inv['object']=='Map' and inv['name']=='of':
                maps.extend((args[i].strip('"'),args[i+1],ml(m)) for i in range(0,len(args)-1,2) if args[i].startswith('"'))
            if inv['name'] in ['put','entry'] and len(args)>1 and args[0].startswith('"'):maps.append((args[0].strip('"'),args[1],ml(m)))
    if maps:doc.append('Các field Map được dựng trong nguồn (expression xác định null/default, không giả thành schema DTO):\n'+table(['Key Map','Expression nguồn','Method'],list(dict.fromkeys(maps))))
    example=None
    for status,rsp in op.get('responses',{}).items():
        doc.append(f'OpenAPI status `{status}`: {rsp.get("description","")} (annotation sinh tự động không thay thế status runtime/controller).\n')
        for media,body in rsp.get('content',{}).items():
            doc.append(table(['Field response','Kiểu','Required theo schema','Format/enum'],flat(body.get('schema',{}),defs)))
            if example is None:example=schema_example(body.get('schema',{}),defs)
    if example is not None:doc.append('Ví dụ cấu trúc tổng hợp, các giá trị không phải mẫu nghiệp vụ hợp lệ đầy đủ:\n\n```json\n'+json.dumps(example,ensure_ascii=False,indent=2)+'\n```\n')
    doc += ['### E. Trình tự xử lý và nhánh\n\nHTTP → filter/token → method authorization → binding/Bean Validation → handler sau đây. Business validation thủ công, query/write và remote calls tiếp tục theo bảng liên kết; mã từng nhánh được giữ đầy đủ trong catalogue, không cắt method dài.\n',f'```java\n{bykey[a["key"]]["body"]}\n```\n']
    rows=[]
    for m in trace:
        body=m['body'];signals=[]
        if any('Transactional' in x for x in m['annotations']):signals+= [x for x in m['annotations'] if 'Transactional' in x]
        if 'transaction' in body.lower():signals.append('TransactionTemplate/transaction helper trong body')
        if any(x in m['source'] for x in ['/client/','/storage/']):signals.append('I/O ngoài DB; đối chiếu timeout/compensation')
        if 'Repository' in m['class']:signals.append('Query khai báo hoặc Spring Data')
        conditions=re.findall(r'(?m)^\s*(?:if|switch)\s*\(([^\n]+)',body)
        signals+= ['Điều kiện: '+x.strip() for x in conditions]
        rows.append((ml(m),link(m['source'],m['line']),'; '.join(signals) or 'Mapping/helper; xem toàn bộ body liên kết'))
    doc.append(table(['Bước/controller→service→DAO/client','Nguồn','Nhánh/transaction/I/O'],rows))
    doc += ['### F. Database, ghi trực tiếp và downstream\n\nBảng sau truy theo DAO/SQL trong service này; READ/WRITE là khả năng nhánh tương ứng, không phải khẳng định mọi request đều thực hiện. Remote side effects không gộp thành giao dịch của caller. Association JPA cascade và dirty checking được xem cùng entity ở DB reference.\n']
    if effects_a:doc.append(table(['Bảng','Đọc/ghi/lock và method chứng minh'],[(t,'; '.join(sorted(set(mode+' '+m['class']+'.'+name for mode,m,name in rows)))) for t,rows in effects_a.items()]))
    else:doc.append('Không định vị được ghi bảng trực tiếp trong trace này; endpoint có thể thuần read/remote hoặc Spring Data/JPA callback không bind được. Không suy diễn “không có side effect”; đối chiếu catalogue và workflow liên quan.\n')
    rem=[m for m in trace if '/client/' in m['source'] or '/storage/' in m['source']]
    if rem:doc.append('I/O downstream: '+', '.join(dict.fromkeys(ml(m) for m in rem))+'.\n')
    doc += ['### G. Quy tắc nghiệp vụ\n\n'+(note(a) or 'Các điều kiện và state transition của endpoint nằm ở bảng E cùng method nguồn được liên kết; Bean Validation ở C chỉ là lớp đầu. Mục đích cụ thể: '+title(a)+'. Xem workflow '+', '.join(related)+' để biết điều kiện trước/sau và transaction liên service.')+'\n']
    errors=[]
    for m in trace:
        for i,line in enumerate(m['body'].splitlines()):
            if re.search(r'\bthrow\b|orElseThrow|BusinessException\.(invalid|conflict|forbidden|notFound|unavailable)',line):errors.append((m['class']+'.'+m['name'],line.strip(),ml(m)))
    doc += ['### H. Failure paths\n\n401: token/credential không hợp lệ khi filter yêu cầu; 403: type/role/scope/correlation/ownership tùy policy. 400 binding/validation; 404/409/422/503 theo nhánh thực dưới đây. Không khẳng định mọi API có tất cả mã. Runtime 403 còn có thể che lỗi server khi error-dispatch bị chặn (CHT-005).\n']
    if errors:doc.append(table(['Method','Throw/ánh xạ nguồn','Chi tiết đầy đủ'],list(dict.fromkeys(errors))))
    doc += ['### I. Kiểm chứng runtime\n']
    if tc:doc.append(table(['Case','Nội dung','Loại','HTTP thực / assertion','Kết quả'],[(x['caseId'],x['name'],x.get('kind'),x.get('actualStatus',x.get('actualStatuses','DB/worker assertion, không có HTTP riêng')),x['result']) for x in tc]))
    else:doc.append('BLOCKED — Cake AI không compile, không gửi request tới mock hoặc gọi OpenAPI của service khác để tính là đã kiểm chứng. Chưa kiểm happy path/authorization runtime của operation này.\n')
    doc += ['### J. Bằng chứng nguồn\n\n'+link(a['source'],a['line'])+'; '+', '.join(dict.fromkeys(link(m['source'],m['line']) for m in trace))+'.\n',
    'DTO/entity: '+', '.join(classlink(c) for c in dto)+'. Migration/constraint đầy đủ tại [DB reference](BACKEND_DATABASE_AND_DATA_FLOW_VI.md); policy filter được in nguyên văn trong [security reference](BACKEND_AUTHORIZATION_AND_SECURITY_VI.md).\n',
    '### K. Hệ quả tích hợp Flutter\n\n'+('Không đưa service credential vào mobile; đây là contract server-to-server.' if a['visibility']=='INTERNAL' else 'Dùng đúng method/path/body ở C, enum nguyên dạng, UTC Instant và số tiền decimal; phân biệt null/field bỏ qua và replace/patch. '+('Mutation phải giữ nguyên idempotency key khi retry cùng payload; thay payload tạo key mới. ' if any('Idempotency' in m['parameters'] for m in trace) else '')+'Chỉ mở flow sau khi trạng thái runtime I và blocker tương ứng đã được chấp nhận/khắc phục. ')+(note(a) if a['id'] in ['ORD-003','ORD-008','IDN-005','CHT-005','MKT-014','BKR-022'] else '')+' Xem [contract Flutter](BACKEND_TO_FLUTTER_API_CONTRACT_REFERENCE_VI.md).\n']
write(OUT/'BACKEND_API_DETAILED_SPECIFICATION_VI.md','\n'.join(doc))

# Dữ liệu DB lấy từ PostgreSQL, kể cả 6 bảng AI schema-only; không giả runtime AI.
db=['# Cơ sở dữ liệu và dòng dữ liệu Backend\n',f'7 database nghiệp vụ logic, 49 application tables, 17 file migration. Stack audit có 6 DB chạy ứng dụng/Flyway (43 bảng); Cake AI apply DDL vào DB riêng chỉ để kiểm schema (6 bảng), không có ứng dụng AI chạy. Flyway history không tính application table.\n',
'Thông tin DB đang có được đọc bằng BEGIN READ ONLY trong [existing metadata](evidence/existing-database-metadata.json). [Audit metadata](evidence/isolated-database-metadata.json) là schema sau migration nguồn mới. DB audit cùng một PostgreSQL instance nhưng user/database độc lập, không dùng lại volume của project bakery-local.\n',
table(['Service','DB audit','Chế độ','Bảng nghiệp vụ','PostgreSQL'],[(s['service'],s['database'],s['mode'],len([t for t in s['tables'] if t['table_name']!='flyway_schema_history']),s['version']) for s in schemas]),
'## Ranh giới và nhất quán\n\nUUID liên service là tham chiếu logic, không có FK xuyên DB. Identity sở hữu user/address/role; Bakery sở hữu catalog/membership; Marketplace giữ RFQ và commercial offer snapshot; Order giữ snapshot bất biến để lịch sử không đổi theo catalog; Subscription giữ plan/order/period snapshots; Chat giữ participant/message/receipt; Cake AI giữ revision/execution/design.\n\nJPA @Transactional/TransactionTemplate bảo đảm trong từng datasource. REST ngoài transaction ở acceptance/approval không có XA; lease, idempotency và retry cung cấp nhất quán cuối cùng. Snapshot PII có chủ đích trong Order và không được in từ DB ở audit.\n',
'## Migration đã áp dụng\n']
for s in schemas:
    db.append('### '+s['service']+'\n')
    if s.get('flyway'):db.append(table(['Version','Script','Checksum','Success'],[(x['version'],x['script'],x['checksum'],x['success']) for x in s['flyway']]))
    else:db.append('Cake AI: DDL nguồn được chạy tuần tự bằng psql vào DB schema-only. Không tạo Flyway history giả và không gọi đây là migration do ứng dụng chạy.\n')
db.append('## Từng bảng: columns, constraints, indexes, readers/writers\n')
for s in schemas:
    service=s['service'];mer=['erDiagram'];relations=[]
    for t in s['tables']:
        t=t['table_name']
        if t=='flyway_schema_history':continue
        cols=[c for c in s['columns'] if c['table_name']==t];cons=[c for c in s['constraints'] if c['table_name']==t];indexes=[x for x in s['indexes'] if x['tablename']==t]
        entities=[c for c in classes if entitytables.get((service,c['name']))==t and c['module']==service]
        refs=[(a,effects(a).get(t)) for a in apis if a['module']==service and t in effects(a)]
        db += [f'### {service} · `{t}`\n',f'Database `{s["database"]}`, schema `public`. Entity: '+(', '.join(c['name']+' '+classlink(c) for c in entities) or 'JDBC/record hoặc collection table; xem SQL catalogue')+'.\n',
        TABLE_PURPOSE[t]+' PK/FK/check bên dưới là định nghĩa thực trong PostgreSQL.\n',
        table(['Column','Type','Nullable','Default','Length / precision / scale'],[(c['column_name'],c['data_type']+' / '+c['udt_name'],c['is_nullable'],c['column_default'],f'{c["character_maximum_length"]} / {c["numeric_precision"]} / {c["numeric_scale"]}') for c in cols]),
        table(['Constraint','Loại p/u/f/c/x','Định nghĩa'],[(c['conname'],c['contype'],c['definition']) for c in cons]),
        table(['Index','Định nghĩa'],[(x['indexname'],x['indexdef']) for x in indexes]),
        'Audit/state columns: '+', '.join('`'+c['column_name']+'`' for c in cols if any(k in c['column_name'] for k in ['status','version','created','updated','deleted','reviewed','claimed','lease','completed','assigned','submitted']))+'. Các enum/check hợp lệ nằm trong constraints; field không có check không được coi đã được DB enforce.\n',
        table(['API','Đọc/ghi/lock từ trace'],[(f'[{a["id"]}](BACKEND_API_DETAILED_SPECIFICATION_VI.md#{a["id"].lower()})','; '.join(sorted(set(mode+' '+m['class']+'.'+n for mode,m,n in rs)))) for a,rs in refs])]
        # Whole-source SQL accesses capture schedulers, derived queries/collections not bound from API.
        hits=[]
        for path,text in sources.items():
            if not path.endswith('.java') or '/src/main/' not in path or '/'+service+'/' not in path:continue
            for i,line in enumerate(text.splitlines(),1):
                if re.search(r'\b'+re.escape(t)+r'\b',line):hits.append((path,i))
        db.append('Nguồn entity/JDBC khác (gồm scheduler và cascade): '+', '.join(link(p,i) for p,i in hits)+'. Nếu bảng collection/history không hiện API trực tiếp, xem owner entity/cascade trong các liên kết này; không suy diễn bảng không được sử dụng.\n')
        mer.append('  '+t+' {')
        for c in cols:mer.append('    '+re.sub(r'\W','_',c['udt_name'])+' '+c['column_name'])
        mer.append('  }')
        for con in cons:
            fk=re.search(r'FOREIGN KEY \(([^)]+)\) REFERENCES ([\w.]+)\(([^)]+)\)',con['definition'])
            if fk:
                keys={x.strip() for x in fk[1].split(',')};nullable=any(c['is_nullable']=='YES' and c['column_name'] in keys for c in cols)
                unique=False
                for uc in cons:
                    match=re.search(r'(?:PRIMARY KEY|UNIQUE) \(([^)]+)\)',uc['definition'])
                    if uc['contype'] in ['p','u'] and match and {x.strip() for x in match[1].split(',')}==keys:unique=True
                left='o|' if nullable else '||';right='o|' if unique else 'o{'
                relations.append(f'  {fk[2].split(".")[-1]} {left}--{right} {t} : "{fk[1]}"')
    mer+=relations
    dp=OUT/'diagrams';dp.mkdir(exist_ok=True);write(dp/(service+'-er.mmd'),'\n'.join(mer)+'\n')
    db.append(f'## ER vật lý — {service}\n\n```mermaid\n'+ '\n'.join(mer)+'\n```\n')
db += ['## Đồng bộ canonical SQL, entity và schema\n\nĐối chiếu checksum/cột/constraint ở evidence; canonical SQL ngoài backend có thể là tài liệu cũ. Không sửa migration/checksum hay chạy Flyway repair. Bảng @Version như products/customer_orders/RFQ bảo vệ concurrent writes; DB constraints vẫn cần vì service validation trước write có race. Subscription advisory lock theo bakery và acceptance lease không phải global mutex cho toàn hệ thống.\n',
'## Các điểm transaction cần lưu ý\n\nRefresh rotation có khóa ghi và giữ quyết định revoke qua ngoại lệ. Acceptance giữ workflow trước khi gọi Order, có thể tồn tại order trước khi Marketplace complete. Payment approve commit period rồi notify Bakery; retry/onboarding scheduler chịu trách nhiệm phần còn lại. Storage PUT/DELETE không commit cùng PostgreSQL; cleanup best effort có cửa sổ orphan. Review soft-delete giữ record; add-on delete là disable.\n']
write(OUT/'BACKEND_DATABASE_AND_DATA_FLOW_VI.md','\n'.join(db))

# Policy gốc nguyên văn đã đọc, kèm matrix role cho mọi endpoint.
security=['# Xác thực, phân quyền và bảo mật Backend\n',
'Access JWT RS256 ký bằng RSA hiện hữu, kiểm issuer/audience/time và token_type; user roles chuyển ROLE_, service scopes chuyển SCOPE_. Đọc nguồn decoder từng service: shared ResourceSecurityConfiguration được Marketplace/Cake AI import; Bakery/Subscription/Order/Chat có policy riêng. JWKS chỉ public key, refresh token opaque lưu hash SHA-256 và BCrypt password/service secrets. Không có HMAC secret được tự sinh hay key rotation trong audit.\n',
'## Ma trận quyền mọi operation\n',table(['API','Method / route','Quyền và resource boundary'],[(a['id'],a['method']+' '+a['path'],auth(a)) for a in apis]),
'## Quy tắc bảo mật và các giới hạn xác minh\n\nCookie refresh HttpOnly, SameSite=Lax, Path=/api/v1/auth; Secure mặc định bật. Chỉ stack loopback audit tắt Secure để kiểm HTTP; đây không phải khuyến nghị cho bản triển khai thật. Flutter native cần cookie jar và lưu session an toàn, body không có refreshToken. CSRF bị tắt; CORS Identity cho origin cấu hình với credentials; CORS không là lớp authorization cho native client.\n\nTài khoản ACTIVE được kiểm ở login/refresh và internal getUser. Resource Server không truy vấn Identity mỗi request nên logout/đổi role/status không thu hồi JWT tức thì. Không tìm thấy rate limiting/OTP/forgot password/email verification hoặc API quản lý address/profile công khai trong inventory hiện tại. Không báo các tính năng UI demo là API đã có.\n\n401 token sai khác 403 quyền thiếu; owner cùng role nhưng foreign bakery/customer phải bị chặn. X-Correlation-Id bắt buộc tại các service matcher nội bộ chuyên biệt. Shared platform internal policy chỉ yêu cầu service token, scope do @PreAuthorize cụ thể; không áp một quy tắc correlation đồng nhất cho mọi service.\n\nStorage signed URLs có hạn; metadata trả URL cần refresh bằng API, không lưu URL như object key. Response Order có snapshot tên/điện thoại/địa chỉ nên chỉ đọc đúng customer/bakery/admin. File uploads có validator theo loại, byte size và image decode; xem nguồn được đính kèm dưới đây.\n\nBằng chứng runtime: foreign bakery patch403, customer khác đọc order404, service thiếu correlation403, user JWT gọi internal bị chặn; refresh replay revoke family PASS. Không thực hiện pentest tải lớn, key compromise, XSS, brute force hay truy cập cloud thật. Không suy ra đã kiểm hết security chỉ từ những case này.\n',
'## Chính sách nguồn đầy đủ\n']
policy_sources=sorted({c['source'] for c in classes if any(x in c['name'] for x in ['SecurityConfig','ResourceSecurity','JwtConfig','JwtProperties','SecurityProperties','AttachmentValidator','ImageValidator','ServiceTokenService','TokenSessionService'])})
for path in policy_sources:
    text=sources[path]
    # Only application code, never external config/environment values.
    security += [f'### {Path(path).name} — {path.split("/")[1]}\n',link(path)+'\n','```java\n'+'\n'.join(f'{i}: {line}' for i,line in enumerate(text.splitlines(),1) if not line.startswith('import '))+'\n```\n']
security.append('## Findings liên quan\n\nXem [findings](BACKEND_AUDIT_FINDINGS_VI.md): cấu hình scope drift, JWT sau logout còn sống, lỗi dispatch HTTP403 che SQL và surface API thiếu cho mobile. Không có claim đã thử token RSA giả, token expired hoặc đổi role concurrent nếu runtime-cases không có case tương ứng.\n')
write(OUT/'BACKEND_AUTHORIZATION_AND_SECURITY_VI.md','\n'.join(security))
write(EV/'reference-generation-summary.json',json.dumps({'apis':len(apis),'sourceMethodEntries':len(methodids),'classes':len(classes),'tables':len(alltables)},indent=2))
write(EV/'api-data-effects.json',json.dumps({a['id']:{t:[{'mode':mode,'method':m['class']+'.'+m['name'],'source':m['source'],'line':m['line'],'operation':n} for mode,m,n in rows] for t,rows in effects(a).items()} for a in apis},ensure_ascii=False,indent=2))
print(json.dumps({'apiSections':len(apis),'sourceMethods':len(methodids),'models':len(classes),'dbTables':len(alltables)}))
