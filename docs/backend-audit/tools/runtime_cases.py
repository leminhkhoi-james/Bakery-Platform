"""API thật, dữ liệu tổng hợp, chỉ project Docker disposable. Không log credential/body riêng tư."""
from pathlib import Path
import base64,collections,concurrent.futures,datetime,hashlib,json,os,re,subprocess,tempfile,time,uuid
import requests
ROOT=Path(__file__).resolve().parents[3];EV=ROOT/'docs/backend-audit/evidence'
WORK=Path(tempfile.gettempdir())/'bakery-backend-audit-20261107'
PRIVATE=json.loads((WORK/'runtime-private.json').read_text());SPEC=json.loads((WORK/'runtime-compose.json').read_text())
PROJECT=PRIVATE['project'];assert PROJECT=='bakery-audit-20261107'
DB=PROJECT+'-audit-db-1';api=json.loads((EV/'api-inventory.json').read_text(encoding='utf-8'));BYID={x['id']:x for x in api}
cases=json.loads((EV/'runtime-cases.json').read_text(encoding='utf-8')) if (EV/'runtime-cases.json').exists() else []
statefile=WORK/'test-state.json';state=json.loads(statefile.read_text()) if statefile.exists() else {'run':uuid.uuid4().hex[:10],'actors':{},'ids':{}}
def persist():
    statefile.write_text(json.dumps(state),encoding='utf-8')
    subprocess.run(['icacls',str(statefile),'/inheritance:r','/grant:r',subprocess.check_output(['whoami'],text=True).strip()+':F','/grant:r','*S-1-5-18:F'],capture_output=True,check=True)
    (EV/'runtime-cases.json').write_text(json.dumps(cases,ensure_ascii=False,indent=2),encoding='utf-8')
def sql(service,query):
    c=json.loads(subprocess.check_output(['docker','inspect',DB]))[0]
    assert c['Config']['Labels']['com.docker.compose.project']==PROJECT
    r=subprocess.run(['docker','exec','-i',DB,'psql','-X','-Atq','-v','ON_ERROR_STOP=1','-U','audit_admin','-d',PRIVATE['dbUsers'][service]['database']],input=query,text=True,capture_output=True)
    if r.returncode:raise RuntimeError('SQL fixture audit thất bại: '+r.stderr[:500])
    return r.stdout.strip()
def bodydata(r):
    try:d=r.json();return d.get('data',d) if isinstance(d,dict) else d
    except Exception:return None
def call(aid,name,actor=None,expected=(200,),params=None,payload=None,headers=None,files=None,cookies=None,kind='BUSINESS',check=None):
    op=BYID[aid];path=op['path']
    for k,v in (params or {}).items():path=path.replace('{'+k+'}',str(v))
    if '{id}' in path:
        for alias in ['offerId','requestId','cakeRequestId','userId']:
            if alias in (params or {}):path=path.replace('{id}',str(params[alias]));break
    path=re.sub(r'\{[^}]+\}',str(uuid.UUID(int=0)),path)
    url=f"http://127.0.0.1:{PRIVATE['ports'][op['module']]}"+path
    assert url.startswith('http://127.0.0.1:1809')
    h={'X-Correlation-Id':'audit-'+str(uuid.uuid4())};h.update(headers or {})
    if actor:h['Authorization']='Bearer '+state['actors'][actor]['token']
    started=time.monotonic()
    try:
        r=requests.request(op['method'],url,json=payload if files is None else None,files=files,headers=h,cookies=cookies,timeout=25)
        passed=r.status_code in expected and (check(r) if check else True)
        data=bodydata(r);shape=sorted(data) if isinstance(data,dict) else type(data).__name__
        # Chỉ giữ cấu trúc, status và lỗi nghiệp vụ không chứa dữ liệu người dùng.
        error=None
        if r.status_code>=400:
            try:
                message=r.json().get('message','')
                if len(message)<250 and not any(x in message.lower() for x in ['@','bearer','select ','insert ','jdbc:']):error=message
            except Exception:pass
        row={'caseId':f'TC-{len(cases)+1:04}','api':aid,'name':name,'actor':actor or 'anonymous','kind':kind,'expectedStatus':list(expected),'actualStatus':r.status_code,'result':'PASS' if passed else 'FAIL','elapsedMs':round((time.monotonic()-started)*1000),'responseShape':shape,'error':error}
    except requests.RequestException as e:
        r=None;row={'caseId':f'TC-{len(cases)+1:04}','api':aid,'name':name,'kind':kind,'actor':actor or 'anonymous','result':'ERROR','errorType':type(e).__name__}
    cases.append(row);persist()
    print(json.dumps({k:row[k] for k in ['caseId','api','name','result']},ensure_ascii=True),flush=True)
    return r
def idof(r):
    d=bodydata(r)
    if not isinstance(d,dict) or not d.get('id'):raise RuntimeError('Fixture API không trả id; xem runtime-cases, không in body.')
    return d['id']
def key():return {'Idempotency-Key':str(uuid.uuid4())}
def future(days):return (datetime.datetime.now(datetime.timezone.utc)+datetime.timedelta(days=days)).isoformat()
def png():return base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aN1cAAAAASUVORK5CYII=')
def metadata(data):return {'metadata':(None,json.dumps(data),'application/json')}
def login(alias):
    a=state['actors'][alias];r=call('IDN-002','Đăng nhập '+alias,payload={'email':a['email'],'password':PRIVATE['userPassword']})
    if r.status_code!=200:raise RuntimeError('Login fixture failed')
    a['token']=bodydata(r)['accessToken'];a['cookies']=r.cookies.get_dict();persist()
def bootstrap():
    if not any(c['kind']=='ANONYMOUS_SURFACE' for c in cases):
        for op in api:
            if op['module']=='cake-ai-service':continue
            public=op['id'] in ['IDN-001','BKR-004','BKR-008','BKR-034','BKR-035','SUB-013','SUB-014','SUB-015']
            expected=(200,404) if public else (400,401,403,415)
            call(op['id'],'Kiểm tra bề mặt khi chưa đăng nhập',expected=expected,payload={} if op['method'] not in ['GET','DELETE'] else None,kind='ANONYMOUS_SURFACE')
    for alias in ['admin','ownerA','ownerB','customerA','customerB']:
        if alias not in state['actors']:
            email=f'{alias.lower()}.{state["run"]}@audit.invalid';state['actors'][alias]={'email':email}
            r=call('IDN-006','Tạo tài khoản tổng hợp '+alias,expected=(201,),payload={'email':email,'password':PRIVATE['userPassword'],'displayName':'Audit '+alias,'phoneNumber':'0900000000'})
            # register returns user summary, id may be obtained through JWT subject after login.
            login(alias)
            a=state['actors'][alias];claims=json.loads(base64.urlsafe_b64decode(a['token'].split('.')[1]+'=='));a['id']=claims['sub'];persist()
    aid=state['actors']['admin']['id']
    sql('identity-service',f"INSERT INTO user_roles(user_id,role_id) SELECT '{aid}',id FROM roles WHERE code='ADMIN' ON CONFLICT DO NOTHING;")
    login('admin')
    for alias in ['customerA','customerB']:
        if 'address' not in state['actors'][alias]:
            a=state['actors'][alias];address=str(uuid.uuid4())
            sql('identity-service',f"INSERT INTO user_addresses(id,user_id,label,recipient_name,recipient_phone,address_line,district,city,is_default) VALUES ('{address}','{a['id']}','Audit','Synthetic','0900000000','Synthetic address','AuditDistrict','AuditCity',true);")
            a['address']=address;persist()
def bakery_flow():
    ids=state['ids'];ops={'addresses':[{'addressLine':'Synthetic bakery','district':'AuditDistrict','city':'AuditCity','isPrimary':True}], 'serviceAreas':[{'city':'AuditCity','district':'AuditDistrict','deliveryFee':10000,'minimumOrder':0,'active':True}], 'businessHours':[{'dayOfWeek':1,'opensAt':'08:00','closesAt':'20:00','closed':False}]}
    if 'plan' not in ids:
        r=call('SUB-005','Admin tạo gói ACTIVE','admin',(201,),payload={'code':'AUDIT-'+state['run'],'name':'Audit monthly','monthlyPrice':100000,'currency':'VND','billingPeriodMonths':1,'status':'ACTIVE','features':{'maxProducts':'100','maxAiGenerations':'10'}});ids['plan']=idof(r);persist()
    for alias in ['ownerA','ownerB']:
        if alias+'Bakery' in ids:continue
        call('BKR-006','Onboarding ban đầu','%s'%alias,(200,))
        r=call('BKR-007','CUSTOMER gửi onboarding',alias,(201,200),payload={'name':'Audit Bakery '+alias,'phoneNumber':'0900000000','operations':ops});bakery=idof(r);ids[alias+'Bakery']=bakery;persist()
        call('BKR-003','Admin duyệt bakery ACTIVE','admin',params={'bakeryId':bakery},payload={'status':'ACTIVE'})
        r=call('SUB-010','Tạo đơn thuê bao',alias,(201,),params={'bakeryId':bakery},payload={'planId':ids['plan']},headers=key());order=idof(r)
        headers=key();p={'paymentMethod':'BANK_TRANSFER','paymentReference':'AUDIT-'+str(uuid.uuid4()),'amount':100000,'currency':'VND'}
        r=call('SUB-012','Gửi chứng từ nội bộ tổng hợp, không chuyển tiền',alias,(201,),params={'orderId':order},headers=headers,files=metadata(p));payment=idof(r)
        call('SUB-002','Admin xác nhận chứng từ tổng hợp','admin',params={'paymentId':payment},payload={'reviewNote':'Audit fixture only'},headers=key())
        call('BKR-022','Hoàn tất cấp OWNER',alias,(204,),params={'bakeryId':bakery})
        login(alias)
    bakery=ids['ownerABakery'];bp={'bakeryId':bakery}
    for aid,actor,params in [('BKR-001','admin',{}),('BKR-002','admin',bp),('BKR-004',None,{}),('BKR-008',None,bp),('BKR-021','ownerA',bp),('BKR-006','ownerA',{}),('SUB-013',None,{}),('SUB-014','ownerA',{}),('SUB-015',None,{'planId':ids['plan']}),('SUB-004','admin',{}),('SUB-001','admin',{}),('SUB-008','ownerA',bp),('SUB-009','ownerA',bp)]:call(aid,'Đọc dữ liệu fixture thật',actor,params=params)
    call('BKR-009','Chủ tiệm khác sửa bakery bị từ chối','ownerB',(403,),params=bp,payload={'name':'forbidden'})
    call('BKR-009','Chủ tiệm cập nhật profile','ownerA',params=bp,payload={'description':'Synthetic audit'})
    call('BKR-023','Thay thế lịch/địa chỉ/phạm vi giao','ownerA',params=bp,payload=ops)
    for aid in ['BKR-019','BKR-020']:call(aid,'Upload PNG thật vào MinIO audit','ownerA',(201,),params=bp,files={'file':('audit.png',png(),'image/png')})
    catalog_flow()
