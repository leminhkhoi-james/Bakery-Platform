"""Bounded local checks: absent RFQ storage and synthetic non-participant access."""
from phase5_http import LocalApi,OUT
import base64,datetime,json,secrets,subprocess,time,uuid
api=LocalApi();result={};target=OUT/'additional-probe.json'
try:
    api.login('customer');api.login('owner')
    fixture=json.loads((OUT/'ui-fixture.json').read_text())
    container=json.loads(subprocess.check_output(['docker','inspect','bakery-mobile-phase5-marketplace']))[0]
    environment=dict(v.split('=',1) for v in container['Config']['Env'] if '=' in v)
    names=['FIREBASE_PROJECT_ID','FIREBASE_STORAGE_BUCKET']
    result['storageConfiguration']={n:'PRESENT' if environment.get(n,'').strip() else 'ABSENT' for n in names}
    # Adapter checks these two before ADC/network; never contact an unknown cloud.
    prior=json.loads(target.read_text()) if target.exists() else {}
    if all(not environment.get(n,'').strip() for n in names) and not prior.get('result',{}).get('rfqImageUploadStatus'):
        prior=json.loads(target.read_text()) if target.exists() else {}
        rid=prior.get('result',{}).get('storageDraftId')
        if not rid:
            area=next(a for a in api.ownerBakery['operations']['serviceAreas'] if a['active'])
            status,response,_=api.call('customer','marketplace','POST','/api/v1/cake-requests',{'requestType':'OPEN_CUSTOM','title':'Phase5 storage diagnostic '+str(time.time_ns()),'description':'Synthetic local storage diagnostic','neededAt':(datetime.datetime.now(datetime.timezone.utc)+datetime.timedelta(days=20)).isoformat(),'deliveryCity':area['city'],'deliveryDistrict':area['district']})
            assert status==201;rid=response['data']['id']
        result['storageDraftId']=rid
        boundary='phase5-'+uuid.uuid4().hex
        png=base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j1ioAAAAASUVORK5CYII=')
        raw=(f'--{boundary}\r\nContent-Disposition: form-data; name="files"; filename="phase5.png"\r\nContent-Type: image/png\r\n\r\n').encode()+png+(f'\r\n--{boundary}--\r\n').encode()
        status,_,_=api.call('customer','marketplace','POST','/api/v1/cake-requests/'+rid+'/images',raw=raw,headers={'Content-Type':'multipart/form-data; boundary='+boundary})
        result['rfqImageUploadStatus']=status
    else:
        result.update({k:v for k,v in prior.get('result',{}).items() if k in ['storageDraftId','rfqImageUploadStatus']})
    api.login('admin')
    assert api.private['admin']['id'] not in [fixture['customerId'],fixture['ownerId']]
    cid=fixture['conversationId'];mid=fixture['messageId']
    result['nonParticipant']={}
    for label,method,path in [('conversation','GET','/api/v1/conversations/'+cid),('messageDelete','DELETE','/api/v1/conversations/'+cid+'/messages/'+mid)]:
        status,_,_=api.call('admin','chat',method,path);result['nonParticipant'][label]=status
        assert status in [403,404]
    status,response,_=api.call('owner','chat','GET','/api/v1/conversations?bakeryId='+fixture['bakeryId'])
    result['ownerConversationListStatus']=status
    result['listContainsOwnedFixture']=status==200 and any(v['id']==cid for v in response['data']['result'])
except Exception as error:result['errorType']=type(error).__name__
if target.exists():target.rename(target.with_stem(target.stem+'-'+str(time.time_ns())))
api.save(target.name,{'result':result,'credentialsPersisted':False,'externalCallsAllowed':False,'sqlWritesPerformed':False})
print(json.dumps(result),flush=True)
