"""HTTP smoke checks through Gateway; no provider calls or business transactions.

Creates one temporary customer and removes only that customer's Identity record.
Requires the Docker project started by Start-GatewayStack.ps1.
"""
import argparse
import http.cookiejar
import json
from pathlib import Path
import secrets
import subprocess
import time
import urllib.error
import urllib.request
import uuid

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--base-url', default='http://127.0.0.1:8080')
parser.add_argument('--project', default='bakery-gateway')
parser.add_argument('--output', default='docs/audit/evidence/gateway-smoke.json')
args = parser.parse_args()
base = args.base_url.rstrip('/')
cookies = http.cookiejar.CookieJar()
client = urllib.request.build_opener(urllib.request.ProxyHandler({}),
                                    urllib.request.HTTPCookieProcessor(cookies))
results = []
user_id = None
email = 'gateway-smoke-' + uuid.uuid4().hex + '@example.test'
password = secrets.token_urlsafe(24)


def request(method, path, body=None, token=None, timeout=20):
    headers = {'Accept': 'application/json'}
    if body is not None:
        headers['Content-Type'] = 'application/json'
    if token:
        headers['Authorization'] = 'Bearer ' + token
    req = urllib.request.Request(base + path, method=method, headers=headers,
                                 data=json.dumps(body).encode() if body is not None else None)
    try:
        response = client.open(req, timeout=timeout)
    except urllib.error.HTTPError as error:
        response = error
    with response:
        raw = response.read()
        try:
            payload = json.loads(raw)
        except ValueError:
            payload = None
        return response.status, payload


def check(name, method, path, expected=200, body=None, token=None):
    status, payload = request(method, path, body, token)
    passed = status == expected
    results.append({'check': name, 'method': method, 'path': path,
                    'expectedStatus': expected, 'actualStatus': status, 'passed': passed})
    print(f'{"PASS" if passed else "FAIL"} {name}: HTTP {status}', flush=True)
    return status, payload


try:
    deadline = time.monotonic() + 120
    while time.monotonic() < deadline:
        try:
            if request('GET', '/actuator/health', timeout=2)[0] == 200:
                break
        except (OSError, urllib.error.URLError):
            pass
        time.sleep(2)
    else:
        raise RuntimeError('Gateway not ready after 120 seconds')
    check('Gateway health', 'GET', '/actuator/health')
    services = ['identity', 'bakery', 'marketplace', 'subscription', 'cake-ai', 'orders', 'chat']
    for service in services:
        status, document = check(service + ' OpenAPI', 'GET', f'/{service}/v3/api-docs')
        valid = bool(status == 200 and isinstance(document, dict)
                     and document.get('openapi') and document.get('paths'))
        results.append({'check': service + ' OpenAPI document', 'passed': valid,
                        'pathCount': len(document.get('paths', {})) if isinstance(document, dict) else 0})
        servers = document.get('servers', []) if isinstance(document, dict) else []
        results.append({'check': service + ' Swagger uses Gateway URL',
                        'passed': any(server.get('url') == base + '/' + service for server in servers)})
    protected = {'identity': '/auth/me', 'marketplace': '/cake-requests',
                 'cake-ai': '/generation-jobs', 'orders': '/orders', 'chat': '/conversations'}
    for service, path in protected.items():
        check(service + ' rejects anonymous', 'GET', f'/{service}/api/v1{path}', expected=401)
        check(service + ' rejects invalid JWT', 'GET', f'/{service}/api/v1{path}',
              expected=401, token='invalid.jwt.signature')
    status, registered = check('Register temporary customer', 'POST', '/identity/api/v1/auth/register',
                               expected=201, body={'email': email, 'password': password,
                                                   'displayName': 'Gateway smoke check'})
    if status != 201:
        raise RuntimeError('Registration failed; response values suppressed')
    user_id = str(uuid.UUID(registered['data']['id']))
    status, login = check('Login via Gateway', 'POST', '/identity/api/v1/auth/login',
                          body={'email': email, 'password': password})
    if status != 200:
        raise RuntimeError('Login failed; response values suppressed')
    token = login['data']['accessToken']
    authenticated = {**protected, 'bakery': '/bakeries', 'subscription': '/subscription-plans'}
    for service, path in authenticated.items():
        check(service + ' authenticated API', 'GET', f'/{service}/api/v1{path}', token=token)
    check('Refresh cookie through Gateway', 'POST', '/identity/api/v1/auth/refresh')
    check('Logout through Gateway', 'POST', '/identity/api/v1/auth/logout', token=token)
except Exception as error:
    results.append({'check': 'Smoke execution completed', 'passed': False, 'errorType': type(error).__name__})
    raise
finally:
    if user_id:
        # UUID is parsed and email is generated internally; never delete existing accounts.
        sql = f"DELETE FROM users WHERE id = '{user_id}' AND email = '{email}';"
        cleanup = subprocess.run(
            ['docker', 'compose', '-p', args.project, 'exec', '-T', 'identity-db', 'sh', '-c',
             'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"',],
            input=sql, text=True, capture_output=True)
        cleaned = cleanup.returncode == 0 and 'DELETE 1' in cleanup.stdout
        results.append({'check': 'Temporary customer removed', 'passed': cleaned})
        print('PASS Temporary customer removed' if cleaned else 'FAIL Temporary customer cleanup', flush=True)
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps({'baseUrl': base, 'checks': results,
                                  'passed': all(item['passed'] for item in results)}, indent=2), encoding='utf-8')

raise SystemExit(0 if all(item['passed'] for item in results) else 1)
