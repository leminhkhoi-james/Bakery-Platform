"""Resumable Gateway HTTP workflow runner. Secrets stay in ignored target files."""
from pathlib import Path
import concurrent.futures
import datetime
import hashlib
import json
import secrets
import subprocess
import time
import urllib.error
import urllib.request
import uuid

ROOT = Path(__file__).resolve().parents[1]
STATE = ROOT / 'backend/target/gateway-e2e-state.json'
EVIDENCE = ROOT / 'docs/audit/evidence/gateway-e2e.json'
BASE = 'http://127.0.0.1:8080'
HTTP = urllib.request.build_opener(urllib.request.ProxyHandler({}))
IMAGE = (ROOT / 'frontend/public/business-simulation/cake-01.jpeg').read_bytes()


def multipart(metadata=None, image=None, part='file', fields=None):
    boundary = 'gateway-e2e-' + uuid.uuid4().hex
    chunks = []
    for name, value in (fields or {}).items():
        chunks.append(f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"\r\n\r\n{value}\r\n'.encode())
    if metadata is not None:
        chunks.append((f'--{boundary}\r\nContent-Disposition: form-data; name="metadata"\r\n'
                       'Content-Type: application/json\r\n\r\n').encode() + json.dumps(metadata).encode() + b'\r\n')
    if image is not None:
        chunks.append((f'--{boundary}\r\nContent-Disposition: form-data; name="{part}"; filename="e2e-cake.jpg"\r\n'
                       'Content-Type: image/jpeg\r\n\r\n').encode() + image + b'\r\n')
    chunks.append(f'--{boundary}--\r\n'.encode())
    return b''.join(chunks), 'multipart/form-data; boundary=' + boundary


def future(days=7):
    return (datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=days)).isoformat()


def key():
    return {'Idempotency-Key': str(uuid.uuid4())}


class Runner:
    def __init__(self):
        self.state = json.loads(STATE.read_text()) if STATE.exists() else {
            'run': uuid.uuid4().hex[:10], 'actors': {}, 'ids': {}, 'completed': [], 'checks': []}
        self.ids = self.state['ids']
        self.phase = 'setup'

    def save(self):
        existed = STATE.exists()
        STATE.write_text(json.dumps(self.state), encoding='utf-8')
        if not existed:
            account = subprocess.check_output(['whoami'], text=True).strip()
            subprocess.run(['icacls', str(STATE), '/inheritance:r', '/grant:r', account + ':F',
                            '/grant:r', '*S-1-5-18:F'], capture_output=True, check=True)
        latest = {}
        for row in self.state['checks']:
            if row.get('invalidExpectation'):
                continue
            latest[row['phase'] + ':' + row['name']] = row
        EVIDENCE.parent.mkdir(parents=True, exist_ok=True)
        EVIDENCE.write_text(json.dumps({'run': self.state['run'], 'baseUrl': BASE,
            'updatedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
            'completedPhases': self.state['completed'], 'checks': list(latest.values()),
            'attemptCount': len(self.state['checks']), 'passed': sum(r['passed'] for r in latest.values()),
            'failed': sum(not r['passed'] for r in latest.values()),
            'ids': self.ids,
            'harnessCorrections': [row for row in self.state['checks'] if row.get('invalidExpectation')]}, indent=2), encoding='utf-8')

    def record(self, name, passed, **details):
        row = {'phase': self.phase, 'name': name, 'passed': bool(passed), **details}
        self.state['checks'].append(row)
        self.save()
        print(('PASS ' if passed else 'FAIL ') + self.phase + ': ' + name +
              (' HTTP ' + str(details['actualStatus']) if 'actualStatus' in details else ''), flush=True)
        if not passed:
            raise RuntimeError('Workflow check failed: ' + name)

    def call(self, name, method, path, actor=None, body=None, expected=(200,), headers=None,
             upload=None, raw=False):
        h = {'Accept': 'application/json', 'X-Correlation-Id': 'gateway-e2e-' + self.state['run']}
        if actor:
            h['Authorization'] = 'Bearer ' + self.state['actors'][actor]['token']
        h.update(headers or {})
        if upload is not None:
            data, h['Content-Type'] = upload
        elif body is not None:
            data = json.dumps(body).encode()
            h['Content-Type'] = 'application/json'
        else:
            data = None
        request = urllib.request.Request(BASE + path, data=data, method=method, headers=h)
        started = time.monotonic()
        try:
            response = HTTP.open(request, timeout=40)
        except urllib.error.HTTPError as error:
            response = error
        with response:
            status = response.status
            content = response.read()
            try: payload = json.loads(content) if content else None
            except ValueError: payload = None
        if raw:
            return status, payload
        safe_error = None
        if status >= 400 and isinstance(payload, dict):
            message = str(payload.get('message', ''))
            if len(message) < 250 and not any(x in message.lower() for x in ['bearer', 'jdbc:', 'http', '@']):
                safe_error = message
        self.record(name, status in expected, method=method, path=path, expectedStatus=list(expected),
                    actualStatus=status, elapsedMs=round((time.monotonic() - started) * 1000), error=safe_error)
        return payload.get('data', payload) if isinstance(payload, dict) else payload

    def sql(self, domain, query):
        if domain not in ['identity', 'bakery', 'marketplace', 'subscription', 'order', 'chat', 'cake-ai']:
            raise ValueError('Unknown database')
        container = 'bakery-gateway-' + domain + '-db-1'
        result = subprocess.run(['docker', 'exec', '-i', container, 'sh', '-c',
            'psql -X -Atq -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"'],
            input=query, text=True, capture_output=True, check=True)
        return result.stdout.strip()

    def login(self, actor):
        user = self.state['actors'][actor]
        login = self.call('Login ' + actor, 'POST', '/identity/api/v1/auth/login',
                          body={'email': user['email'], 'password': user['password']})
        user['token'] = login['accessToken']
        self.save()

    def run(self, phase, function):
        self.phase = phase
        if phase in self.state['completed']:
            print('Already completed: ' + phase, flush=True)
            return
        function(self)
        self.state['completed'].append(phase)
        self.save()


def image_read(runner, name, url, expected_bytes=None):
    with HTTP.open(url, timeout=40) as response:
        content = response.read()
        mime = response.headers.get('Content-Type', '')
        valid = response.status == 200 and mime.startswith('image/') and len(content) > 100
    if expected_bytes is not None:
        valid = valid and content == expected_bytes
    runner.record(name, valid, bytes=len(content), sha256=hashlib.sha256(content).hexdigest())
    return content
