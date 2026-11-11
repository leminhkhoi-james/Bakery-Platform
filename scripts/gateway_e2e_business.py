"""Identity, bakery onboarding, subscription and catalog flows through Gateway."""
from gateway_e2e_core import IMAGE, future, key, multipart
import secrets
import uuid


def bootstrap(r):
    for actor in ['admin', 'ownerA', 'ownerB', 'customerA', 'customerB']:
        if actor not in r.state['actors']:
            user = {'email': 'gateway-e2e-' + r.state['run'] + '-' + actor.lower() + '@example.test',
                    'password': secrets.token_urlsafe(24)}
            created = r.call('Register ' + actor, 'POST', '/identity/api/v1/auth/register', expected=(201,),
                body={**user, 'displayName': '[E2E] ' + actor, 'phoneNumber': '0900000000'})
            user['id'] = str(uuid.UUID(created['id']))
            r.state['actors'][actor] = user
            r.save()
        r.login(actor)
    admin = r.state['actors']['admin']['id']
    r.sql('identity', f"INSERT INTO user_roles(user_id,role_id) SELECT '{admin}',id FROM roles WHERE code='ADMIN' ON CONFLICT DO NOTHING;")
    r.login('admin')
    for actor in ['customerA', 'customerB']:
        user = r.state['actors'][actor]
        if 'address' not in user:
            address = r.call('Create address ' + actor, 'POST', '/identity/api/v1/users/me/addresses', actor,
                expected=(201,), body={'label': 'E2E home', 'recipientName': 'E2E Customer',
                'recipientPhone': '0900000000', 'addressLine': '123 E2E Street', 'ward': 'Test Ward',
                'district': 'E2E District', 'city': 'E2E City', 'isDefault': True})
            user['address'] = address['id']; r.save()
    address = r.state['actors']['customerA']['address']
    r.call('Foreign address hidden', 'GET', '/identity/api/v1/users/me/addresses/' + address,
           'customerB', expected=(404,))
    r.call('Update profile', 'PATCH', '/identity/api/v1/users/me', 'customerA', body={'displayName': '[E2E] Customer updated'})


def bakery(r):
    operations = {'addresses': [{'addressLine': 'E2E bakery', 'district': 'E2E District',
                   'city': 'E2E City', 'isPrimary': True}],
                  'serviceAreas': [{'city': 'E2E City', 'district': 'E2E District',
                   'deliveryFee': 10000, 'minimumOrder': 0, 'active': True}], 'businessHours': []}
    if 'plan' not in r.ids:
        plan = r.call('Admin creates subscription plan', 'POST', '/subscription/api/v1/admin/subscription-plans',
            'admin', expected=(201,), body={'code': 'E2E-' + r.state['run'], 'name': '[E2E] Monthly',
            'monthlyPrice': 100000, 'currency': 'VND', 'billingPeriodMonths': 1, 'status': 'ACTIVE',
            'features': {'maxProducts': '100', 'maxAiGenerations': '10'}})
        r.ids['plan'] = plan['id']; r.save()
    for actor in ['ownerA', 'ownerB']:
        if actor + 'Bakery' not in r.ids:
            item = r.call('Customer submits onboarding ' + actor, 'POST', '/bakery/api/v1/bakeries/onboarding', actor,
                expected=(200, 201), body={'name': '[E2E] Bakery ' + actor, 'phoneNumber': '0900000000', 'operations': operations})
            r.ids[actor + 'Bakery'] = item['id']; r.save()
        bid = r.ids[actor + 'Bakery']
        if actor + 'Approved' not in r.ids:
            r.call('Admin approves bakery ' + actor, 'PATCH', '/bakery/api/v1/admin/bakeries/' + bid + '/status',
                   'admin', body={'status': 'ACTIVE'})
            r.ids[actor + 'Approved'] = True; r.save()
        if actor + 'SubscriptionOrder' not in r.ids:
            order = r.call('Owner buys subscription ' + actor, 'POST',
                '/subscription/api/v1/bakeries/' + bid + '/subscription-orders', actor,
                expected=(201,), body={'planId': r.ids['plan']}, headers=key())
            r.ids[actor + 'SubscriptionOrder'] = order['id']; r.save()
        if actor + 'Payment' not in r.ids:
            payment = r.call('Submit synthetic payment reference ' + actor, 'POST',
                '/subscription/api/v1/subscription-orders/' + r.ids[actor + 'SubscriptionOrder'] + '/payments',
                actor, expected=(201,), headers=key(), upload=multipart(metadata={'paymentMethod': 'BANK_TRANSFER',
                    'paymentReference': 'E2E-' + uuid.uuid4().hex, 'amount': 100000, 'currency': 'VND'}, image=IMAGE, part='proof'))
            r.ids[actor + 'Payment'] = payment['id']; r.save()
        if actor + 'Subscribed' not in r.ids:
            review_key = r.state.setdefault(actor + 'ApproveKey', key()); r.save()
            path = '/subscription/api/v1/admin/bakery-payments/' + r.ids[actor + 'Payment'] + '/approve'
            body = {'reviewNote': 'Synthetic E2E proof only; no bank transfer'}
            r.call('Admin approves payment ' + actor, 'POST', path, 'admin', body=body, headers=review_key)
            r.call('Approve payment replay ' + actor, 'POST', path, 'admin', body=body, headers=review_key)
            r.ids[actor + 'Subscribed'] = True; r.save()
        r.call('Owner activates workspace ' + actor, 'POST', '/bakery/api/v1/bakeries/' + bid + '/onboarding/complete',
               actor, expected=(204,))
        r.login(actor)
        subscription = r.call('Subscription active ' + actor, 'GET', '/subscription/api/v1/bakeries/' + bid + '/subscription', actor)
        r.record('Active subscription exists ' + actor, bool(subscription))
    r.call('Another owner cannot edit bakery', 'PATCH', '/bakery/api/v1/bakeries/' + r.ids['ownerABakery'],
           'ownerB', body={'name': 'Forbidden'}, expected=(403,))
    r.call('Customer cannot create plan', 'POST', '/subscription/api/v1/admin/subscription-plans',
           'customerA', body={}, expected=(403,))


