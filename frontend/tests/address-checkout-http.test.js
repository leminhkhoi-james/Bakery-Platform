import assert from 'node:assert/strict'
import { test } from 'node:test'
import { addressService, loadAddresses } from '../src/services/addressService.js'
import { createVerifiedDirectOrder, acceptVerifiedOffer } from '../src/services/verifiedCheckoutService.js'

test('Original backend blocks every address/checkout entry point before any network call', async () => {
  const nativeFetch = globalThis.fetch
  let calls = 0
  globalThis.fetch = async () => { calls++; throw new Error('No network is allowed while blocked') }
  try {
    for (const operation of [
      () => addressService.list(),
      () => addressService.create({ recipientName: 'User input' }),
      () => addressService.verify('arbitrary-id'),
      () => loadAddresses(),
      () => createVerifiedDirectOrder({}, { deliveryAddressId: 'arbitrary-id' }, 'retry-key'),
      () => acceptVerifiedOffer('offer-id', { deliveryAddressId: 'arbitrary-id' }, 'retry-key'),
    ]) await assert.rejects(operation, error => error.status === 503 && /Hiện chưa thể chọn địa chỉ/.test(error.message))
    assert.equal(calls, 0)
  } finally { globalThis.fetch = nativeFetch }
})
