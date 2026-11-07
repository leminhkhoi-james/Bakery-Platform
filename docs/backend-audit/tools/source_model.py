"""Mô hình AST Java phục vụ audit; không compile và không sửa ứng dụng."""
from pathlib import Path
import collections, gc, hashlib, itertools, json, os, re, sys, tempfile

ROOT=Path(__file__).resolve().parents[3]; OUT=ROOT/'docs/backend-audit/evidence'
sys.path.insert(0,os.environ.get('AUDIT_PYTHON_TOOLS',str(Path(tempfile.gettempdir())/'bakery-backend-audit-20261107-parser')))
from tree_sitter import Language, Parser
import tree_sitter_java
parser=Parser(Language(tree_sitter_java.language()))
# Giữ Tree sống đến cuối phiên; tránh lỗi GC native trên Python 3.13/Windows.
gc.disable()
trees=[]
def walk(n):
    yield n
    for c in n.named_children:yield from walk(c)
def txt(n):return n.text.decode('utf-8') if n else ''
def anns(n):
    modifiers=next((c for c in n.named_children if c.type=='modifiers'),None)
    return [txt(c) for c in modifiers.named_children if c.type in ['annotation','marker_annotation']] if modifiers else []
def source_ref(n,path):return {'source':path,'line':n.start_point.row+1,'endLine':n.end_point.row+1}
def write(name,data):(OUT/name).write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
manifest=[]; classes=[]; methods=[]; parse_errors=[]; mappings=[]
for p in sorted((ROOT/'backend').rglob('*')):
    if not p.is_file() or any(x in p.parts for x in ['target','.git','.idea']):continue
    if p.suffix not in ['.java','.xml','.yml','.yaml','.properties','.sql','.md'] and p.name not in ['Dockerfile','mvnw','mvnw.cmd']:continue
    raw=p.read_bytes(); path=p.relative_to(ROOT).as_posix()
    manifest.append({'source':path,'bytes':len(raw),'lines':len(raw.splitlines()),'sha256':hashlib.sha256(raw).hexdigest(),'test': '/src/test/' in path})
    if p.suffix!='.java':continue
    if '--progress' in sys.argv: print(path,flush=True)
    tree=parser.parse(raw);trees.append(tree);root=tree.root_node
    if root.has_error:parse_errors.append(path)
    package=next((txt(c).removeprefix('package ').rstrip(';') for c in root.named_children if c.type=='package_declaration'),'')
    for node in walk(root):
        if node.type not in ['class_declaration','interface_declaration','record_declaration','enum_declaration']:continue
        name=txt(node.child_by_field_name('name')); module=p.relative_to(ROOT/'backend').parts[0]
        body=node.child_by_field_name('body'); children=list(body.named_children) if body else []
        children += [y for x in children if x.type=='enum_body_declarations' for y in x.named_children]
        cl={'name':name,'package':package,'module':module,'kind':node.type,'annotations':anns(node),'super':txt(node.child_by_field_name('superclass')),'interfaces':txt(node.child_by_field_name('interfaces')),'test':'/src/test/' in path,**source_ref(node,path),'fields':[],'methods':[]}
        params=node.child_by_field_name('parameters')
        for child in list(children)+(list(params.named_children) if params else []):
            if child.type in ['field_declaration','constant_declaration','formal_parameter']:
                typ=txt(child.child_by_field_name('type'))
                for v in ([child] if child.type=='formal_parameter' else [x for x in child.named_children if x.type=='variable_declarator']):
                    cl['fields'].append({'name':txt(v.child_by_field_name('name')),'type':typ,'annotations':anns(child),'declaration':txt(child),**source_ref(child,path)})
            if child.type not in ['method_declaration','constructor_declaration','compact_constructor_declaration']:continue
            b=child.child_by_field_name('body'); name_m=txt(child.child_by_field_name('name')) or name
            parameters=child.child_by_field_name('parameters')
            method={'class':name,'module':module,'name':name_m,'return':txt(child.child_by_field_name('type')),'parameters':txt(parameters),'annotations':anns(child),'signature':txt(child)[:(b.start_byte-child.start_byte) if b else len(txt(child))].strip(),'body':txt(b),'invocations':[],**source_ref(child,path)}
            method['key']=f'{path}:{method["line"]}:{name_m}'
            if b:
                for inv in walk(b):
                    if inv.type=='method_invocation':method['invocations'].append({'object':txt(inv.child_by_field_name('object')),'name':txt(inv.child_by_field_name('name')),'arguments':txt(inv.child_by_field_name('arguments')),'line':inv.start_point.row+1})
            method['localTypes']={txt(v.child_by_field_name('name')):txt(local.child_by_field_name('type')) for local in walk(b) if local.type=='local_variable_declaration' for v in local.named_children if v.type=='variable_declarator'} if b else {}
            cl['methods'].append(method['key']); methods.append(method)
        if node.type=='enum_declaration':cl['values']=[txt(x.child_by_field_name('name')) for x in children if x.type=='enum_constant']
        classes.append(cl)

