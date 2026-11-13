"""Synthetic-only HTTP contract probe. Never serializes credentials or response bodies."""
from pathlib import Path
import datetime,json,subprocess,time,urllib.error,urllib.request,uuid
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'mobile/docs/evidence/phases-5a-5b-5c'
runtime=json.loads((OUT/'runtime-start.json').read_text());origins={k.removesuffix('-service'):v['origin'] for k,v in runtime['services'].items() if k.endswith('-service')}
private=json.loads((ROOT.parent/'.secrets/bakery-platform/local-smoke-users.json').read_text(encoding='utf-8-sig'))
events=[];tokens={};fixture={};stamp=str(time.time_ns())
def call(actor,service,method,path,body=None,headers=None,raw=None):
    h={'Accept':'application/json',**(headers or {})}
    if actor in tokens:h['Authorization']='Bearer '+tokens[actor]
    data=raw
    if body is not None:data=json.dumps(body).encode();h['Content-Type']='application/json'
    req=urllib.request.Request(origins[service]+path,data=data,headers=h,method=method)
    try:r=urllib.request.urlopen(req,timeout=30)
    except urllib.error.HTTPError as error:r=error
    content=r.read();value=json.loads(content) if content else {};status=r.status
    events.append({'actor':actor,'service':service,'method':method,'path':path.split('?')[0],'status':status,'responseIds':[value['data']['id']] if isinstance(value.get('data'),dict) and 'id' in value['data'] else []})
    return status,value.get('data'),r.headers
def login(actor):
    status,data,_=call(actor,'identity','POST','/api/v1/auth/login',{'email':private[actor]['email'],'password':private['password']})
    if status!=200:raise RuntimeError('Existing synthetic '+actor+' login failed HTTP '+str(status))
    tokens[actor]=data['accessToken'];return data
def save():
    if (OUT/'http-probe.json').exists():(OUT/'http-probe.json').rename(OUT/('http-probe-previous-'+str(time.time_ns())+'.json'))
    (OUT/'http-probe.json').write_text(json.dumps({'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'events':events,'fixture':fixture,'credentialsPersisted':False},indent=2),encoding='utf-8')
try:
    for actor in ['customer','owner','admin']:login(actor)
    fixture['bakeryId']=private['bakeryId'];fixture['productId']=private['productId']
    now=datetime.datetime.now(datetime.timezone.utc)
    iso=lambda days:(now+datetime.timedelta(days=days)).isoformat()
    draft={'requestType':'OPEN_CUSTOM','title':'Mobile Phase5 '+stamp,'description':'Synthetic local integration request','neededAt':iso(14),'deliveryDistrict':'District 1','deliveryCity':'Ho Chi Minh City','budgetMin':'100000','budgetMax':'900000','preference':{'flavor':'Vanilla'}}
    status,request,_=call('customer','marketplace','POST','/api/v1/cake-requests',draft)
    if status!=201:raise RuntimeError('New synthetic RFQ failed HTTP '+str(status))
    rid=request['id'];fixture['requestId']=rid
    call('customer','marketplace','GET','/api/v1/cake-requests/'+rid)
    call('customer','marketplace','PATCH','/api/v1/cake-requests/'+rid,{'description':'Synthetic draft edited'})
    call('customer','marketplace','POST','/api/v1/cake-requests/'+rid+'/publish')
    call('owner','marketplace','GET','/api/v1/cake-requests?scope=available&page=1&pageSize=20')
    call('customer','marketplace','GET','/api/v1/offers?scope=received')
    call('owner','marketplace','GET','/api/v1/offers?scope=sent')
    offer={'bakeryId':private['bakeryId'],'cakePrice':'300000','deliveryFee':'20000','estimatedCompletionAt':iso(10),'expiresAt':iso(7),'message':'Synthetic offer','items':[]}
    status,off,_=call('owner','marketplace','POST','/api/v1/cake-requests/'+rid+'/offers',offer)
    if status==201:
        oid=off['id'];fixture['offerId']=oid
        call('customer','marketplace','GET','/api/v1/offers/'+oid)
        call('owner','marketplace','PATCH','/api/v1/offers/'+oid,{'message':'Synthetic revised offer'})
        call('owner','marketplace','POST','/api/v1/cake-requests/'+rid+'/offers',offer)
    call('customer','orders' if 'orders' in origins else 'order','GET','/api/v1/orders?scope=mine')
    call('owner','order','GET','/api/v1/orders?scope=bakery&bakeryId='+private['bakeryId'])
    status,conversation,_=call('customer','chat','POST','/api/v1/conversations',{'cakeRequestId':rid,'bakeryId':private['bakeryId']})
    if status in [200,201]:
        cid=conversation['id'];fixture['conversationId']=cid
        call('customer','chat','GET','/api/v1/conversations/'+cid)
        call('customer','chat','GET','/api/v1/conversations/'+cid+'/messages?limit=2')
        messageId=str(uuid.uuid4());boundary='mobile-'+uuid.uuid4().hex
        metadata={'clientMessageId':messageId,'messageType':'TEXT','content':'Synthetic Phase5 message '+stamp}
        raw=(f'--{boundary}\r\nContent-Disposition: form-data; name="metadata"\r\nContent-Type: application/json\r\n\r\n'+json.dumps(metadata)+f'\r\n--{boundary}--\r\n').encode()
        status,message,_=call('customer','chat','POST','/api/v1/conversations/'+cid+'/messages',headers={'Content-Type':'multipart/form-data; boundary='+boundary},raw=raw)
        if status in [200,201]:
            fixture['messageId']=message['id']
            call('customer','chat','POST','/api/v1/conversations/'+cid+'/messages',headers={'Content-Type':'multipart/form-data; boundary='+boundary},raw=raw)
            call('owner','chat','POST','/api/v1/conversations/'+cid+'/read',{'throughMessageId':message['id']})
            call('owner','chat','GET','/api/v1/conversations/'+cid+'/messages?limit=2')
        call('owner','chat','GET','/api/v1/conversations?bakeryId='+private['bakeryId'])
    call('customer','chat','GET','/api/v1/conversations')
except Exception as error:fixture['probeErrorType']=type(error).__name__;fixture['probeReason']=str(error) if isinstance(error,RuntimeError) else 'Details suppressed'
finally:save();print(json.dumps({'events':len(events),'fixtureFields':list(fixture),'statuses':[e['service']+' '+e['method']+' '+str(e['status']) for e in events]}),flush=True)
