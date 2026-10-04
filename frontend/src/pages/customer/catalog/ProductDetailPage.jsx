import { PRODUCT_GALLERY_IMAGES as GALLERY_IMAGES, PRODUCT_SIZES as SIZES } from '../../../mockData/customer/cakes.js'
import { useState } from 'react'
import { useAppData } from '../../../context/AppDataContext.jsx'



export const ProductDetailPage = ({
  cake,
  onAddToCart,
  onNavigate,
}) => {
  const { addRfq } = useAppData()
  const cakeSizes = cake?.sizes && cake.sizes.length > 0 ? cake.sizes : SIZES
  const initialIndex = cake?.selectedSize
    ? cakeSizes.findIndex((s) => s.size === cake.selectedSize)
    : -1

  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedSizeIndex, setSelectedSizeIndex] = useState(
    initialIndex >= 0 ? initialIndex : 0
  )
  const [sweetness, setSweetness] = useState('less30')
  const [cakeMessage, setCakeMessage] = useState('')
  const [addonGoldCandle, setAddonGoldCandle] = useState(false)
  const [addonPartyHat, setAddonPartyHat] = useState(false)
  const [deliveryType, setDeliveryType] = useState('express')
  const [quantity, setQuantity] = useState(1)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [activeTab, setActiveTab] = useState('taste')
  const [showSizeGuide, setShowSizeGuide] = useState(false)

  // Calculations
  const currentBasePrice = cakeSizes[selectedSizeIndex]?.price || cake?.price || 480000
  const addonsTotal =
    (addonGoldCandle ? 15000 : 0) + (addonPartyHat ? 25000 : 0)
  const unitPrice = currentBasePrice + addonsTotal
  const totalPrice = unitPrice * quantity

  const handleAdd = () => {
    const chosenSize = cakeSizes[selectedSizeIndex]
    const selectedSizeLabel = chosenSize
      ? `Size ${chosenSize.size} • ${chosenSize.guests}`
      : (cake?.sizeSpec || 'Size tiêu chuẩn')

    if (onAddToCart) {
      onAddToCart({
        id: cake?.id || 'velvet-raspberry-bliss',
        title: cake?.title || 'Velvet Raspberry Bliss',
        image: cake?.image || (cake?.photos && cake?.photos[0]) || GALLERY_IMAGES[0]?.url,
        selectedSize: chosenSize?.size || 'Tiêu chuẩn',
        sizeSpec: selectedSizeLabel,
        sweetness:
          sweetness === 'french'
            ? 'Chuẩn vị Pháp'
            : sweetness === 'less30'
            ? 'Giảm 30% đường'
            : 'Giảm 50% đường',
        cakeMessage: cakeMessage.trim() || undefined,
        quantity,
        price: unitPrice,
      })
    }

    if (onNavigate) {
      onNavigate('cart')
    }
  }

  const handleFastOrder = () => {
    const chosenSize = cakeSizes[selectedSizeIndex]
    const selectedSizeLabel = chosenSize
      ? `Size ${chosenSize.size} • ${chosenSize.guests}`
      : (cake?.sizeSpec || 'Size 18cm • 6-8 người')

    if (onAddToCart) {
      onAddToCart({
        id: cake?.id || 'velvet-raspberry-bliss',
        title: cake?.title || 'Velvet Raspberry Bliss',
        image: cake?.image || (cake?.photos && cake?.photos[0]) || GALLERY_IMAGES[0]?.url,
        selectedSize: chosenSize?.size || '18cm',
        sizeSpec: selectedSizeLabel,
        sweetness:
          sweetness === 'french'
            ? 'Chuẩn vị Pháp'
            : sweetness === 'less30'
            ? 'Giảm 30% đường'
            : 'Giảm 50% đường',
        cakeMessage: cakeMessage.trim() || undefined,
        quantity,
        price: unitPrice,
      })
    }

    try {
      localStorage.setItem('sweetcake_direct_checkout', 'true')
    } catch {}

    if (onNavigate) {
      onNavigate('cart')
    }
  }

  return (
    <div className="w-full striped-candy-bg min-h-[calc(100vh-20rem)]">
      <div className="flex flex-col w-full">
        {/* Ambient Glow */}
        <div className="relative w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 pt-6 pb-20 overflow-hidden">

          {/* MAIN PRODUCT SECTION: Dual Column Canvas */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter lg:gap-12 mt-8 items-start">
            {/* LEFT COLUMN: Curated Gallery */}
            <div className="lg:col-span-6 space-y-4">
              <div className="relative rounded-2xl overflow-hidden bg-surface/60 backdrop-blur-md border border-outline-variant/20 shadow-xl shadow-primary/5 group">
                {/* Floating Badges */}
                <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                  <span className="bg-secondary text-on-secondary px-3 py-1 rounded-full font-label-sm tracking-wider uppercase shadow-md flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-xs">
                      local_fire_department
                    </span>
                    Bán chạy nhất
                  </span>
                  <span className="bg-surface/90 backdrop-blur-md text-on-surface px-3 py-1 rounded-full font-label-sm shadow-sm flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-xs text-secondary">
                      ac_unit
                    </span>
                    Bảo quản lạnh 4-8°C
                  </span>
                </div>


                {/* Main Image Frame */}
                <div className="relative aspect-[4/5] w-full overflow-hidden cursor-zoom-in bg-surface-container">
                  <img
                    alt={GALLERY_IMAGES[selectedImage]?.alt}
                    className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
                    id="main-product-image"
                    src={GALLERY_IMAGES[selectedImage]?.url}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                </div>
              </div>

              {/* Thumbnail Gallery Strip */}
              <div className="grid grid-cols-4 gap-3">
                {GALLERY_IMAGES.slice(1).map((item, idx) => {
                  const actualIndex = idx + 1
                  const isActive = selectedImage === actualIndex
                  return (
                    <button
                      key={item.url}
                      className={`aspect-square rounded-xl overflow-hidden bg-surface-container p-0.5 transition-all cursor-pointer ${
                        isActive
                          ? 'ring-2 ring-secondary opacity-100'
                          : 'opacity-70 hover:opacity-100'
                      }`}
                      onClick={() => setSelectedImage(actualIndex)}
                      type="button"
                    >
                      <img
                        alt={item.alt}
                        className="w-full h-full object-cover rounded-lg"
                        src={item.url}
                      />
                    </button>
                  )
                })}
              </div>

            </div>

            {/* RIGHT COLUMN: Product Details, Configurator & Ordering */}
            <div className="lg:col-span-6 flex flex-col space-y-6">
              {/* Header & Title Area */}
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="inline-block px-3 py-1 bg-surface/80 backdrop-blur-md rounded-full font-label-md text-xs uppercase tracking-widest text-primary font-bold shadow-sm border border-outline-variant/30">
                    Signature Entremet Collection
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                  <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                    Bánh Sinh Nhật Nghệ Thuật
                  </span>
                </div>

                <h1 className="font-headline-lg text-3xl sm:text-4xl lg:text-[44px] text-primary tracking-tight drop-shadow-sm">
                  Velvet Raspberry Bliss
                </h1>

              </div>

              {/* Pricing Block */}
              <div className="bg-surface-container p-4 rounded-xl flex items-baseline justify-between shadow-sm">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span
                      className="font-headline-md text-primary font-bold"
                      id="display-price"
                    >
                      {totalPrice.toLocaleString('vi-VN')}₫
                    </span>
                  </div>
                  <p className="font-body-sm text-xs text-on-surface-variant mt-0.5">
                    Giá bao gồm hộp quà signature ép kim &amp; nến cơ bản
                  </p>
                </div>
              </div>

              {/* Form Builder / Customizer Form */}
              <div className="space-y-5">
                {/* 1. Size Selection */}
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center">
                    <label className="font-label-md text-primary font-semibold flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-base text-secondary">
                        straighten
                      </span>
                      1. Chọn kích thước bánh:
                    </label>
                    <button
                      className="text-xs text-secondary hover:underline font-label-sm flex items-center gap-0.5 cursor-pointer"
                      onClick={() => setShowSizeGuide(true)}
                      type="button"
                    >
                      <span className="material-symbols-outlined text-xs">
                        help_outline
                      </span>
                      Hướng dẫn chọn size
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5" id="size-options">
                    {cakeSizes.map((item, idx) => {
                      const isSelected = selectedSizeIndex === idx
                      return (
                        <button
                          key={item.size}
                          className={`p-3 rounded-xl transition-all text-left flex flex-col justify-between cursor-pointer ${
                            isSelected
                              ? 'bg-primary text-on-primary shadow-md'
                              : 'bg-surface-container-low hover:bg-surface-container-high'
                          }`}
                          onClick={() => setSelectedSizeIndex(idx)}
                          type="button"
                        >
                          <div>
                            <div
                              className={`font-label-md font-bold ${
                                isSelected ? 'text-on-primary' : 'text-on-surface'
                              }`}
                            >
                              {item.size.startsWith('Size') || item.size.includes('Tầng')
                                ? item.size
                                : `Size ${item.size}`}
                            </div>
                            <div
                              className={`text-[11px] ${
                                isSelected ? 'text-primary-fixed' : 'text-on-surface-variant'
                              }`}
                            >
                              {item.guests}
                            </div>
                          </div>
                          <div
                            className={`text-xs font-semibold mt-2 ${
                              isSelected
                                ? 'text-secondary-container'
                                : 'text-secondary'
                            }`}
                          >
                            {item.price.toLocaleString('vi-VN')}₫
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* 2. Sweetness Level Selection */}
                <div className="space-y-2">
                  <label className="font-label-md text-primary font-semibold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base text-secondary">
                      cookie
                    </span>
                    2. Tùy chọn vị ngọt (Sugar Level):
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <label
                      className={`cursor-pointer p-3 rounded-xl flex items-center gap-3 transition-colors ${
                        sweetness === 'french'
                          ? 'bg-surface-container ring-1 ring-secondary'
                          : 'bg-surface-container-low hover:bg-surface-container'
                      }`}
                    >
                      <input
                        checked={sweetness === 'french'}
                        onChange={() => setSweetness('french')}
                        className="accent-secondary w-4 h-4 cursor-pointer"
                        name="sweetness"
                        type="radio"
                        value="french"
                      />
                      <div className="text-left">
                        <div className="text-xs font-label-md font-bold text-on-surface">
                          Chuẩn vị Pháp
                        </div>
                        <div className="text-[11px] text-on-surface-variant">
                          100% tự nhiên
                        </div>
                      </div>
                    </label>

                    <label
                      className={`cursor-pointer p-3 rounded-xl flex items-center gap-3 transition-colors ${
                        sweetness === 'less30'
                          ? 'bg-surface-container ring-1 ring-secondary'
                          : 'bg-surface-container-low hover:bg-surface-container'
                      }`}
                    >
                      <input
                        checked={sweetness === 'less30'}
                        onChange={() => setSweetness('less30')}
                        className="accent-secondary w-4 h-4 cursor-pointer"
                        name="sweetness"
                        type="radio"
                        value="less30"
                      />
                      <div className="text-left">
                        <div className="text-xs font-label-md font-bold text-primary flex items-center gap-1">
                          Giảm 30% đường
                          <span className="material-symbols-outlined text-xs text-secondary">
                            star
                          </span>
                        </div>
                        <div className="text-[11px] text-secondary font-medium">
                          Khuyên dùng • Dịu thanh
                        </div>
                      </div>
                    </label>

                    <label
                      className={`cursor-pointer p-3 rounded-xl flex items-center gap-3 transition-colors ${
                        sweetness === 'less50'
                          ? 'bg-surface-container ring-1 ring-secondary'
                          : 'bg-surface-container-low hover:bg-surface-container'
                      }`}
                    >
                      <input
                        checked={sweetness === 'less50'}
                        onChange={() => setSweetness('less50')}
                        className="accent-secondary w-4 h-4 cursor-pointer"
                        name="sweetness"
                        type="radio"
                        value="less50"
                      />
                      <div className="text-left">
                        <div className="text-xs font-label-md font-bold text-on-surface">
                          Giảm 50% đường
                        </div>
                        <div className="text-[11px] text-on-surface-variant">
                          Rất ít ngọt cho ăn kiêng
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* 3. Message on Cake (Custom Plaque) */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label
                      className="font-label-md text-primary font-semibold flex items-center gap-1.5"
                      htmlFor="cake-message"
                    >
                      <span className="material-symbols-outlined text-base text-secondary">
                        draw
                      </span>
                      3. Viết chữ lên mặt bánh (Miễn phí bảng socola):
                    </label>
                    <span className="text-[11px] text-outline font-mono" id="char-count">
                      {cakeMessage.length}/30 ký tự
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      className="w-full bg-surface-container-low text-on-surface px-4 py-3 rounded-xl font-body-sm placeholder:text-outline-variant outline-none focus:bg-surface-container transition-all"
                      id="cake-message"
                      maxLength={30}
                      placeholder="Ví dụ: Happy Birthday Linh Anh! 🎂"
                      type="text"
                      value={cakeMessage}
                      onChange={(e) => setCakeMessage(e.target.value)}
                    />
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline-variant text-base">
                      cake
                    </span>
                  </div>
                </div>

                {/* 4. Accessories & Add-ons */}
                <div className="space-y-2">
                  <label className="font-label-md text-primary font-semibold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base text-secondary">
                      celebration
                    </span>
                    4. Nến sinh nhật &amp; Phụ kiện bàn tiệc:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <label className="cursor-pointer p-2.5 rounded-xl bg-surface-container-low flex items-start gap-2.5 hover:bg-surface-container transition-all">
                      <input
                        defaultChecked
                        className="mt-0.5 accent-secondary rounded cursor-pointer"
                        type="checkbox"
                      />
                      <div className="text-left">
                        <div className="text-xs font-label-md font-semibold text-on-surface">
                          Nến tăm pastel
                        </div>
                        <div className="text-[11px] text-secondary font-medium">
                          Miễn phí kèm bánh
                        </div>
                      </div>
                    </label>

                    <label className="cursor-pointer p-2.5 rounded-xl bg-surface-container-low flex items-start gap-2.5 hover:bg-surface-container transition-all">
                      <input
                        defaultChecked
                        className="mt-0.5 accent-secondary rounded cursor-pointer"
                        type="checkbox"
                      />
                      <div className="text-left">
                        <div className="text-xs font-label-md font-semibold text-on-surface">
                          Dao mạ vàng &amp; đĩa thân thiện
                        </div>
                        <div className="text-[11px] text-secondary font-medium">
                          Tặng kèm miễn phí
                        </div>
                      </div>
                    </label>

                    <label className="cursor-pointer p-2.5 rounded-xl bg-surface-container-low flex items-start gap-2.5 hover:bg-surface-container transition-all">
                      <input
                        checked={addonGoldCandle}
                        onChange={(e) => setAddonGoldCandle(e.target.checked)}
                        className="mt-0.5 accent-secondary rounded cursor-pointer"
                        type="checkbox"
                      />
                      <div className="text-left">
                        <div className="text-xs font-label-md font-semibold text-on-surface">
                          Nến số nhũ vàng
                        </div>
                        <div className="text-[11px] text-on-surface-variant">
                          +15.000₫ / số
                        </div>
                      </div>
                    </label>

                    <label className="cursor-pointer p-2.5 rounded-xl bg-surface-container-low flex items-start gap-2.5 hover:bg-surface-container transition-all">
                      <input
                        checked={addonPartyHat}
                        onChange={(e) => setAddonPartyHat(e.target.checked)}
                        className="mt-0.5 accent-secondary rounded cursor-pointer"
                        type="checkbox"
                      />
                      <div className="text-left">
                        <div className="text-xs font-label-md font-semibold text-on-surface">
                          Nón tiệc ép kim
                        </div>
                        <div className="text-[11px] text-on-surface-variant">
                          +25.000₫ / set
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* 5. Delivery Slot Selector */}
                <div className="space-y-2">
                  <label className="font-label-md text-primary font-semibold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base text-secondary">
                      schedule
                    </span>
                    5. Thời gian nhận bánh mong muốn:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <label
                      className={`cursor-pointer p-3 rounded-xl flex items-center gap-3 transition-colors ${
                        deliveryType === 'express'
                          ? 'bg-surface-container ring-1 ring-secondary'
                          : 'bg-surface-container-low'
                      }`}
                    >
                      <input
                        checked={deliveryType === 'express'}
                        onChange={() => setDeliveryType('express')}
                        className="accent-secondary w-4 h-4 cursor-pointer"
                        name="delivery_time"
                        type="radio"
                      />
                      <div>
                        <div className="text-xs font-label-md font-bold text-on-surface flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm text-secondary">
                            bolt
                          </span>
                          Giao hỏa tốc trong 2 giờ
                        </div>
                        <div className="text-[11px] text-on-surface-variant">
                          Áp dụng nội thành TP.HCM &amp; HN
                        </div>
                      </div>
                    </label>

                    <label
                      className={`cursor-pointer p-3 rounded-xl flex items-center gap-3 transition-colors ${
                        deliveryType === 'schedule'
                          ? 'bg-surface-container ring-1 ring-secondary'
                          : 'bg-surface-container-low'
                      }`}
                    >
                      <input
                        checked={deliveryType === 'schedule'}
                        onChange={() => setDeliveryType('schedule')}
                        className="accent-secondary w-4 h-4 cursor-pointer"
                        name="delivery_time"
                        type="radio"
                      />
                      <div>
                        <div className="text-xs font-label-md font-bold text-on-surface flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm text-secondary">
                            event
                          </span>
                          Hẹn ngày &amp; giờ chính xác
                        </div>
                        <div className="text-[11px] text-on-surface-variant">
                          Lên đơn chuẩn bị trước 1-7 ngày
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Quantity & Action CTA Buttons */}
                <div className="pt-4 space-y-3">
                  <div className="flex items-center gap-3">
                    {/* Quantity Stepper */}
                    <div className="flex items-center bg-surface-container rounded-xl p-1 shrink-0">
                      <button
                        className="w-9 h-9 rounded-lg hover:bg-surface-container-high flex items-center justify-center text-on-surface transition-colors active:scale-90 cursor-pointer"
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        type="button"
                      >
                        <span className="material-symbols-outlined text-base">
                          remove
                        </span>
                      </button>
                      <span
                        className="w-10 text-center font-label-md font-bold text-primary"
                        id="item-quantity"
                      >
                        {quantity}
                      </span>
                      <button
                        className="w-9 h-9 rounded-lg hover:bg-surface-container-high flex items-center justify-center text-on-surface transition-colors active:scale-90 cursor-pointer"
                        onClick={() => setQuantity((q) => q + 1)}
                        type="button"
                      >
                        <span className="material-symbols-outlined text-base">
                          add
                        </span>
                      </button>
                    </div>

                    {/* Primary CTA: Add to Bag */}
                    <button
                      className="flex-1 bg-primary hover:bg-secondary text-on-primary py-3.5 px-6 rounded-xl font-label-lg font-bold flex items-center justify-center gap-2 transition-all duration-300 shadow-lg shadow-primary/10 active:scale-[0.98] cursor-pointer"
                      onClick={handleAdd}
                      type="button"
                    >
                      <span className="material-symbols-outlined text-xl">
                        shopping_bag
                      </span>
                      <span>Thêm Vào Giỏ Hàng</span>
                    </button>
                  </div>

                  {/* Instant Express Checkout CTA */}
                  <button
                    className="w-full bg-secondary text-on-secondary hover:bg-secondary/90 py-3 rounded-xl font-label-lg font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.99] cursor-pointer"
                    onClick={handleFastOrder}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-xl">
                      electric_bolt
                    </span>
                    <span>Đặt Hỏa Tốc Ngay (Giao Sau 2h)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* TABS SECTION: Editorial Deep Dive */}
          <div className="mt-20">
            <div className="border-b border-outline-variant/30 flex items-center gap-8 overflow-x-auto no-scrollbar">
              {[
                { id: 'taste', label: 'Cấu trúc & Hương vị' },
                { id: 'ingredients', label: 'Nguyên liệu tuyển chọn' },
                { id: 'storage', label: 'Bảo quản & Thưởng thức' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  className={`pb-4 font-headline-sm text-lg font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    activeTab === tab.id
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-on-surface-variant hover:text-primary'
                  }`}
                  onClick={() => setActiveTab(tab.id)}
                  type="button"
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content Area */}
            <div className="py-8">
              {/* Tab 1: Taste & Structure Architecture */}
              {activeTab === 'taste' && (
                <div className="tab-panel block" id="tab-taste">
                  <div className="max-w-4xl space-y-5">
                    <h3 className="font-headline-md text-primary">
                      Vũ điệu chua ngọt đánh thức mọi giác quan
                    </h3>
                    <p className="font-body-md text-on-surface-variant leading-relaxed">
                      Velvet Raspberry Bliss là một tác phẩm haute pâtisserie đỉnh cao
                      kết hợp sự xốp mịn nồng nàn của cốt bánh chiffon nhung đỏ hữu
                      cơ, đan xen cùng các lớp mứt quả phúc bồn tử tươi tự nấu thanh
                      mát và kem tươi Mascarpone ngọt dịu. Mỗi miếng bánh tan êm dịu,
                      không gắt, để lại hậu vị ngọt ngào tinh khiết.
                    </p>

                    <div className="space-y-3 pt-2">
                      <div className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-secondary/15 text-secondary flex items-center justify-center font-bold text-xs shrink-0">
                          1
                        </span>
                        <div>
                          <h4 className="font-label-md text-on-surface font-bold">
                            Lớp phủ trên cùng (Top Crown)
                          </h4>
                          <p className="font-body-sm text-xs text-on-surface-variant">
                            Phúc bồn tử tươi organic mọng nước điểm xuyết lá vàng ăn
                            được 24K và hoa thảo mộc thơm nhẹ.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-secondary/15 text-secondary flex items-center justify-center font-bold text-xs shrink-0">
                          2
                        </span>
                        <div>
                          <h4 className="font-label-md text-on-surface font-bold">
                            Lớp kem Mascarpone Vanilla Chantilly
                          </h4>
                          <p className="font-body-sm text-xs text-on-surface-variant">
                            Kem phô mai béo ngậy thanh khiết từ Ý đánh bông nhẹ nhàng
                            với hạt vani Madagascar nguyên chất.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-secondary/15 text-secondary flex items-center justify-center font-bold text-xs shrink-0">
                          3
                        </span>
                        <div>
                          <h4 className="font-label-md text-on-surface font-bold">
                            Lớp mứt Mâm Xôi Coulis tự nấu
                          </h4>
                          <p className="font-body-sm text-xs text-on-surface-variant">
                            Mứt cô đặc từ quả mâm xôi chín mọng nấu chậm với cốt chanh
                            vàng Pháp, giữ nguyên tép quả tự nhiên.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-secondary/15 text-secondary flex items-center justify-center font-bold text-xs shrink-0">
                          4
                        </span>
                        <div>
                          <h4 className="font-label-md text-on-surface font-bold">
                            Cốt bánh Red Velvet Chiffon ẩm mượt
                          </h4>
                          <p className="font-body-sm text-xs text-on-surface-variant">
                            Bột cacao nguyên chất kết hợp bơ sữa lên men tự nhiên,
                            tạo cấu trúc xốp nhẹ như mây.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Organic Ingredients */}
              {activeTab === 'ingredients' && (
                <div className="tab-panel block" id="tab-ingredients">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-surface-container p-6 rounded-2xl space-y-3">
                      <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center text-secondary">
                        <span className="material-symbols-outlined text-2xl">
                          nutrition
                        </span>
                      </div>
                      <h4 className="font-headline-sm text-primary text-base">
                        Bơ Elle &amp; Vire Normandy
                      </h4>
                      <p className="font-body-sm text-on-surface-variant leading-relaxed">
                        Được nhập khẩu nguyên khối từ vùng đồng cỏ Normandy trứ danh nước
                        Pháp, mang lại mùi thơm béo ngậy đặc trưng không thể nhầm lẫn.
                      </p>
                    </div>

                    <div className="bg-surface-container p-6 rounded-2xl space-y-3">
                      <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center text-secondary">
                        <span className="material-symbols-outlined text-2xl">spa</span>
                      </div>
                      <h4 className="font-headline-sm text-primary text-base">
                        Mâm xôi tươi Đà Lạt Farm
                      </h4>
                      <p className="font-body-sm text-on-surface-variant leading-relaxed">
                        Canh tác hữu cơ không phân hóa học, thu hoạch đúng độ chín lúc
                        rạng đông để quả giữ nguyên vị giòn ngọt thanh và vị chua mọng
                        nước.
                      </p>
                    </div>

                    <div className="bg-surface-container p-6 rounded-2xl space-y-3">
                      <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center text-secondary">
                        <span className="material-symbols-outlined text-2xl">
                          psychiatry
                        </span>
                      </div>
                      <h4 className="font-headline-sm text-primary text-base">
                        Vani Bourbon Madagascar
                      </h4>
                      <p className="font-body-sm text-on-surface-variant leading-relaxed">
                        Chiết xuất trực tiếp từ quả vani đen nguyên chất hạt mịn, tạo
                        chiều sâu mùi thơm quý phái ngập tràn mà hương liệu nhân tạo
                        không bao giờ đạt được.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Storage & Slicing Tips */}
              {activeTab === 'storage' && (
                <div className="tab-panel block" id="tab-storage">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-surface-container-low p-6 rounded-2xl">
                    <div className="space-y-4">
                      <h4 className="font-headline-sm text-primary text-base flex items-center gap-2">
                        <span className="material-symbols-outlined text-secondary">
                          ac_unit
                        </span>
                        Hướng dẫn bảo quản
                      </h4>
                      <ul className="space-y-2 text-on-surface-variant font-body-sm">
                        <li className="flex items-start gap-2">
                          <span className="material-symbols-outlined text-secondary text-sm shrink-0 mt-1">
                            check_circle
                          </span>
                          <span>
                            Bảo quản liên tục trong tủ lạnh nhiệt độ{' '}
                            <strong>2°C - 6°C</strong> trong hộp kín để tránh hút mùi thực
                            phẩm khác.
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="material-symbols-outlined text-secondary text-sm shrink-0 mt-1">
                            check_circle
                          </span>
                          <span>
                            Ngon nhất khi thưởng thức trong vòng{' '}
                            <strong>24h - 48h</strong> kể từ lúc nhận bánh.
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="material-symbols-outlined text-secondary text-sm shrink-0 mt-1">
                            check_circle
                          </span>
                          <span>
                            Để bánh ngoài nhiệt độ phòng (25°C) không quá 45 phút để kem
                            không bị mềm nhão mất form dáng.
                          </span>
                        </li>
                      </ul>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-headline-sm text-primary text-base flex items-center gap-2">
                        <span className="material-symbols-outlined text-secondary">
                          tips_and_updates
                        </span>
                        Bí quyết cắt lát bánh phẳng mịn
                      </h4>
                      <ul className="space-y-2 text-on-surface-variant font-body-sm">
                        <li className="flex items-start gap-2">
                          <span className="material-symbols-outlined text-secondary text-sm shrink-0 mt-1">
                            arrow_right
                          </span>
                          <span>
                            Dùng dao cắt bánh (kèm theo trong hộp) ngâm qua nước ấm nóng
                            trong 15 giây rồi lau khô trước mỗi nhát cắt.
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="material-symbols-outlined text-secondary text-sm shrink-0 mt-1">
                            arrow_right
                          </span>
                          <span>
                            Cắt dứt khoát một đường từ trên xuống, không kéo cưa qua lại
                            để lát cắt giữ nguyên các vân kem đẹp mắt.
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="material-symbols-outlined text-secondary text-sm shrink-0 mt-1">
                            arrow_right
                          </span>
                          <span>
                            Kết hợp hoàn hảo với một tách trà Earl Grey hoặc Champagne
                            khô ướp lạnh.
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}


            </div>
          </div>

          {/* PAIRING SUGGESTIONS / CROSS-SELL SECTION */}
          <div className="mt-16 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
              <div>
                <span className="text-xs font-label-md tracking-wider uppercase text-secondary font-bold">
                  Thưởng thức trọn vẹn
                </span>
                <h2 className="font-headline-md text-primary mt-1">
                  Gợi ý kết hợp cùng tiệc ngọt
                </h2>
              </div>
              <a
                className="text-sm font-label-md text-secondary hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                href="/explore"
                onClick={(e) => {
                  e.preventDefault()
                  onNavigate && onNavigate('explore')
                }}
              >
                Xem tất cả đồ uống &amp; petit fours
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {/* Pairing Card 1 */}
              <div className="bg-surface-container-low rounded-2xl p-4 flex flex-col justify-between group shadow-sm hover:shadow-xl transition-all duration-300">
                <div className="space-y-3">
                  <div className="aspect-[4/3] rounded-xl overflow-hidden bg-surface-container relative">
                    <img
                      alt="Macarons"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuBmsVzjTjx0IXkjIOk52xFfrpv7TjI9az2jX1gpiVBfsVk2CkwVOuzGJu2GoliiJ6a6O9yypqJ83qKQlQVNLqVf9t515O2kFPLLmEAXvtMtSbVcPq6V7SNOBSegKib2_tZYTL4Hdg1kAxjPhT4fH_HLAFVDiK0CBqS360SilhLUzy1_YHqUQy2i8SjUdCIGx7j421dsrFO4NO5DsrTotFAbAPz2m_ZBZvNN0mj7q0WXaAS2__WF23w5"
                    />
                    <span className="absolute top-2 left-2 bg-surface/90 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-primary">
                      Kèm bánh
                    </span>
                  </div>
                  <div>
                    <h4 className="font-headline-sm text-base text-primary">
                      Hộp 6 Macarons Pháp Signature
                    </h4>
                    <p className="font-body-sm text-xs text-on-surface-variant line-clamp-2 mt-1">
                      Vỏ giòn tan bọc nhân ganache phúc bồn tử, hạt dẻ cười &amp; socola
                      đen 70%.
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 mt-2 border-t border-outline-variant/20">
                  <span className="font-label-lg font-bold text-secondary">
                    210.000₫
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      className="p-2 rounded-full bg-surface-container hover:bg-surface-container-high text-primary hover:text-secondary transition-colors cursor-pointer"
                      onClick={() =>
                        onAddToCart &&
                        onAddToCart({
                          id: 'macarons-6',
                          title: 'Hộp 6 Macarons Pháp Signature',
                          price: 210000,
                        })
                      }
                      title="Thêm vào giỏ hàng"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-base">
                        add_shopping_cart
                      </span>
                    </button>
                    <button
                      className="px-3.5 py-1.5 rounded-full bg-primary text-on-primary font-label-md text-xs hover:bg-secondary transition-all shadow-sm cursor-pointer"
                      onClick={() =>
                        onAddToCart &&
                        onAddToCart({
                          id: 'macarons-6',
                          title: 'Hộp 6 Macarons Pháp Signature',
                          price: 210000,
                        })
                      }
                      type="button"
                    >
                      Đặt ngay
                    </button>
                  </div>
                </div>
              </div>

              {/* Pairing Card 2 */}
              <div className="bg-surface-container-low rounded-2xl p-4 flex flex-col justify-between group shadow-sm hover:shadow-xl transition-all duration-300">
                <div className="space-y-3">
                  <div className="aspect-[4/3] rounded-xl overflow-hidden bg-surface-container relative">
                    <img
                      alt="Rose Earl Grey Tea"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuCcfE9YSBTHUb99bzqofhGfVJEQW64jE8HJVFnGdD55k9Yg01-B-cQ3ce2DHaGZAyuKhXivzLyb0magKWKG9izSgODiGPQKs2HCj-800Og19xIkV_DOGtgpQwzLqOkxBaNVroLz3H9hFc-tpYqlcCNCQVDqDj6X6L8BUrXWPORrcvzCSYOGtuwBg3XlcyluMCP6wyySl5rGhZ3vJK_4ubOL_sXo0pdp7OcEBSQOmbocaKorPANho-EO"
                    />
                    <span className="absolute top-2 left-2 bg-surface/90 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-primary">
                      Đồ uống hoàn hảo
                    </span>
                  </div>
                  <div>
                    <h4 className="font-headline-sm text-base text-primary">
                      Trà Bá Tước Hoa Hồng (Rose Earl Grey)
                    </h4>
                    <p className="font-body-sm text-xs text-on-surface-variant line-clamp-2 mt-1">
                      Trà lá Ceylon thượng hạng ướp tinh dầu cam Bergamot và nụ hoa hồng
                      Pháp thơm ngát.
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 mt-2 border-t border-outline-variant/20">
                  <span className="font-label-lg font-bold text-secondary">
                    140.000₫
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      className="p-2 rounded-full bg-surface-container hover:bg-surface-container-high text-primary hover:text-secondary transition-colors cursor-pointer"
                      onClick={() =>
                        onAddToCart &&
                        onAddToCart({
                          id: 'rose-earl-grey',
                          title: 'Trà Bá Tước Hoa Hồng (Rose Earl Grey)',
                          price: 140000,
                        })
                      }
                      title="Thêm vào giỏ hàng"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-base">
                        add_shopping_cart
                      </span>
                    </button>
                    <button
                      className="px-3.5 py-1.5 rounded-full bg-primary text-on-primary font-label-md text-xs hover:bg-secondary transition-all shadow-sm cursor-pointer"
                      onClick={() =>
                        onAddToCart &&
                        onAddToCart({
                          id: 'rose-earl-grey',
                          title: 'Trà Bá Tước Hoa Hồng (Rose Earl Grey)',
                          price: 140000,
                        })
                      }
                      type="button"
                    >
                      Đặt ngay
                    </button>
                  </div>
                </div>
              </div>

              {/* Pairing Card 3 */}
              <div className="bg-surface-container-low rounded-2xl p-4 flex flex-col justify-between group shadow-sm hover:shadow-xl transition-all duration-300">
                <div className="space-y-3">
                  <div className="aspect-[4/3] rounded-xl overflow-hidden bg-surface-container relative">
                    <img
                      alt="Croissant"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuB6sr1ww3fZYNJ8fP2QVl7ECqdcrKDwOnqolqWUh-UgHuPUnm67IBf-Ol0LjLpxWrUckcW813lCxabs8m21-PpPSW8aXadmDSk6tIY6eXxKJR1tNu4sRt-ZcofnnbCoFwSAe6eno7ZWdtoekCZIqLdC7upija1gpHG1sIxTccPupZvikAWilcF1apCwjSbG5q9JqUTPZ5YcGlCWmTF2jGXdB0-0h8yfcZ8QeWsPrBt9mvzH21CWQ9ZW"
                    />
                    <span className="absolute top-2 left-2 bg-surface/90 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-primary">
                      Khai vị mặn
                    </span>
                  </div>
                  <div>
                    <h4 className="font-headline-sm text-base text-primary">
                      Croissant Bơ Tỏi Đen Lên Men
                    </h4>
                    <p className="font-body-sm text-xs text-on-surface-variant line-clamp-2 mt-1">
                      Bánh nướng ngàn lớp thơm nức từ bơ tươi kết hợp sốt tỏi đen cân
                      bằng vị giác.
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 mt-2 border-t border-outline-variant/20">
                  <span className="font-label-lg font-bold text-secondary">
                    65.000₫
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      className="p-2 rounded-full bg-surface-container hover:bg-surface-container-high text-primary hover:text-secondary transition-colors cursor-pointer"
                      onClick={() =>
                        onAddToCart &&
                        onAddToCart({
                          id: 'croissant-black-garlic',
                          title: 'Croissant Bơ Tỏi Đen Lên Men',
                          price: 65000,
                        })
                      }
                      title="Thêm vào giỏ hàng"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-base">
                        add_shopping_cart
                      </span>
                    </button>
                    <button
                      className="px-3.5 py-1.5 rounded-full bg-primary text-on-primary font-label-md text-xs hover:bg-secondary transition-all shadow-sm cursor-pointer"
                      onClick={() =>
                        onAddToCart &&
                        onAddToCart({
                          id: 'croissant-black-garlic',
                          title: 'Croissant Bơ Tỏi Đen Lên Men',
                          price: 65000,
                        })
                      }
                      type="button"
                    >
                      Đặt ngay
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CUSTOM BESPOKE CAKE CALLOUT BANNER */}
          <div className="mt-20 relative rounded-3xl overflow-hidden bg-primary-container text-on-primary p-8 md:p-12 shadow-2xl">
            <div className="relative z-10 max-w-2xl space-y-4">
              <div className="inline-flex items-center gap-2 bg-secondary/30 text-secondary-container px-3.5 py-1 rounded-full text-xs font-label-md uppercase tracking-wider">
                <span className="material-symbols-outlined text-xs">
                  auto_awesome
                </span>
                Dịch vụ Bespoke Atelier
              </div>
              <h3 className="font-headline-lg text-primary-fixed leading-tight">
                Bạn muốn tùy chỉnh một chiếc bánh hoàn toàn độc bản?
              </h3>
              <p className="font-body-md text-primary-fixed-dim leading-relaxed text-sm">
                Từ bánh cưới nhiều tầng, trang trí fondant thủ công, vị bánh riêng theo
                cung hoàng đạo hoặc hoa tươi nhập khẩu cao cấp – nghệ nhân bánh ngọt tại
                Sweet Cake sẵn sàng lắng nghe câu chuyện của bạn.
              </p>
              <div className="pt-2 flex flex-wrap items-center gap-4">
                <a
                  className="bg-secondary text-on-secondary hover:bg-secondary-container hover:text-on-secondary-container px-6 py-3 rounded-xl font-label-lg font-bold transition-all flex items-center gap-2 shadow-lg active:scale-95 cursor-pointer"
                  href="/ai-studio"
                  onClick={(e) => {
                    e.preventDefault()
                    onNavigate && onNavigate('ai-studio')
                  }}
                >
                  <span className="material-symbols-outlined text-lg">palette</span>
                  <span>Bắt đầu tự thiết kế bánh</span>
                </a>
              </div>
            </div>
            {/* Decorative Graphic Glow inside banner */}
            <div className="absolute -right-16 -bottom-16 w-80 h-80 rounded-full bg-secondary/15 blur-3xl pointer-events-none"></div>
          </div>
        </div>

        {/* MODAL: Size Guide */}
        {showSizeGuide && (
          <div className="fixed inset-0 z-50 bg-primary/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-surface rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
              <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
                <h3 className="font-headline-sm text-primary">
                  Cẩm nang chọn kích cỡ bánh
                </h3>
                <button
                  className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
                  onClick={() => setShowSizeGuide(false)}
                  type="button"
                >
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              </div>
              <div className="space-y-3 font-body-sm text-on-surface-variant">
                <div className="p-3 bg-surface-container-low rounded-xl">
                  <strong className="text-primary font-label-md">
                    Size 14cm (Cao 8cm):
                  </strong>{' '}
                  Thích hợp cho buổi hẹn hò 2 người hoặc gia đình nhỏ 3-4 người. Cắt được
                  4-6 phần ăn vừa vặn.
                </div>
                <div className="p-3 bg-surface-container-low rounded-xl">
                  <strong className="text-primary font-label-md">
                    Size 16cm (Cao 9cm - Tiêu chuẩn):
                  </strong>{' '}
                  Lựa chọn phổ biến nhất cho tiệc sinh nhật thân mật 4-6 người. Cắt được
                  6-8 lát bánh chuẩn.
                </div>
                <div className="p-3 bg-surface-container-low rounded-xl">
                  <strong className="text-primary font-label-md">
                    Size 20cm (Cao 10cm):
                  </strong>{' '}
                  Dành cho tiệc gia đình lớn, họp mặt bạn bè 8-10 người. Đủ cho 10-12
                  phần ăn rộng rãi.
                </div>
                <div className="p-3 bg-surface-container-low rounded-xl">
                  <strong className="text-primary font-label-md">
                    Size 24cm (Cao 10cm):
                  </strong>{' '}
                  Dành cho tiệc sinh nhật tại nhà hàng, liên hoan công ty từ 12-16 người.
                </div>
              </div>
              <button
                className="w-full bg-primary text-on-primary py-2.5 rounded-xl font-label-md font-bold cursor-pointer"
                onClick={() => setShowSizeGuide(false)}
                type="button"
              >
                Đã hiểu, quay lại đặt bánh
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProductDetailPage
