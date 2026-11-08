"""Compare security bytecode of existing binaries without changing containers."""
from phase5_http import ROOT,OUT
import hashlib,json,subprocess,zipfile
cache=ROOT/'mobile/.dart_tool/phase5-artifacts';cache.mkdir(parents=True,exist_ok=True)
c=json.loads(subprocess.check_output(['docker','inspect','bakery-local-bakery-service-1']))[0]
cmd=(c['Config'].get('Entrypoint') or [])+(c['Config'].get('Cmd') or [])
jar=next((cmd[i+1] for i,x in enumerate(cmd[:-1]) if x=='-jar'),None)
result={'image':c['Image'],'sourceSecurityConverterIncludesScope':True}
if jar:
    target=cache/'canonical-bakery.jar'
    subprocess.run(['docker','cp',c['Name'].lstrip('/')+':'+jar,str(target)],capture_output=True,check=True)
    current=ROOT.parent/'.runtime/bakery-mobile-phases-1-4/jars/bakery-service.jar'
    for label,p in [('canonicalImage',target),('previousCurrentSourceRuntime',current)]:
        with zipfile.ZipFile(p) as z:
            entry=next(n for n in z.namelist() if n.endswith('/security/SecurityConfig.class'))
            raw=z.read(entry);result[label]={'jarSha256':hashlib.sha256(p.read_bytes()).hexdigest(),'securityClassSha256':hashlib.sha256(raw).hexdigest(),'containsDelegatingConverter':b'DelegatingJwtGrantedAuthoritiesConverter' in raw}
    result['sameSecurityBytecode']=result['canonicalImage']['securityClassSha256']==result['previousCurrentSourceRuntime']['securityClassSha256']
(OUT/'artifact-provenance.json').write_text(json.dumps(result,indent=2),encoding='utf-8');print(json.dumps(result))