def catalog_flow():
    ids=state['ids'];bp={'bakeryId':ids['ownerABakery']}
    if 'product' not in ids:
        r=call('BKR-016','Tạo danh mục đủ slug','ownerA',(201,),params=bp,payload={'name':'Audit cakes','slug':'audit-'+state['run'],'sortOrder':0});ids['category']=idof(r)
        r=call('BKR-025','Tạo sản phẩm DRAFT','ownerA',(201,),params=bp,payload={'categoryId':ids['category'],'name':'Audit cake','slug':'audit-'+state['run'],'basePrice':200000,'customizable':True,'minimumNoticeHours':0});ids['product']=idof(r);persist()
    if 'addon' not in ids:
        r=call('BKR-011','Tạo add-on đủ category','ownerA',(201,),params=bp,payload={'name':'Audit candle','category':'CANDLE','price':5000,'active':True});ids['addon']=idof(r);persist()
    pp={**bp,'productId':ids['product']};ap={**bp,'addOnId':ids['addon']};cp={**bp,'categoryId':ids['category']}
    for aid in ['BKR-010','BKR-015','BKR-024']:call(aid,'Danh sách quản trị bakery','ownerA',params=bp)
    call('BKR-018','Sửa danh mục','ownerA',params=cp,payload={'name':'Audit updated'})
    call('BKR-013','Sửa add-on','ownerA',params=ap,payload={'description':'Synthetic'})
    call('BKR-014','Upload ảnh add-on','ownerA',(201,),params=ap,files={'file':('audit.png',png(),'image/png')})
    call('BKR-026','Sửa product','ownerA',params=pp,payload={'description':'Synthetic'})
    call('BKR-031','Thay thế options rỗng hợp lệ','ownerA',params=pp,payload={'groups':[]})
    r=call('BKR-029','Upload ảnh primary sản phẩm','ownerA',(201,),params=pp,files=[('files',('audit.png',png(),'image/png')),('primaryIndex',(None,'0'))])
    call('BKR-032','Publish sau entitlement và primary image','ownerA',params=pp)
    call('BKR-034','Danh sách sản phẩm public')
    call('BKR-035','Chi tiết sản phẩm public',params={'productId':ids['product']})
    call('SUB-006','Sửa gói không ảnh hưởng snapshot đơn','admin',params={'planId':ids['plan']},payload={'description':'Synthetic update'})
def marketplace_flow():
    ids=state['ids'];bakery=ids['ownerABakery']
    if 'request' not in ids:
        r=call('MKT-002','CUSTOMER tạo RFQ OPEN_CUSTOM draft','customerA',(201,),payload={'requestType':'OPEN_CUSTOM','title':'Audit cake request','description':'Synthetic only','neededAt':future(7),'offerDeadline':future(3),'deliveryDistrict':'AuditDistrict','deliveryCity':'AuditCity','budgetMin':100000,'budgetMax':500000});ids['request']=idof(r);persist()
    rp={'requestId':ids['request'],'cakeRequestId':ids['request']}
    call('MKT-004','Sửa draft','customerA',params=rp,payload={'title':'Audit updated request'})
    call('MKT-003','Khách khác không đọc request riêng','customerB',(404,403),params=rp)
    call('MKT-009','Publish RFQ','customerA',params=rp)
    call('MKT-001','Customer mine','customerA')
    call('MKT-003','Chủ tiệm đọc OPEN trong service area','ownerA',params=rp)
    call('MKT-006','Upload cần Firebase chưa cấu hình','customerA',(503,),params=rp,files={'files':('audit.png',png(),'image/png')})
    offerdata={'bakeryId':bakery,'message':'Synthetic offer','cakePrice':200000,'deliveryFee':10000,'estimatedCompletionAt':future(6),'expiresAt':future(2),'items':[]}
    if 'offer' not in ids:
        r=call('MKT-008','Owner gửi offer thật','ownerA',(201,),params=rp,payload=offerdata);ids['offer']=idof(r);persist()
    op={'offerId':ids['offer']};call('MKT-012','Chi tiết offer','customerA',params=op);call('MKT-011','Danh sách offer','ownerA')
    call('MKT-013','Sửa giá offer pending','ownerA',params=op,payload={'message':'Synthetic updated'})
    if 'conversation' not in ids:
        r=call('CHT-002','Tạo conversation theo request/offer','customerA',(201,200),payload={'cakeRequestId':ids['request'],'bakeryId':bakery});ids['conversation']=idof(r);persist()
    conv={'conversationId':ids['conversation']}
    call('CHT-001','Danh sách conversation','customerA');call('CHT-003','Chủ tiệm join/read conversation','ownerA',params=conv)
    call('CHT-003','Khách khác bị che conversation','customerB',(404,),params=conv)
    if 'message' not in ids:
        message={'clientMessageId':str(uuid.uuid4()),'messageType':'TEXT','content':'Synthetic audit message'}
        r=call('CHT-006','Gửi TEXT multipart','customerA',(201,),params=conv,files=metadata(message));ids['message']=idof(r);state['messagePayload']=message;persist()
    call('CHT-006','Replay clientMessageId giống payload','customerA',(200,),params=conv,files=metadata(state['messagePayload']))
    call('CHT-006','Replay clientMessageId khác payload','customerA',(409,),params=conv,files=metadata({**state['messagePayload'],'content':'different'}))
    call('CHT-005','Đọc message và đánh dấu delivered','ownerA',params=conv)
    call('CHT-008','Mark read','ownerA',params=conv,payload={'throughMessageId':ids['message']})
    call('CHT-007','Sender xóa mềm message','customerA',(204,),params={**conv,'messageId':ids['message']})
    call('CHT-004','CUSTOMER không được đóng chat','customerA',(404,403),params=conv,payload={'reason':'Audit'})
    call('CHT-004','OWNER đóng chat','ownerA',params=conv,payload={'reason':'Audit'})
    # Confirm direct-contract defect against real identity and bakery.
    call('ORD-003','Direct order với địa chỉ hợp lệ từ Identity','customerA',(201,),payload={'bakeryId':bakery,'productId':ids['product'],'quantity':1,'deliveryAddressId':state['actors']['customerA']['address'],'requestedDeliveryAt':future(7),'optionSelections':[],'addOns':[]},headers=key())
    accept={'deliveryAddressId':state['actors']['customerA']['address'],'deliveryNote':'Synthetic'}
    ak=state.setdefault('acceptKey',str(uuid.uuid4()));persist()
    r=call('MKT-014','Accept offer tạo order thật xuyên 4 service','customerA',params=op,payload=accept,headers={'Idempotency-Key':ak})
    d=bodydata(r)
    if isinstance(d,dict):
        ids['acceptedResponse']=d
        order=d.get('orderId') or (d.get('order') or {}).get('id')
        if order:ids['order']=order
        persist()
    call('MKT-014','Replay acceptance giống key','customerA',params=op,payload=accept,headers={'Idempotency-Key':ak})
