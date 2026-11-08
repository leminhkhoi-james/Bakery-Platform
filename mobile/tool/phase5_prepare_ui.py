"""Prepare one new owned synthetic RFQ for native Offer creation; reuse it on resume."""
from phase5_http import LocalApi,OUT
import datetime,json,time
api=LocalApi();api.login('customer');api.login('owner');target=OUT/'ui-fixture.json'
fixture=json.loads((OUT/'compatible-live-flows.json').read_text())['fixture'].copy()
if target.exists():fixture.update(json.loads(target.read_text()))
if not fixture.get('uiCreateRequestId'):
    area=next(a for a in api.ownerBakery['operations']['serviceAreas'] if a['active']);needed=(datetime.datetime.now(datetime.timezone.utc)+datetime.timedelta(days=25)).isoformat()
    status,result,_=api.call('customer','marketplace','POST','/api/v1/cake-requests',{'requestType':'OPEN_CUSTOM','title':'Phase5 native offer target '+str(time.time_ns()),'description':'Synthetic UI offer lifecycle','neededAt':needed,'deliveryCity':area['city'],'deliveryDistrict':area['district']})
    assert status==201;fixture['uiCreateRequestId']=result['data']['id']
    status,result,_=api.call('customer','marketplace','POST','/api/v1/cake-requests/'+fixture['uiCreateRequestId']+'/publish');assert status==200 and result['data']['status']=='OPEN'
else:
    status,result,_=api.call('customer','marketplace','GET','/api/v1/cake-requests/'+fixture['uiCreateRequestId']);assert status==200 and result['data']['customerId']==fixture['customerId']
status,result,_=api.call('owner','marketplace','GET','/api/v1/offers?scope=sent&bakeryId='+fixture['bakeryId']+'&cakeRequestId='+fixture['uiCreateRequestId'])
assert status==200
if result['data']['result']:fixture['uiCreatedOfferId']=result['data']['result'][0]['id'];fixture['uiCreatedOfferStatus']=result['data']['result'][0]['status']
target.write_text(json.dumps(fixture,indent=2),encoding='utf-8');api.save('ui-fixture-setup.json',{'newRecordsAreSynthetic':True});print(json.dumps({'ready':True,'fixtureFields':list(fixture),'existingOfferReused':bool(fixture.get('uiCreatedOfferId'))}))
