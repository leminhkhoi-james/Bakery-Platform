import { cleanPresentationLabel, publicCopy } from '../../../services/uiLabels.js'
import { useState, useEffect } from 'react'
import { loadBakery } from '../../../services/vendorService.js'
import { loadProducts } from '../../../services/cakeService.js'
import { loadPublishedBakeryReviews } from '../../../services/bakeryReviewService.js'
import { useCatalogResource } from '../../../hooks/useCatalogResource.js'
import CatalogImage from '../../../components/catalog/CatalogImage.jsx'
import CatalogState from '../../../components/catalog/CatalogState.jsx'
import CatalogPagination from '../../../components/catalog/CatalogPagination.jsx'
import ProductCard from '../../../components/catalog/ProductCard.jsx'
import { Icon } from '../../../components/common/WorkspaceUI.jsx'

const SAMPLE_REVIEWS = {
  'la-creme-patisserie': [
    {
      id: 'lcp-1',
      author: 'Hoàng Nhật Linh',
      initials: 'NL',
      initialsBg: 'bg-secondary text-white',
      stars: 5,
      date: '3 ngày trước',
      comment: 'Bánh Velvet Raspberry Bliss làm cả gia đình mình ngạc nhiên vì độ xốp và vị ngọt dịu nhẹ, không hề ngấy như các tiệm bánh công nghiệp. Khâu đóng hộp giao đến còn mát rượi!',
      cakeName: 'Velvet Raspberry Bliss',
    },
    {
      id: 'lcp-2',
      author: 'Đỗ Hải Đăng',
      initials: 'HĐ',
      initialsBg: 'bg-primary text-white',
      stars: 5,
      date: '1 tuần trước',
      comment: 'Bánh kem 2 tầng cho tiệc sinh nhật bé nhà mình rất tuyệt vời. Từng bông hoa kem bơ được bắt rất tỉ mỉ, chủ tiệm nhắn tin tư vấn nhiệt tình từ lúc chốt mẫu đến lúc giao.',
      cakeName: 'Bánh Kem 2 Tầng Hoa Tươi',
    },
    {
      id: 'lcp-3',
      author: 'Phạm Minh Anh',
      initials: 'MA',
      initialsBg: 'bg-amber-600 text-white',
      stars: 5,
      date: '2 tuần trước',
      comment: 'Cốt bánh chiffon ẩm mịn, kem bơ Pháp thơm béo mà thanh nhẹ. Điểm 10 cho đóng gói thùng xốp cẩn thận và tài xế giao hàng nhẹ nhàng.',
      cakeName: 'Entremet Trái Cây Cao Cấp',
    },
  ],
  'sweet-bakery-studio': [
    {
      id: 'sbs-1',
      author: 'Vũ Thảo & Minh Trí',
      initials: 'VT',
      initialsBg: 'bg-secondary text-white',
      stars: 5,
      date: '2 ngày trước',
      comment: 'Tạo hình 3D giống hệt mẫu AI phác thảo đến 98%! Cả nhà ai cũng trầm trồ khi mở hộp bánh. Cốt bánh trà Earl Grey thơm thoang thoảng rất dễ chịu.',
      cakeName: 'Bánh Tạo Hình 3D Nhân Vật Hoạt Hình',
    },
    {
      id: 'sbs-2',
      author: 'Nguyễn Bích Ngọc',
      initials: 'BN',
      initialsBg: 'bg-primary text-white',
      stars: 5,
      date: '5 ngày trước',
      comment: 'Tiệm giao bánh hỏa tốc rất nhanh. Bánh tới nơi nguyên vẹn form dáng không hề bị chảy hay xước kem. Cực kỳ uy tín!',
      cakeName: 'Bánh Pikachu 3D Chiffon',
    },
    {
      id: 'sbs-3',
      author: 'Lê Gia Huy',
      initials: 'GH',
      initialsBg: 'bg-amber-600 text-white',
      stars: 4,
      date: '2 tuần trước',
      comment: 'Bánh rất ngon, độ ngọt giảm 35% đúng như yêu cầu của mình. Tiệm đóng gói kỹ lưỡng có kèm đá gel.',
      cakeName: 'Bánh Sinh Nhật Phong Cách Hàn Quốc',
    },
  ],
  'moon-cake-haute': [
    {
      id: 'mch-1',
      author: 'Phan Phương Anh',
      initials: 'PA',
      initialsBg: 'bg-amber-600 text-white',
      stars: 5,
      date: '4 ngày trước',
      comment: 'Bánh kem cưới Haute Couture dát vàng ăn được cực kỳ sang trọng và lộng lẫy. Chef Moon tư vấn phối màu hoa tươi theo đúng concept đám cưới của mình!',
      cakeName: 'Bánh Cưới Dát Vàng Haute Couture',
    },
    {
      id: 'mch-2',
      author: 'Lâm Khánh Chi',
      initials: 'KC',
      initialsBg: 'bg-secondary text-white',
      stars: 5,
      date: '10 ngày trước',
      comment: 'Hương vị chuẩn 5 sao, lớp kem bơ nhuyễn mịn tan ngay trong miệng. Khách đến dự tiệc ai cũng khen ngợi hết lời.',
      cakeName: 'Bánh Kem Nghệ Thuật Hoa Tươi Ngoại Nhập',
    },
  ],
}

