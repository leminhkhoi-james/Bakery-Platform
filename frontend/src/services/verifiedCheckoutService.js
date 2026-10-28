import { blockAddressCheckout } from './addressService.js'

// Fail before HTTP: the original backend cannot supply Customer addresses.
export const createVerifiedDirectOrder = blockAddressCheckout
export const acceptVerifiedOffer = blockAddressCheckout
