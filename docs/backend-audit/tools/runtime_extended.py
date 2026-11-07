"""Bổ sung nhánh lỗi, nội bộ, replay, cạnh tranh; tái dùng fixture đã xác minh."""
from runtime_cases import *
for alias in state['actors']:login(alias)
ids=state['ids'];bp={'bakeryId':ids['ownerABakery']};rp={'id':ids['request']};op={'offerId':ids['offer']};cp={'conversationId':ids['conversation']}
def service_token(client,audience,scope):
    env=SPEC['services'][client]['environment']
    names={'marketplace-service':('SERVICE_CLIENT_ID','SERVICE_CLIENT_SECRET'),'order-service':('ORDER_SERVICE_CLIENT_ID','ORDER_SERVICE_CLIENT_SECRET'),'chat-service':('CHAT_SERVICE_CLIENT_ID','CHAT_SERVICE_CLIENT_SECRET'),'bakery-service':(None,'BAKERY_CLIENT_SECRET'),'subscription-service':(None,'SUBSCRIPTION_CLIENT_SECRET')}
    n,s=names[client];r=call('IDN-007','Cấp service token: '+client+' -> '+audience,payload={'clientId':env[n] if n else client,'clientSecret':env[s],'audience':audience,'scope':scope})
    if r.status_code!=200:raise RuntimeError('Service token audit failed')
    return {'Authorization':'Bearer '+bodydata(r)['accessToken']}
call('SUB-014','Payment options public theo matcher thực tế',expected=(200,))
for alias in ['ownerA','ownerB']:call('BKR-022','Complete idempotent trả 204',alias,(204,),params={'bakeryId':ids[alias+'Bakery']})
call('IDN-004','JWT me','customerA')
cookies=state['actors']['customerB']['cookies']
r=call('IDN-005','Refresh rotation cookie',cookies=cookies)
newcookies=r.cookies.get_dict()
call('IDN-005','Replay refresh cũ bị từ chối, revoke family',cookies=cookies,expected=(401,))
call('IDN-005','Token con sau replay cũng bị thu hồi',cookies=newcookies,expected=(401,))
login('customerB');call('IDN-003','Logout xóa refresh cookie','customerB',expected=(204,),cookies=state['actors']['customerB']['cookies'])
call('IDN-004','Access JWT còn hiệu lực sau logout','customerB')
call('IDN-002','Sai mật khẩu trả 401',expected=(401,),payload={'email':state['actors']['customerA']['email'],'password':'invalid-'+str(uuid.uuid4())})
call('IDN-006','Email trùng trả 409',expected=(409,),payload={'email':state['actors']['customerA']['email'],'password':PRIVATE['userPassword'],'displayName':'Duplicate'})
call('BKR-001','Customer không vào admin','customerA',(403,))
for aid,client,aud,scope,params,payload,expected in [
 ('BKR-036','order-service','bakery-service','bakery:profile:read',bp,None,(200,)),
 ('BKR-037','chat-service','bakery-service','bakery:membership:read',{**bp,'userId':state['actors']['ownerA']['id']},None,(200,)),
 ('BKR-042','order-service','bakery-service','bakery:membership:read',{'userId':state['actors']['ownerA']['id']},None,(200,)),
 ('BKR-038','subscription-service','bakery-service','bakery:onboarding:activate',bp,None,(204,)),
 ('BKR-041','order-service','bakery-service','bakery:catalog:quote',{}, {'bakeryId':bp['bakeryId'],'productId':ids['product'],'quantity':1,'deliveryCity':'AuditCity','deliveryDistrict':'AuditDistrict','optionSelections':[],'addOns':[]},(200,)),
 ('IDN-008','order-service','identity-service','identity:user:read',{'userId':state['actors']['customerA']['id']},None,(200,)),
 ('IDN-010','order-service','identity-service','identity:address:read',{'userId':state['actors']['customerA']['id'],'addressId':state['actors']['customerA']['address']},None,(200,)),
 ('IDN-009','bakery-service','identity-service','identity:bakery-owner:grant',{'userId':state['actors']['ownerA']['id']},None,(204,)),
 ('SUB-016','bakery-service','subscription-service','subscription:entitlement:read',bp,None,(200,)),
 ('MKT-016','chat-service','marketplace-service','marketplace:request:chat:authorize',rp,None,(200,400,422)),
 ('MKT-018','order-service','marketplace-service','marketplace:offer:read',{'id':ids['offer']},None,(200,)),
 ('ORD-009','marketplace-service','order-service','order:create-from-offer',{}, {'offerId':ids['offer'],'cakeRequestId':ids['request'],'customerId':state['actors']['customerA']['id'],'deliveryAddressId':state['actors']['customerA']['address'],'deliveryNote':'Synthetic'},(200,201))]:
    h=service_token(client,aud,scope)
    if aid=='ORD-009':h['Idempotency-Key']='accept-offer:'+ids['offer']
    r=call(aid,'Service contract với JWT đúng scope',headers=h,params=params,payload=payload,expected=expected)
    if aid=='IDN-010':
        data=bodydata(r);(EV/'address-contract-check.json').write_text(json.dumps({'identityResponseKeys':sorted(data),'hasId':'id' in data,'typedOrderRequiresId':True,'source':'IdentityClient.AddressResponse / OrderCreationServiceImpl.validateAddress'}),encoding='utf-8')
    if aid=='BKR-036':call(aid,'User token không thay service token','customerA',(401,403),params=params)
    if aid=='SUB-016':
        # Remove correlation using raw request; call() intentionally always supplies it.
        response=requests.get('http://127.0.0.1:18094'+BYID[aid]['path'].replace('{bakeryId}',bp['bakeryId']),headers=h,timeout=10)
        cases.append({'caseId':f'TC-{len(cases)+1:04}','api':aid,'name':'Service token thiếu X-Correlation-Id','kind':'SECURITY','actor':'service','actualStatus':response.status_code,'expectedStatus':[403],'result':'PASS' if response.status_code==403 else 'FAIL'});persist()
