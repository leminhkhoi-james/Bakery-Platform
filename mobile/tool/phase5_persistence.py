"""Read back only the owned synthetic RFQ/Offer/Conversation after service restart."""
from phase5_http import LocalApi,OUT
import json,time
api=LocalApi();fixture=json.loads((OUT/'ui-fixture.json').read_text());checks=[]
try:
    api.login('customer');api.login('owner')
    for label,actor,service,path,key,expected in [
        ('RFQ remains OPEN','customer','marketplace','/api/v1/cake-requests/'+fixture['requestId'],'status','OPEN'),
        ('Native Offer remains WITHDRAWN','owner','marketplace','/api/v1/offers/'+fixture['uiCreatedOfferId'],'status','WITHDRAWN'),
        ('Native Conversation remains CLOSED','customer','chat','/api/v1/conversations/'+fixture['conversationId'],'status','CLOSED')]:
        status,response,_=api.call(actor,service,'GET',path)
        ok=status==200 and response['data'][key]==expected
        checks.append({'check':label,'status':status,'result':'PASS' if ok else 'FAIL'})
        assert ok
except Exception as error:checks.append({'result':'FAIL','errorType':type(error).__name__})
target=OUT/'persistence-after-restart.json'
if target.exists():target.rename(target.with_stem(target.stem+'-'+str(time.time_ns())))
api.save(target.name,{'checks':checks,'restartScope':'three newly added phase5 containers only','sqlWritesPerformed':False})
print(json.dumps(checks),flush=True)
raise SystemExit(any(c['result']!='PASS' for c in checks))
