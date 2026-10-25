import { MOCK_VENDORS } from '../mockData/admin/vendors.js'

export const vendorService = {
  async getVendors() {
    return Promise.resolve([...MOCK_VENDORS])
  },

  async approveVendor(vendorId) {
    const vendor = MOCK_VENDORS.find((v) => v.id === vendorId)
    if (vendor) {
      vendor.status = 'active'
      vendor.statusLabel = 'Đang mở lò'
      vendor.verified = true
    }
    return Promise.resolve(vendor || null)
  },
}