# Chat source allows the conversation customer to close; first expectation was wrong.
call('CHT-004','Customer sở hữu được đóng conversation theo source','customerA',params=cp,payload={'reason':'Synthetic'})
call('CHT-005','Tái hiện lỗi trang đầu không before','customerA',expected=(200,),params=cp)
before=base64.urlsafe_b64encode((future(30)+'|'+str(uuid.UUID(int=(1<<128)-1))).encode()).decode().rstrip('=')
call('CHT-005','Cursor có timestamp tránh bind NULL','customerA',params=cp,headers={},check=lambda r:True) if False else None
url=f"http://127.0.0.1:18097/api/v1/conversations/{ids['conversation']}/messages?before={before}"
r=requests.get(url,headers={'Authorization':'Bearer '+state['actors']['customerA']['token']},timeout=15)
cases.append({'caseId':f'TC-{len(cases)+1:04}','api':'CHT-005','name':'Cursor non-null phân lập lỗi SQL null','kind':'DIAGNOSTIC','actualStatus':r.status_code,'expectedStatus':[200],'result':'PASS' if r.status_code==200 else 'FAIL'});persist()
# Isolated draft to test storage without state precondition stopping first.
draft={'requestType':'OPEN_CUSTOM','title':'Audit auxiliary','description':'Synthetic','neededAt':future(8),'offerDeadline':future(4),'deliveryDistrict':'AuditDistrict','deliveryCity':'AuditCity'}
r=call('MKT-002','Draft phụ cho nhánh hủy/ảnh','customerA',(201,),payload=draft);rid=idof(r)
call('MKT-006','Firebase không cấu hình trên draft hợp lệ','customerA',(503,),params={'id':rid},files={'files':('audit.png',png(),'image/png')})
call('MKT-010','Chọn design khi AI unavailable','customerA',(503,),params={'id':rid},payload={'generatedDesignId':str(uuid.uuid4())})
call('MKT-007','Xóa ảnh không tồn tại','customerA',(404,),params={'id':rid,'imageId':str(uuid.uuid4())})
call('MKT-005','Hủy draft hợp lệ','customerA',params={'id':rid},payload={'reason':'Synthetic'})
call('MKT-004','Không sửa request CANCELLED','customerA',(409,),params={'id':rid},payload={'title':'illegal'})
call('MKT-014','Không tái sử dụng acceptance key khác payload','customerA',(409,),params=op,headers={'Idempotency-Key':state['acceptKey']},payload={'deliveryAddressId':state['actors']['customerA']['address'],'deliveryNote':'Different'})
# Concurrent acceptance replay on existing successful workflow: no new business writes expected.
def replay(_):
    return requests.post('http://127.0.0.1:18093/api/v1/offers/'+ids['offer']+'/accept',headers={'Authorization':'Bearer '+state['actors']['customerA']['token'],'Idempotency-Key':state['acceptKey'],'X-Correlation-Id':'audit-concurrent'},json={'deliveryAddressId':state['actors']['customerA']['address'],'deliveryNote':'Synthetic'},timeout=20).status_code
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:statuses=list(pool.map(replay,range(4)))
count=sql('order-service',f"SELECT count(*) FROM customer_orders WHERE offer_id='{ids['offer']}';")
cases.append({'caseId':f'TC-{len(cases)+1:04}','api':'MKT-014','name':'4 replay song song, chỉ 1 order/offer','kind':'CONCURRENCY','actualStatuses':statuses,'orderCount':int(count),'result':'PASS' if statuses==[200]*4 and count=='1' else 'FAIL'});persist()
print(json.dumps({'cases':len(cases),'pass':sum(c['result']=='PASS' for c in cases),'failed':sum(c['result']=='FAIL' for c in cases)}))
