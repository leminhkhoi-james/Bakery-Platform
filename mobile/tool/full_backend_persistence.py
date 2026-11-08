"""Restart only three owned Mobile app containers; preserve config/data/volumes."""
import json,subprocess,time,urllib.request
from full_common import OUT,save
from phase5_http import LocalApi
fixture=json.loads((OUT/'fixture-manifest.json').read_text());runtime=json.loads((OUT/'runtime-start.json').read_text())
api=LocalApi();api.private['owner']={'email':fixture['customerEmail'],'password':api.private['password']};api.mobileOwner=False
for actor in ['customer','owner']:api.login(actor)
if api.private['owner']['id']!=fixture['ownerId']:raise SystemExit('Current-run Owner identity mismatch')
targets=['bakery-mobile-phase5-'+d for d in ['marketplace','order','chat']]
def inspect(name):return json.loads(subprocess.check_output(['docker','inspect',name]))[0]
before={n:inspect(n) for n in targets}
if any(c['Config']['Labels'].get('bakery.mobile.phase')!='5' for c in before.values()):raise SystemExit('Refusing restart of unverified container')
for name in targets:subprocess.run(['docker','restart',name],capture_output=True,check=True,timeout=90)
for domain in ['marketplace','order','chat']:
    origin=runtime['services'][domain+'-service']['origin']
    for _ in range(60):
        try:
            with urllib.request.urlopen(origin+'/v3/api-docs',timeout=3) as r:
                if r.status==200:break
        except Exception:time.sleep(1)
    else:raise SystemExit('Restart readiness failed for '+domain)
checks=[]
for actor,domain,path,expected in [
 ('customer','marketplace','/api/v1/cake-requests/'+fixture['journeyCRequestId'],'OPEN'),
 ('owner','marketplace','/api/v1/offers/'+fixture['journeyCOfferId'],'WITHDRAWN'),
 ('customer','chat','/api/v1/conversations/'+fixture['journeyCConversationId'],'CLOSED')]:
    status,value,_=api.call(actor,domain,'GET',path);ok=status==200 and value['data']['status']==expected
    checks.append({'actor':actor,'service':domain,'path':path,'httpStatus':status,'expectedState':expected,'result':'PASS' if ok else 'FAIL'})
api.call('owner','order','GET','/api/v1/orders?scope=bakery&bakeryId='+fixture['bakeryId'])
after={n:inspect(n) for n in targets}
unchanged=all(before[n]['Config']==after[n]['Config'] and before[n]['Mounts']==after[n]['Mounts'] for n in targets)
save('test-results/backend-persistence.json',{'checks':checks,'restartedContainers':targets,'containerConfigAndMountsUnchanged':unchanged,'databaseContainersRestarted':False,'sqlWrites':False,'volumesRemoved':False,'result':'PASS' if unchanged and all(c['result']=='PASS' for c in checks) else 'FAIL'})
save('sanitized-events/backend-persistence.json',{'events':api.events,'layer':'HOST_API_AFTER_SERVICE_RESTART'})
print({'checks':checks,'configurationUnchanged':unchanged},flush=True)
