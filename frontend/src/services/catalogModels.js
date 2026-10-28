import { ApiError } from './apiClient.js'

export const isCatalogId = (id) => typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
export const catalogMoney = (value) => ['number', 'string'].includes(typeof value) && String(value).trim() !== '' && Number.isFinite(Number(value)) ? Number(value) : null
export const formatCatalogPrice = (value) => value === null || value === undefined ? 'Chưa có giá' : Number(value).toLocaleString('vi-VN') + '₫'

export function mapProduct(dto) {
  const product = dto?.product
  if (!isCatalogId(product?.id)) throw new ApiError('Dữ liệu sản phẩm không hợp lệ.', 502)
  const images = Array.isArray(dto.images) ? dto.images.filter((image) => typeof image?.url === 'string' && image.url).toSorted((a, b) => a.displayOrder - b.displayOrder) : []
  return {
    id: product.id, productId: product.id, catalogSource: 'backend',
    title: product.name || 'Sản phẩm chưa có tên', description: product.description || '',
    price: catalogMoney(product.basePrice), status: product.status ?? null,
    customizable: product.customizable ?? null, defaultServingSize: product.defaultServingSize ?? null,
    minimumNoticeHours: product.minimumNoticeHours ?? null,
    bakeryId: dto.bakeryId ?? null, vendor: dto.bakeryName || null,
    categoryId: dto.category?.id ?? product.categoryId ?? null,
    category: dto.category?.name || null,
    images, image: (images.find((image) => image.primary) || images[0])?.url || null,
    optionGroups: Array.isArray(dto.options?.groups) ? dto.options.groups : [],
    addOns: Array.isArray(dto.addOns) ? dto.addOns : [],
  }
}

export function mapBakery(dto) {
  if (!isCatalogId(dto?.id)) throw new ApiError('Dữ liệu cửa hàng không hợp lệ.', 502)
  const address = dto.primaryAddress ?? null
  return {
    id: dto.id, name: dto.name || 'Cửa hàng chưa có tên', description: dto.description || '',
    image: dto.logoUrl || dto.coverUrl || null, logoUrl: dto.logoUrl || null, coverUrl: dto.coverUrl || null,
    location: address ? [address.addressLine, address.ward, address.district, address.city].filter(Boolean).join(', ') : '',
    city: address?.city || '', district: address?.district || '',
    primaryAddress: address, operations: dto.operations ?? null,
  }
}

export function mapCatalogPage(data, mapper) {
  const meta = data?.meta
  if (!Array.isArray(data?.result) || !meta ||
      !['page', 'pageSize', 'pages', 'total'].every((key) => Number.isInteger(meta[key])) ||
      meta.page < 1 || meta.pageSize < 1 || meta.pages < 0 || meta.total < 0) {
    throw new ApiError('Response catalog không đúng định dạng result/meta.', 502)
  }
  return { result: data.result.map(mapper), meta: { ...meta } }
}

export function catalogQuery(params, allowed) {
  const query = new URLSearchParams()
  for (const key of allowed) {
    const value = params[key]
    if (value !== undefined && value !== null && String(value).trim() !== '') query.set(key, String(value).trim())
  }
  const text = query.toString()
  return text ? '?' + text : ''
}

export function catalogDetailPath(resource, id) {
  if (!isCatalogId(id)) throw new ApiError('Không tìm thấy ' + (resource === 'products' ? 'sản phẩm' : 'cửa hàng') + '.', 404)
  return '/' + resource + '/' + encodeURIComponent(id)
}
