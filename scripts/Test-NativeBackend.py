"""Read-only native regression: health, Gateway/OpenAPI servers, CORS, service JWTs.

python scripts/Test-NativeBackend.py --output <outside-repository.json> [--user-id <synthetic UUID>]
No container tooling, storage writes, paid providers, raw tokens or secrets.
"""
import argparse
import base64
import json
import pathlib
import urllib.error
import urllib.request
import uuid
from native_backend import ROOT,PORTS,CLIENTS,dotenv

PREFIX={'identity-service':'identity','bakery-service':'bakery','marketplace-service':'marketplace',
        'subscription-service':'subscription','cake-ai-service':'cake-ai','order-service':'orders','chat-service':'chat'}

def request(url,method='GET',body=None,headers=None):
    data=json.dumps(body).encode() if body is not None else None
    req=urllib.request.Request(url,data=data,method=method,headers={'Content-Type':'application/json'} | (headers or {}))
    try:
        with urllib.request.urlopen(req,timeout=15) as response:
            raw=response.read()
            try: payload=json.loads(raw)
            except ValueError: payload=None
            return response.status,dict(response.headers),payload
    except urllib.error.HTTPError as response:
        return response.code,dict(response.headers),None
    except (OSError,ValueError): return 0,{},None

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output',required=True)
    parser.add_argument('--user-id',type=uuid.UUID)
    args=parser.parse_args(); output=pathlib.Path(args.output).resolve()
    if output.is_relative_to(ROOT): raise ValueError('Evidence must stay outside repository')
    env=dotenv(ROOT/'.env'); results=[]
    def record(name,ok,**evidence): results.append({'check':name,'pass':ok,**evidence})
    for service,port in PORTS.items():
        status,_,data=request(f'http://localhost:{port}/actuator/health/readiness')
        record(service+':readiness',status==200 and data.get('status')=='UP',status=status)
        if service not in PREFIX: continue
        for gateway in (False,True):
            base=f'http://localhost:8080/{PREFIX[service]}' if gateway else f'http://localhost:{port}'
            status,_,spec=request(base+'/v3/api-docs')
            servers=[s['url'] for s in (spec or {}).get('servers',[])]
            record(service+(':gateway-openapi' if gateway else ':direct-openapi'),status==200 and base in servers,
                    status=status,servers=servers,operations=sum(len([m for m in item if m.lower() in {'get','post','put','patch','delete'}]) for item in (spec or {}).get('paths',{}).values()))
    for origin,expected in [('http://localhost:5173',200),('https://unapproved.example',403)]:
        status,headers,_=request('http://localhost:8080/identity/api/v1/auth/me','OPTIONS',headers={
            'Origin':origin,'Access-Control-Request-Method':'GET','Access-Control-Request-Headers':'authorization,idempotency-key'})
        allowed=headers.get('Access-Control-Allow-Origin')
        record('gateway:cors:'+origin,status==expected and (allowed==origin if expected==200 else allowed is None),status=status,allow_origin=allowed)
    for service,(plain,hashed) in CLIENTS.items():
        audience,scope=('marketplace-service','marketplace:request:read') if service=='cake-ai-service' else (
                ('identity-service','identity:user:read') if service in ('bakery-service','order-service') else
                ('bakery-service','bakery:membership:read'))
        if service=='subscription-service': audience,scope='bakery-service','bakery:profile:read'
        body={'clientId':service,'clientSecret':env.get(plain,''),'audience':audience,'scope':scope}
        status,_,response=request('http://localhost:8081/internal/v1/auth/service-token','POST',body)
        record(service+':token',status==200,status=status,audience=audience,scope=scope)
        token=(response or {}).get('accessToken')
        if token:
            claims=json.loads(base64.urlsafe_b64decode(token.split('.')[1]+'=='))
            record(service+':claims',claims.get('token_type')=='service' and audience in claims.get('aud',[]) and scope in claims.get('scope','').split(),audience=claims.get('aud'),scope=claims.get('scope'))
        body['clientSecret']='intentionally-incorrect-credential'
        status,_,_=request('http://localhost:8081/internal/v1/auth/service-token','POST',body)
        record(service+':wrong-secret',status==401,status=status)
    output.parent.mkdir(parents=True,exist_ok=True); output.write_text(json.dumps(results,indent=2))
    print(json.dumps({'checks':len(results),'passed':sum(r['pass'] for r in results),'output':str(output)}))
    return 0 if all(r['pass'] for r in results) else 1

if __name__=='__main__': raise SystemExit(main())
