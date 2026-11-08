"""Current-run operation coverage, keeping HTTP regression distinct from UI proof."""
from pathlib import Path
import collections,json,re
MOBILE=Path(__file__).resolve().parents[1];OUT=MOBILE/'docs/evidence/docker-api-diagnostic'
backend=json.loads((OUT/'backend-regression.json').read_text())['requests']
ui=[]
for name in ['after-interrupted-state.json','after-final-ui.json','verified-ui.json','tail-ui.json','session-ui.json','cold-process-state.json','public-detail-ui.json']:
 p=OUT/name
 if p.exists():
  data=json.loads(p.read_text());ui.extend((data.get('state') or data).get('events',[]))
ui=list({json.dumps(r,sort_keys=True):r for r in ui}.values())
operations=[]
for line in (MOBILE/'docs/API_INTEGRATION_MATRIX_PHASES_1_4_VI.md').read_text(encoding='utf-8').splitlines():
 if not re.match(r'\| [1-4] \|',line):continue
 cells=line.split('|');method,route=re.search(r'`([A-Z]+) ([^`]+)`',cells[4]).groups();service=cells[3].strip().removesuffix('-service')
 pattern='^'+re.sub(r'\{[^}]+\}',r'[^/]+',route)+'$'
 b=[r for r in backend if r['service']==service and r['method']==method and re.match(pattern,r['path'])]
 u=[r for r in ui if r['method']==method and re.match(pattern,r['path']) and r.get('layer')=='ANDROID_UI' and r.get('mode') in ['real','lost-register-response']]
 operations.append({'id':cells[2].strip().split(' ')[0],'phase':int(cells[1]),'service':service,'method':method,'route':route,'adapterImplemented':True,'backendReached':bool(b),'backend2xx':any(200<=r['httpStatus']<300 for r in b),'androidUi2xx':any(200<=r['status']<300 for r in u),'uiBusinessResult':'See individual UI checkpoints/screenshots; a transport 2xx alone is not a UI business assertion','backendStatuses':sorted({r['httpStatus'] for r in b}),'androidUiStatuses':sorted({r['status'] for r in u})})
summary={'operations':operations,'uniqueInventory':len(operations),'backendHttp2xxOperations':sum(o['backend2xx'] for o in operations),'androidUi2xxOperations':sum(o['androidUi2xx'] for o in operations),'byService':{s:{'inventory':sum(o['service']==s for o in operations),'backend2xx':sum(o['service']==s and o['backend2xx'] for o in operations),'androidUi2xx':sum(o['service']==s and o['androidUi2xx'] for o in operations)} for s in ['identity','bakery','subscription']},'backendRequestCount':len(backend),'uiCoverageRule':'Current run only; normalized service+method+route. Historical 55/55 UI not reused; injected invalid/rejected connections excluded from positive UI counts.'}
(OUT/'current-api-coverage.json').write_text(json.dumps(summary,indent=2),encoding='utf-8')
table=['# Ma trận hồi quy API trong lần chẩn đoán hiện tại','',
 f"Inventory {len(operations)} operation; HTTP Backend 2xx {summary['backendHttp2xxOperations']}; Android UI transport 2xx {summary['androidUi2xxOperations']}. Đây không phải 55/55 UI PASS.",'',
 'Một 2xx xác minh response của operation; kết quả UI/nghiệp vụ cần đọc checkpoint và ảnh tương ứng. Mutation chỉ tạo trên fixture synthetic mới. Không dùng PASS lịch sử.','',
 '| Phase | ID | Service | Method / normalized route | Adapter | Backend HTTP | Android UI 2xx |','|---|---|---|---|---|---|---|']
for o in operations:
 table.append(f"| {o['phase']} | {o['id']} | {o['service']} | `{o['method']} {o['route']}` | Implemented | {'2xx đã xác minh' if o['backend2xx'] else 'Chưa đạt'} | {'Có' if o['androidUi2xx'] else 'Chưa xác minh qua UI'} |")
table+=['','Bằng chứng: [Backend](evidence/docker-api-diagnostic/backend-regression.json), [coverage máy đọc](evidence/docker-api-diagnostic/current-api-coverage.json), các `*-ui.json` và screenshot trong cùng thư mục evidence. Các checkpoint backend kiểm tra Owner activation, media byte hash, SCHEDULED và snapshot giá; không suy ra mọi nhánh/validation/permission đều được kiểm thử.']
(MOBILE/'docs/CURRENT_API_REGRESSION_DIAGNOSTIC_VI.md').write_text('\n'.join(table)+'\n',encoding='utf-8')
print(json.dumps({k:v for k,v in summary.items() if k!='operations'}))