def catalog(r):
    path = '/bakery/api/v1/bakeries/' + r.ids['ownerABakery']
    if 'category' not in r.ids:
        item = r.call('Create category', 'POST', path + '/categories', 'ownerA', expected=(201,),
                      body={'name': '[E2E] Cakes', 'slug': 'e2e-' + r.state['run'], 'sortOrder': 0})
        r.ids['category'] = item['id']; r.save()
    if 'addon' not in r.ids:
        item = r.call('Create add-on', 'POST', path + '/add-ons', 'ownerA', expected=(201,),
                      body={'name': '[E2E] Candle', 'category': 'CANDLE', 'price': 5000, 'active': True})
        r.ids['addon'] = item['id']; r.save()
    if 'product' not in r.ids:
        item = r.call('Create draft product', 'POST', path + '/products', 'ownerA', expected=(201,),
            body={'categoryId': r.ids['category'], 'name': '[E2E] Cake', 'slug': 'e2e-' + r.state['run'],
                  'basePrice': 200000, 'customizable': True, 'minimumNoticeHours': 0})
        r.ids['product'] = item['id']; r.save()
    product_path = path + '/products/' + r.ids['product']
    if 'productPublished' not in r.ids:
        r.call('Product requires primary image', 'POST', product_path + '/publish', 'ownerA', expected=(409, 422))
        r.call('Upload product primary image', 'POST', product_path + '/images', 'ownerA', expected=(201,),
               upload=multipart(image=IMAGE, part='files', fields={'primaryIndex': 0}))
        r.call('Replace product options', 'PUT', product_path + '/options', 'ownerA', body={'groups': []})
        r.call('Publish product with subscription', 'POST', product_path + '/publish', 'ownerA')
        r.ids['productPublished'] = True; r.save()
    r.call('Upload bakery logo', 'POST', path + '/logo', 'ownerA', expected=(201,), upload=multipart(image=IMAGE))
    r.call('Upload add-on image', 'POST', path + '/add-ons/' + r.ids['addon'] + '/image',
           'ownerA', expected=(201,), upload=multipart(image=IMAGE))
    product = r.call('Public product detail', 'GET', '/bakery/api/v1/products/' + r.ids['product'])
    r.record('Published price correct', float(product['product']['basePrice']) == 200000)
