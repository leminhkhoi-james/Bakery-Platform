import { ApiError } from './apiClient.js'
import { isCatalogId } from './catalogModels.js'
import { requireId, requireText, text } from './managementModels.js'

export const JOB_STATUSES = ['QUEUED', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'CANCELLED']
export const runningJob = (status) => ['QUEUED', 'PROCESSING'].includes(status)
export const aiUrl = (value) => typeof value === 'string' && /^https?:\/\//i.test(value) ? value : null
export function generationPayload(input, create = true) {
  const body = { prompt: requireText(input.prompt, 'Prompt', 4000), negativePrompt: input.negativePrompt || null }
  if (body.negativePrompt && (typeof body.negativePrompt !== 'string' || body.negativePrompt.length > 2000)) throw new ApiError('Negative prompt tối đa 2000 ký tự.', 422)
  if (create) body.cakeRequestId = requireId(input.cakeRequestId, 'Cake request')
  const params = input.generationParameters || {}
  const aspectRatio = params.aspectRatio ?? '1:1', numberOfDesigns = Number(params.numberOfDesigns ?? 1)
  if (!['1:1', '4:3', '3:4'].includes(aspectRatio) || !Number.isInteger(numberOfDesigns) || numberOfDesigns < 1 || numberOfDesigns > 4) throw new ApiError('Chỉ hỗ trợ tỉ lệ 1:1/4:3/3:4 và 1–4 thiết kế.', 422)
  body.generationParameters = { aspectRatio, numberOfDesigns }
  return body
}
export function generationKey(key) {
  if (typeof key !== 'string' || !key.trim() || key.length > 128) throw new ApiError('Idempotency-Key cần 1–128 ký tự.', 400)
  return key
}
export function mapJobSummary(dto) {
  if (!isCatalogId(dto?.id)) throw new ApiError('GenerationJob DTO thiếu ID.', 502)
  return { id: dto.id, status: text(dto.status), modelName: text(dto.modelName), currentRevision: Number.isInteger(dto.currentRevision) ? dto.currentRevision : null, createdAt: text(dto.createdAt), updatedAt: text(dto.updatedAt) }
}
export function mapJobPage(dto) {
  if (!Array.isArray(dto?.content) || !['page', 'size', 'totalElements', 'totalPages'].every((key) => Number.isInteger(dto[key])) || dto.page < 0 || dto.size < 1 || dto.totalElements < 0 || dto.totalPages < 0) throw new ApiError('AI history không đúng content/page/size/totalElements/totalPages.', 502)
  return { result: dto.content.map(mapJobSummary), meta: { page: dto.page + 1, pageSize: dto.size, total: dto.totalElements, pages: dto.totalPages } }
}
export function mapDesign(dto) {
  if (!isCatalogId(dto?.id) || !isCatalogId(dto.generationJobId)) throw new ApiError('GeneratedDesign DTO không hợp lệ.', 502)
  const approved = dto.moderationStatus === 'APPROVED'
  return { ...dto, imageUrl: approved ? aiUrl(dto.imageUrl) : null, thumbnailUrl: approved ? aiUrl(dto.thumbnailUrl) : null }
}
export function mapJobDetail(dto, user) {
  if (!isCatalogId(dto?.job?.id) || !isCatalogId(dto.job.customerId) || !isCatalogId(dto.job.cakeRequestId) || !['promptRevisions', 'sourceImages', 'generatedDesigns'].every((key) => Array.isArray(dto[key]))) throw new ApiError('Job detail nested không hợp lệ.', 502)
  if (user && dto.job.customerId !== user.id && !user.roles?.includes('ADMIN')) throw new ApiError('AI job không thuộc tài khoản hiện tại.', 403)
  return { job: { ...dto.job }, currentRevision: dto.currentRevision ?? null, promptRevisions: dto.promptRevisions, sourceImages: dto.sourceImages.map((image) => ({ ...image, url: aiUrl(image.url) })), generatedDesigns: dto.generatedDesigns.map(mapDesign) }
}
