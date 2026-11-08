"""In source có số dòng theo class đã được AST định vị; không đoán đường dẫn."""
from pathlib import Path
import hashlib,json,sys
ROOT=Path(__file__).resolve().parents[3];EV=ROOT/'docs/backend-audit/evidence'
classes=json.loads((EV/'java-classes.json').read_text(encoding='utf-8'))
ledger=json.loads((EV/'review-ledger.json').read_text(encoding='utf-8')) if (EV/'review-ledger.json').exists() else []
for query in sys.argv[1:]:
    name,_,module=query.partition('@')
    hits=[x for x in classes if x['name']==name and not x['test'] and (not module or x['module']==module)]
    if not hits:print('NOT_FOUND',query);continue
    for cl in hits:
        p=ROOT/cl['source'];s=p.read_text(encoding='utf-8');lines=s.splitlines()
        print('\nFILE',cl['source'])
        for i,line in enumerate(lines,1):
            if line.startswith('import ') or not line.strip():continue
            print(f'{i}: {line}')
        row={'source':cl['source'],'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'mode':'FULL_SOURCE_EMITTED_WITH_LINE_NUMBERS','class':cl['name']}
        if row not in ledger:ledger.append(row)
(EV/'review-ledger.json').write_text(json.dumps(ledger,ensure_ascii=False,indent=2),encoding='utf-8')
