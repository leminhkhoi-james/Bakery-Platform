import { isCatalogId } from '../services/catalogModels.js'

export function vendorRoute(route, bakeryId) {
  const [page, query = ''] = route.split('?')
  if (!isCatalogId(bakeryId) || !/^vendor-(dashboard|menu|profile|settings|subscription|orders|revenue|rfq|quote-submit|chat)$/.test(page)) return route
  const params = new URLSearchParams(query)
  params.set('bakeryId', bakeryId.toLowerCase())
  return page + '?' + params
}

export function catalogUrl(page, data) {
  const url = new URL('/' + page, 'http://sweetcake.local')
  const id = page === 'product-detail' ? data?.productId || data?.id : data?.id
  if (['product-detail', 'bakery-detail'].includes(page) && id) url.searchParams.set('id', id)
  if (page === 'explore') {
    for (const key of ['bakeryId', 'categoryId', 'query']) if (data?.[key]) url.searchParams.set(key, data[key])
  }
  return url.pathname + url.search
}