const DEFAULT_SAMPLE_REVIEWS = [
  {
    id: 'def-1',
    author: 'Nguyễn Thu Hà',
    initials: 'TH',
    initialsBg: 'bg-secondary text-white',
    stars: 5,
    date: '3 ngày trước',
    comment: 'Bánh làm rất đúng mẫu phác thảo, cốt bánh mềm ẩm và kem thanh nhẹ không hề bị ngọt gắt. Giao hàng cẩn thận, đúng giờ!',
    cakeName: 'Bánh Kem Nghệ Thuật Thiết Kế Riêng',
  },
  {
    id: 'def-2',
    author: 'Trần Minh Quân',
    initials: 'MQ',
    initialsBg: 'bg-primary text-white',
    stars: 5,
    date: '1 tuần trước',
    comment: 'Chủ tiệm nhiệt tình hỗ trợ chỉnh sửa chi tiết chữ viết lên bánh. Đóng hộp quà tặng rất sang trọng và chỉn chu.',
    cakeName: 'Bánh Sinh Nhật Trang Trí Tối Giản',
  },
  {
    id: 'def-3',
    author: 'Lê Hoàng Yến',
    initials: 'HY',
    initialsBg: 'bg-amber-600 text-white',
    stars: 5,
    date: '2 tuần trước',
    comment: 'Chất lượng tuyệt vời ngoài mong đợi, bánh giữ form rất tốt dù vận chuyển xa. Sẽ tiếp tục ủng hộ tiệm trong các dịp tới!',
    cakeName: 'Bánh Mousse Trái Cây Tươi',
  },
]

