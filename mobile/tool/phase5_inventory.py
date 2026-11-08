"""Source/OpenAPI inventory, with public-only normalized route counting."""
from phase5_http import LocalApi,ROOT,OUT
import json,re
api=LocalApi();rows=[]
for domain in ['marketplace','order','chat']:
    _,spec,_=api.call('anonymous',domain,'GET','/v3/api-docs',record=False)
    public={p:v for p,v in spec.get('paths',{}).items() if p.startswith('/api/v1/')}
    (OUT/(domain+'-public-openapi.json')).write_text(json.dumps({'paths':public,'components':spec.get('components',{})},indent=2),encoding='utf-8')
    for p in (ROOT/'backend'/(domain+'-service')/'src/main/java').rglob('*Controller.java'):
        source=p.read_text();base=re.search(r'@RequestMapping\("([^"\n]+)"\)',source)
        if not base or not base[1].startswith('/api/v1'):continue
        matches=list(re.finditer(r'@(Get|Post|Put|Patch|Delete)Mapping(?:\(([^\n]*)\))?',source))
        for i,m in enumerate(matches):
            suffix=re.search(r'"([^"\n]*)"',m[2] or '');route=base[1]+(suffix[1] if suffix else '');method=m[1].upper()
            body=source[m.end():matches[i+1].start() if i+1<len(matches) else len(source)]
            outside='selected-design' in route or '/review' in route
            rows.append({'domain':domain,'method':method,'route':route,'controller':p.relative_to(ROOT).as_posix(),'line':source[:m.start()].count('\n')+1,'dtoNames':sorted(set(re.findall(r'\b([A-Z][A-Za-z]+(?:Request|Response))\b',body))),'sourceStatus':'SOURCE_VERIFIED','runtimeDefined':method.lower() in public.get(route,{}),'inScope':not outside,'adapterImplemented':not outside,'auth':'User JWT; role + ownership/participant checks enforced by Backend','contractEvidence':domain+'-public-openapi.json'})
(OUT/'api-inventory.json').write_text(json.dumps({'countingRule':'service + HTTP method + normalized public route','operations':rows,'counts':{d:{'discovered':sum(r['domain']==d for r in rows),'inScope':sum(r['domain']==d and r['inScope'] for r in rows)} for d in ['marketplace','order','chat']}},indent=2),encoding='utf-8')
print(json.dumps({'counts':{d:{'discovered':sum(r['domain']==d for r in rows),'inScope':sum(r['domain']==d and r['inScope'] for r in rows)} for d in ['marketplace','order','chat']},'sourceRuntimeMissing':[r['method']+' '+r['route'] for r in rows if not r['runtimeDefined']]}))
