"""Renewal/rejection, cancellation, targeted custom requests and AI-to-order flows."""
from gateway_e2e_core import IMAGE, future, key, multipart
from gateway_e2e_commerce import finish_order
import concurrent.futures
import uuid


def branches(r):
    bid = r.ids['ownerABakery']
    if 'renewalOrder' not in r.ids:
        order = r.call('Create renewal subscription order', 'POST',
            '/subscription/api/v1/bakeries/' + bid + '/subscription-orders', 'ownerA',
            expected=(201,), headers=key(), body={'planId': r.ids['plan']})
        r.ids['renewalOrder'] = order['id']; r.save()
    pay_path = '/subscription/api/v1/subscription-orders/' + r.ids['renewalOrder'] + '/payments'
    if 'rejectedPayment' not in r.ids:
        payment = r.call('Submit renewal proof for rejection', 'POST', pay_path, 'ownerA', expected=(201,), headers=key(),
            upload=multipart(metadata={'paymentMethod': 'BANK_TRANSFER', 'paymentReference': 'E2E-rejected-' + uuid.uuid4().hex,
                                       'amount': 100000, 'currency': 'VND'}))
        r.ids['rejectedPayment'] = payment['id']; r.save()
        r.call('Admin rejects incorrect proof', 'POST', '/subscription/api/v1/admin/bakery-payments/' + payment['id'] + '/reject',
               'admin', body={'reviewNote': 'Synthetic incorrect proof'})
    r.call('Rejected payment cannot be approved', 'POST',
        '/subscription/api/v1/admin/bakery-payments/' + r.ids['rejectedPayment'] + '/approve', 'admin', expected=(409,),
        headers=key(), body={'reviewNote': 'Invalid reversal'})
    if 'renewalPayment' not in r.ids:
        payment = r.call('Owner resubmits renewal proof', 'POST', pay_path, 'ownerA', expected=(201,), headers=key(),
            upload=multipart(metadata={'paymentMethod': 'BANK_TRANSFER', 'paymentReference': 'E2E-renewal-' + uuid.uuid4().hex,
                                       'amount': 100000, 'currency': 'VND'}))
        r.ids['renewalPayment'] = payment['id']; r.save()
    if 'renewalApproved' not in r.ids:
        approval_key = r.state.setdefault('renewalApprovalKey', key()); r.save()
        approve = '/subscription/api/v1/admin/bakery-payments/' + r.ids['renewalPayment'] + '/approve'
        r.call('Admin approves corrected renewal proof', 'POST', approve, 'admin', headers=approval_key, body={'reviewNote': 'E2E renewal'})
        r.ids['renewalApproved'] = True; r.save()
        def replay(_):
            return r.call('parallel renewal replay', 'POST', approve, 'admin', headers=approval_key,
                          body={'reviewNote': 'E2E renewal'}, raw=True)[0]
        with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
            statuses = list(pool.map(replay, range(4)))
        r.record('Four concurrent approval replays succeed', statuses == [200] * 4, statuses=statuses)
    count = r.sql('subscription', "SELECT count(*) FROM bakery_subscriptions WHERE bakery_id='" + str(uuid.UUID(bid)) + "' AND status='SCHEDULED';")
    r.record('Renewal creates exactly one scheduled period', count == '1')
    if 'targetedRequest' not in r.ids:
        item = r.call('Create targeted product customization', 'POST', '/marketplace/api/v1/cake-requests', 'customerA',
            expected=(201,), body={'requestType': 'TARGETED_PRODUCT_CUSTOM', 'targetBakeryId': bid, 'baseProductId': r.ids['product'],
                'title': '[E2E] Targeted customization', 'description': 'Custom decoration based on catalog product',
                'neededAt': future(9), 'deliveryCity': 'E2E City', 'deliveryDistrict': 'E2E District', 'optionSelections': []})
        r.ids['targetedRequest'] = item['id']; r.save()
    targeted = '/marketplace/api/v1/cake-requests/' + r.ids['targetedRequest']
    if 'targetedPublished' not in r.ids:
        r.call('Publish targeted RFQ', 'POST', targeted + '/publish', 'customerA')
        r.ids['targetedPublished'] = True; r.save()
    r.call('Unrelated bakery cannot read targeted RFQ', 'GET', targeted, 'ownerB', expected=(403, 404))
    offer_body = {'bakeryId': bid, 'cakePrice': 250000, 'deliveryFee': 10000,
                  'estimatedCompletionAt': future(7), 'expiresAt': future(5), 'items': []}
    if 'withdrawOffer' not in r.ids:
        offer = r.call('Target bakery sends custom offer', 'POST', targeted + '/offers', 'ownerA', expected=(201,), body=offer_body)
        r.ids['withdrawOffer'] = offer['id']; r.save()
        r.call('Bakery withdraws pending offer', 'POST', '/marketplace/api/v1/offers/' + offer['id'] + '/withdraw',
               'ownerA', body={'reason': 'Synthetic withdrawal'})
        r.call('Customer cancels open RFQ', 'POST', targeted + '/cancel', 'customerA', body={'reason': 'Synthetic cancellation'})
    r.call('Cancelled RFQ cannot be edited', 'PATCH', targeted, 'customerA', body={'title': 'Invalid'}, expected=(409,))
    if 'cancelOrder' not in r.ids:
        order = r.call('Create order for cancellation', 'POST', '/orders/api/v1/orders/direct', 'customerA', expected=(201,),
            headers=key(), body={**r.state['directBody'], 'customerNote': '[E2E] Cancellation branch'})
        r.ids['cancelOrder'] = order['id']; r.save()
    cancel_path = '/orders/api/v1/orders/' + r.ids['cancelOrder']
    cancelled = r.call('Customer cancels pending order', 'POST', cancel_path + '/status-transitions', 'customerA',
                       body={'targetStatus': 'CANCELLED', 'reason': 'E2E cancellation'})
    r.record('Order cancellation persisted', cancelled['status'] == 'CANCELLED')
    r.call('Cancelled order cannot be confirmed', 'POST', cancel_path + '/status-transitions', 'ownerA',
           body={'targetStatus': 'CONFIRMED'}, expected=(409,))


