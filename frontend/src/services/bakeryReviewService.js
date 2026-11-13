import { api, ApiError } from './apiClient.js'
import { isCatalogId } from './catalogModels.js'

export const bakeryReviewService = {
  async getPublishedReviews({ bakeryId, page = 1, size = 20 }, options = {}) {
    if (!isCatalogId(bakeryId) || !Number.isInteger(page) || page < 1 || !Number.isInteger(size) || size < 1 || size > 100) {
      throw new ApiError('Yêu cầu tải đánh giá không hợp lệ.', 400)
    }
    const params = new URLSearchParams({ bakeryId, page: String(page), size: String(size) })
    const data = await api.get('/bakery-reviews?' + params, { ...options, auth: false, retryAuth: false })
    if (!data?.meta || !Array.isArray(data.result)) throw new ApiError('Danh sách đánh giá không hợp lệ.', 502)
    return {
      meta: data.meta,
      result: data.result.map((review) => {
        if (!isCatalogId(review?.orderId) || !Number.isInteger(review.rating) || review.rating < 1 || review.rating > 5) {
          throw new ApiError('Đánh giá công khai không hợp lệ.', 502)
        }
        return {
          orderId: review.orderId,
          customerName: typeof review.customerName === 'string' && review.customerName.trim() ? review.customerName.trim() : 'Khách hàng đã xác thực',
          rating: review.rating,
          comment: typeof review.comment === 'string' ? review.comment : '',
          createdAt: review.createdAt || null,
        }
      }),
    }
  },
}

export const loadPublishedBakeryReviews = (params, options) => bakeryReviewService.getPublishedReviews(params, options)
