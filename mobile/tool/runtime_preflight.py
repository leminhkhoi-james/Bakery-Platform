"""Read-only local runtime check. Never prints environment or credentials."""
from pathlib import Path
import hashlib, json, os, subprocess, urllib.request, datetime

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'mobile/docs/evidence/api-integration-phases-1-4'
OUT.mkdir(parents=True, exist_ok=True)
ports = {'identity':18101, 'bakery':18102, 'subscription':18104}
report = {'at':datetime.datetime.now(datetime.timezone.utc).isoformat(), 'services':{}, 'gateway':{}}
for name, port in ports.items():
    result = {'origin':f'http://127.0.0.1:{port}'}
    try:
        with urllib.request.urlopen(result['origin']+'/v3/api-docs',timeout=15) as r:
            spec = json.load(r)
        (OUT / f'openapi-{name}.json').write_text(json.dumps(spec,indent=2),encoding='utf-8')
        result.update(status='RUNNING_AND_VERIFIED_OPENAPI',pathCount=len(spec['paths']))
        if name == 'identity': result['tokenFields'] = list(spec['components']['schemas']['TokenResponse']['properties'])
        if name == 'bakery': result['hasOnboarding'] = '/api/v1/bakeries/onboarding' in spec['paths']
        if name == 'subscription': result['hasPaymentOptions'] = '/api/v1/subscription-plans/payment-options' in spec['paths']
    except Exception as e: result.update(status='BLOCKED_ENVIRONMENT',errorType=type(e).__name__)
    report['services'][name] = result
try:
    with urllib.request.urlopen('http://127.0.0.1:8080/api/v1/products',timeout=3) as r:
        report['gateway']={'status':r.status}
except Exception as e: report['gateway']={'status':'UNAVAILABLE', 'errorType':type(e).__name__}
report['sourceVsExternalBuild']={}
copy = Path('H:/MSS/.runtime/bakery-mobile-phases-1-4/source/backend')
for name in ['identity-service','bakery-service','subscription-service']:
    different=[];count=0
    for p in (ROOT/'backend'/name/'src').rglob('*'):
        if p.is_file():
            other=copy/name/p.relative_to(ROOT/'backend'/name)
            if not other.exists() or hashlib.sha256(p.read_bytes()).digest()!=hashlib.sha256(other.read_bytes()).digest(): different.append(p.relative_to(ROOT).as_posix())
            count+=1
    report['sourceVsExternalBuild'][name]={'checked':count,'different':different}
(OUT/'runtime-preflight.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(report,indent=2))
