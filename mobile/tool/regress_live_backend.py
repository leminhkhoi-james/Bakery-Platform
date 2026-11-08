"""Current HTTP regression using only newly created synthetic public-API records.

This is BACKEND_HTTP evidence, never an Android UI PASS. Credentials remain in
memory; existing accounts/data/configuration are not changed or deleted.
"""
from pathlib import Path
import datetime,hashlib,json,secrets,struct,subprocess,time,urllib.error,urllib.parse,urllib.request,uuid,zlib
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'mobile/docs/evidence/docker-api-diagnostic'
runtime=json.loads((OUT/'runtime-start.json').read_text());ports={s:runtime['services']['mobile-'+s]['port'] for s in ['identity','bakery','subscription']}
stamp=str(time.time_ns());password=secrets.token_urlsafe(24)
rows=[];resources={};checks=[]
def persist():
 (OUT/'backend-regression.json').write_text(json.dumps({'layer':'BACKEND_HTTP','at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'requests':rows,'resources':resources,'businessChecks':checks,'credentialsPersisted':False},indent=2),encoding='utf-8')
def multipart(body,files):
 boundary='diagnostic-'+uuid.uuid4().hex;data=bytearray()
 if body is not None:data.extend(f'--{boundary}\r\nContent-Disposition: form-data; name="metadata"\r\nContent-Type: application/json\r\n\r\n{json.dumps(body)}\r\n'.encode())
 for field,name,mime,content in files:
  data.extend(f'--{boundary}\r\nContent-Disposition: form-data; name="{field}"; filename="{name}"\r\nContent-Type: {mime}\r\n\r\n'.encode());data.extend(content);data.extend(b'\r\n')
 data.extend(f'--{boundary}--\r\n'.encode());return bytes(data),'multipart/form-data; boundary='+boundary
def call(service,method,path,actor=None,body=None,files=None,key=False,expected=None):
 headers={'Accept':'application/json'}
 if actor and actor.get('token'):headers['Authorization']='Bearer '+actor['token']
 if service=='identity' and path.endswith(('/refresh','/logout')) and actor and actor.get('cookie'):headers['Cookie']=actor['cookie']
 if key:headers['Idempotency-Key']=str(uuid.uuid4()) if key is True else key
 if files is not None:payload,headers['Content-Type']=multipart(body,files)
 else:
  payload=None if body is None else json.dumps(body).encode()
  if payload is not None:headers['Content-Type']='application/json'
 request=urllib.request.Request(f'http://127.0.0.1:{ports[service]}{path}',data=payload,method=method,headers=headers)
 try:response=urllib.request.urlopen(request,timeout=25)
 except urllib.error.HTTPError as e:response=e
 status=response.status;raw=response.read();data=json.loads(raw).get('data') if raw else None
 cookie=response.headers.get_all('Set-Cookie') or []
 if actor is not None and service=='identity' and path.endswith(('/login','/refresh')) and status==200:
  actor.update(token=data['accessToken'],cookie=next(v.split(';',1)[0] for v in cookie if v.startswith('refresh_token=')))
 ids=[];states=[]
 def collect(value):
  if isinstance(value,dict):
   if isinstance(value.get('id'),str):ids.append(value['id'])
   if isinstance(value.get('status'),str):states.append(value['status'])
   for v in value.values():collect(v)
  elif isinstance(value,list):
   for v in value:collect(v)
 collect(data)
 ok=status in expected if expected else 200<=status<300
 rows.append({'service':service,'method':method,'path':path.split('?')[0],'httpStatus':status,'expected':expected or '2xx','result':'PASS' if ok else 'FAIL','ids':ids,'states':states,'requestFields':list(body) if isinstance(body,dict) else [],'multipartParts':[f[0] for f in files or []]})
 persist()
 if not ok:raise RuntimeError(f'{service} {method} {path.split("?")[0]} returned HTTP {status}')
 return data
def check(name,value):checks.append({'check':name,'result':'PASS' if value else 'FAIL'});persist();assert value,name
def png():
 def chunk(t,d):return struct.pack('!I',len(d))+t+d+struct.pack('!I',zlib.crc32(t+d)&0xffffffff)
 return b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('!2I5B',64,64,8,2,0,0,0))+chunk(b'tEXt',b'Description\0SYNTHETIC LOCAL TEST - NO REAL FUNDS')+chunk(b'IDAT',zlib.compress((b'\0'+b'\x6b\x21\x2e'*64)*64))+chunk(b'IEND',b'')
admin={};owner={}
try:
 creds=json.loads((ROOT.parent/'.secrets/bakery-platform/local-smoke-users.json').read_text(encoding='utf-8-sig'))
 call('identity','POST','/api/v1/auth/login',admin,{'email':creds['admin']['email'],'password':creds['password']})
 profile=call('identity','POST','/api/v1/auth/register',body={'email':f'backend-diagnostic-{stamp}@audit.invalid','password':password,'displayName':'Synthetic Backend Diagnostic'})
 resources['user']=profile['id']
 call('identity','POST','/api/v1/auth/login',owner,{'email':f'backend-diagnostic-{stamp}@audit.invalid','password':password})
 check('Customer me is newly registered record',call('identity','GET','/api/v1/auth/me',owner)['id']==profile['id'])
 operations={'addresses':[{'addressLine':'Synthetic Test Street','district':'Synthetic District','city':'Local Test City','isPrimary':True}],'serviceAreas':[{'district':'Synthetic District','city':'Local Test City','deliveryFee':'0','minimumOrder':'0','active':True}],'businessHours':[{'dayOfWeek':1,'closed':False,'opensAt':'08:00','closesAt':'18:00'}]}
 bakery=call('bakery','POST','/api/v1/bakeries/onboarding',owner,{'name':'Diagnostic Bakery '+stamp,'phoneNumber':'0000000000','operations':operations})
 bid=bakery['id'];resources['bakery']=bid;prefix='/api/v1/bakeries/'+bid
 call('bakery','GET','/api/v1/bakeries/onboarding',owner)
 call('bakery','GET','/api/v1/admin/bakeries',admin);call('bakery','GET','/api/v1/admin/bakeries/'+bid,admin)
 call('bakery','PATCH','/api/v1/admin/bakeries/'+bid+'/status',admin,{'status':'ACTIVE'})
 plan=call('subscription','POST','/api/v1/admin/subscription-plans',admin,{'code':'DBG'+stamp,'name':'Synthetic Diagnostic Plan','monthlyPrice':'90000','currency':'VND','billingPeriodMonths':1,'status':'ACTIVE','features':{'catalog':'enabled'}})
 pid=plan['id'];resources['plan']=pid
 call('subscription','GET','/api/v1/admin/subscription-plans',admin);call('subscription','GET','/api/v1/subscription-plans');call('subscription','GET','/api/v1/subscription-plans/'+pid);call('subscription','GET','/api/v1/subscription-plans/payment-options')
 order=call('subscription','POST',prefix+'/subscription-orders',owner,{'planId':pid},key=True);oid=order['id'];resources['order']=oid
 call('subscription','GET',prefix+'/subscription-orders',owner);call('subscription','GET','/api/v1/subscription-orders/'+oid,owner)
 def payment(order,reference,proof=False):return call('subscription','POST','/api/v1/subscription-orders/'+order['id']+'/payments',owner,{'paymentMethod':'BANK_TRANSFER','paymentReference':reference,'amount':str(order['totalAmount']),'currency':order['currency']},files=[('proof','synthetic.png','image/png',png())] if proof else [],key=True)
 first=payment(order,'SYNTHETIC-NO-FUNDS-'+stamp,True)
 call('subscription','GET','/api/v1/admin/bakery-payments',admin)
 call('subscription','POST','/api/v1/admin/bakery-payments/'+first['id']+'/reject',admin,{'reviewNote':'Synthetic local rejection; no real money'})
 second=payment(order,'SYNTHETIC-CORRECTED-'+stamp)
 call('subscription','POST','/api/v1/admin/bakery-payments/'+second['id']+'/approve',admin,{'reviewNote':'Synthetic local verification only'},key=True)
 call('subscription','GET',prefix+'/subscription',owner)
 call('bakery','POST',prefix+'/onboarding/complete',owner)
 call('identity','POST','/api/v1/auth/refresh',owner)
 check('Owner role granted through actual onboarding contract','BAKERY_OWNER' in call('identity','GET','/api/v1/auth/me',owner)['roles'])
 call('bakery','PATCH',prefix,owner,{'name':'Verified Diagnostic Bakery '+stamp})
 persisted=call('bakery','GET','/api/v1/bakeries/onboarding',owner)
 ops=persisted['operations'];call('bakery','PUT',prefix+'/operations',owner,ops)
 call('bakery','GET',prefix+'/members',owner)
 image=(ROOT/'mobile/assets/demo/cake_01.jpg').read_bytes()
 for suffix in ['logo','cover']:call('bakery','POST',prefix+'/'+suffix,owner,files=[('file','synthetic-asset.jpg','image/jpeg',image)])
 category=call('bakery','POST',prefix+'/categories',owner,{'name':'Diagnostic Category','slug':'diag-'+stamp,'displayOrder':0,'active':True});cid=category['id']
 call('bakery','GET',prefix+'/categories',owner);call('bakery','PATCH',prefix+'/categories/'+cid,owner,{'name':'Updated Diagnostic Category'})
 addon=call('bakery','POST',prefix+'/add-ons',owner,{'name':'Diagnostic Addon','category':'TOPPER','price':'20000','active':True});aid=addon['id']
 call('bakery','GET',prefix+'/add-ons',owner);call('bakery','PATCH',prefix+'/add-ons/'+aid,owner,{'price':'25000'});call('bakery','POST',prefix+'/add-ons/'+aid+'/image',owner,files=[('file','synthetic-asset.jpg','image/jpeg',image)])
 product=call('bakery','POST',prefix+'/products',owner,{'categoryId':cid,'name':'Diagnostic Cake','slug':'diag-'+stamp,'basePrice':'210000','customizable':True,'defaultServingSize':8,'minimumNoticeHours':0});productId=product['id'];resources['product']=productId
 pp=prefix+'/products/'+productId
 call('bakery','GET',prefix+'/products',owner);call('bakery','PATCH',pp,owner,{'description':'Synthetic product persisted via current HTTP regression'})
 call('bakery','PUT',pp+'/options',owner,{'groups':[{'name':'Size','selectionType':'SINGLE','required':False,'minimumSelections':0,'maximumSelections':1,'displayOrder':0,'values':[{'name':'Standard','priceAdjustment':'0','active':True,'displayOrder':0}]}]})
 pictures=call('bakery','POST',pp+'/images',owner,files=[('files','synthetic-asset.jpg','image/jpeg',image),('files','synthetic-extra.jpg','image/jpeg',image)])
 call('bakery','DELETE',pp+'/images/'+pictures[-1]['id'],owner)
 call('bakery','POST',pp+'/publish',owner);call('bakery','POST',pp+'/hide',owner);call('bakery','POST',pp+'/publish',owner)
 public=call('bakery','GET','/api/v1/products/'+productId);call('bakery','GET','/api/v1/products');call('bakery','GET','/api/v1/bakeries');call('bakery','GET',prefix)
 media=public['images'][0].get('imageUrl') or public['images'][0].get('url')
 if media:
  u=urllib.parse.urlsplit(media)
  if u.hostname not in ['127.0.0.1','localhost'] or u.port!=19022:raise RuntimeError('Refusing non-local media request')
  with urllib.request.urlopen(media,timeout=15) as r:content=r.read();check('Signed product media GET 200 and exact uploaded bytes',r.status==200 and hashlib.sha256(content).digest()==hashlib.sha256(image).digest())
 draft=call('bakery','POST',prefix+'/products',owner,{'name':'Disposable Diagnostic Draft','slug':'draft-'+stamp,'basePrice':'1','defaultServingSize':1,'minimumNoticeHours':0,'customizable':False})
 call('bakery','POST',prefix+'/products/'+draft['id']+'/archive',owner)
 call('bakery','DELETE',prefix+'/categories/'+cid,owner);call('bakery','DELETE',prefix+'/add-ons/'+aid,owner)
 call('subscription','PATCH','/api/v1/admin/subscription-plans/'+pid,admin,{'monthlyPrice':'110000'})
 renewal=call('subscription','POST',prefix+'/subscription-orders',owner,{'planId':pid},key=True);resources['renewal']=renewal['id']
 renewed=payment(renewal,'SYNTHETIC-RENEWAL-'+stamp)
 call('subscription','POST','/api/v1/admin/bakery-payments/'+renewed['id']+'/approve',admin,{'reviewNote':'Synthetic renewal only'},key=True)
 status=call('subscription','GET',prefix+'/subscription',owner)
 check('Renewal produces future scheduled period','SCHEDULED' in json.dumps(status))
 check('Completed order retains original snapshot',str(call('subscription','GET','/api/v1/subscription-orders/'+oid,owner)['totalAmount']).startswith('90000'))
 call('subscription','POST','/api/v1/admin/subscription-plans/'+pid+'/archive',admin)
 branch=call('bakery','POST','/api/v1/bakeries',owner,{'name':'Diagnostic Branch '+stamp,'phoneNumber':'0000000000'});resources['branch']=branch['id']
 call('bakery','PUT','/api/v1/bakeries/'+branch['id']+'/operations',owner,operations);call('bakery','POST','/api/v1/bakeries/'+branch['id']+'/submit-for-approval',owner)
 call('bakery','GET','/api/v1/admin/bakeries/'+branch['id'],admin)
 check('No unexpected HTTP failures',all(r['result']=='PASS' for r in rows))
except Exception as e:
 checks.append({'check':'journey completion','result':'FAIL','errorType':type(e).__name__,'safeMessage':str(e) if isinstance(e,(RuntimeError,AssertionError)) else 'Sensitive exception details omitted'})
finally:
 for actor in [owner,admin]:
  if actor.get('token'):
   try:call('identity','POST','/api/v1/auth/logout',actor)
   except Exception:checks.append({'check':'logout','result':'FAIL'})
 persist()
print(json.dumps({'requests':len(rows),'failures':[r for r in rows if r['result']=='FAIL'],'checks':checks,'resources':resources}),flush=True)
raise SystemExit(any(r['result']=='FAIL' for r in rows) or any(c['result']=='FAIL' for c in checks))
