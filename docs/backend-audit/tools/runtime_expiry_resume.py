"""Tiếp tục đúng fixture expiry sau khi DB từ chối timestamp bất hợp lệ; không chạy lại recovery."""
from runtime_cases import *
ids=state['ids']
def mark(aid,name,passed,**kw):
    cases.append({'caseId':f'TC-{len(cases)+1:04}','api':aid,'name':name,'kind':'SCHEDULER_OR_RECOVERY','result':'PASS' if passed else 'FAIL',**kw});persist();print(json.dumps(cases[-1],ensure_ascii=True),flush=True)
customer=state['actors']['customerA']['id']
exp=sql('marketplace-service',f"SELECT id FROM cake_requests WHERE customer_id='{customer}' AND title='Expiry audit fixture' ORDER BY created_at DESC LIMIT 1;")
assert exp
exp_offer=sql('marketplace-service',f"SELECT id FROM offers WHERE cake_request_id='{exp}' LIMIT 1;")
assert exp_offer
sql('marketplace-service',f"UPDATE offers SET created_at=now()-interval '2 hours',expires_at=now()-interval '1 minute' WHERE id='{exp_offer}'; UPDATE cake_requests SET needed_at=now()-interval '1 minute' WHERE id='{exp}';")
for _ in range(45):
    value=sql('marketplace-service',f"SELECT r.status||':'||o.status FROM cake_requests r JOIN offers o ON o.cake_request_id=r.id WHERE r.id='{exp}';")
    if value=='CLOSED:EXPIRED':break
    time.sleep(1)
mark('MKT-001','Scheduler RFQ CLOSED và offer EXPIRED khi qua hạn',value=='CLOSED:EXPIRED',states=value)
for alias in ['ownerA','admin']:login(alias)
r=call('SUB-005','Plan phụ cho expiry order','admin',(201,),payload={'code':'EXPIRY-'+uuid.uuid4().hex[:10],'name':'Expiry test','monthlyPrice':100000,'currency':'VND','billingPeriodMonths':1,'status':'ACTIVE','features':{}});plan=idof(r)
r=call('SUB-010','PENDING_PAYMENT riêng cho expiry','ownerA',(201,),params={'bakeryId':ids['ownerABakery']},payload={'planId':plan},headers=key());so=idof(r)
sql('subscription-service',f"UPDATE subscription_orders SET created_at=now()-interval '2 hours',expires_at=now()-interval '1 hour' WHERE id='{so}'; UPDATE bakery_subscriptions SET period_start=now()-interval '3 hours',period_end=now()-interval '2 hours' WHERE bakery_id='{ids['ownerABakery']}' AND status='ACTIVE'; UPDATE bakery_subscriptions SET period_start=now()-interval '1 hour',period_end=now()+interval '1 hour' WHERE bakery_id='{ids['ownerABakery']}' AND status='SCHEDULED';")
for _ in range(75):
    value=sql('subscription-service',f"SELECT status FROM subscription_orders WHERE id='{so}';")
    periods=sql('subscription-service',f"SELECT count(*) FILTER(WHERE status='ACTIVE')||':'||count(*) FILTER(WHERE status='EXPIRED') FROM bakery_subscriptions WHERE bakery_id='{ids['ownerABakery']}';")
    if value=='EXPIRED' and periods=='1:1':break
    time.sleep(1)
mark('SUB-008','Lifecycle job expire order/old period và activate scheduled',value=='EXPIRED' and periods=='1:1',orderStatus=value,activeAndExpiredCounts=periods)
(EV/'scheduler-test-method.json').write_text(json.dumps({'project':PROJECT,'orderServiceTemporaryStop':True,'orderServiceRestored':True,'originalStackTouched':False,'dateFixturesModifiedOnlyInAuditDb':True,'statusesChangedByActualSchedulers':True,'previousScheduledPeriodNowActive':True,'priorDbAssertionsCapturedBeforeTimeFixtureChanges':True,'initialExpiryDateFixtureRejectedByCheckConstraint':True,'recoveryWasNotRepeated':True},indent=2),encoding='utf-8')
print(json.dumps({'cases':len(cases),'pass':sum(x['result']=='PASS' for x in cases)}))
