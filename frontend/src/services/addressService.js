import { ApiError } from './apiClient.js'
import { ADDRESS_BLOCKER } from './checkoutService.js'

// The committed Identity backend has internal snapshots only.
// Never probe the Stage 8 public address API, even if a local container exposes it.
export async function blockAddressCheckout() {
  throw new ApiError(ADDRESS_BLOCKER, 503)
}
export const addressService = {
  list: blockAddressCheckout,
  create: blockAddressCheckout,
  verify: blockAddressCheckout,
}
export const loadAddresses = blockAddressCheckout
