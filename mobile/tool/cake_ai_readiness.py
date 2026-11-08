"""Read-only readiness/provenance of the existing Mobile stack for Cake AI.

Does not claim old Identity/Bakery/Subscription JARs match current source. The
legacy launcher refuses that drift; this explicit reuse path records it while
testing the current isolated Cake AI JAR against the already running services.
"""
from pathlib import Path
import argparse
import hashlib
import json
import subprocess
import urllib.request
from cake_ai_runtime import ROOT, MOBILE

p = argparse.ArgumentParser()
p.add_argument('--output', type=Path, required=True)
args = p.parse_args()
out = args.output.resolve()
if not out.is_relative_to(MOBILE):
    raise SystemExit('Evidence must remain inside mobile')
out.mkdir(parents=True, exist_ok=True)
services = {
    'identity': ('bakery-mobile-20261107-mobile-identity-1', '/v3/api-docs'),
    'bakery': ('bakery-mobile-20261107-mobile-bakery-1', '/api/v1/products'),
    'subscription': ('bakery-mobile-20261107-mobile-subscription-1', '/api/v1/subscription-plans'),
    'marketplace': ('bakery-mobile-phase5-marketplace', '/v3/api-docs'),
    'order': ('bakery-mobile-phase5-order', '/v3/api-docs'),
    'chat': ('bakery-mobile-phase5-chat', '/v3/api-docs'),
    'mobile-storage': ('bakery-mobile-20261107-mobile-storage-1', '/minio/health/ready'),
    'chat-storage': ('bakery-local-chat-storage-1', '/minio/health/ready'),
}
report = {'services': {}, 'actions': [], 'sourceDrift': {}, 'mode': 'EXPLICIT_REUSE_RUNNING_SERVICES'}
for domain, (container, path) in services.items():
    c = json.loads(subprocess.check_output(['docker', 'inspect', container]))[0]
    if c['State']['Status'] != 'running':
        raise RuntimeError('Existing service is not running: ' + domain)
    internal = '9000/tcp' if domain.endswith('storage') else '8080/tcp'
    bindings = c['HostConfig']['PortBindings'][internal]
    if len(bindings) != 1 or bindings[0]['HostIp'] != '127.0.0.1':
        raise RuntimeError('Expected a single loopback binding: ' + domain)
    origin = 'http://127.0.0.1:' + bindings[0]['HostPort']
    with urllib.request.urlopen(origin + path, timeout=5) as r:
        if r.status != 200:
            raise RuntimeError('Readiness failed: ' + domain)
    key = domain if domain.endswith('storage') else domain + '-service'
    report['services'][key] = {'container': container, 'origin': origin,
                               'readinessStatus': 200, 'image': c['Image'],
                               'source': 'existing running deployment; no rebuild or reconfiguration'}
    if domain in ['identity', 'bakery', 'subscription']:
        source = ROOT / 'backend' / (domain + '-service')
        old = ROOT.parent / '.runtime/bakery-mobile-phases-1-4/source/backend' / (domain + '-service')
        changed = []
        for f in (source / 'src').rglob('*'):
            if f.is_file():
                copy = old / f.relative_to(source)
                if not copy.is_file() or hashlib.sha256(copy.read_bytes()).digest() != hashlib.sha256(f.read_bytes()).digest():
                    changed.append(f.relative_to(ROOT).as_posix())
        report['sourceDrift'][domain] = changed
report['result'] = 'READY_WITH_SOURCE_PROVENANCE_LIMITATIONS' if any(report['sourceDrift'].values()) else 'PASS'
(out / 'runtime-start.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
print(json.dumps({'result': report['result'], 'services': len(services),
                  'sourceDriftCounts': {k: len(v) for k, v in report['sourceDrift'].items()}}))
