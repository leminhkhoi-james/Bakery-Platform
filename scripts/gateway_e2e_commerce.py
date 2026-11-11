"""Marketplace, direct/offer orders, fulfillment, reviews and chat through Gateway."""
from gateway_e2e_core import IMAGE, future, image_read, key, multipart
import concurrent.futures
import uuid


def marketplace(r):
    if 'request' not in r.ids:
        item = r.call('Create open custom draft', 'POST', '/marketplace/api/v1/cake-requests', 'customerA',
            expected=(201,), body={'requestType': 'OPEN_CUSTOM', 'title': '[E2E] Custom order',
            'description': 'Synthetic cake requirement', 'neededAt': future(7), 'offerDeadline': future(3),
            'deliveryCity': 'E2E City', 'deliveryDistrict': 'E2E District', 'budgetMin': 100000, 'budgetMax': 500000})
        r.ids['request'] = item['id']; r.save()
    path = '/marketplace/api/v1/cake-requests/' + r.ids['request']
    if 'requestPublished' not in r.ids:
        r.call('Foreign customer cannot edit RFQ', 'PATCH', path, 'customerB', body={'title': 'Forbidden'}, expected=(403, 404))
        r.call('Update draft preference', 'PATCH', path, 'customerA', body={'occasion': 'Birthday', 'servingSize': 8})
        r.call('Publish RFQ', 'POST', path + '/publish', 'customerA')
        r.ids['requestPublished'] = True; r.save()
    r.call('Eligible bakery reads open RFQ', 'GET', path, 'ownerA')
    offer_body = {'message': '[E2E] Quotation', 'cakePrice': 200000, 'deliveryFee': 10000,
                  'estimatedCompletionAt': future(6), 'expiresAt': future(2), 'items': []}
    for actor in ['ownerA', 'ownerB']:
        if actor + 'Offer' not in r.ids:
            item = r.call('Bakery submits offer ' + actor, 'POST', path + '/offers', actor, expected=(201,),
                          body={**offer_body, 'bakeryId': r.ids[actor + 'Bakery']})
            r.ids[actor + 'Offer'] = item['id']; r.save()
    r.call('Customer cannot submit bakery offer', 'POST', path + '/offers', 'customerA', expected=(403,),
           body={**offer_body, 'bakeryId': r.ids['ownerABakery']})
    r.call('Offer owner edits message', 'PATCH', '/marketplace/api/v1/offers/' + r.ids['ownerAOffer'],
           'ownerA', body={'message': '[E2E] Updated quotation'})
    r.call('Other bakery cannot edit offer', 'PATCH', '/marketplace/api/v1/offers/' + r.ids['ownerAOffer'],
           'ownerB', body={'message': 'Forbidden'}, expected=(403, 404))


