"""Local test API client shared by diagnostics; never prints request/response bodies."""
from pathlib import Path
import json,urllib.request,urllib.error
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'mobile/docs/evidence/phases-5a-5b-5c'
class LocalApi:
    def __init__(self):
        runtime=json.loads((OUT/'runtime-start.json').read_text());self.origins={k.removesuffix('-service'):v['origin'] for k,v in runtime['services'].items() if k.endswith('-service')}
        self.private=json.loads((ROOT.parent/'.secrets/bakery-platform/local-smoke-users.json').read_text(encoding='utf-8-sig'));self.tokens={};self.events=[]
        self.mobileOwner=False
        if runtime['services']['bakery-service'].get('source')=='existing working Mobile deployment':
            privateOwner=json.loads((ROOT.parent/'.runtime/bakery-mobile-phases-1-4/mobile-live-user.json').read_text(encoding='utf-8-sig'))
            self.private['owner']={'email':privateOwner['email'],'password':privateOwner['password']};self.mobileOwner=True
    def call(self,actor,service,method,path,body=None,headers=None,raw=None,record=True):
        h={'Accept':'application/json',**(headers or {})};data=raw
        if actor in self.tokens:h['Authorization']='Bearer '+self.tokens[actor]
        if body is not None:data=json.dumps(body).encode();h['Content-Type']='application/json'
        request=urllib.request.Request(self.origins[service]+path,data=data,headers=h,method=method)
        try:r=urllib.request.urlopen(request,timeout=30)
        except urllib.error.HTTPError as e:r=e
        content=r.read();value=json.loads(content) if content else None
        if record:self.events.append({'actor':actor,'service':service,'method':method,'path':path.split('?')[0],'status':r.status})
        return r.status,value,r.headers
    def login(self,actor):
        status,value,_=self.call(actor,'identity','POST','/api/v1/auth/login',{'email':self.private[actor]['email'],'password':self.private[actor].get('password',self.private['password'])})
        if status!=200:raise RuntimeError('Existing authorized synthetic login failed HTTP '+str(status))
        self.tokens[actor]=value['data']['accessToken']
        status,me,_=self.call(actor,'identity','GET','/api/v1/auth/me')
        if status!=200:raise RuntimeError('Synthetic identity reconciliation failed')
        self.private[actor]['id']=me['data']['id']
        if actor=='owner' and self.mobileOwner:
            status,onboarding,_=self.call(actor,'bakery','GET','/api/v1/bakeries/onboarding')
            if status!=200 or not onboarding.get('data'):raise RuntimeError('Existing synthetic Mobile owner bakery unavailable')
            self.private['bakeryId']=onboarding['data']['id'];self.ownerBakery=onboarding['data']
            status,products,_=self.call(actor,'bakery','GET','/api/v1/products?bakeryId='+self.private['bakeryId']+'&page=1&size=20')
            if status==200 and products['data']['result']:self.private['productId']=products['data']['result'][0]['product']['id']
    def save(self,name,extra=None):
        (OUT/name).write_text(json.dumps({'events':self.events,**(extra or {})},indent=2),encoding='utf-8')
