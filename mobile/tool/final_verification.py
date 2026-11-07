"""Đối chiếu baseline và ranh giới thay đổi; không đọc secrets ngoài repo."""
from pathlib import Path
import hashlib, json, re, subprocess

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'docs/mobile/evidence'
baseline = json.loads((OUT / 'baseline.json').read_text(encoding='utf-8'))
changed, checked = [], 0
for name, old_hash in baseline['tracked'].items():
    if name.startswith(('mobile/', 'docs/')):
        continue
    checked += 1
    path = ROOT / name
    if not path.exists() or hashlib.sha256(path.read_bytes()).hexdigest() != old_hash:
        changed.append(name)
status = subprocess.check_output(['git', 'status', '--porcelain', '-uall'], cwd=ROOT, text=True, encoding='utf-8')
platform_changes = [name for name, old_hash in baseline['tracked'].items() if name.startswith(('mobile/android/', 'mobile/ios/')) and (not (ROOT/name).exists() or hashlib.sha256((ROOT/name).read_bytes()).hexdigest() != old_hash)]
entries = [line[3:] for line in status.splitlines()]
outside = [p for p in entries if not p.startswith(('mobile/', 'docs/'))]
staged = subprocess.check_output(['git', 'diff', '--cached', '--name-only'], cwd=ROOT, text=True).splitlines()
network, sensitive = [], []
for path in (ROOT / 'mobile/lib').rglob('*.dart'):
    text = path.read_text(encoding='utf-8')
    for pattern in [r'dart:io', r'package:(?:http|dio|web_socket|firebase)', r'Image\.network', r'NetworkImage\(', r'HttpClient\(', r'WebSocket\.', r'https?://', r'Bearer\s+[A-Za-z0-9]']:
        if re.search(pattern, text): network.append({'file':path.relative_to(ROOT).as_posix(), 'pattern':pattern})
for name in entries:
    p = ROOT / name
    if not p.is_file() or p.suffix not in ['.dart','.md','.yaml','.json','.py','.txt']:
        continue
    if re.search(r'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.', p.read_text(encoding='utf-8', errors='replace')):
        sensitive.append(name)
result = {'baselineHead':baseline['head'], 'protectedTrackedFilesChecked':checked, 'protectedTrackedFilesChanged':changed, 'platformScaffoldFilesChanged':platform_changes, 'changesOutsideMobileDocs':outside, 'stagedFiles':staged, 'runtimeNetworkingMatches':network, 'privateKeyOrJwtMatches':sensitive, 'changedOrNewFiles':len(entries), 'scope':'Hash toàn bộ file tracked ngoài mobile/docs; không khẳng định đã hash cache/build untracked hoặc kiểm toán mọi loại secret.'}
(OUT / 'repository-integrity.json').write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
manifest = [{'path':p, 'bytes':(ROOT/p).stat().st_size, 'sha256':hashlib.sha256((ROOT/p).read_bytes()).hexdigest()} for p in entries if (ROOT/p).is_file() and p != 'docs/mobile/evidence/file-manifest.json']
(OUT / 'file-manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps(result, ensure_ascii=False))
assert not (changed or platform_changes or outside or staged or network or sensitive)
