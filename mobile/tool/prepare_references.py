"""Ghi baseline và đọc toàn bộ tài liệu tham chiếu; không thay source tham chiếu."""
from pathlib import Path
import hashlib,json,re,subprocess,collections
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'docs/mobile/evidence';OUT.mkdir(parents=True,exist_ok=True)
head=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip()
tracked=subprocess.check_output(['git','ls-files','-z'],cwd=ROOT).decode().split('\0')
files={p:hashlib.sha256((ROOT/p).read_bytes()).hexdigest() for p in tracked if p and (ROOT/p).is_file()}
baseline=OUT/'baseline.json'
if not baseline.exists():baseline.write_text(json.dumps({'head':head,'statusBeforeImplementation':'CLEAN','tracked':files},indent=2),encoding='utf-8')
required=['design-web.md','docs/PROJECT-STATUS.md','mobile/README.md','docs/ARCHITECTURE.md','docs/API_SPEC.md','docs/DATABASE.md']
required += ['docs/audit/'+n+'.md' for n in ['BAKERY_PLATFORM_CURRENT_SYSTEM_AUDIT_VI','BAKERY_PLATFORM_FINAL_EXECUTION_REPORT_VI','BACKEND_API_CATALOG_VI','API_SCHEMAS_VI','API_BEHAVIOR_TRACE_VI','DATABASE_CATALOG_VI','FRONTEND_BACKEND_INTEGRATION_VI','FRONTEND_SCREEN_MATRIX_VI','RUNTIME_FLOW_MATRIX_VI','LOCAL_RUNTIME_VI','SOURCE_REVIEW_LEDGER_VI','SKILLS_REVIEW_VI']]
required += [p.relative_to(ROOT).as_posix() for p in (ROOT/'docs/decisions').glob('*.md')]
summaries=[]
for name in required:
    p=ROOT/name
    if not p.exists():continue
    b=p.read_bytes();s=b.decode('utf-8-sig');headings=re.findall(r'^#{1,6} .+$',s,re.M)
    summaries.append({'path':name,'bytes':len(b),'lines':len(s.splitlines()),'sha256':hashlib.sha256(b).hexdigest(),'headings':headings,
                      'tables':len(re.findall(r'^\|',s,re.M)),'completeBytesRead':True})
(OUT/'reference-reading.json').write_text(json.dumps(summaries,ensure_ascii=False,indent=2),encoding='utf-8')
# Đọc mọi page/component/style đang dùng; giữ inventory để liên kết từng màn hình.
front=[]
for p in sorted((ROOT/'frontend/src').rglob('*')):
    if p.is_file() and p.suffix in ['.jsx','.js','.css']:
        s=p.read_text(encoding='utf-8-sig');front.append({'path':p.relative_to(ROOT).as_posix(),'sha256':hashlib.sha256(s.encode()).hexdigest(),
            'headings':re.findall(r'<h[123][^>]*>([^<{]+)',s),'imports':re.findall(r'from [\'\"]([^\'\"]+)',s),
            'containsLocalDemo':bool(re.search(r'demo|mock|sandbox',s,re.I))})
(OUT/'web-source-reading.json').write_text(json.dumps(front,ensure_ascii=False,indent=2),encoding='utf-8')
routes=(ROOT/'frontend/src/routes/AppRoutes.jsx').read_text(encoding='utf-8')
names=sorted(set(re.findall(r"currentPage === '([^']+)'",routes))-{'vendor-settings'})
names=['home']+names
(OUT/'verified-web-routes.json').write_text(json.dumps(names,indent=2),encoding='utf-8')
print(json.dumps({'head':head,'baselineFiles':len(files),'documentsRead':len(summaries),'webModulesRead':len(front),'canonicalRoutes':len(names)},indent=2))
