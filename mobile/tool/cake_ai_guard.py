"""Compare protected source/secrets with the pre-execution baseline, read only.

Also scan changed/new Mobile text and built APK entries for known credentials
read in memory. Only path/variable names and match counts are reported.
"""
import datetime
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import zipfile
from cake_ai_runtime import ROOT, MOBILE, OUT, save

baseline = json.loads((OUT / 'baseline.json').read_text())
excluded = {'.git', 'node_modules', 'target', 'build', '.dart_tool', '.gradle', '__pycache__', '.symlinks'}


def fingerprint(p):
    s = p.stat()
    return {'sha256': hashlib.sha256(p.read_bytes()).hexdigest(), 'size': s.st_size, 'mtimeNs': s.st_mtime_ns}


protected = {}
for directory, dirs, files in os.walk(ROOT):
    dirs[:] = [d for d in dirs if d not in excluded and (Path(directory) / d) != MOBILE]
    for name in files:
        p = Path(directory) / name
        protected[p.relative_to(ROOT).as_posix()] = fingerprint(p)
changed = [k for k, old in baseline['protectedFiles'].items() if protected.get(k) != old]
added = sorted(set(protected) - set(baseline['protectedFiles']))
secret_changes = [p for p, old in baseline['externalSecrets'].items() if not Path(p).exists() or fingerprint(Path(p)) != old]
new_secret_files = sorted(str(p) for p in (ROOT.parent / '.secrets/bakery-platform').iterdir()
                          if p.is_file() and str(p) not in baseline['externalSecrets'])
mobile_changed = []
for directory, dirs, files in os.walk(MOBILE):
    dirs[:] = [d for d in dirs if d not in excluded]
    for name in files:
        p = Path(directory) / name
        rel = p.relative_to(ROOT).as_posix()
        old = baseline['initialMobileFiles'].get(rel)
        if old is None or fingerprint(p)['sha256'] != old['sha256']:
            mobile_changed.append(p)
# Secrets from approved local files stay in this process only.
needles = {}
for p in [ROOT / '.env', ROOT / 'backend/.env', ROOT.parent / '.secrets/bakery-platform/local-runtime.env']:
    if not p.exists():
        continue
    for line in p.read_text(encoding='utf-8-sig').splitlines():
        if '=' not in line or line.lstrip().startswith('#'):
            continue
        k, v = line.split('=', 1)
        v = v.strip().strip('"').strip("'")
        if re.search('PASSWORD|SECRET|API_KEY|PRIVATE_KEY', k) and len(v) >= 10:
            needles[k.strip()] = v.encode()
private = json.loads((ROOT.parent / '.secrets/bakery-platform/local-smoke-users.json').read_text(encoding='utf-8-sig'))
def credentials(obj):
    if isinstance(obj, dict):
        for k, v in obj.items():
            if k == 'password' and isinstance(v, str) and len(v) >= 8:
                needles['SYNTHETIC_PASSWORD_' + str(len(needles))] = v.encode()
            elif isinstance(v, dict):
                credentials(v)
credentials(private)
for p in (ROOT.parent / '.secrets/bakery-platform').glob('*.pem'):
    if 'PRIVATE KEY' in p.read_text():
        needles['PRIVATE_PEM'] = p.read_bytes()
for p in (ROOT.parent / '.secrets/bakery-platform').glob('*.json'):
    obj = json.loads(p.read_text(encoding='utf-8-sig'))
    if isinstance(obj, dict) and obj.get('private_key'):
        needles['SERVICE_ACCOUNT_PRIVATE_KEY'] = obj['private_key'].encode()
matches = []
for p in mobile_changed:
    content = p.read_bytes()
    for key, value in needles.items():
        if value in content:
            matches.append({'path': p.relative_to(ROOT).as_posix(), 'variableName': key})
apk = MOBILE / 'build/app/outputs/flutter-apk/app-debug.apk'
apk_matches = []
scanned_apks = []
for artifact in [apk, MOBILE / '.dart_tool/cake-ai-apks/driver.apk']:
    if not artifact.exists():
        continue
    scanned_apks.append({'path': artifact.relative_to(MOBILE).as_posix(),
                         'sha256': hashlib.sha256(artifact.read_bytes()).hexdigest()})
    with zipfile.ZipFile(artifact) as z:
        for name in z.namelist():
            if name.endswith('/'):
                continue
            data = z.read(name)
            for key, value in needles.items():
                if value in data:
                    apk_matches.append({'artifact': artifact.relative_to(MOBILE).as_posix(), 'entry': name, 'variableName': key})
report = {
    'at': datetime.datetime.now(datetime.timezone.utc).isoformat(),
    'headBefore': baseline['head'],
    'headAfter': subprocess.check_output(['git', 'rev-parse', 'HEAD'], text=True).strip(),
    'protectedBeforeCount': len(baseline['protectedFiles']), 'protectedAfterCount': len(protected),
    'protectedChangedOrDeleted': changed, 'protectedAdded': added,
    'externalSecretsBeforeCount': len(baseline['externalSecrets']),
    'externalSecretsChangedOrDeleted': secret_changes, 'newExternalSecretFiles': new_secret_files,
    'changedOrAddedMobileCount': len(mobile_changed),
    'changedExistingMobile': [p.relative_to(ROOT).as_posix() for p in mobile_changed if p.relative_to(ROOT).as_posix() in baseline['initialMobileFiles']],
    'knownSecretNeedlesCount': len(needles), 'secretMatches': matches, 'apkSecretMatches': apk_matches,
    'scannedApks': scanned_apks,
    'apkSha256': hashlib.sha256(apk.read_bytes()).hexdigest() if apk.exists() else None,
    'staged': subprocess.check_output(['git', 'diff', '--cached', '--name-only'], text=True).splitlines(),
    'status': subprocess.check_output(['git', 'status', '--short'], text=True),
}
report['result'] = 'PASS' if not any([changed, added, secret_changes, new_secret_files, matches, apk_matches, report['staged'], report['headBefore'] != report['headAfter']]) else 'FAIL'
save('final-integrity.json', report)
print(json.dumps({k: report[k] for k in ['result', 'protectedBeforeCount', 'protectedAfterCount', 'protectedChangedOrDeleted', 'protectedAdded', 'externalSecretsChangedOrDeleted', 'changedOrAddedMobileCount', 'secretMatches', 'apkSecretMatches']}))
raise SystemExit(0 if report['result'] == 'PASS' else 2)
