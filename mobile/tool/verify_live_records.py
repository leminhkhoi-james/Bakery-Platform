"""Read-only reconciliation of UI-created records. No business mutations or SQL."""
from pathlib import Path
import hashlib,json,os,urllib.request,urllib.error,urllib.parse,http.cookies
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'mobile/docs/evidence/api-integration-phases-1-4'
credentials=json.loads(Path(os.environ.get('BAKERY_ADMIN_CREDENTIAL_FILE','H:/MSS/.secrets/bakery-platform/local-smoke-users.json')).read_text(encoding='utf-8-sig'))
customer=json.loads(Path('H:/MSS/.runtime/bakery-mobile-phases-1-4/mobile-live-user.json').read_text())
events=[]
for p in OUT.rglob('android-ui-requests.json'):events.extend(json.loads(p.read_text()))
events.sort(key=lambda x:x.get('at',''))
def created(method,path,first=False):
    rows=[r for r in events if r['method']==method and r['path']==path and 200<=r['status']<300 and r['ids']]
    return (rows[0] if first else rows[-1])['ids'][0]
bid=created('POST','/api/v1/bakeries/onboarding');product=created('POST',f'/api/v1/bakeries/{bid}/products')
rows=[]
def call(port,path,token=None,method='GET',body=None,cookie=None,label='owner',expected=200):
    headers={'Content-Type':'application/json'}
    if token:headers['Authorization']='Bearer '+token
    if cookie:
        if port!=18101:raise RuntimeError('Never send Identity cookie to another origin')
        headers['Cookie']=cookie
    req=urllib.request.Request(f'http://127.0.0.1:{port}'+path,method=method,data=None if body is None else json.dumps(body).encode(),headers=headers)
    responseCookie=None
    try:
        with urllib.request.urlopen(req,timeout=20) as r:
            status=r.status;data=json.load(r).get('data');responseCookie=r.headers.get('Set-Cookie')
    except urllib.error.HTTPError as e:status=e.code;data=None
    rows.append({'layer':'BACKEND_READ_RECONCILIATION','actor':label,'method':method,'path':path,'port':port,'status':status,'expected':expected,'result':'PASS' if status==expected else 'FAIL'})
    return data,responseCookie
def login(email,password,label):
    data,raw=call(18101,'/api/v1/auth/login',method='POST',body={'email':email,'password':password},label=label)
    jar=http.cookies.SimpleCookie();jar.load(raw or '')
    return data['accessToken'],'refresh_token='+jar['refresh_token'].value
owner,ownerCookie=login(customer['email'],customer['password'],'owner')
me,_=call(18101,'/api/v1/auth/me',owner);rows[-1]['roles']=me['roles']
onboard,_=call(18102,'/api/v1/bakeries/onboarding',owner);rows[-1]['id']=onboard['id'];rows[-1]['bakeryStatus']=onboard['status']
catalog,_=call(18102,f'/api/v1/products/{product}',label='public');rows[-1].update(id=catalog['product']['id'],bakeryId=catalog['bakeryId'],imageCount=len(catalog['images']),optionGroups=len(catalog['options']['groups']))
media=[]
bakery,_=call(18102,f'/api/v1/bakeries/{bid}',label='public')
for label,url in [('product',catalog['images'][0]['url'] if catalog['images'] else None),('logo',bakery.get('logoUrl')),('cover',bakery.get('coverUrl'))]:
    if not url:media.append({'kind':label,'status':'NOT_VERIFIED'});continue
    origin=urllib.parse.urlparse(url)
    if origin.hostname not in ['127.0.0.1','localhost'] or origin.port!=19022:media.append({'kind':label,'status':'BLOCKED_ORIGIN'});continue
    with urllib.request.urlopen(url,timeout=15) as response:
        content=response.read();media.append({'kind':label,'status':response.status,'bytes':len(content),'sha256':hashlib.sha256(content).hexdigest(),'signedUrlStored':False})
state,_=call(18104,f'/api/v1/bakeries/{bid}/subscription',owner)
rows[-1]['currentStatus']=(state.get('currentSubscription') or {}).get('status');rows[-1]['scheduledStatus']=(state.get('scheduledSubscription') or {}).get('status')
orders,_=call(18104,f'/api/v1/bakeries/{bid}/subscription-orders',owner)
rows[-1]['orders']=[{'id':o['id'],'status':o['status'],'amount':str(o['totalAmount'])} for o in orders['result']]
other,otherCookie=login(credentials['owner']['email'],credentials['password'],'other-owner')
for port,path in [(18102,f'/api/v1/bakeries/{bid}/products'),(18102,f'/api/v1/bakeries/{bid}/members'),(18104,f'/api/v1/bakeries/{bid}/subscription'),(18104,'/api/v1/admin/subscription-plans')]:call(port,path,other,label='other-owner',expected=403)
web,_=call(5174,f'/api/v1/products/{product}',label='web-proxy');rows[-1]['matchesPublicRecord']=web['product']['id']==product and web['product']['basePrice']==catalog['product']['basePrice']
call(18101,'/api/v1/auth/logout',owner,method='POST',cookie=ownerCookie)
call(18101,'/api/v1/auth/logout',other,method='POST',cookie=otherCookie,label='other-owner')
report={'checks':rows,'media':media,'scope':'All record reconciliation GETs; only authentication login/logout POSTs. These are not Android UI PASS counts.','allExpected':all(r['result']=='PASS' for r in rows)}
(OUT/'persisted-record-reconciliation.json').write_text(json.dumps(report,indent=2),encoding='utf-8');print(json.dumps({'checks':len(rows),'allExpected':report['allExpected'],'media':media}))
