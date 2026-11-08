"""Những nhánh còn thiếu; không chạy lại bootstrap hoặc các flow đã hoàn tất."""
from runtime_cases import *
ids=state['ids'];bp={'bakeryId':ids['ownerABakery']}
for alias in ['admin','ownerA','customerA']:login(alias)
def st(client,audience,scope):
    env=SPEC['services'][client]['environment'];n,s={'marketplace-service':('SERVICE_CLIENT_ID','SERVICE_CLIENT_SECRET'),'order-service':('ORDER_SERVICE_CLIENT_ID','ORDER_SERVICE_CLIENT_SECRET'),'chat-service':('CHAT_SERVICE_CLIENT_ID','CHAT_SERVICE_CLIENT_SECRET'),'bakery-service':(None,'BAKERY_CLIENT_SECRET')}[client]
    r=call('IDN-007','Service token cho nhánh bổ sung',payload={'clientId':env[n] if n else client,'clientSecret':env[s],'audience':audience,'scope':scope})
    return {'Authorization':'Bearer '+bodydata(r)['accessToken']}
for aid,scope,params,expected in [('IDN-008','identity:user:read',{'id':state['actors']['customerA']['id']},(200,)),('IDN-009','identity:bakery-owner:grant',{'id':state['actors']['ownerA']['id']},(204,))]:
    call(aid,'Internal UUID đúng route template',params=params,headers=st('bakery-service','identity-service',scope),expected=expected)
call('IDN-003','Logout controller thực trả 200','customerA',(200,),cookies=state['actors']['customerA']['cookies'])
login('customerA')
mkth=st('marketplace-service','bakery-service','bakery:catalog:quote')
for aid in ['BKR-039','BKR-040']:
    call(aid,'Quote nội bộ đúng dạng Marketplace',headers=mkth,payload={'bakeryId':bp['bakeryId'],'productId':ids['product'] if aid=='BKR-040' else None,'deliveryCity':'AuditCity','deliveryDistrict':'AuditDistrict','optionSelections':[],'addOns':[{'addOnId':ids['addon'],'quantity':2}]})
call('MKT-016','Chat authorization query đủ customer và bakery',headers=st('chat-service','marketplace-service','marketplace:request:chat:authorize'),params={'id':ids['request']},payload=None,expected=(400,)) if False else None
# Query string is not an API path parameter; use request URL suffix through small helper.
def query_case(aid,name,query,headers,params):
    a=BYID[aid];path=a['path']
    for k,v in params.items():path=path.replace('{'+k+'}',v)
    r=requests.get(f"http://127.0.0.1:{PRIVATE['ports'][a['module']]}"+path,params=query,headers={**headers,'X-Correlation-Id':'audit-final'},timeout=15)
    cases.append({'caseId':f'TC-{len(cases)+1:04}','api':aid,'name':name,'kind':'BUSINESS','actualStatus':r.status_code,'expectedStatus':[200],'result':'PASS' if r.status_code==200 else 'FAIL'});persist();return r
