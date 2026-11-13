"""Non-destructive API preflight. Auth credentials remain host-side in memory."""
from pathlib import Path
import os,json,urllib.request,urllib.error,http.cookiejar,datetime
ROOT=Path(__file__).resolve().parents[2]
credentials=json.loads(Path(os.environ.get('BAKERY_ADMIN_CREDENTIAL_FILE','H:/MSS/.secrets/bakery-platform/local-smoke-users.json')).read_text(encoding='utf-8-sig'))
private={'userPassword':credentials['password']}
state={'actors':{'admin':credentials['admin']}}
jar=http.cookiejar.CookieJar();opener=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
rows=[]
def call(port,method,path,body=None,token=None):
    headers={'Content-Type':'application/json'}
    if token:headers['Authorization']='Bearer '+token
    request=urllib.request.Request(f'http://127.0.0.1:{port}'+path,method=method,data=None if body is None else json.dumps(body).encode(),headers=headers)
    try:
        with opener.open(request,timeout=20) as response:
            data=json.load(response);code=response.status
    except urllib.error.HTTPError as e:
        code=e.code;data={}
    rows.append({'layer':'BACKEND_PREFLIGHT','method':method,'path':path,'port':port,'status':code,'result':'PASS' if code<300 else 'FAIL','at':datetime.datetime.now(datetime.timezone.utc).isoformat()})
    return data.get('data')
for port,path in [(18102,'/api/v1/products?page=1&size=1'),(18102,'/api/v1/bakeries?page=1&size=1'),(18104,'/api/v1/subscription-plans'),(18104,'/api/v1/subscription-plans/payment-options')]:
    value=call(port,'GET',path)
    rows[-1]['shape']='array' if isinstance(value,list) else list(value) if isinstance(value,dict) else type(value).__name__
login=call(18101,'POST','/api/v1/auth/login',{'email':state['actors']['admin']['email'],'password':private['userPassword']})
if login:
    rows[-1]['tokenFields']=list(login)
    rows[-1]['cookieAttributes']=[{'name':c.name,'path':c.path,'secure':c.secure,'httpOnly':c.has_nonstandard_attr('HttpOnly'),'hasExpiry':c.expires is not None} for c in jar]
    me=call(18101,'GET','/api/v1/auth/me',token=login['accessToken'])
    rows[-1]['roles']=me.get('roles') if me else []
    refreshed=call(18101,'POST','/api/v1/auth/refresh',{})
    if refreshed:call(18101,'POST','/api/v1/auth/logout',{},token=refreshed['accessToken'])
out=ROOT/'mobile/docs/evidence/api-integration-phases-1-4/backend-preflight.json'
out.write_text(json.dumps(rows,indent=2),encoding='utf-8')
print(json.dumps(rows,indent=2))
