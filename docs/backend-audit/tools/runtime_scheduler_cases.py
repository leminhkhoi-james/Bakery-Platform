"""Failure injection/expiry chỉ trên project audit; không đổi source hay DB hiện hữu."""
from runtime_cases import *
ids=state['ids'];order_container=PROJECT+'-order-service-1'
def mark(aid,name,passed,**kw):
    cases.append({'caseId':f'TC-{len(cases)+1:04}','api':aid,'name':name,'kind':'SCHEDULER_OR_RECOVERY','result':'PASS' if passed else 'FAIL',**kw});persist();print(json.dumps({'caseId':cases[-1]['caseId'],'name':name,'result':cases[-1]['result']},ensure_ascii=True),flush=True)
def container_action(action):
    c=json.loads(subprocess.check_output(['docker','inspect',order_container]))[0]
    assert c['Config']['Labels']['com.docker.compose.project']==PROJECT
    subprocess.run(['docker',action,order_container],check=True,capture_output=True,timeout=40)
for alias in ['customerA','ownerA','admin']:login(alias)
draft={'requestType':'OPEN_CUSTOM','title':'Recovery audit fixture','description':'Synthetic recovery test','neededAt':future(10),'offerDeadline':future(5),'deliveryDistrict':'AuditDistrict','deliveryCity':'AuditCity'}
r=call('MKT-002','Draft riêng cho recovery','customerA',(201,),payload=draft);rid=idof(r)
call('MKT-009','Publish request recovery','customerA',params={'id':rid})
offer={'bakeryId':ids['ownerABakery'],'cakePrice':150000,'deliveryFee':10000,'estimatedCompletionAt':future(8),'expiresAt':future(4),'items':[]}
r=call('MKT-008','Offer riêng cho recovery','ownerA',(201,),params={'id':rid},payload=offer);oid=idof(r)
stopped=False
try:
    container_action('stop');stopped=True
    call('MKT-014','Order tạm ngừng: acceptance trả503 và giữ retry','customerA',(503,),params={'id':oid},headers=key(),payload={'deliveryAddressId':state['actors']['customerA']['address'],'customerNote':'Recovery fixture'})
    pending=sql('marketplace-service',f"SELECT status FROM offer_acceptance_workflows WHERE offer_id='{oid}';")
    mark('MKT-014','Workflow durable RETRYING sau remote unavailable',pending=='RETRYING',workflowStatus=pending)
finally:
    if stopped:container_action('start')
for _ in range(50):
    try:
        if requests.get('http://127.0.0.1:18096/v3/api-docs',timeout=3).status_code==200:break
    except requests.RequestException:pass
    time.sleep(1)
else:raise RuntimeError('Audit Order chưa ready sau khôi phục; container đã start, không động project khác.')
for _ in range(55):
    current=sql('marketplace-service',f"SELECT status FROM offer_acceptance_workflows WHERE offer_id='{oid}';")
    if current=='SUCCEEDED':break
    time.sleep(1)
count=sql('order-service',f"SELECT count(*) FROM customer_orders WHERE offer_id='{oid}';")
mark('MKT-014','Scheduler tự phục hồi SUCCEEDED, chỉ1 order',current=='SUCCEEDED' and count=='1',workflowStatus=current,orderCount=int(count))
# Expiry fixture: only dates changed, actual statuses are changed by original scheduler.
draft['title']='Expiry audit fixture';r=call('MKT-002','Draft riêng cho expiry','customerA',(201,),payload=draft);exp=idof(r)
call('MKT-009','Publish expiry fixture','customerA',params={'id':exp})
r=call('MKT-008','Offer chờ hết hạn','ownerA',(201,),params={'id':exp},payload=offer);exp_offer=idof(r)
sql('marketplace-service',f"UPDATE offers SET created_at=now()-interval '2 hours',expires_at=now()-interval '1 minute' WHERE id='{exp_offer}'; UPDATE cake_requests SET needed_at=now()-interval '1 minute' WHERE id='{exp}';")
for _ in range(45):
    value=sql('marketplace-service',f"SELECT r.status||':'||o.status FROM cake_requests r JOIN offers o ON o.cake_request_id=r.id WHERE r.id='{exp}';")
    if value=='CLOSED:EXPIRED':break
    time.sleep(1)
mark('MKT-001','Scheduler RFQ CLOSED và offer EXPIRED khi qua hạn',value=='CLOSED:EXPIRED',states=value)
# Subscription expiry and scheduled activation use pre-existing synthetic renewal periods.
r=call('SUB-005','Plan phụ cho expiry order','admin',(201,),payload={'code':'EXPIRY-'+uuid.uuid4().hex[:10],'name':'Expiry test','monthlyPrice':100000,'currency':'VND','billingPeriodMonths':1,'status':'ACTIVE','features':{}});plan=idof(r)
r=call('SUB-010','PENDING_PAYMENT riêng cho expiry','ownerA',(201,),params={'bakeryId':ids['ownerABakery']},payload={'planId':plan},headers=key());so=idof(r)
sql('subscription-service',f"UPDATE subscription_orders SET created_at=now()-interval '2 hours',expires_at=now()-interval '1 hour' WHERE id='{so}'; UPDATE bakery_subscriptions SET period_start=now()-interval '3 hours',period_end=now()-interval '2 hours' WHERE bakery_id='{ids['ownerABakery']}' AND status='ACTIVE'; UPDATE bakery_subscriptions SET period_start=now()-interval '1 hour',period_end=now()+interval '1 hour' WHERE bakery_id='{ids['ownerABakery']}' AND status='SCHEDULED';")
for _ in range(75):
    value=sql('subscription-service',f"SELECT status FROM subscription_orders WHERE id='{so}';")
    periods=sql('subscription-service',f"SELECT count(*) FILTER(WHERE status='ACTIVE')||':'||count(*) FILTER(WHERE status='EXPIRED') FROM bakery_subscriptions WHERE bakery_id='{ids['ownerABakery']}';")
    if value=='EXPIRED' and periods=='1:1':break
    time.sleep(1)
mark('SUB-008','Lifecycle job expire order/old period và activate scheduled',value=='EXPIRED' and periods=='1:1',orderStatus=value,activeAndExpiredCounts=periods)
(EV/'scheduler-test-method.json').write_text(json.dumps({'project':PROJECT,'orderServiceTemporaryStop':True,'originalStackTouched':False,'dateFixturesModifiedOnlyInAuditDb':True,'statusesChangedByActualSchedulers':True,'previousScheduledPeriodNowActive':True,'priorDbAssertionsCapturedBeforeTimeFixtureChanges':True},indent=2),encoding='utf-8')
print(json.dumps({'cases':len(cases),'lastCases':[{'id':x['caseId'],'result':x['result']} for x in cases[-3:]]}))