def order_flow():
    ids=state['ids'];call('ORD-002','Customer đọc danh sách đơn','customerA')
    if 'order' not in ids:
        found=sql('order-service',"SELECT id FROM customer_orders ORDER BY created_at DESC LIMIT 1;")
        if found:ids['order']=found;persist()
    if 'order' not in ids:return
    op={'orderId':ids['order']}
    call('ORD-004','Đọc order snapshots','customerA',params=op)
    call('ORD-004','Khách khác không đọc order','customerB',(404,403),params=op)
    call('ORD-007','Review trước COMPLETED bị chặn','customerA',(409,422),params=op,payload={'rating':5,'comment':'Synthetic'})
    call('ORD-008','Customer không tự hoàn tất đơn','customerA',(403,),params=op,payload={'targetStatus':'COMPLETED'})
    for target in ['CONFIRMED','BAKING','READY','DELIVERING','COMPLETED']:call('ORD-008','Owner chuyển trạng thái '+target,'ownerA',params=op,payload={'targetStatus':target})
    call('ORD-007','Tạo review khi COMPLETED','customerA',(201,),params=op,payload={'rating':5,'comment':'Synthetic'})
    call('ORD-007','Review trùng order','customerA',(409,),params=op,payload={'rating':5})
    call('ORD-006','Cập nhật review','customerA',params=op,payload={'rating':4,'comment':'Synthetic updated'})
    call('ORD-001','Admin ẩn review','admin',params=op,payload={'status':'HIDDEN'})
    call('ORD-005','Customer xóa review mềm','customerA',(204,),params=op)
if __name__=='__main__':
    import sys
    phase=sys.argv[1] if len(sys.argv)>1 else 'bootstrap'
    {'bootstrap':bootstrap,'bakery':bakery_flow,'catalog':catalog_flow,'marketplace':marketplace_flow,'orders':order_flow}[phase]()
    print(json.dumps({'phase':phase,'cases':len(cases),'pass':sum(c['result']=='PASS' for c in cases),'fail':sum(c['result']=='FAIL' for c in cases)}))
