"""Real local Cake AI contract checks. Credentials/tokens stay in memory.

Creates explicitly synthetic RFQs/jobs via supported APIs only. No provider key,
cloud writes, database writes, payment, or email. Run once per current-run.
"""
from pathlib import Path
import datetime
import hashlib
import json
import time
import urllib.error
import urllib.request
import uuid
from cake_ai_runtime import ROOT, OUT, STATE, save
from phase5_http import LocalApi

api = LocalApi()
api.origins.update({'identity': 'http://127.0.0.1:18101',
                    'marketplace': 'http://127.0.0.1:18103',
                    'cake': 'http://127.0.0.1:18105'})
results = []
fixtures = {}


def check(label, actor, method, path, expected, body=None, headers=None, raw=None, service='cake'):
    status, value, response_headers = api.call(actor, service, method, path, body, headers, raw)
    results.append({'label': label, 'actor': actor, 'method': method, 'path': path,
                    'http': status, 'expected': expected,
                    'result': 'PASS' if status in expected else 'FAIL',
                    'at': datetime.datetime.now(datetime.timezone.utc).isoformat()})
    print(label, status, results[-1]['result'], flush=True)
    save('host-api-results.json', {'layer': 'HOST_API_REAL_DOCKER', 'checks': results,
                                 'fixtures': fixtures, 'events': api.events})
    return status, value.get('data', value) if isinstance(value, dict) else value, response_headers


def request(actor, title):
    body = {'requestType': 'OPEN_CUSTOM', 'title': title,
            'description': 'Synthetic local Cake AI verification; no purchase or real payment.',
            'neededAt': (datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=14)).isoformat(),
            'deliveryDistrict': 'Local audit district', 'deliveryCity': 'Local audit city',
            'budgetMin': 200000, 'budgetMax': 400000, 'servingSize': 8}
    s, d, _ = check(title, actor, 'POST', '/api/v1/cake-requests', [201], body, service='marketplace')
    if s != 201:
        raise RuntimeError('Actual RFQ prerequisite failed')
    return d['id']


def metadata(request_id, prompt='A strawberry pink cake for a local integration check', count=1):
    return {'cakeRequestId': request_id, 'prompt': prompt, 'negativePrompt': '',
            'generationParameters': {'aspectRatio': '1:1', 'numberOfDesigns': count}}


def multipart(data, image=None):
    boundary = 'cake-local-' + uuid.uuid4().hex
    raw = ('--' + boundary + '\r\nContent-Disposition: form-data; name="metadata"\r\n'
           'Content-Type: application/json\r\n\r\n' + json.dumps(data) + '\r\n').encode()
    if image is not None:
        raw += ('--' + boundary + '\r\nContent-Disposition: form-data; name="sourceImages"; '
                'filename="controlled-reference.jpg"\r\nContent-Type: image/jpeg\r\n\r\n').encode()
        raw += image + b'\r\n'
    raw += ('--' + boundary + '--\r\n').encode()
    return raw, {'Content-Type': 'multipart/form-data; boundary=' + boundary}


def create(label, data, key=None, image=None, actor='customer', expected=None):
    raw, headers = multipart(data, image)
    if key is not False:
        headers['Idempotency-Key'] = key or 'cake-' + uuid.uuid4().hex
    return check(label, actor, 'POST', '/api/v1/generation-jobs', expected or [202], headers=headers, raw=raw)


def wait(job):
    for _ in range(30):
        s, d, _ = api.call('customer', 'cake', 'GET', '/api/v1/generation-jobs/' + job)
        if s == 200 and d['data']['job']['status'] not in ['QUEUED', 'PROCESSING']:
            return d['data']
        time.sleep(1)
    raise RuntimeError('Job did not reach a terminal state within 30 seconds')


