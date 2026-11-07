"""Read-only headless Chrome reference when desktop automation kernel is unavailable."""
from pathlib import Path
import subprocess,json,time,urllib.request,re
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'mobile/docs/evidence/api-integration-phases-1-4'
chrome=Path('C:/Program Files/Google/Chrome/Application/chrome.exe')
profile=Path('H:/MSS/.runtime/bakery-mobile-phases-1-4/browser-profile')
rows=[]
routes=[('/','web-home'),('/subscription-plans#pricing-section','web-plans'),('/stores','web-bakeries')]
try:
    resources=json.loads((OUT/'android-ui-results.json').read_text())[-1]['resourceIds']
    routes.extend([('/product-detail?id='+resources['product'],'web-live-product'),('/bakery-detail?id='+resources['bakery'],'web-live-bakery')])
except (OSError,KeyError,ValueError):pass
for route,name in routes:
    command=[str(chrome),'--headless=new','--disable-gpu','--no-first-run','--hide-scrollbars','--user-data-dir='+str(profile),'--window-size=1280,900','--virtual-time-budget=8000','--screenshot='+str(OUT/(name+'.png')),'--dump-dom','http://127.0.0.1:5174'+route]
    try:
        result=subprocess.run(command,capture_output=True,timeout=45)
        dom=result.stdout.decode('utf-8',errors='replace')
        dom=re.sub(r'https?://[^"\s<>]*(?:X-Amz|[?&]token=)[^"\s<>]*','[SIGNED_MEDIA_URL_REDACTED]',dom,flags=re.I)
        (OUT/(name+'.html')).write_text(dom,encoding='utf-8')
        rows.append({'route':route,'exitCode':result.returncode,'htmlBytes':len(result.stdout),'screenshot':name+'.png','method':'Actual headless Chrome; desktop GUI kernel unavailable; no credentials supplied'})
    except subprocess.TimeoutExpired:rows.append({'route':route,'status':'NOT_VERIFIED','reason':'Chrome headless timeout'})
(OUT/'web-browser-reference.json').write_text(json.dumps(rows,indent=2),encoding='utf-8')
print(json.dumps(rows))