def chat(r):
    for row in r.state['checks']:
        if row['phase'] == 'chat' and row['name'] == 'Customer cannot close conversation':
            row['invalidExpectation'] = 'API_SPEC permits CUSTOMER participants to close their own conversation.'
    if 'conversation' not in r.ids:
        item = r.call('Create eligible conversation', 'POST', '/chat/api/v1/conversations', 'customerA', expected=(200, 201),
                      body={'cakeRequestId': r.ids['request'], 'bakeryId': r.ids['ownerABakery']})
        r.ids['conversation'] = item['id']; r.save()
    path = '/chat/api/v1/conversations/' + r.ids['conversation']
    current = r.call('Read current conversation lifecycle', 'GET', path, 'customerA')
    if current['status'] == 'CLOSED':
        r.call('Customer closes own conversation idempotently', 'POST', path + '/close', 'customerA', body={'reason': 'E2E'})
        r.call('Nonparticipant cannot close conversation', 'POST', path + '/close', 'customerB', body={'reason': 'E2E'}, expected=(403, 404))
        r.call('Closed conversation rejects new messages', 'POST', path + '/messages', 'customerA', expected=(409,),
               upload=multipart(metadata={'clientMessageId': str(uuid.uuid4()), 'messageType': 'TEXT', 'content': 'Closed'}))
        return
    r.call('Owner reads eligible conversation', 'GET', path, 'ownerA')
    r.call('Nonparticipant conversation hidden', 'GET', path, 'customerB', expected=(404,))
    message = r.state.setdefault('textMessage', {'clientMessageId': str(uuid.uuid4()),
        'messageType': 'TEXT', 'content': '[E2E] Please use pastel flowers.'}); r.save()
    if 'message' not in r.ids:
        item = r.call('Customer sends text', 'POST', path + '/messages', 'customerA', expected=(201,), upload=multipart(metadata=message))
        r.ids['message'] = item['id']; r.save()
    replay = r.call('Text replay idempotent', 'POST', path + '/messages', 'customerA', expected=(200,), upload=multipart(metadata=message))
    r.record('Text replay same message', replay['id'] == r.ids['message'])
    r.call('Changed message replay conflicts', 'POST', path + '/messages', 'customerA', expected=(409,),
           upload=multipart(metadata={**message, 'content': 'Different content'}))
    r.call('Owner lists messages without cursor', 'GET', path + '/messages', 'ownerA')
    r.call('Owner marks messages read', 'POST', path + '/read', 'ownerA', body={'throughMessageId': r.ids['message']})
    if 'imageMessage' not in r.ids:
        item = r.call('Owner sends image attachment', 'POST', path + '/messages', 'ownerA', expected=(201,),
            upload=multipart(metadata={'clientMessageId': str(uuid.uuid4()), 'messageType': 'IMAGE', 'content': '[E2E] Cake reference'},
                             image=IMAGE, part='files'))
        r.ids['imageMessage'] = item['id']; r.save()
        attachments = item.get('attachments', [])
        r.record('Image attachment returned', len(attachments) == 1)
        attachment = attachments[0]
        image_read(r, 'Chat MinIO attachment round-trip', attachment.get('url') or attachment.get('downloadUrl'), IMAGE)
    r.call('Only sender can delete message', 'DELETE', path + '/messages/' + r.ids['message'], 'ownerA', expected=(403, 404))
    r.call('Customer closes own conversation idempotently', 'POST', path + '/close', 'customerA', body={'reason': 'E2E'})


def finish_order(r, order_id, label):
    path = '/orders/api/v1/orders/' + order_id
    existing = r.call(label + ' read order', 'GET', path, 'customerA')
    if existing['status'] == 'COMPLETED':
        return
    r.call(label + ' foreign customer denied', 'GET', path, 'customerB', expected=(403, 404))
    r.call(label + ' review blocked before completion', 'POST', path + '/review', 'customerA',
           body={'rating': 5, 'comment': 'E2E'}, expected=(409, 422))
    stages = ['PENDING', 'CONFIRMED', 'BAKING', 'READY', 'DELIVERING']
    current = stages.index(existing['status'])
    for target in stages[current + 1:]:
        r.call(label + ' owner moves to ' + target, 'POST', path + '/status-transitions', 'ownerA', body={'targetStatus': target})
    r.call(label + ' owner cannot confirm receipt', 'POST', path + '/status-transitions', 'ownerA',
           body={'targetStatus': 'COMPLETED'}, expected=(403,))
    completed = r.call(label + ' customer confirms receipt', 'POST', path + '/status-transitions',
                       'customerA', body={'targetStatus': 'COMPLETED'})
    r.record(label + ' completed timestamp persisted', completed['status'] == 'COMPLETED' and bool(completed['completedAt']))


