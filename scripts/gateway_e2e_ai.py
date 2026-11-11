"""Bounded live Gemini/Firebase workflow; never retries a failed paid execution."""
from gateway_e2e_core import HTTP, IMAGE, ROOT, future, image_read, key, multipart
import hashlib
import time
import urllib.error
import urllib.parse


def poll(r, job_id, label):
    deadline = time.monotonic() + 600
    previous = None
    while time.monotonic() < deadline:
        status, response = r.call('Poll', 'GET', '/cake-ai/api/v1/generation-jobs/' + job_id,
                                  'customerA', raw=True)
        if status != 200:
            r.record(label + ' polling responds', False, actualStatus=status)
        detail = response['data']
        state = detail['job']['status']
        if state != previous:
            print(label + ': ' + state, flush=True)
            previous = state
        if state in ['SUCCEEDED', 'FAILED', 'CANCELLED']:
            error = detail['job'].get('errorMessage')
            r.record(label + ' succeeds', state == 'SUCCEEDED', jobStatus=state,
                     error=error if error and len(error) < 160 else None)
            return detail
        time.sleep(3)
    r.record(label + ' completes within ten minutes', False)


def approve_and_read(r, detail, label):
    design = detail['generatedDesigns'][-1]
    design_id = design['id']
    r.ids[label + 'Design'] = design_id; r.save()
    r.call(label + ' foreign design denied', 'GET', '/cake-ai/api/v1/generated-designs/' + design_id,
           'customerB', expected=(403, 404))
    if design['moderationStatus'] == 'PENDING':
        r.record(label + ' pending image URL hidden', not design.get('imageUrl'))
        r.call(label + ' pending design selection denied', 'PUT',
            '/marketplace/api/v1/cake-requests/' + r.ids['aiRequest'] + '/selected-design',
            'customerA', body={'generatedDesignId': design_id}, expected=(422,))
        r.call(label + ' customer cannot moderate', 'PATCH',
            '/cake-ai/api/v1/admin/generated-designs/' + design_id + '/moderation', 'customerA',
            body={'moderationStatus': 'APPROVED', 'reason': 'E2E'}, expected=(403,))
        admin_preview = r.call(label + ' admin preview', 'GET', '/cake-ai/api/v1/generated-designs/' + design_id, 'admin')
        image_read(r, label + ' admin preview readable', admin_preview['imageUrl'])
        design = r.call(label + ' admin approves design', 'PATCH',
            '/cake-ai/api/v1/admin/generated-designs/' + design_id + '/moderation', 'admin',
            body={'moderationStatus': 'APPROVED', 'reason': 'Synthetic safe cake E2E review'})
    r.record(label + ' approved design', design['moderationStatus'] == 'APPROVED')
    design = r.call(label + ' customer reads approved design', 'GET', '/cake-ai/api/v1/generated-designs/' + design_id, 'customerA')
    content = image_read(r, label + ' generated image bytes', design['imageUrl'])
    image_read(r, label + ' thumbnail readable', design['thumbnailUrl'])
    metadata = design.get('providerMetadata') or {}
    r.record(label + ' real Google provider provenance', metadata.get('provider') == 'GOOGLE_GEMINI',
             requestedModel=metadata.get('requestedModel'), returnedModel=metadata.get('returnedModel'),
             sha256=hashlib.sha256(content).hexdigest())
    output = ROOT / 'docs/audit/evidence' / ('gateway-e2e-' + label + '.png')
    output.write_bytes(content)
    split = urllib.parse.urlsplit(design['imageUrl'])
    unsigned = urllib.parse.urlunsplit((split.scheme, split.netloc, split.path, '', ''))
    try:
        with HTTP.open(unsigned, timeout=30) as response: status = response.status
    except urllib.error.HTTPError as error:
        status = error.code
    r.record(label + ' cloud object private', status in [401, 403], actualStatus=status)
    selected = r.call(label + ' customer selects design in Marketplace', 'PUT',
        '/marketplace/api/v1/cake-requests/' + r.ids['aiRequest'] + '/selected-design',
        'customerA', body={'generatedDesignId': design_id})
    r.record(label + ' selected design persisted', selected['selectedDesignId'] == design_id)


