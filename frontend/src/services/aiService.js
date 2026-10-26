import { api, ApiError } from './apiClient.js'
import { catalogQuery } from './catalogModels.js'
import { requireId } from './managementModels.js'
import { generationPayload, generationKey, mapJobSummary, mapJobPage, mapJobDetail, mapDesign } from './aiModels.js'
import { validateReferenceImages } from './marketplaceFiles.js'

const jobPath = (id) => '/generation-jobs/' + requireId(id, 'AI job')
export const aiService = {
  async getJobs(params = {}, options = {}) { return mapJobPage(await api.get('/generation-jobs' + catalogQuery(params, ['cakeRequestId', 'status', 'page', 'size']), options)) },
  async getGenerationJob(id, user, options = {}) { const data = mapJobDetail(await api.get(jobPath(id), options), user); if (data.job.id !== id.toLowerCase()) throw new ApiError('Job trả về sai ID.', 502); return data },
  async createGenerationJob(input, images = [], key) {
    generationKey(key); const metadata = generationPayload(input)
    await validateReferenceImages(images, 5, true)
    const form = new FormData(); form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' })); images.forEach((image) => form.append('sourceImages', image))
    return mapJobSummary(await api.post('/generation-jobs', form, { headers: { 'Idempotency-Key': key } }))
  },
  async reviseJob(id, input, key) { return mapJobSummary(await api.post(jobPath(id) + '/prompt-revisions', generationPayload(input, false), { headers: { 'Idempotency-Key': generationKey(key) } })) },
  async cancelJob(id) { return mapJobSummary(await api.post(jobPath(id) + '/cancel')) },
  async getDesign(id, options = {}) { const design = mapDesign(await api.get('/generated-designs/' + requireId(id), options)); if (design.id !== id.toLowerCase()) throw new ApiError('Backend trả sai thiết kế.', 502); return design },
}
export const loadAiJobs = (params, options) => aiService.getJobs(params, options)
export const loadAiJob = ({ id, user }, options) => aiService.getGenerationJob(id, user, options)
