import { randomUUID } from 'node:crypto'
export const customerId = randomUUID(), bakeryId = randomUUID(), requestId = randomUUID(), offerId = randomUUID(), jobId = randomUUID(), designId = randomUUID(), addressId = randomUUID(), orderId = randomUUID(), addOnId = randomUUID()
export const user = { id: customerId, roles: ['CUSTOMER'], displayName: 'Fixture customer' }
export const input = { requestType: 'OPEN_CUSTOM', title: 'Yêu cầu fixture', description: 'Mô tả từ fixture', neededAt: '2099-03-01T00:00:00Z', offerDeadline: '2099-02-01T00:00:00Z', deliveryDistrict: 'Quận fixture', deliveryCity: 'Thành phố fixture', budgetMin: '100000.00', budgetMax: '500000.00', preference: { allergyNotes: 'Không đậu phộng' } }
export const request = { ...input, id: requestId, customerId, targetBakeryId: null, baseProductId: null, selectedDesignId: null, status: 'DRAFT', images: [], optionSelections: [], offers: [], statusHistory: [], createdAt: '2026-10-26T00:00:00Z', updatedAt: '2026-10-26T00:00:00Z' }
export const offerInput = { bakeryId, cakePrice: '200000.00', deliveryFee: '10000.00', message: 'Điều kiện fixture', estimatedCompletionAt: '2099-02-28T00:00:00Z', expiresAt: '2099-02-27T00:00:00Z', items: [{ addOnId, quantity: 2 }] }
export const offer = { ...offerInput, id: offerId, cakeRequestId: requestId, status: 'PENDING', totalPrice: '220000.00', addOnTotal: '10000.00', items: [{ id: randomUUID(), addOnId, quantity: 2, itemNameSnapshot: 'Nến fixture', unitPrice: '5000.00', lineTotal: '10000.00' }], statusHistory: [], createdAt: '2026-10-26T00:00:00Z' }
export const generation = { cakeRequestId: requestId, prompt: 'Bánh fixture', negativePrompt: 'Không chữ', generationParameters: { aspectRatio: '4:3', numberOfDesigns: 2 } }
export const job = { id: jobId, customerId, cakeRequestId: requestId, status: 'SUCCEEDED', modelName: 'Server model', createdAt: '2026-10-26T00:00:00Z' }
export const design = { id: designId, generationJobId: jobId, moderationStatus: 'APPROVED', imageUrl: 'https://fixture.invalid/design.png', thumbnailUrl: 'https://fixture.invalid/thumb.png' }
export const detail = { job, currentRevision: 1, promptRevisions: [], sourceImages: [], generatedDesigns: [design] }
export const page = (result, meta = {}) => ({ result, meta: { page: 1, pageSize: 12, pages: result.length ? 1 : 0, total: result.length, ...meta } })
export const jobPage = (content) => ({ content, page: 0, size: 12, totalElements: content.length, totalPages: content.length ? 1 : 0 })
export const png = () => new File([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0])], 'fixture.png', { type: 'image/png' })