def ai(r):
    if 'aiRequest' not in r.ids:
        request = r.call('Create draft RFQ for live AI', 'POST', '/marketplace/api/v1/cake-requests', 'customerA',
            expected=(201,), body={'requestType': 'OPEN_CUSTOM', 'title': '[E2E] Live Gemini cake',
            'description': 'Synthetic pastel birthday cake for end-to-end verification', 'neededAt': future(8),
            'deliveryCity': 'E2E City', 'deliveryDistrict': 'E2E District'})
        r.ids['aiRequest'] = request['id']; r.save()
    if 'aiReference' not in r.ids:
        uploaded = r.call('Upload RFQ reference to real Firebase', 'POST',
            '/marketplace/api/v1/cake-requests/' + r.ids['aiRequest'] + '/images', 'customerA', expected=(201,),
            upload=multipart(image=IMAGE, part='files'))
        image_read(r, 'Firebase reference round-trip exact bytes', uploaded[0]['url'], IMAGE)
        r.ids['aiReference'] = uploaded[0]['id']; r.save()
    metadata = {'cakeRequestId': r.ids['aiRequest'],
        'prompt': 'Photorealistic single tier pastel pink birthday cake, white buttercream, small sugar flowers, plain cream background. Cake only.',
        'negativePrompt': 'people, lettering, watermark',
        'generationParameters': {'aspectRatio': '1:1', 'numberOfDesigns': 1}}
    r.call('Reject another customer RFQ before provider call', 'POST', '/cake-ai/api/v1/generation-jobs',
           'customerB', expected=(403, 404), headers=key(), upload=multipart(metadata=metadata))
    r.call('Reject more than one paid design in E2E mode', 'POST', '/cake-ai/api/v1/generation-jobs',
           'customerA', expected=(422,), headers=key(),
           upload=multipart(metadata={**metadata, 'generationParameters': {'aspectRatio': '1:1', 'numberOfDesigns': 2}}))
    job_key = r.state.setdefault('aiCreateKey', key()); r.save()
    if 'aiJob' not in r.ids:
        created = r.call('Accept one real generation job', 'POST', '/cake-ai/api/v1/generation-jobs',
            'customerA', expected=(202,), headers=job_key, upload=multipart(metadata, IMAGE, 'sourceImages'))
        r.ids['aiJob'] = created['id']; r.save()
    replay = r.call('Generation key replay creates no extra job', 'POST', '/cake-ai/api/v1/generation-jobs',
        'customerA', expected=(202,), headers=job_key, upload=multipart(metadata, IMAGE, 'sourceImages'))
    r.record('Generation replay same job id', replay['id'] == r.ids['aiJob'])
    r.call('Generation key changed payload rejected', 'POST', '/cake-ai/api/v1/generation-jobs',
        'customerA', expected=(409,), headers=job_key, upload=multipart({**metadata, 'prompt': 'Different cake'}, IMAGE, 'sourceImages'))
    r.call('Foreign job read denied', 'GET', '/cake-ai/api/v1/generation-jobs/' + r.ids['aiJob'],
           'customerB', expected=(403, 404))
    detail = poll(r, r.ids['aiJob'], 'original')
    approve_and_read(r, detail, 'original')
    # One explicit refinement, at most three more provider requests. No retry on failure.
    revision_key = r.state.setdefault('aiRevisionKey', key()); r.save()
    revision = {'prompt': 'Keep the same cake and white background, refine the sugar flowers to pale lavender.',
                'generationParameters': {'aspectRatio': '1:1', 'numberOfDesigns': 1}}
    if 'aiRevisionAccepted' not in r.ids:
        r.call('Accept one prompt refinement', 'POST', '/cake-ai/api/v1/generation-jobs/' + r.ids['aiJob'] + '/prompt-revisions',
               'customerA', expected=(202,), headers=revision_key, body=revision)
        r.ids['aiRevisionAccepted'] = True; r.save()
    detail = poll(r, r.ids['aiJob'], 'refined')
    r.record('Prompt revision persisted', len(detail['promptRevisions']) == 2)
    approve_and_read(r, detail, 'refined')
    ledger = r.sql('cake-ai', 'SELECT count(*) FROM generation_provider_calls;')
    r.record('Provider request count within explicit budget', int(ledger) <= 9, providerCalls=int(ledger))


def cancel_ai(r):
    # Requires gateway_e2e_setup.py pause-worker/refresh-core: admission enabled,
    # scheduler stopped. This exercises cancellation without another paid call.
    for row in r.state['checks']:
        if row['phase'] == 'cancel-ai' and row['name'] == 'AI cancellation replay idempotent':
            row['invalidExpectation'] = 'API_SPEC specifies HTTP 409 when cancelling a terminal AI job.'
    baseline = int(r.sql('cake-ai', 'SELECT count(*) FROM generation_provider_calls;'))
    if 'cancelAiRequest' not in r.ids:
        request = r.call('Create RFQ for queued cancellation', 'POST', '/marketplace/api/v1/cake-requests', 'customerA',
            expected=(201,), body={'requestType': 'OPEN_CUSTOM', 'title': '[E2E] Cancel queued job',
            'description': 'Synthetic cancellation, no provider invocation', 'neededAt': future(8),
            'deliveryCity': 'E2E City', 'deliveryDistrict': 'E2E District'})
        r.ids['cancelAiRequest'] = request['id']; r.save()
    metadata = {'cakeRequestId': r.ids['cancelAiRequest'], 'prompt': 'A plain white birthday cake',
                'generationParameters': {'aspectRatio': '1:1', 'numberOfDesigns': 1}}
    if 'cancelAiJob' not in r.ids:
        job = r.call('Queue AI job with worker paused', 'POST', '/cake-ai/api/v1/generation-jobs', 'customerA',
                     expected=(202,), headers=key(), upload=multipart(metadata=metadata))
        r.ids['cancelAiJob'] = job['id']; r.save()
    path = '/cake-ai/api/v1/generation-jobs/' + r.ids['cancelAiJob']
    r.call('Foreign customer cannot cancel AI job', 'POST', path + '/cancel', 'customerB', expected=(403, 404))
    status, existing = r.call('Read before cancel', 'GET', path, 'customerA', raw=True)
    if status == 200 and existing['data']['job']['status'] != 'CANCELLED':
        r.call('Owner cancels queued AI job', 'POST', path + '/cancel', 'customerA')
    r.call('Terminal AI job rejects repeated cancellation', 'POST', path + '/cancel', 'customerA', expected=(409,))
    detail = r.call('Read cancelled AI job', 'GET', path, 'customerA')
    r.record('AI cancellation persisted', detail['job']['status'] == 'CANCELLED')
    r.call('Exhausted reservation budget rejects admission', 'POST', '/cake-ai/api/v1/generation-jobs', 'customerA',
           expected=(429,), headers=key(), upload=multipart(metadata=metadata))
    after = int(r.sql('cake-ai', 'SELECT count(*) FROM generation_provider_calls;'))
    r.record('Cancellation and quota rejection made no provider calls', after == baseline, providerCalls=after)
