"""Verify existing credentials against the working Mobile Identity; no secret writes."""
from phase5_http import LocalApi,OUT
import json,subprocess
api=LocalApi();api.origins['identity']='http://127.0.0.1:18101';result=[]
for service in ['marketplace','order','chat']:
    c=json.loads(subprocess.check_output(['docker','inspect','bakery-local-'+service+'-service-1']))[0]
    e=dict(v.split('=',1) for v in c['Config']['Env'] if '=' in v)
    # Actual names, not generated values. All three use the configured service identity.
    idKey=next((k for k in ['SERVICE_CLIENT_ID','ORDER_SERVICE_CLIENT_ID','CHAT_SERVICE_CLIENT_ID','SERVICE_AUTH_CLIENT_ID'] if e.get(k)),None)
    secretKey=next((k for k in ['SERVICE_CLIENT_SECRET','ORDER_SERVICE_CLIENT_SECRET','CHAT_SERVICE_CLIENT_SECRET','SERVICE_AUTH_CLIENT_SECRET'] if e.get(k)),None)
    if not idKey or not secretKey:result.append({'service':service,'status':'CONFIG_NAMES_NEED_INSPECTION','candidateNames':[k for k in e if 'CLIENT' in k]});continue
    status,_,_=api.call('host-service-diagnostic','identity','POST','/internal/v1/auth/service-token',{'clientId':e[idKey],'clientSecret':e[secretKey],'audience':'bakery-service','scope':'bakery:membership:read'})
    result.append({'service':service,'status':status,'clientIdVariable':idKey,'clientSecretVariable':secretKey})
(OUT/'topology-credential-check.json').write_text(json.dumps({'services':result,'newCredentialsGenerated':False},indent=2),encoding='utf-8');print(json.dumps(result))
