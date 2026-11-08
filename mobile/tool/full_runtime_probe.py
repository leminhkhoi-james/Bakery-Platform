"""Read-only runtime/contract checks. Secrets remain in memory; no internal APIs."""
import datetime,hashlib,json,subprocess,urllib.error,urllib.request
from full_common import ROOT,MOBILE,OUT,save
from phase5_http import LocalApi
runtime=json.loads((OUT/'runtime-start.json').read_text(encoding='utf-8-sig'))
api=LocalApi()
api.origins={k.removesuffix('-service'):v['origin'] for k,v in runtime['services'].items() if k.endswith('-service')}
manifest={'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'services':{},'devices':[]}
for name,service in runtime['services'].items():
    c=json.loads(subprocess.check_output(['docker','inspect',service['container']]))[0]
    manifest['services'][name]={'container':service['container'],'imageId':c['Image'],'startedAt':c['State']['StartedAt'],'state':c['State']['Status'],'health':c['State'].get('Health',{}).get('Status'),'origin':service['origin'],'networks':list(c['NetworkSettings']['Networks']),'environmentVariableNames':sorted(x.split('=',1)[0] for x in c['Config']['Env']),'mounts':[{'type':m['Type'],'target':m['Destination'],'readOnly':not m['RW']} for m in c['Mounts']]}
    for mount in c['Mounts']:
        p=__import__('pathlib').Path(mount['Source'])
        if mount['Destination'].endswith('.jar') and p.is_file():manifest['services'][name]['runtimeJarSha256']=hashlib.sha256(p.read_bytes()).hexdigest()
allc=json.loads(subprocess.check_output(['docker','ps','-aq']).decode() and subprocess.check_output(['docker','inspect',*subprocess.check_output(['docker','ps','-aq']).decode().split()]))
manifest['cakeAiContainers']=[{'name':c['Name'],'image':c['Image'],'status':c['State']['Status'],'portMappings':c['HostConfig']['PortBindings']} for c in allc if 'cake-ai' in c['Name']]
manifest['gatewayContainers']=[{'name':c['Name'],'status':c['State']['Status']} for c in allc if 'gateway' in c['Name']]
findings={}
for actor in ['customer','owner','admin']:
    api.login(actor)
    findings[actor+'Roles']='verified by legitimate /auth/me'
    api.call(actor,'order','GET','/api/v1/orders?scope='+('all' if actor=='admin' else 'mine')+'&page=1&size=20')
fixture=json.loads((MOBILE/'docs/evidence/phases-5a-5b-5c/ui-fixture.json').read_text(encoding='utf-8-sig'))
for k in ['conversationId','requestId','offerId']:
    if k in fixture:
        if k=='conversationId':
            api.call('customer','chat','GET','/api/v1/conversations/'+fixture[k])
            r=api.call('customer','chat','GET','/api/v1/conversations/'+fixture[k]+'/messages?limit=2');findings['chatHistoryStatus']=r[0]
        elif k=='requestId':api.call('admin','marketplace','GET','/api/v1/cake-requests/'+fixture[k])
api.call('admin','marketplace','GET','/api/v1/cake-requests?page=1&size=20')
# Source controller discovery confirms no public address endpoint: do not guess URL/UUID.
findings['publicAddressContract']='ABSENT_IN_CURRENT_IDENTITY_CONTROLLERS'
signals={}
for name in ['bakery-mobile-phase5-chat','bakery-mobile-phase5-marketplace']:
    p=subprocess.run(['docker','logs','--since','10m',name],capture_output=True,text=True,encoding='utf-8',errors='replace')
    raw=p.stdout+p.stderr
    signals[name]={s:raw.count(s) for s in ['SQLState: 42P18','could not determine data type','AccessDeniedException','Firebase Storage is not configured'] if s in raw}
findings['serverLogSignals']=signals
save('source-runtime-manifest.json',manifest)
save('sanitized-events/host-runtime.json',{'events':api.events,'findings':findings,'layer':'HOST_API_READ_ONLY','fixtureSource':'previous authorized synthetic records; not new E2E'})
print(json.dumps({'services':len(manifest['services']),'cakeAiContainers':manifest['cakeAiContainers'],'gateway':manifest['gatewayContainers'],'findings':findings,'eventCount':len(api.events)}))