query_case('MKT-016','Chat authorization đủ query',{'customerId':state['actors']['customerA']['id'],'bakeryId':bp['bakeryId']},st('chat-service','marketplace-service','marketplace:request:chat:authorize'),{'id':ids['request']})
call('ORD-009','Replay from-offer giữ note null đúng fingerprint',headers={**st('marketplace-service','order-service','order:create-from-offer'),'Idempotency-Key':'accept-offer:'+ids['offer']},payload={'offerId':ids['offer'],'cakeRequestId':ids['request'],'customerId':state['actors']['customerA']['id'],'deliveryAddressId':state['actors']['customerA']['address']},expected=(200,))
call('MKT-014','Cùng key khác customerNote thực sự trả 409','customerA',(409,),params={'id':ids['offer']},headers={'Idempotency-Key':state['acceptKey']},payload={'deliveryAddressId':state['actors']['customerA']['address'],'customerNote':'Changed known field'})
# Legacy bakery path and approval; no replacement of existing fixture.
r=call('BKR-005','OWNER hiện hữu tạo bakery DRAFT thứ hai','ownerA',(201,),payload={'name':'Audit legacy bakery','phoneNumber':'0900000000'});bid=idof(r)
operations={'addresses':[{'addressLine':'Synthetic','district':'AuditDistrict','city':'AuditCity','isPrimary':True}],'serviceAreas':[{'city':'AuditCity','district':'AuditDistrict','deliveryFee':0,'minimumOrder':0,'active':True}],'businessHours':[]}
call('BKR-023','Chuẩn bị legacy bakery để submit','ownerA',params={'bakeryId':bid},payload=operations)
call('BKR-033','Submit DRAFT legacy hợp lệ','ownerA',params={'bakeryId':bid})
# Additional subscription order, rejection and period snapshots.
r=call('SUB-010','Tạo đơn gia hạn sau kỳ đang active','ownerA',(201,),params=bp,payload={'planId':ids['plan']},headers=key());sid=idof(r)
call('SUB-011','Chi tiết đơn thuê bao mới','ownerA',params={'orderId':sid})
r=call('SUB-012','Nộp payment để kiểm nhánh reject','ownerA',(201,),params={'orderId':sid},headers=key(),files=metadata({'paymentMethod':'BANK_TRANSFER','paymentReference':'AUDIT-'+str(uuid.uuid4()),'amount':100000,'currency':'VND'}));pid=idof(r)
call('SUB-003','Admin reject có lý do','admin',params={'paymentId':pid},payload={'reviewNote':'Synthetic rejected proof'})
call('SUB-002','Không approve payment đã rejected','admin',(409,),params={'paymentId':pid},headers=key(),payload={'reviewNote':'invalid'})
r=call('SUB-012','Nộp lại sau reject','ownerA',(201,),params={'orderId':sid},headers=key(),files=metadata({'paymentMethod':'BANK_TRANSFER','paymentReference':'AUDIT-'+str(uuid.uuid4()),'amount':100000,'currency':'VND'}));pid=idof(r)
call('SUB-002','Approve gia hạn tạo kỳ SCHEDULED','admin',params={'paymentId':pid},headers=key(),payload={'reviewNote':'Synthetic renewal'})
# A second request for withdrawal; doesn't affect completed accepted offer.
draft={'requestType':'OPEN_CUSTOM','title':'Withdrawal branch','description':'Synthetic','neededAt':future(9),'deliveryDistrict':'AuditDistrict','deliveryCity':'AuditCity'}
r=call('MKT-002','Draft cho withdrawal','customerA',(201,),payload=draft);rid=idof(r)
call('MKT-009','Publish request withdrawal','customerA',params={'id':rid})
offer={'bakeryId':bp['bakeryId'],'cakePrice':100000,'deliveryFee':10000,'estimatedCompletionAt':future(7),'expiresAt':future(5),'items':[]}
r=call('MKT-008','Offer cho nhánh withdraw','ownerA',(201,),params={'id':rid},payload=offer);oid=idof(r)
call('MKT-015','OWNER rút offer PENDING','ownerA',params={'id':oid},payload={'reason':'Synthetic'})
call('MKT-008','Unique vẫn chặn tạo lại sau WITHDRAWN','ownerA',(409,),params={'id':rid},payload=offer)
# Catalog lifecycle operations performed last, after all quote-dependent tests.
pp={**bp,'productId':ids['product']}
call('BKR-028','Ẩn sản phẩm đã PUBLISHED','ownerA',params=pp)
call('BKR-027','Archive sản phẩm HIDDEN','ownerA',params=pp)
call('BKR-032','Không publish lại ARCHIVED','ownerA',(409,),params=pp)
image=sql('bakery-service',f"SELECT id FROM product_images WHERE product_id='{ids['product']}' LIMIT 1;")
if image:call('BKR-030','Xóa ảnh trên sản phẩm archive','ownerA',(204,),params={**pp,'imageId':image})
call('BKR-012','Disable add-on','ownerA',(204,),params={**bp,'addOnId':ids['addon']})
r=call('BKR-016','Danh mục rỗng để xóa','ownerA',(201,),params=bp,payload={'name':'Disposable','slug':'disposable-'+uuid.uuid4().hex});cid=idof(r)
call('BKR-017','Xóa danh mục không có sản phẩm','ownerA',(204,),params={**bp,'categoryId':cid})
call('SUB-007','Archive plan, giữ nguyên subscription snapshot','admin',params={'planId':ids['plan']})
# DB assertions contain only booleans/counts, never user data.
checks={
'one_order_per_offer':sql('order-service',f"SELECT count(*)=1 FROM customer_orders WHERE offer_id='{ids['offer']}';"),
'order_completed':sql('order-service',f"SELECT status='COMPLETED' AND completed_at IS NOT NULL FROM customer_orders WHERE id='{ids['order']}';"),
'amount_equals_sum_plus_delivery':sql('order-service',f"SELECT o.total_amount=o.subtotal+o.delivery_fee AND o.subtotal=(SELECT sum(line_total) FROM order_items WHERE order_id=o.id) FROM customer_orders o WHERE o.id='{ids['order']}';"),
'acceptance_succeeded':sql('marketplace-service',f"SELECT status='SUCCEEDED' FROM offer_acceptance_workflows WHERE offer_id='{ids['offer']}';"),
'owner_role_granted':sql('identity-service',f"SELECT exists(SELECT 1 FROM user_roles ur JOIN roles r ON r.id=ur.role_id WHERE ur.user_id='{state['actors']['ownerA']['id']}' AND r.code='BAKERY_OWNER');"),
'scheduled_period_present':sql('subscription-service',f"SELECT count(*)>0 FROM bakery_subscriptions WHERE bakery_id='{bp['bakeryId']}' AND status='SCHEDULED';")}
(EV/'runtime-db-assertions.json').write_text(json.dumps(checks,indent=2),encoding='utf-8')
print(json.dumps({'cases':len(cases),'dbAssertions':checks}))