def ai_order(r):
    path = '/marketplace/api/v1/cake-requests/' + r.ids['aiRequest']
    current = r.call('Read AI-selected RFQ', 'GET', path, 'customerA')
    r.record('Refined AI design remains selected', current['selectedDesignId'] == r.ids['refinedDesign'])
    if 'aiPublished' not in r.ids:
        r.call('Publish request with AI design', 'POST', path + '/publish', 'customerA')
        r.ids['aiPublished'] = True; r.save()
    if 'aiOffer' not in r.ids:
        offer = r.call('Bakery quotes selected AI design', 'POST', path + '/offers', 'ownerA', expected=(201,),
            body={'bakeryId': r.ids['ownerABakery'], 'cakePrice': 300000, 'deliveryFee': 10000,
                  'estimatedCompletionAt': future(6), 'expiresAt': future(3), 'message': '[E2E] Make selected AI cake', 'items': []})
        r.ids['aiOffer'] = offer['id']; r.save()
    accept_key = r.state.setdefault('aiAcceptKey', key()); r.save()
    accepted = r.call('Customer accepts AI design quote', 'POST', '/marketplace/api/v1/offers/' + r.ids['aiOffer'] + '/accept',
        'customerA', headers=accept_key, body={'deliveryAddressId': r.state['actors']['customerA']['address'], 'customerNote': '[E2E] AI cake'})
    oid = accepted.get('orderId') or (accepted.get('order') or {}).get('id')
    r.record('AI workflow creates an order', bool(oid))
    r.ids['aiOrder'] = oid; r.save()
    finish_order(r, oid, 'AI')
    r.call('Review completed AI cake order', 'POST', '/orders/api/v1/orders/' + oid + '/review', 'customerA',
           expected=(201,), body={'rating': 5, 'comment': '[E2E] AI design to completed cake'})


def final_config(r):
    # A fresh direct-order request after deploying default Identity/Order scopes.
    if 'defaultScopeOrder' not in r.ids:
        request_key = r.state.setdefault('defaultScopeKey', key()); r.save()
        body = {**r.state['directBody'], 'customerNote': '[E2E] Default scope concurrency'}
        def create(_):
            return r.call('parallel direct order', 'POST', '/orders/api/v1/orders/direct', 'customerA',
                          headers=request_key, body=body, raw=True)
        with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
            responses = list(pool.map(create, range(4)))
        statuses = [status for status, _ in responses]
        r.record('Default scopes allow four concurrent direct creates', all(s in [200, 201] for s in statuses), statuses=statuses)
        ids = {response['data']['id'] for _, response in responses}
        r.record('Concurrent direct creates return one order', len(ids) == 1)
        r.ids['defaultScopeOrder'] = ids.pop(); r.save()
    count = r.sql('order', "SELECT count(*) FROM customer_orders WHERE customer_note='[E2E] Default scope concurrency';")
    r.record('Concurrent direct creates persist exactly one row', count == '1')
    r.call('Cancel final verification order', 'POST', '/orders/api/v1/orders/' + r.ids['defaultScopeOrder'] + '/status-transitions',
           'customerA', body={'targetStatus': 'CANCELLED', 'reason': 'E2E verification complete'})
