import { MOCK_CAKES } from '../mockData/customer/cakes.js'

export const cakeService = {
  async getCakes() {
    return Promise.resolve([...MOCK_CAKES])
  },

  async getCakeById(id) {
    const cake = MOCK_CAKES.find((c) => c.id === id)
    return Promise.resolve(cake || null)
  },

  async searchCakes(query) {
    if (!query) return Promise.resolve([...MOCK_CAKES])
    const q = query.toLowerCase()
    const filtered = MOCK_CAKES.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.flavor.toLowerCase().includes(q) ||
        c.categoryName.toLowerCase().includes(q)
    )
    return Promise.resolve(filtered)
  },
}