export default function BakeryDetailPage({ routeSearch = '', onNavigate }) {
  const params = new URLSearchParams(routeSearch)
  const id = params.get('id') || ''
  const view = params.get('view') || params.get('tab') || ''
  const resource = useCatalogResource(loadBakery, { id })

  useEffect(() => {
    if (view === 'reviews' && resource.status === 'ready') {
      const el = document.getElementById('bakery-reviews')
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 150)
      }
    }
  }, [view, resource.status])

  return (
    <div className="sc-catalog w-full min-h-screen">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12 py-8">
        <button className="text-secondary underline cursor-pointer" onClick={() => onNavigate?.('stores')}>
          ← Danh sách cửa hàng
        </button>
        <div className="mt-6"><CatalogState {...resource} onRetry={resource.reload} onNavigate={onNavigate} /></div>
        {resource.status === 'ready' && <>
          <BakeryDetails bakery={resource.data} />

          {/* Quick Section Jump Bar */}
          <div className="mt-8 flex flex-wrap items-center gap-3 border-b border-primary/10 pb-4">
            <button
              type="button"
              onClick={() => document.getElementById('bakery-menu')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-white border border-primary/15 text-primary hover:bg-rose-50 transition-all cursor-pointer shadow-2xs"
            >
              <Icon name="restaurant_menu" className="text-base" />
              <span>Menu &amp; Mẫu bánh</span>
            </button>
            <button
              type="button"
              onClick={() => document.getElementById('bakery-reviews')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-50 border border-amber-200 text-amber-900 hover:bg-amber-100 transition-all cursor-pointer shadow-2xs"
            >
              <Icon name="star" className="text-base fill-amber-400" />
              <span>Đánh giá từ khách hàng</span>
            </button>
          </div>

          <BakeryMenu key={id} bakeryId={id} onNavigate={onNavigate} />
          <BakeryReviews bakeryId={id} bakery={resource.data} />
        </>}
      </div>
    </div>
  )
}

export function BakeryDetails({ bakery }) {
  return (
    <section className="rounded-2xl border border-outline-variant/20 bg-surface/90 p-6 shadow-sm">
      {bakery.coverUrl && (
        <CatalogImage
          src={bakery.coverUrl}
          alt={cleanPresentationLabel(bakery.name, 'Tiệm bánh')}
          className="mb-6 h-48 w-full rounded-2xl object-cover sm:h-64"
        />
      )}
      <div className="flex flex-col sm:flex-row items-start gap-6">
        <CatalogImage
          src={bakery.logoUrl}
          alt={cleanPresentationLabel(bakery.name, 'Tiệm bánh')}
          className="h-24 w-24 shrink-0 rounded-2xl object-cover"
        />
        <div className="flex-1 min-w-0">
          <h1 className="font-headline-lg text-3xl sm:text-4xl text-primary font-bold">
            {cleanPresentationLabel(bakery.name, 'Tiệm bánh')}
          </h1>
          <p className="mt-2 text-sm text-outline">{bakery.location || 'Tiệm chưa cung cấp địa chỉ.'}</p>
          <p className="mt-4 whitespace-pre-line text-on-surface-variant">
            {publicCopy(bakery.description, 'Tiệm chưa cung cấp mô tả.')}
          </p>
        </div>
      </div>
      {(bakery.operations?.businessHours || []).length > 0 && (
        <details className="mt-6 text-primary">
          <summary className="cursor-pointer font-bold">Giờ hoạt động</summary>
          <ul className="mt-3 space-y-1 text-sm">
            {bakery.operations.businessHours.map((hour) => (
              <li key={hour.dayOfWeek}>
                {hour.dayOfWeek === 7 ? 'Chủ nhật' : 'Thứ ' + (hour.dayOfWeek + 1)}: {hour.closed ? 'Đóng cửa' : hour.opensAt && hour.closesAt ? hour.opensAt + ' – ' + hour.closesAt : 'Chưa có giờ mở cửa'}
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  )
}

function BakeryMenu({ bakeryId, onNavigate }) {
  const [page, setPage] = useState(1)
  const resource = useCatalogResource(loadProducts, { bakeryId, page, size: 6, sort: 'createdAt,desc' })
  return (
    <section id="bakery-menu" className="mt-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-headline-md text-2xl text-primary font-bold">Menu &amp; Mẫu Bánh</h2>
        <button className="text-secondary underline cursor-pointer" onClick={() => onNavigate?.('explore', { bakeryId })}>
          Tìm kiếm trong menu →
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-gutter">
        <CatalogState
          {...resource}
          empty={!resource.data?.result.length}
          emptyText="Tiệm chưa có sản phẩm công khai."
          onRetry={resource.reload}
          onNavigate={onNavigate}
        />
        {resource.data?.result.map((product) => (
          <ProductCard key={product.id} product={product} onNavigate={onNavigate} />
        ))}
      </div>
      {resource.status === 'ready' && <CatalogPagination meta={resource.data.meta} onPage={setPage} />}
    </section>
  )
}

export function BakeryReviews({ bakeryId, bakery }) {
  const [filterRating, setFilterRating] = useState('all')
  const resource = useCatalogResource(loadPublishedBakeryReviews, { bakeryId, page: 1, size: 100 })
  const realReviews = (resource.data?.result || []).map((review) => ({
      id: review.orderId,
      author: review.customerName,
      initials: review.customerName
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase(),
      initialsBg: 'bg-secondary text-white',
      stars: review.rating,
      date: review.createdAt ? new Date(review.createdAt).toLocaleDateString('vi-VN') : 'Gần đây',
      comment: review.comment,
    }))
  const allReviews = realReviews
  const avgRating = allReviews.length ? (allReviews.reduce((sum, review) => sum + review.stars, 0) / allReviews.length).toFixed(1) : '0.0'
  const totalCount = allReviews.length

  const filtered =
    filterRating === 'all'
      ? allReviews
      : filterRating === '5'
      ? allReviews.filter((r) => r.stars === 5)
      : allReviews.filter((r) => r.stars <= 4)

  if (resource.status === 'loading') {
    return <section id="bakery-reviews" className="mt-12 rounded-2xl border border-outline-variant/20 bg-white/95 p-8 text-center shadow-xs"><p role="status" className="text-sm text-outline">Đang tải đánh giá đã được duyệt…</p></section>
  }

  if (resource.status === 'error') {
    return <section id="bakery-reviews" className="mt-12 rounded-2xl border border-rose-200 bg-rose-50/60 p-8 text-center shadow-xs"><h3 className="text-lg font-bold text-primary">Chưa tải được đánh giá</h3><p className="mt-1 text-sm text-outline">Vui lòng thử lại sau.</p><button type="button" onClick={resource.reload} className="mt-4 text-sm font-bold text-secondary underline underline-offset-4">Tải lại</button></section>
  }

  if (allReviews.length === 0) {
    return (
      <section className="mt-12 rounded-2xl border border-outline-variant/20 bg-white/95 p-8 text-center shadow-xs">
        <div className="w-12 h-12 mx-auto rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-500 mb-3">
          <Icon name="rate_review" className="text-2xl" />
        </div>
        <h3 className="text-lg font-bold text-primary">Chưa có đánh giá nào cho tiệm này</h3>
        <p className="mt-1 text-sm text-outline max-w-md mx-auto">
          Hãy đặt chiếc bánh đầu tiên và chia sẻ cảm nhận của bạn để giúp tiệm ngày càng hoàn thiện nhé!
        </p>
      </section>
    )
  }

  return (
    <section id="bakery-reviews" className="mt-12 space-y-6">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold uppercase tracking-wider">
          <Icon name="star" className="text-sm fill-amber-400" />
          <span>Phản hồi từ khách hàng</span>
        </div>
        <h2 className="font-headline-md text-2xl sm:text-3xl text-primary font-bold mt-2">
          Đánh Giá &amp; Cảm Nhận Thực Tế
        </h2>
        <p className="text-sm text-outline mt-1">
          Tổng hợp trải nghiệm chân thật từ các khách hàng đã đặt bánh tại {cleanPresentationLabel(bakery?.name, 'tiệm')}
        </p>
      </div>

      {/* Summary Score Card */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 rounded-2xl border border-primary/10 bg-gradient-to-br from-amber-50/40 via-white to-rose-50/30 p-6 sm:p-8 shadow-xs">
        {/* Score & Stars */}
        <div className="md:col-span-4 flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r border-primary/10 pb-6 md:pb-0 md:pr-6">
          <div className="text-5xl sm:text-6xl font-bold text-primary tracking-tight font-serif">
            {avgRating}
          </div>
          <div className="flex items-center text-amber-400 gap-1 mt-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <svg key={star} className="w-5 h-5 fill-amber-400 text-amber-400" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <p className="mt-2 text-xs font-semibold text-outline">
            Dựa trên {totalCount} lượt đánh giá đã được duyệt
          </p>
        </div>

        {/* Guarantee badges & Filters */}
        <div className="md:col-span-8 flex flex-col justify-center gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl bg-white/90 border border-primary/8 p-3 shadow-2xs">
              <span className="text-base">🎂</span>
              <strong className="block text-xs font-bold text-primary mt-1">99% Đúng mẫu bánh</strong>
              <p className="text-[11px] text-outline mt-0.5">Tạo hình bám sát yêu cầu thiết kế</p>
            </div>
            <div className="rounded-xl bg-white/90 border border-primary/8 p-3 shadow-2xs">
              <span className="text-base">🍰</span>
              <strong className="block text-xs font-bold text-primary mt-1">100% Bơ Pháp hảo hạng</strong>
              <p className="text-[11px] text-outline mt-0.5">Cốt bánh ẩm thơm, vị ngọt dịu</p>
            </div>
            <div className="rounded-xl bg-white/90 border border-primary/8 p-3 shadow-2xs">
              <span className="text-base">⏱️</span>
              <strong className="block text-xs font-bold text-primary mt-1">Giao hàng bảo đảm dáng bánh</strong>
              <p className="text-[11px] text-outline mt-0.5">Thùng chống sốc, giữ trọn dáng nguyên vẹn</p>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-primary/10">
            <span className="text-xs font-medium text-outline">Lọc đánh giá:</span>
            <button
              type="button"
              onClick={() => setFilterRating('all')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                filterRating === 'all'
                  ? 'bg-secondary text-white shadow-xs'
                  : 'bg-white border border-primary/15 text-outline hover:bg-rose-50'
              }`}
            >
              Tất cả ({allReviews.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterRating('5')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                filterRating === '5'
                  ? 'bg-secondary text-white shadow-xs'
                  : 'bg-white border border-primary/15 text-outline hover:bg-rose-50'
              }`}
            >
              ★ 5 sao ({allReviews.filter((r) => r.stars === 5).length})
            </button>
            <button
              type="button"
              onClick={() => setFilterRating('4')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                filterRating === '4'
                  ? 'bg-secondary text-white shadow-xs'
                  : 'bg-white border border-primary/15 text-outline hover:bg-rose-50'
              }`}
            >
              ★ 4 sao trở xuống ({allReviews.filter((r) => r.stars <= 4).length})
            </button>
          </div>
        </div>
      </div>

      {/* Reviews Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {filtered.map((item) => (
          <article
            key={item.id}
            className="rounded-2xl border border-primary/10 bg-white/95 p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
          >
            <div>
              {/* Header: Author + Stars */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ${item.initialsBg || 'bg-secondary text-white'} shrink-0 shadow-2xs`}
                  >
                    {item.initials}
                  </span>
                  <div>
                    <strong className="block text-sm font-bold text-primary leading-snug">
                      {item.author}
                    </strong>
                    <div className="flex items-center gap-1.5 text-[11px] text-outline mt-0.5">
                      <span className="text-emerald-700 font-semibold flex items-center gap-0.5">
                        <Icon name="verified" className="text-xs text-emerald-600" />
                        Đã mua tại tiệm
                      </span>
                      <span>·</span>
                      <span>{item.date}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center text-amber-400 shrink-0">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className={`w-4 h-4 ${star <= item.stars ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`}
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>

              {/* Cake tag */}
              {item.cakeName && (
                <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50/70 border border-amber-200/50 text-[11px] font-semibold text-amber-900">
                  <span>🎂</span>
                  <span>{item.cakeName}</span>
                </div>
              )}

              {/* Review Comment */}
              <p className="mt-3 text-sm text-gray-700 leading-relaxed italic">
                “{item.comment}”
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