if __name__ == '__main__':
    if (OUT / 'host-api-results.json').exists():
        raise SystemExit('Existing evidence retained. Use a new run for another mutation suite.')
    try:
        for actor in ['customer', 'owner', 'admin']:
            api.login(actor)
        fixtures['requestId'] = rid = request('customer', 'Cake AI host ' + STATE['runId'])
        fixtures['foreignRequestId'] = foreign = request('owner', 'Cake AI foreign ownership ' + STATE['runId'])
        key = 'create-' + uuid.uuid4().hex
        reference = (ROOT / 'mobile/assets/demo/cake_01.jpg').read_bytes()
        s, job, _ = create('Create multipart with controlled reference', metadata(rid), key, reference)
        if s != 202:
            raise RuntimeError('Creation failed')
        fixtures['jobId'] = jid = job['id']
        fixtures['initialState'] = job['status']
        check('List own jobs zero-based page', 'customer', 'GET', '/api/v1/generation-jobs?page=0&size=20', [200])
        check('Filter by actual RFQ', 'customer', 'GET', '/api/v1/generation-jobs?cakeRequestId=' + rid + '&status=QUEUED', [200])
        create('Replay same logical create', metadata(rid), key, reference)
        create('Idempotency conflict', metadata(rid, 'Different payload'), key, reference, expected=[409])
        create('Missing key', metadata(rid), False, expected=[400])
        create('Blank prompt', metadata(rid, ''), expected=[400])
        create('Invalid ratio', {**metadata(rid), 'generationParameters': {'aspectRatio': '9:9', 'numberOfDesigns': 1}}, expected=[422])
        create('Invalid source bytes', metadata(rid), image=b'not an image', expected=[422])
        check('Invalid pagination', 'customer', 'GET', '/api/v1/generation-jobs?page=-1', [422])
        check('Invalid status filter', 'customer', 'GET', '/api/v1/generation-jobs?status=UNKNOWN', [422])
        check('Anonymous jobs', 'anonymous', 'GET', '/api/v1/generation-jobs', [401])
        # The existing synthetic Admin also has CUSTOMER. This lists only its
        # own jobs, never a privileged global Admin queue.
        check('Admin with Customer role lists own jobs', 'admin', 'GET', '/api/v1/generation-jobs', [200])
        check('Other Customer cannot read job', 'owner', 'GET', '/api/v1/generation-jobs/' + jid, [403])
        check('Other Customer cannot revise job', 'owner', 'POST', '/api/v1/generation-jobs/' + jid + '/prompt-revisions', [403], metadata(rid), {'Idempotency-Key': 'foreign-' + uuid.uuid4().hex})
        check('Other Customer cannot cancel job', 'owner', 'POST', '/api/v1/generation-jobs/' + jid + '/cancel', [403])
        terminal = wait(jid)
        fixtures['terminalState'] = terminal['job']['status']
        fixtures['designIds'] = [d['id'] for d in terminal['generatedDesigns']]
        save('job-terminal.json', terminal)
        check('Customer job detail', 'customer', 'GET', '/api/v1/generation-jobs/' + jid, [200])
        check('Admin job detail', 'admin', 'GET', '/api/v1/generation-jobs/' + jid, [200])
        check('Cannot cancel terminal job', 'customer', 'POST', '/api/v1/generation-jobs/' + jid + '/cancel', [409])
        for did in fixtures['designIds']:
            _, design, _ = check('Customer design detail', 'customer', 'GET', '/api/v1/generated-designs/' + did, [200])
            check('Other Customer cannot read design', 'owner', 'GET', '/api/v1/generated-designs/' + did, [403])
            check('Customer cannot moderate', 'customer', 'PATCH', '/api/v1/admin/generated-designs/' + did + '/moderation', [403], {'moderationStatus': 'REJECTED'})
            check('Admin design detail', 'admin', 'GET', '/api/v1/generated-designs/' + did, [200])
            check('Admin cannot re-moderate already approved', 'admin', 'PATCH', '/api/v1/admin/generated-designs/' + did + '/moderation', [409], {'moderationStatus': 'REJECTED'})
            check('Invalid moderation status', 'admin', 'PATCH', '/api/v1/admin/generated-designs/' + did + '/moderation', [400], {'moderationStatus': 'PENDING'})
            media = []
            for field in ['imageUrl', 'thumbnailUrl']:
                url = design.get(field)
                if url:
                    with urllib.request.urlopen(url, timeout=10) as r:
                        data = r.read()
                        media.append({'field': field, 'http': r.status, 'contentType': r.headers.get('Content-Type'),
                                      'size': len(data), 'sha256': hashlib.sha256(data).hexdigest(),
                                      'magic': data[:8].hex()})
                        (OUT / ('backend-fallback-' + field + '.bin')).write_bytes(data)
            save('media-verification.json', {'designId': did, 'source': 'REAL_BACKEND_LOCAL_JAVA2D_FALLBACK', 'media': media})
            check('Marketplace selected design handoff', 'customer', 'PUT', '/api/v1/cake-requests/' + rid + '/selected-design', [200], {'generatedDesignId': did}, service='marketplace')
            _, confirmed, _ = check('Reconcile selected design', 'customer', 'GET', '/api/v1/cake-requests/' + rid, [200], service='marketplace')
            fixtures['selectedDesignConfirmed'] = confirmed.get('selectedDesignId') == did
        revision = {k: v for k, v in metadata(rid, 'A matcha green cake revised locally', 2).items() if k != 'cakeRequestId'}
        rkey = 'revision-' + uuid.uuid4().hex
        check('Create revision', 'customer', 'POST', '/api/v1/generation-jobs/' + jid + '/prompt-revisions', [202], revision, {'Idempotency-Key': rkey})
        check('Replay revision', 'customer', 'POST', '/api/v1/generation-jobs/' + jid + '/prompt-revisions', [202], revision, {'Idempotency-Key': rkey})
        revised = wait(jid)
        fixtures['revised'] = {'revision': revised['currentRevision'], 'designCount': len(revised['generatedDesigns']), 'status': revised['job']['status']}
        save('job-revised.json', revised)
        s, cancelled, _ = create('Create cancellable job', metadata(rid))
        fixtures['cancelJobId'] = cancelled['id']
        check('Cancel queued job', 'customer', 'POST', '/api/v1/generation-jobs/' + cancelled['id'] + '/cancel', [200])
        check('Cancelled detail', 'customer', 'GET', '/api/v1/generation-jobs/' + cancelled['id'], [200])
        s, rejected, _ = create('Create locally moderated rejection', metadata(rid, 'violent weapon cake'))
        fixtures['failedJobId'] = rejected['id']
        fail = wait(rejected['id'])
        fixtures['failedResult'] = {'status': fail['job']['status'], 'errorCode': fail['job'].get('errorMessage'), 'designCount': len(fail['generatedDesigns'])}
        save('job-failed.json', fail)
        # Deliberately expected denial: exposes the existing Backend fail-open
        # behavior if Identity cannot provide Cake AI's service token.
        s, foreign_job, _ = create('Foreign RFQ must be denied', metadata(foreign), expected=[403])
        if s == 202:
            fixtures['foreignRfqAcceptedJobId'] = foreign_job['id']
            check('Cancel unexpected foreign-RFQ job', 'customer', 'POST', '/api/v1/generation-jobs/' + foreign_job['id'] + '/cancel', [200, 409])
        # Internal API use is host-side with an existing legitimately issued
        # service token. No service credential ever enters the Flutter app.
        env = {}
        for line in (ROOT.parent / '.secrets/bakery-platform/local-runtime.env').read_text(encoding='utf-8-sig').splitlines():
            if '=' in line and not line.startswith('#'):
                k, v = line.split('=', 1); env[k.strip()] = v.strip().strip('"').strip("'")
        token_request = {'clientId': 'marketplace-service', 'clientSecret': env['MARKETPLACE_CLIENT_SECRET'],
                         'audience': 'cake-ai-service', 'scope': 'cake-ai:design:validate'}
        s, token, _ = api.call('anonymous', 'identity', 'POST', '/internal/v1/auth/service-token', token_request, record=False)
        if s == 200:
            api.tokens['marketplace-service'] = token['accessToken']
            did = fixtures['designIds'][0]
            query = '?customerId=' + api.private['customer']['id'] + '&cakeRequestId=' + rid
            check('Internal design validation', 'marketplace-service', 'GET', '/internal/v1/generated-designs/' + did + '/validation' + query, [200])
            check('Internal request generation context', 'marketplace-service', 'GET', '/internal/v1/cake-requests/' + rid + '/generation-context', [200])
        else:
            fixtures['internalTokenBlockerHttp'] = s
        check('Human cannot call internal validation', 'customer', 'GET', '/internal/v1/cake-requests/' + rid + '/generation-context', [403])
    finally:
        save('host-api-results.json', {'layer': 'HOST_API_REAL_DOCKER', 'checks': results,
                                     'fixtures': fixtures, 'events': api.events})
        save('host-fixtures.json', fixtures)
