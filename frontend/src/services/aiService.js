import { api } from './apiClient.js'

export const aiService = {
  /**
   * Create generation job
   * Calls POST /api/v1/generation-jobs
   */
  async createGenerationJob(metadata, images = [], idempotencyKey = null) {
    const idKey = idempotencyKey || crypto.randomUUID()
    const formData = new FormData()

    const metadataBlob = new Blob([JSON.stringify(metadata)], {
      type: 'application/json',
    })
    formData.append('metadata', metadataBlob)

    if (images && images.length > 0) {
      images.forEach((img) => {
        formData.append('sourceImages', img)
      })
    }

    return api.post('/generation-jobs', formData, {
      headers: {
        'Idempotency-Key': idKey,
      },
    })
  },

  /**
   * Get generation job status and result
   * Calls GET /api/v1/generation-jobs/{id}
   */
  async getGenerationJob(id) {
    return api.get(`/generation-jobs/${id}`)
  },
}
