"""Real cross-service flows on the compatible Mobile extension; only new synthetic data."""
from phase5_http import LocalApi,OUT
import base64,datetime,hashlib,json,time,urllib.request,uuid
api=LocalApi();fixture={};checks=[]
def check(name,condition):
    checks.append({'name':name,'result':'PASS' if condition else 'FAIL'})
    if not condition:raise RuntimeError(name)
def data(r):return r[1].get('data') if isinstance(r[1],dict) else None
def multipart(metadata,files=()):
    boundary='phase5-'+uuid.uuid4().hex
    raw=(f'--{boundary}\r\nContent-Disposition: form-data; name="metadata"\r\nContent-Type: application/json\r\n\r\n'+json.dumps(metadata)+'\r\n').encode()
    for name,mime,content in files:raw+=(f'--{boundary}\r\nContent-Disposition: form-data; name="files"; filename="{name}"\r\nContent-Type: {mime}\r\n\r\n').encode()+content+b'\r\n'
    raw+=(f'--{boundary}--\r\n').encode();return {'Content-Type':'multipart/form-data; boundary='+boundary},raw
try:
    api.login('customer');api.login('owner')
    b=api.ownerBakery;area=next(a for a in b['operations']['serviceAreas'] if a['active'])
    fixture.update(ownerId=api.private['owner']['id'],customerId=api.private['customer']['id'],bakeryId=b['id'],productId=api.private['productId'])
    now=datetime.datetime.now(datetime.timezone.utc);iso=lambda days:(now+datetime.timedelta(days=days)).isoformat()
    request={'requestType':'OPEN_CUSTOM','title':'Phase5 compatible '+str(time.time_ns()),'description':'Synthetic cross-service fixture','neededAt':iso(20),'deliveryCity':area['city'],'deliveryDistrict':area['district'],'budgetMin':'0','budgetMax':'9000000'}
    r=api.call('customer','marketplace','POST','/api/v1/cake-requests',request);check('RFQ create 201',r[0]==201);rid=data(r)['id'];fixture['requestId']=rid
    r=api.call('customer','marketplace','POST','/api/v1/cake-requests/'+rid+'/publish');check('RFQ publish OPEN',r[0]==200 and data(r)['status']=='OPEN')
    r=api.call('owner','marketplace','GET','/api/v1/cake-requests?scope=available&page=1&size=100');check('Owner availability and membership works',r[0]==200 and any(v['id']==rid for v in data(r)['result']))
    offer={'bakeryId':b['id'],'cakePrice':'350000','deliveryFee':'20000','estimatedCompletionAt':iso(10),'expiresAt':iso(7),'message':'Synthetic compatible offer','items':[]}
    r=api.call('owner','marketplace','POST','/api/v1/cake-requests/'+rid+'/offers',offer);check('Eligible Owner offer create',r[0]==201);oid=data(r)['id'];fixture['offerId']=oid
    r=api.call('owner','marketplace','PATCH','/api/v1/offers/'+oid,{'message':'Synthetic compatible offer edited'});check('Offer edit persists',r[0]==200 and data(r)['message']=='Synthetic compatible offer edited')
    r=api.call('owner','marketplace','POST','/api/v1/cake-requests/'+rid+'/offers',offer);check('Duplicate offer prevented',r[0]==409)
    r=api.call('customer','marketplace','GET','/api/v1/offers/'+oid);check('Customer reads actual total',r[0]==200 and str(data(r)['totalPrice']) in ['370000','370000.0','370000.00'])
    r=api.call('customer','chat','POST','/api/v1/conversations',{'cakeRequestId':rid,'bakeryId':b['id']});check('Authorized conversation created',r[0] in [200,201]);cid=data(r)['id'];fixture['conversationId']=cid
    r=api.call('owner','chat','GET','/api/v1/conversations/'+cid);check('Owner participant access',r[0]==200)
    first=api.call('customer','chat','GET','/api/v1/conversations/'+cid+'/messages?limit=2');fixture['firstPageHistoryStatus']=first[0]
    mid=str(uuid.uuid4());metadata={'clientMessageId':mid,'messageType':'TEXT','content':'Synthetic compatible text '+str(time.time_ns())};headers,raw=multipart(metadata)
    r=api.call('customer','chat','POST','/api/v1/conversations/'+cid+'/messages',headers=headers,raw=raw);check('Message stored with server ID',r[0]==201);message=data(r);fixture['messageId']=message['id']
    r=api.call('customer','chat','POST','/api/v1/conversations/'+cid+'/messages',headers=headers,raw=raw);check('Same clientMessageId replays same server record',r[0]==200 and data(r)['id']==message['id'])
    r=api.call('owner','chat','POST','/api/v1/conversations/'+cid+'/read',{'throughMessageId':message['id']});check('Owner mark read',r[0]==200)
    # Explicit non-null cursor diagnosis uses the actual documented source format
    # and server-generated timestamp/ID. Flutter never fabricates first-page cursors.
    cursor=base64.urlsafe_b64encode((message['createdAt']+'|'+message['id']).encode()).decode().rstrip('=')
    later=api.call('owner','chat','GET','/api/v1/conversations/'+cid+'/messages?before='+cursor+'&limit=2');fixture['nonNullCursorHistoryStatus']=later[0]
    png=base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j1ioAAAAASUVORK5CYII=')
    headers,raw=multipart({'clientMessageId':str(uuid.uuid4()),'messageType':'IMAGE','content':'Synthetic local attachment'},[('phase5.png','image/png',png)])
    r=api.call('owner','chat','POST','/api/v1/conversations/'+cid+'/messages',headers=headers,raw=raw);check('Local attachment message created',r[0]==201)
    attachment=data(r)['attachments'][0];fixture['imageMessageId']=data(r)['id']
    with urllib.request.urlopen(attachment['url'],timeout=20) as response:download=response.read();check('Signed local attachment bytes persisted',response.status==200 and hashlib.sha256(download).digest()==hashlib.sha256(png).digest())
    r=api.call('owner','chat','GET','/api/v1/conversations?bakeryId='+b['id']);check('Conversation list persists context and preview',r[0]==200 and any(c['id']==cid for c in data(r)['result']))
except Exception as e:fixture['errorType']=type(e).__name__;fixture['safeReason']=str(e) if isinstance(e,RuntimeError) else 'Details suppressed'
finally:
    target=OUT/'compatible-live-flows.json'
    if target.exists():target.rename(target.with_stem(target.stem+'-'+str(time.time_ns())))
    api.save('compatible-live-flows.json',{'fixture':fixture,'checks':checks,'signedUrlsPersisted':False,'credentialsPersisted':False,'sqlWritesPerformed':False})
    print(json.dumps({'checks':checks,'fixtureFields':list(fixture),'firstPageHistoryStatus':fixture.get('firstPageHistoryStatus'),'statuses':[str(e['status']) for e in api.events]}),flush=True)