prod=[c for c in classes if not c['test']]; by_key={m['key']:m for m in methods}; by_name=collections.defaultdict(list)
for c in prod:by_name[c['name']].append(c)
def resolve(typ,method,module):
    typ=re.sub(r'<.*>','',typ).split('.')[-1].strip()
    candidates=[c for c in by_name[typ] if c['module']==module]
    if not candidates:candidates=[c for c in by_name[typ] if c['module']=='platform-support']
    candidates += [c for c in prod if c['module']==module and re.search(r'\b'+re.escape(typ)+r'\b',c['interfaces'])] if typ else []
    return [by_key[k] for c in candidates for k in c['methods'] if by_key[k]['name']==method]
class_methods={(c['source'],c['name']):c for c in classes}
for m in methods:
    cl=class_methods[(m['source'],m['class'])];deps={x['name']:x['type'] for x in cl['fields']};deps.update(m['localTypes'])
    m['resolvedCalls']=[];m['unresolvedCalls']=[]
    for call in m['invocations']:
        obj=call['object'];typ=m['class'] if obj in ['', 'this'] else deps.get(obj,obj if obj in by_name else '')
        found=resolve(typ,call['name'],m['module']) if typ else []
        m['resolvedCalls'] += [x['key'] for x in found]
        if not found:m['unresolvedCalls'].append(call)
    m['resolvedCalls']=list(dict.fromkeys(m['resolvedCalls']))

def annotation_name(a):return re.match(r'@(\w+)',a)[1]
def paths(a):
    pair=re.search(r'\b(?:value|path)\s*=\s*(\{[^}]*\}|"[^"]*")',a,re.S)
    direct=re.match(r'@\w+\s*\(\s*(\{[^}]*\}|"[^"]*")',a,re.S)
    raw=pair[1] if pair else direct[1] if direct else ''
    return re.findall(r'"([^"\n]*)"',raw) or ['']
apis=[]
for cl in prod:
    if not any(annotation_name(a) in ['RestController','Controller'] for a in cl['annotations']):continue
    prefix=next((paths(a) for a in cl['annotations'] if annotation_name(a)=='RequestMapping'),[''])
    for key in cl['methods']:
        m=by_key[key]
        for a in m['annotations']:
            name=annotation_name(a)
            if name not in ['GetMapping','PostMapping','PutMapping','PatchMapping','DeleteMapping','RequestMapping']:continue
            verbs=[name[:-7].upper()] if name!='RequestMapping' else re.findall(r'RequestMethod\.(\w+)',a) or ['ANY']
            for base,path,verb in itertools.product(prefix,paths(a),verbs):
                route=(base.rstrip('/')+'/'+path.lstrip('/')).rstrip('/') or '/'
                api={'module':cl['module'],'controller':cl['name'],'handler':m['name'],'method':verb,'path':route,'key':key,'controllerAnnotations':cl['annotations'],'annotations':m['annotations'],'parameters':m['parameters'],'response':m['return'],'mapping':a,**{k:m[k] for k in ['source','line','endLine']}}
                queue=[key]; seen=set();nodes=[]
                while queue:
                    current=queue.pop(0)
                    if current in seen:continue
                    seen.add(current);nodes.append(current);queue+=by_key[current]['resolvedCalls']
                api['traceMethods']=nodes;apis.append(api)
prefixes={'identity-service':'IDN','bakery-service':'BKR','marketplace-service':'MKT','order-service':'ORD','chat-service':'CHT','cake-ai-service':'CAI','subscription-service':'SUB','api-gateway':'GTW'}
counter=collections.Counter(); unique=set()
for a in sorted(apis,key=lambda a:(a['module'],a['path'],a['method'])):
    identity=(a['module'],a['method'],a['path']);assert identity not in unique,identity;unique.add(identity)
    counter[a['module']]+=1;a['id']=f'{prefixes.get(a["module"],a["module"])}-{counter[a["module"]]:03d}'
    a['visibility']='INTERNAL' if a['path'].startswith('/internal/') else 'PUBLIC_SURFACE'
apis.sort(key=lambda a:(a['module'],a['id']))
write('source-manifest.json',manifest);write('java-classes.json',classes);write('java-methods.json',methods);write('api-inventory.json',apis)
summary={'relevantFilesRead':len(manifest),'productionJava':sum(x['source'].endswith('.java') and not x['test'] for x in manifest),'testJava':sum(x['source'].endswith('.java') and x['test'] for x in manifest),'classes':len(prod),'methods':len(methods),'controllerClasses':sum(any('@RestController' in a or '@Controller' in a for a in c['annotations']) for c in prod),'parseErrors':parse_errors,'applicationHttpOperations':len(apis),'byService':dict(counter),'byMethod':dict(collections.Counter(a['method'] for a in apis)),'unresolvedAnyMappings':[a['id'] for a in apis if a['method']=='ANY'],'parser':'tree-sitter Java AST; heuristic type/call binding, not Java compiler semantic analysis'}
write('source-summary.json',summary);print(json.dumps(summary,ensure_ascii=False))
