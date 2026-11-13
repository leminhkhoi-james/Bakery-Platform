"""Revalidate only affected historical blockers using authorized synthetic records."""
from phase5_http import LocalApi,OUT
import json,subprocess,uuid,time,base64
api=LocalApi();findings={};fixture={}
def data(result):return result[1].get('data') if isinstance(result[1],dict) else None
try:
    for actor in ['customer','owner']:api.login(actor)
    # Read only public endpoints from user sessions. Existing fixture IDs are
    # authorized synthetic data, never obtained by guessing a user's identifiers.
    old=api.private['requestId'];bakery=api.private['bakeryId']
    result=api.call('customer','marketplace','GET','/api/v1/cake-requests/'+old)
    findings['existingSyntheticRequestStatus']=result[0]
    result=api.call('customer','chat','POST','/api/v1/conversations',{'cakeRequestId':old,'bakeryId':bakery})
    findings['existingSyntheticChatCreate']=result[0]
    if result[0] not in [200,201]:
        listing=api.call('customer','chat','GET','/api/v1/conversations')
        visible=(data(listing) or {}).get('result',[])
        eligible=[c for c in visible if c['status']=='OPEN']
        findings['authorizedVisibleConversations']=len(visible)
        if eligible:
            result=api.call('customer','chat','GET','/api/v1/conversations/'+eligible[0]['id'])
            fixture['conversationSource']='existing-authorized-synthetic-list'
    if result[0] in [200,201]:
        cid=data(result)['id'];fixture['conversationId']=cid;fixture['cakeRequestId']=data(result)['cakeRequestId'];fixture['bakeryId']=data(result)['bakeryId']
        api.call('owner','chat','GET','/api/v1/conversations/'+cid)
        api.call('customer','chat','GET','/api/v1/conversations/'+cid+'/messages?limit=2')
        boundary='phase5-'+uuid.uuid4().hex
        metadata={'clientMessageId':str(uuid.uuid4()),'messageType':'TEXT','content':'Synthetic Phase5 '+str(time.time_ns())}
        raw=(f'--{boundary}\r\nContent-Disposition: form-data; name="metadata"\r\nContent-Type: application/json\r\n\r\n'+json.dumps(metadata)+f'\r\n--{boundary}--\r\n').encode()
        result=api.call('customer','chat','POST','/api/v1/conversations/'+cid+'/messages',headers={'Content-Type':'multipart/form-data; boundary='+boundary},raw=raw)
        if result[0] in [200,201]:
            mid=data(result)['id'];fixture['messageId']=mid
            api.call('customer','chat','POST','/api/v1/conversations/'+cid+'/messages',headers={'Content-Type':'multipart/form-data; boundary='+boundary},raw=raw)
            api.call('owner','chat','POST','/api/v1/conversations/'+cid+'/read',{'throughMessageId':mid})
            cursor=base64.urlsafe_b64encode((data(result)['createdAt']+'|'+mid).encode()).decode().rstrip('=')
            api.call('owner','chat','GET','/api/v1/conversations/'+cid+'/messages?before='+cursor+'&limit=2')
        api.call('owner','chat','GET','/api/v1/conversations?bakeryId='+bakery)
    # Service credential is reused solely in host-side contract diagnosis. It
    # never enters Flutter, files, command arguments, or printed output.
    container=json.loads(subprocess.check_output(['docker','inspect','bakery-local-marketplace-service-1']))[0]
    env=dict(s.split('=',1) for s in container['Config']['Env'] if '=' in s)
    r=api.call('service-diagnostic','identity','POST','/internal/v1/auth/service-token',{'clientId':env.get('SERVICE_CLIENT_ID','marketplace-service'),'clientSecret':env.get('SERVICE_CLIENT_SECRET',''),'audience':'bakery-service','scope':'bakery:membership:read'})
    findings['marketplaceBakeryTokenStatus']=r[0]
    if r[0]==200:
        token=r[1]['accessToken'];api.tokens['service-diagnostic']=token
        r=api.call('service-diagnostic','bakery','GET','/internal/v1/users/'+api.private['owner']['id']+'/bakery-memberships',headers={'X-Correlation-Id':str(uuid.uuid4())})
        findings['bakeryMembershipServiceStatus']=r[0]
    # Server log evidence is reduced to static signal names and occurrence counts.
    signals={}
    for service in ['marketplace','bakery','chat']:
        log=subprocess.run(['docker','logs','--tail','500','bakery-local-'+service+'-service-1'],capture_output=True,text=True,encoding='utf-8',errors='replace')
        text=log.stdout+log.stderr
        signals[service]={s:text.count(s) for s in ['AccessDeniedException','SQLState: 42P18','could not determine data type','Invalid token','Unauthorized','ServiceUnavailable','PSQLException'] if s in text}
    findings['serverLogSignals']=signals
except Exception as e:findings['diagnosticErrorType']=type(e).__name__
finally:
    api.save('backend-diagnostic.json',{'findings':findings,'fixture':fixture,'internalCallsAreHostDiagnosticsOnly':True})
    print(json.dumps({'findings':findings,'fixtureFields':list(fixture),'statuses':[e['service']+' '+e['method']+' '+str(e['status']) for e in api.events]}),flush=True)
