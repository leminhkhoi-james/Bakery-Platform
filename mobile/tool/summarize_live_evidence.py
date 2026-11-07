"""Reconcile normalized operation inventory with sanitized Android HTTP traces."""
from pathlib import Path
from collections import Counter
import json,re

MOBILE=Path(__file__).resolve().parents[1]
OUT=MOBILE/'docs/evidence/api-integration-phases-1-4'
matrix=MOBILE/'docs/API_INTEGRATION_MATRIX_PHASES_1_4_VI.md'
events={}
for p in sorted(OUT.rglob('android-ui-requests.json')):
    for row in json.loads(p.read_text(encoding='utf-8')):
        key=json.dumps(row,sort_keys=True)
        events.setdefault(key,(row,p.relative_to(MOBILE/'docs').as_posix()))
operations=[];lines=[]
for line in matrix.read_text(encoding='utf-8').splitlines():
    if not re.match(r'\| [1-4] \|',line):lines.append(line);continue
    cells=line.split('|')
    method,route=re.search(r'`([A-Z]+) ([^`]+)`',cells[4]).groups()
    pattern='^'+re.sub(r'\{[^}]+\}',r'[^/]+',route)+'$'
    matched=[(r,p) for r,p in events.values() if r['method']==method and re.match(pattern,r['path'])]
    # Earlier UI-only runs predate the explicit layer field. Their native driver
    # had no adapter probe handler. Preserve raw evidence rather than relabel it.
    passed=[(r,p) for r,p in matched if r.get('layer','ANDROID_UI')=='ANDROID_UI' and 200<=r['status']<300]
    probe=[r for r,p in matched if r.get('layer')=='ADAPTER_PROBE']
    code=re.search(r'(BKR|IDN|SUB)-\d+',cells[2])
    operation={'id':code[0] if code else cells[2].strip(),'phase':int(cells[1]),'service':cells[3].strip(),'method':method,'route':route,'adapter':'IMPLEMENTED','androidUi':'EXERCISED_HTTP_2XX' if passed else 'NOT_VERIFIED','successfulUiRequests':len(passed),'uiStatuses':sorted(set(r['status'] for r,p in matched if r.get('layer','ANDROID_UI')=='ANDROID_UI')),'evidence':sorted(set(p for r,p in passed)),'adapterProbeStatuses':sorted(set(r['status'] for r in probe))}
    operations.append(operation)
    cells[8]=' EXERCISED_ANDROID_UI_HTTP_2XX ' if passed else ' IMPLEMENTED_NOT_RUNTIME_VERIFIED '
    if passed:
        link=f"[Android HTTP {passed[0][0]['status']}]({passed[0][1]})"
        cells[9]=re.sub(r'\[runtime\]\([^)]+\)|\[Android HTTP \d+\]\([^)]+\)',link,cells[9])
    lines.append('|'.join(cells))
report={'uniqueOperations':len(operations),'implemented':len(operations),'androidUiHttp2xx':sum(o['androidUi']=='EXERCISED_HTTP_2XX' for o in operations),'byService':dict(Counter(o['service'] for o in operations)),'byPhase':dict(Counter(o['phase'] for o in operations)),'operations':operations,'countRule':'service + method + normalized route; ADAPTER_PROBE and BACKEND_READ_RECONCILIATION excluded from Android UI totals','uniqueTraceEvents':len(events),'uiResults':{}}
for p in OUT.rglob('android-ui-results.json'):
    rows=json.loads(p.read_text(encoding='utf-8'))
    report['uiResults'][p.relative_to(OUT).as_posix()]={'pass':sum(r.get('result')=='PASS' and r.get('layer')!='ADAPTER_PROBE' for r in rows),'failureActions':[r['action'] for r in rows if str(r.get('result','')).startswith('FAIL')],'probe':sum(r.get('layer')=='ADAPTER_PROBE' for r in rows)}
(OUT/'integration-summary.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
matrix.write_text('\n'.join(lines)+'\n',encoding='utf-8')
print(json.dumps({k:v for k,v in report.items() if k not in ['operations','uiResults']}))
print(json.dumps({'missing':[o['id'] for o in operations if o['androidUi']!='EXERCISED_HTTP_2XX']}))
