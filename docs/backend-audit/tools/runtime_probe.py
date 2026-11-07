"""Chỉ OpenAPI/health GET tới stack audit loopback; không đọc environment."""
from pathlib import Path
import json,requests
EV=Path(__file__).resolve().parents[1]/'evidence'
ports={'identity-service':18091,'bakery-service':18092,'marketplace-service':18093,'subscription-service':18094,'order-service':18096,'chat-service':18097}
rows=[]
for service,port in ports.items():
    row={'service':service,'port':port}
    for kind,path in [('openapi','/v3/api-docs'),('health','/actuator/health')]:
        try:
            r=requests.get(f'http://127.0.0.1:{port}'+path,timeout=20)
            row[kind+'Status']=r.status_code
            if kind=='openapi' and r.status_code==200:
                data=r.json();(EV/f'isolated-openapi-{service}.json').write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
                row['operations']=sum(v in ['get','post','put','patch','delete'] for p in data['paths'].values() for v in p)
            elif kind=='health' and r.status_code==200:row['health']=r.json().get('status')
        except requests.RequestException as e:row[kind+'Error']=type(e).__name__
    rows.append(row)
(EV/'isolated-readiness.json').write_text(json.dumps(rows,indent=2),encoding='utf-8')
print(json.dumps(rows))
