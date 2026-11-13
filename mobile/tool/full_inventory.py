"""Reconcile current controller mappings with historical IDs, without running Backend."""
from full_common import ROOT,MOBILE,DOCS,OUT,save
import collections,hashlib,json,re
old=json.loads((ROOT/'docs/backend-audit/evidence/api-inventory.json').read_text())
def key(service,method,path):return (service,method,re.sub(r'\{[^}]+\}','{}',path))
historical={key(r['module'],r['method'],r['path']):r for r in old}
rows=[]
for module in sorted((ROOT/'backend').iterdir()):
    if not module.is_dir():continue
    for p in (module/'src/main/java').rglob('*.java'):
        source=p.read_text(encoding='utf-8');klass=re.search(r'\bpublic\s+(?:final\s+)?class\s+(\w+)',source)
        if '@RestController' not in source or not klass:continue
        before=source[:klass.start()];base=re.search(r'@RequestMapping\s*\(([^)]*)\)',before,re.S)
        bases=re.findall(r'"([^"\n]+)"',base[1]) if base else ['']
        maps=list(re.finditer(r'@(Get|Post|Put|Patch|Delete)Mapping\b(?:\s*\(([^)]*)\))?',source))
        for i,m in enumerate(maps):
            args=m[2] or '';pathArg=re.search(r'(?:(?:value|path)\s*=\s*)?(\{?\s*"[^\n]+?"\s*\}?)',args)
            # consumes/produces are not paths.
            suffixes=re.findall(r'"([^"\n]*)"',pathArg[1]) if pathArg and (args.lstrip().startswith('"') or args.lstrip().startswith('{') or re.match(r'\s*(value|path)\s*=',args)) else ['']
            body=source[m.end():maps[i+1].start() if i+1<len(maps) else len(source)]
            handler=re.search(r'\bpublic\s+([^{};]+?)\s+(\w+)\s*\(',body)
            for b in bases:
                for suffix in suffixes:
                    path=b+suffix;method=m[1].upper();prior=historical.get(key(module.name,method,path))
                    exposure='MOBILE_SHARED'
                    if path.startswith('/internal/') or klass[1]=='ServiceTokenController':exposure='INTERNAL_SERVICE_ONLY'
                    elif klass[1]=='JwkSetController':exposure='SDK_OR_PROTOCOL_MANAGED'
                    elif '/admin/' in path:exposure='MOBILE_ADMIN'
                    elif klass[1].startswith('Public') or klass[1] in ['SubscriptionPlanController','PaymentOptionsController']:exposure='MOBILE_PUBLIC'
                    elif module.name=='cake-ai-service' and path.endswith('/generation-jobs'):exposure='MOBILE_CUSTOMER'
                    elif module.name=='bakery-service' and klass[1] not in ['BakeryOnboardingController']:exposure='MOBILE_OWNER'
                    apiId=prior['id'] if prior else module.name[:3].upper()+'-'+hashlib.sha256('|'.join(key(module.name,method,path)).encode()).hexdigest()[:8]
                    rows.append({'id':apiId,'service':module.name,'method':method,'path':path,'exposure':exposure,'applicable':exposure.startswith('MOBILE_'),'controller':klass[1],'handler':handler[2] if handler else None,'source':p.relative_to(ROOT).as_posix(),'line':source[:m.start()].count('\n')+1,'sourceSha256':hashlib.sha256(p.read_bytes()).hexdigest(),'response':handler[1].strip() if handler else None,'annotations':re.findall(r'@PreAuthorize\("([^"\n]+)"\)',before+body.split('public')[0]),'dtoNames':sorted(set(re.findall(r'\b([A-Z]\w*(?:Request|Response|Dto))\b',body))),'historicalId':prior['id'] if prior else None,'adapter':False,'reachableUi':False,'androidCurrent':'NOT_TESTED','hostCurrent':'NOT_TESTED','videoTimecodes':[]})
keys=[key(r['service'],r['method'],r['path']) for r in rows]
assert len(keys)==len(set(keys)),'Duplicate normalized mappings require manual review'
oldKeys=set(historical);newKeys=set(keys)
summary={'countingRule':'service + HTTP method + normalized full route; placeholder names normalized only for matching','counts':dict(collections.Counter(r['service'] for r in rows)),'applicableByService':dict(collections.Counter(r['service'] for r in rows if r['applicable'])),'total':len(rows),'applicable':sum(r['applicable'] for r in rows),'oldMappingsRemoved':[list(k) for k in sorted(oldKeys-newKeys)],'newMappings':[list(k) for k in sorted(newKeys-oldKeys)],'operations':rows,'frameworkNote':'Framework-generated Swagger/health/error endpoints are separately recorded during runtime; not invented controller operations'}
save('source-api-inventory.json',summary)
print(json.dumps({k:v for k,v in summary.items() if k not in ['operations','countingRule','frameworkNote']}),flush=True)