def orders(r):
    address = r.state['actors']['customerA']['address']
    if 'directOrder' not in r.ids:
        body = {'bakeryId': r.ids['ownerABakery'], 'productId': r.ids['product'], 'quantity': 1,
                'deliveryAddressId': address, 'requestedDeliveryAt': future(7), 'optionSelections': [],
                'addOns': [{'addOnId': r.ids['addon'], 'quantity': 2}], 'customerNote': '[E2E] Direct order'}
        r.state['directBody'] = body
        r.state['directKey'] = key(); r.save()
        order = r.call('Create direct order with add-on', 'POST', '/orders/api/v1/orders/direct', 'customerA',
                       body=body, headers=r.state['directKey'], expected=(201,))
        r.ids['directOrder'] = order['id']; r.save()
    replay = r.call('Direct order replay', 'POST', '/orders/api/v1/orders/direct', 'customerA',
                    body=r.state['directBody'], headers=r.state['directKey'], expected=(200,))
    r.record('Direct replay same order', replay['id'] == r.ids['directOrder'])
    r.call('Direct key changed payload conflicts', 'POST', '/orders/api/v1/orders/direct', 'customerA', expected=(409,),
           body={**r.state['directBody'], 'quantity': 2}, headers=r.state['directKey'])
    path = '/orders/api/v1/orders/' + r.ids['directOrder']
    order = r.call('Read direct snapshots', 'GET', path, 'customerA')
    r.record('Direct amount includes add-ons and delivery', float(order['subtotal']) == 210000 and float(order['totalAmount']) == 220000)
    original_address = order['deliveryAddress']['addressLine']
    r.call('Customer edits saved address', 'PATCH', '/identity/api/v1/users/me/addresses/' + address,
           'customerA', body={'addressLine': '456 E2E Changed Street'})
    order = r.call('Read immutable order after address edit', 'GET', path, 'customerA')
    r.record('Order retains original delivery snapshot', order['deliveryAddress']['addressLine'] == original_address)
    finish_order(r, r.ids['directOrder'], 'Direct')
    if 'review' not in r.ids:
        review = r.call('Completed customer creates review', 'POST', path + '/review', 'customerA', expected=(201,),
                        body={'rating': 5, 'comment': '[E2E] Cake arrived'})
        r.ids['review'] = review.get('id', True); r.save()
    r.call('Duplicate review rejected', 'POST', path + '/review', 'customerA', body={'rating': 5}, expected=(409,))
    r.call('Customer edits review', 'PATCH', path + '/review', 'customerA', body={'rating': 4, 'comment': '[E2E] Updated'})
    r.call('Admin hides review', 'PATCH', '/orders/api/v1/admin/reviews/' + r.ids['directOrder'] + '/status',
           'admin', body={'status': 'HIDDEN'})
    offer_path = '/marketplace/api/v1/offers/' + r.ids['ownerAOffer'] + '/accept'
    accept_body = {'deliveryAddressId': address, 'customerNote': '[E2E] Accept offer'}
    accept_key = r.state.setdefault('acceptKey', key()); r.save()
    accepted = r.call('Accept offer across services', 'POST', offer_path, 'customerA', body=accept_body, headers=accept_key)
    accepted_id = accepted.get('orderId') or (accepted.get('order') or {}).get('id')
    r.record('Accept returns created order', bool(accepted_id))
    r.ids['offerOrder'] = accepted_id; r.save()
    replay = r.call('Accept offer replay', 'POST', offer_path, 'customerA', body=accept_body, headers=accept_key)
    r.record('Acceptance replay same order', (replay.get('orderId') or (replay.get('order') or {}).get('id')) == accepted_id)
    r.call('Acceptance changed payload conflicts', 'POST', offer_path, 'customerA',
           body={**accept_body, 'customerNote': 'Changed'}, headers=accept_key, expected=(409,))
    count = r.sql('order', "SELECT count(*) FROM customer_orders WHERE offer_id='" + str(uuid.UUID(r.ids['ownerAOffer'])) + "';")
    r.record('Exactly one order per offer', count == '1')
    rejected = r.call('Competing offer after acceptance', 'GET', '/marketplace/api/v1/offers/' + r.ids['ownerBOffer'], 'ownerB')
    r.record('Competing offer rejected', rejected['status'] == 'REJECTED')
    finish_order(r, accepted_id, 'Offer')
