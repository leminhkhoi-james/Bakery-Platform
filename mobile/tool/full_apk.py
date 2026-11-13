"""Keep the verified test-entry APK separate from the normal README app APK."""
import hashlib,json,shutil
from full_common import MOBILE,OUT,save
CACHE=MOBILE/'.dart_tool/full-integration-apks'
def fingerprint():
    paths=sorted([*list((MOBILE/'lib').rglob('*.dart')),MOBILE/'test_driver/full_app.dart',MOBILE/'pubspec.yaml'])
    values={p.relative_to(MOBILE).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in paths}
    return hashlib.sha256(json.dumps(values,sort_keys=True).encode()).hexdigest(),values
def origins():
    runtime=json.loads((OUT/'runtime-start.json').read_text())
    return {d:runtime['services'][d+'-service']['origin'] for d in ['identity','bakery','subscription','marketplace','order','chat']}
def cache_current():
    apk=MOBILE/'build/app/outputs/flutter-apk/app-debug.apk';CACHE.mkdir(parents=True,exist_ok=True)
    f,files=fingerprint();target=CACHE/'full-driver.apk';shutil.copy2(apk,target)
    meta={'entrypoint':'test_driver/full_app.dart','persistentSyntheticNamespace':'sweetcake.full-session.v1','sourceFingerprint':f,'sourceHashes':files,'publicOrigins':origins(),'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'bytes':target.stat().st_size,'secretScanStatus':'PENDING_FINAL_GUARD','cachedPath':str(target.relative_to(MOBILE))}
    (CACHE/'full-driver.json').write_text(json.dumps(meta,indent=2),encoding='utf-8');save('driver-build.json',meta)
    return target
def verified_cache():
    meta=json.loads((CACHE/'full-driver.json').read_text());p=CACHE/'full-driver.apk'
    if meta['sourceFingerprint']!=fingerprint()[0] or meta['publicOrigins']!=origins() or meta['sha256']!=hashlib.sha256(p.read_bytes()).hexdigest():raise RuntimeError('Cached test APK does not match current source/origins; build without --reuse-apk')
    return p
if __name__=='__main__':
    p=cache_current();print({'cachedDriverApk':str(p.relative_to(MOBILE)),'sourceFingerprint':fingerprint()[0]})
