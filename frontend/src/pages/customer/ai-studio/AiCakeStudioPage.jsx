import {
  STYLE_PROMPTS,
  SUGGESTION_TAGS,
  BUDGET_PRESETS,
  STUDIO_SIZES as SIZES,
  STUDIO_FLAVORS as FLAVORS,
  STUDIO_TOPPINGS as TOPPINGS,
  STUDIO_ACCESSORIES as ACCESSORIES,
  AI_RENDER_IMAGES,
} from '../../../mockData/customer/aiDesigns.js'
import { useState } from 'react'
import { useAppData } from '../../../context/AppDataContext.jsx'



export const AiCakeStudioPage = ({
  onAddToCart,
  onNavigate,
  onSetCustomCake,
}) => {
  // Mode: 'ai' (Thiết kế AI) or 'upload' (Tải ảnh mẫu sẵn)
  const [designMode, setDesignMode] = useState('ai')

  // AI Prompt and generation
  const [promptInput, setPromptInput] = useState(
    "Bánh Pikachu 2 tầng màu vàng rực rỡ, cốt bánh chiffon mềm tan, phủ kem tươi béo ngậy, trang trí tai Pikachu socola 3D và má hồng dâu tây, chữ viết 'Happy 7th Birthday Minh Khang!' màu đỏ nổi bật, cho bé trai 7 tuổi"
  )
  const [isGenerating, setIsGenerating] = useState(false)
  const [activeImageIndex, setActiveImageIndex] = useState(0)

  // Uploaded reference images (from Đặt bánh theo mẫu)
  const [uploadedImages, setUploadedImages] = useState([
    {
      id: 'img-1',
      name: 'Pikachu_2tier_concept.png',
      size: '2.4 MB',
      isPrimary: true,
      url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD5uGsS30Cap84oWdpRwGskThAmtRIUkyLvdT3AwjDhYRnbnwht0SzYH1ICVS_aPfeu2aGNApD0LXc8yqwFkUnvwYe366s08YLviv570VcNpj2fVQE-RBCqLDSexFOg4oqRoCnWIGh64nTvwEJspS1SgQ5rUqDmGs1RZ3x27xegSiC-czN5LokTLRx41zkIyS9tGXQ4iMzUPdnWo5u1d85gDstCiXhHTaze6qyPKrgbdsecDZSO8dQZ',
    },
  ])

  // Technical Configuration
  const [selectedSizeId, setSelectedSizeId] = useState('2tier')
  const [selectedFlavors, setSelectedFlavors] = useState(['vanilla', 'strawberry'])
  const [selectedToppings, setSelectedToppings] = useState([
    'Fruit Tươi Theo Mùa',
    'Macaron Pháp Thủ Công',
  ])
  const [cakeMessage, setCakeMessage] = useState('Happy 7th Birthday Minh Khang!')
  const [messagePlacement, setMessagePlacement] = useState('cake') // 'cake' | 'wood_plaque' | 'choco_plaque' | 'card'
  const [checkedAccessories, setCheckedAccessories] = useState({
    candle: true,
    cutlery: true,
    card: true,
    flowers: true,
    balloons: false,
    mica_box: true,
  })

  // RFQ / Delivery & Budget parameters (from Đặt bánh theo mẫu)
  const [budget, setBudget] = useState(1000000)
  const [budgetInputText, setBudgetInputText] = useState('1.000.000')
  const [allowFlexiblePrice, setAllowFlexiblePrice] = useState(true)
  const [deliveryDateRaw, setDeliveryDateRaw] = useState('2026-09-20')
  const [deliveryDate, setDeliveryDate] = useState('Hôm nay, 20/09/2026')
  const [deliveryTimeSlot, setDeliveryTimeSlot] = useState(
    '15:30 - 16:30 (Trước giờ tiệc)'
  )
  const [isCustomTimeSlot, setIsCustomTimeSlot] = useState(false)
  const [customTimeInput, setCustomTimeInput] = useState('')
  const [deliveryAddress, setDeliveryAddress] = useState(
    'Căn hộ 18.04, Tháp Opal, Saigon Pearl, 92 Nguyễn Hữu Cảnh, P. 22, Q. Bình Thạnh, TP.HCM'
  )
  const [customerNote, setCustomerNote] = useState(() => {
    try {
      const saved = localStorage.getItem('sweetcake_active_rfq')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.customerNote) return parsed.customerNote
      }
    } catch {}
    return 'Bánh cho tiệc sinh nhật 7 tuổi bé Minh Khang, làm cốt Chiffon vani ít ngọt 30%, bé hơi nhạy cảm với socola đắng nên dùng socola sữa tạo hình Pikachu giúp em nhé. Giao thùng xe lạnh đúng hẹn.'
  })
  const [isSubmitted, setIsSubmitted] = useState(false)

  const currentSizeObj = SIZES.find((s) => s.id === selectedSizeId) || SIZES[2]
  const accessoryTotal = ACCESSORIES.reduce((acc, item) => {
    return acc + (checkedAccessories[item.id] ? item.price : 0)
  }, 0)
  const flavorTotal = selectedFlavors.reduce((acc, fId) => {
    const flav = FLAVORS.find((f) => f.id === fId)
    return acc + (flav?.price || 0)
  }, 0)
  const baseCalculatedPrice = currentSizeObj.basePrice
  const totalEstimatedPrice = baseCalculatedPrice + accessoryTotal + flavorTotal

  const handleReGenerate = () => {
    setIsGenerating(true)
    setTimeout(() => {
      setIsGenerating(false)
      setActiveImageIndex((prev) => (prev === 0 ? 1 : 0))
    }, 1200)
  }

  const toggleFlavor = (id) => {
    setSelectedFlavors((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const toggleTopping = (topping) => {
    setSelectedToppings((prev) =>
      prev.includes(topping)
        ? prev.filter((item) => item !== topping)
        : [...prev, topping]
    )
  }

  const toggleAccessory = (id) => {
    setCheckedAccessories((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const handleBudgetChange = (e) => {
    const rawVal = e.target.value.replace(/\D/g, '')
    if (rawVal) {
      const num = parseInt(rawVal, 10)
      setBudget(num)
      setBudgetInputText(num.toLocaleString('vi-VN'))
    } else {
      setBudget(0)
      setBudgetInputText('')
    }
  }

  const handleSelectPreset = (preset) => {
    setBudget(preset.value)
    setBudgetInputText(preset.value.toLocaleString('vi-VN'))
  }

  const handleSyncEstimatedBudget = () => {
    setBudget(totalEstimatedPrice)
    setBudgetInputText(totalEstimatedPrice.toLocaleString('vi-VN'))
  }

  const handleAddTag = (tag) => {
    if (!promptInput.includes(tag)) {
      setPromptInput((prev) =>
        prev ? `${prev}, phong cách ${tag}` : `Phong cách ${tag}`
      )
    }
  }

  // Action: Gửi yêu cầu RFQ lên sàn Marketplace nhận báo giá từ các tiệm
  const { addRfq } = useAppData()

  const handleSubmitRfq = (e) => {
    if (e) e.preventDefault()
    setIsSubmitted(true)

    const cakeTitle =
      designMode === 'ai'
        ? `${promptInput.slice(0, 35)}...`
        : `Bánh Custom theo mẫu: ${uploadedImages[0]?.name || 'Thiết kế riêng'}`

    const newRfqId = `#RFQ-${Date.now().toString().slice(-4)}`

    const activeRfq = {
      // Vendor Marketplace fields
      id: newRfqId,
      title: cakeTitle,
      customerName: 'Khách hàng (Bạn)',
      category: 'birthday',
      categoryName: 'Bánh theo yêu cầu',
      budget: budget || totalEstimatedPrice || 1000000,
      budgetDisplay: `${(budget || totalEstimatedPrice || 1000000).toLocaleString('vi-VN')}đ`,
      needDate: deliveryDate || 'Hôm nay, 20/09/2026',
      deliveryTime: deliveryTimeSlot?.split(' ')[0] || '15:30',
      deliveryFullText: `${deliveryDate || 'Hôm nay, 20/09/2026'} - ${deliveryTimeSlot || '15:30'}`,
      address: deliveryAddress || 'TP. Hồ Chí Minh',
      shortAddress: deliveryAddress?.split(',').slice(-2).join(',').trim() || 'TP. Hồ Chí Minh',
      distanceKm: 5.0,
      distanceText: 'TP. Hồ Chí Minh',
      status: 'OPEN',
      statusText: 'Đang nhận báo giá',
      bidsSent: 0,
      maxBids: 5,
      matchScore: 96,
      matchReason: 'Yêu cầu mới nhất từ khách hàng',
      timeLeftHours: 'Còn 23 giờ',
      urgent: false,
      description: customerNote || promptInput || 'Không có mô tả thêm.',
      sizeRequirement: currentSizeObj?.name || 'Theo yêu cầu',
      flavorRequirement: selectedFlavors.map(id => FLAVORS.find(f => f.id === id)?.name).filter(Boolean).join(', '),
      inscription: cakeMessage || '',
      image: currentPreviewImage,
      thumbnails: [],
      // BiddingComparisonPage fields
      conceptTitle: cakeTitle,
      deliveryTimeSlot: deliveryTimeSlot || '15:30 - 16:30',
      deliveryAddress: deliveryAddress || 'TP. Hồ Chí Minh',
      selectedSize: currentSizeObj?.name,
      cakeMessage: cakeMessage,
      customerNote: customerNote,
      flavors: selectedFlavors.map(id => FLAVORS.find(f => f.id === id)?.name).filter(Boolean).join(', '),
      createdAt: new Date().toISOString(),
    }

    // 1. Push to shared Context (Vendor Marketplace reads this)
    addRfq(activeRfq)

    // 2. Clear accepted bids and set active RFQ in localStorage
    try {
      const isEditing = localStorage.getItem('sweetcake_is_editing_rfq') === 'true'
      if (isEditing) {
        localStorage.removeItem('sweetcake_is_editing_rfq')
        localStorage.setItem('sweetcake_rfq_edited_notice', 'true')
        localStorage.removeItem('sweetcake_accepted_bid')
      } else {
        localStorage.removeItem('sweetcake_rfq_edited_notice')
      }
      localStorage.setItem('sweetcake_active_rfq', JSON.stringify(activeRfq))
    } catch {
      // ignore
    }

    setTimeout(() => {
      setIsSubmitted(false)
      if (onNavigate) {
        onNavigate('bidding')
      }
    }, 1000)
  }

  const currentPreviewImage =
    designMode === 'ai'
      ? AI_RENDER_IMAGES[activeImageIndex]
      : uploadedImages[0]?.url || AI_RENDER_IMAGES[0]

  return (
    <div className="w-full bg-surface">
      <div className="flex flex-col w-full">
        {/* Ambient Glows */}
        <div className="relative w-full overflow-hidden">
          <div className="absolute -top-32 right-1/4 w-96 h-96 bg-secondary-fixed/30 rounded-full blur-3xl pointer-events-none -z-10"></div>
          <div className="absolute top-48 left-10 w-80 h-80 bg-primary-fixed/40 rounded-full blur-3xl pointer-events-none -z-10"></div>

          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 py-4 sm:py-6">
            {/* Header Title */}
            <div className="flex flex-col gap-3 mb-8 md:mb-10">
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                <div className="max-w-3xl">
                  <span className="font-label-md text-label-md uppercase tracking-widest text-secondary font-semibold block mb-1">
                    SWEETAI STUDIO
                  </span>
                  <h1 className="font-headline-lg text-[30px] sm:text-[36px] lg:text-[40px] text-primary font-bold tracking-tight leading-tight flex items-center gap-2.5">
                    <span>Thiết Kế Bánh</span>
                    <span className="text-secondary text-[26px] sm:text-[32px] italic">✨</span>
                  </h1>
                </div>

                {/* Mode Switcher Tabs */}
                <div className="flex items-center p-1.5 rounded-2xl bg-surface-container-low border border-outline-variant/30 shadow-xs shrink-0 self-start lg:self-end">
                  <button
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-label-md text-label-md transition-all cursor-pointer ${designMode === 'ai'
                        ? 'bg-primary text-on-primary font-bold shadow-sm'
                        : 'text-on-surface hover:text-primary hover:bg-surface-container'
                      }`}
                    onClick={() => setDesignMode('ai')}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      auto_awesome
                    </span>
                    <span>Tự Thiết Kế Với AI</span>
                  </button>

                  <button
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-label-md text-label-md transition-all cursor-pointer ${designMode === 'upload'
                        ? 'bg-primary text-on-primary font-bold shadow-sm'
                        : 'text-on-surface hover:text-primary hover:bg-surface-container'
                      }`}
                    onClick={() => setDesignMode('upload')}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      cloud_upload
                    </span>
                    <span>Tải Ảnh Mẫu Có Sẵn</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Main Dual-Column Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* LEFT COLUMN: Input, Upload, Specs & RFQ Delivery Form (7 cols) */}
              <div className="lg:col-span-7 flex flex-col gap-6">
                {/* 1. PRIMARY CREATIVE SECTION: AI Generator OR Image Upload */}
                {designMode === 'ai' ? (
                  /* Mode A: AI Natural Language Prompt Section */
                  <div className="bg-surface-container-low rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <label
                        className="flex items-center gap-2 font-label-lg text-label-lg text-primary"
                        htmlFor="ai-prompt-input"
                      >
                        <span className="material-symbols-outlined text-secondary text-[20px]">
                          magic_button
                        </span>
                        Mô tả ý tưởng bánh kem bằng ngôn ngữ tự nhiên
                      </label>
                      <span className="font-label-sm text-label-sm px-2.5 py-0.5 rounded-full bg-secondary-fixed/50 text-secondary font-medium">
                        AI Generator
                      </span>
                    </div>

                    <div className="relative">
                      <textarea
                        className="w-full bg-surface-container-lowest text-on-surface font-body-md text-body-md p-4 rounded-xl shadow-inner focus:outline-none focus:ring-2 focus:ring-secondary/50 placeholder:text-outline/70 resize-none transition-all leading-relaxed"
                        id="ai-prompt-input"
                        rows={4}
                        value={promptInput}
                        onChange={(e) => setPromptInput(e.target.value)}
                      />
                    </div>

                    {/* Fast Prompt Chips */}
                    <div className="mt-4 flex items-center gap-2.5 overflow-x-auto no-scrollbar py-1 scrollbar-none">
                      <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider shrink-0 whitespace-nowrap font-medium">
                        Gợi ý phong cách:
                      </span>
                      <div className="flex items-center gap-2 flex-nowrap shrink-0">
                        {STYLE_PROMPTS.map((item) => (
                          <button
                            key={item.label}
                            className="px-3 py-1 rounded-full bg-surface-container-high hover:bg-secondary-fixed hover:text-primary-fixed-variant text-primary font-label-sm text-label-sm transition-all cursor-pointer whitespace-nowrap shrink-0"
                            onClick={() => setPromptInput(item.text)}
                            type="button"
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Action Prompt Button */}
                    <div className="mt-5 flex items-center justify-end pt-4 bg-surface-container/50 -mx-6 -mb-6 p-6 rounded-b-2xl">
                      <button
                        className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-primary text-on-primary font-label-lg text-label-lg shadow-md hover:bg-secondary transition-all hover:shadow-lg active:scale-95 cursor-pointer disabled:opacity-75"
                        id="btn-re-generate"
                        disabled={isGenerating}
                        onClick={handleReGenerate}
                        type="button"
                      >
                        {isGenerating ? (
                          <>
                            <span className="material-symbols-outlined text-[18px] animate-spin">
                              progress_activity
                            </span>
                            <span>AI đang tổng hợp dữ liệu...</span>
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-[18px]">
                              auto_awesome
                            </span>
                            <span>AI Tạo Ảnh &amp; Ước Lượng Giá ✨</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Mode B: Tải lên hình ảnh mẫu bánh có sẵn */
                  <div className="bg-surface-container-low rounded-2xl p-6 shadow-sm space-y-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-full bg-primary-container text-surface flex items-center justify-center font-label-md text-label-md font-bold">
                          1
                        </span>
                        <label className="font-headline-sm text-headline-sm text-primary">
                          Tải lên hình ảnh mẫu bánh của bạn
                        </label>
                      </div>
                      <span className="font-label-sm text-label-sm px-2.5 py-1 rounded-full bg-secondary-fixed/60 text-on-secondary-container font-medium">
                        Tối đa 5 ảnh
                      </span>
                    </div>

                    {/* Drag & Drop Zone */}
                    <div
                      className="p-8 rounded-2xl bg-surface-container-lowest border-2 border-dashed border-outline/30 hover:border-secondary transition-all text-center flex flex-col items-center justify-center cursor-pointer group"
                      onClick={() =>
                        alert(
                          'Mở trình chọn ảnh từ thiết bị của bạn. (Hỗ trợ JPG, PNG, WEBP)'
                        )
                      }
                    >
                      <div className="w-14 h-14 rounded-full bg-surface-container text-secondary shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-[28px]">
                          cloud_upload
                        </span>
                      </div>
                      <div className="font-headline-sm text-headline-sm text-primary mb-1">
                        Kéo &amp; thả ảnh mẫu bánh vào đây
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mb-2">
                        hoặc{' '}
                        <span className="text-secondary font-semibold underline underline-offset-2">
                          Duyệt từ thiết bị
                        </span>{' '}
                        (Hỗ trợ JPG, PNG, WEBP tối đa 15MB)
                      </p>
                    </div>

                    {/* Uploaded Preview List */}
                    <div className="space-y-3">
                      <div className="font-label-sm text-label-sm text-on-surface-variant font-medium uppercase tracking-wider">
                        Ảnh đã đính kèm ({uploadedImages.length})
                      </div>

                      {uploadedImages.map((img) => (
                        <div
                          key={img.id}
                          className="flex items-center justify-between p-3.5 rounded-2xl bg-surface-container-lowest gap-4 shadow-sm"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <img
                              alt="Cake reference"
                              className="w-16 h-16 rounded-xl object-cover shadow-sm shrink-0"
                              src={img.url}
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-label-md text-label-md text-primary font-bold truncate">
                                  {img.name}
                                </span>
                                {img.isPrimary && (
                                  <span className="px-2 py-0.5 rounded-md bg-secondary-fixed text-on-secondary-fixed font-label-sm text-[10px] uppercase font-bold shrink-0">
                                    Ảnh chính
                                  </span>
                                )}
                              </div>
                              <p className="font-body-sm text-body-sm text-on-surface-variant">
                                {img.size} • Đã phân tích chi tiết kết cấu bánh
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high hover:text-primary transition-colors cursor-pointer"
                              title="Đổi ảnh khác"
                              type="button"
                              onClick={() =>
                                alert('Chọn ảnh mới từ thiết bị của bạn.')
                              }
                            >
                              <span className="material-symbols-outlined text-[18px]">
                                sync
                              </span>
                            </button>
                            <button
                              className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-error-container hover:text-error transition-colors cursor-pointer"
                              title="Xóa ảnh"
                              type="button"
                              onClick={() =>
                                setUploadedImages((prev) =>
                                  prev.filter((item) => item.id !== img.id)
                                )
                              }
                            >
                              <span className="material-symbols-outlined text-[18px]">
                                delete
                              </span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Technical Cake Customization Panel */}
                <div className="bg-surface-container-low rounded-2xl p-6 shadow-sm flex flex-col gap-6">
                  <div className="flex items-center justify-between pb-4 bg-secondary-fixed/35 border-b border-outline-variant/20 -mx-6 -mt-6 p-6 rounded-t-2xl shadow-2xs">
                    <div>
                      <h2 className="font-headline-sm text-[20px] text-primary font-bold flex items-center gap-2">
                        <span className="material-symbols-outlined text-secondary text-[22px]">
                          tune
                        </span>
                        Tùy Chọn Cấu Hình Bánh
                      </h2>
                    </div>
                  </div>

                  {/* A. Size / Tier Selection */}
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="font-label-lg text-label-lg text-primary flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px] text-secondary">
                          straighten
                        </span>
                        Kích thước &amp; Quy mô bánh:
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                      {SIZES.map((s) => {
                        const isSelected = selectedSizeId === s.id
                        return (
                          <button
                            key={s.id}
                            className={`p-3.5 sm:p-4 rounded-xl text-left transition-all relative overflow-hidden cursor-pointer flex flex-col justify-between ${isSelected
                                ? 'bg-primary-container text-on-primary shadow-md ring-2 ring-secondary'
                                : 'bg-surface-container-lowest hover:bg-surface-container text-primary border border-outline-variant/20'
                              }`}
                            onClick={() => setSelectedSizeId(s.id)}
                            type="button"
                          >
                            {isSelected && (
                              <div className="absolute top-1.5 right-1.5">
                                <span className="material-symbols-outlined text-[18px] text-secondary-container font-bold">
                                  check_circle
                                </span>
                              </div>
                            )}
                            <div>
                              <div className="font-label-md text-sm sm:text-base font-bold leading-snug pr-4">
                                {s.name}
                              </div>
                            </div>
                            <div
                              className={`font-label-md text-xs sm:text-sm font-bold mt-2 ${isSelected ? 'text-secondary-fixed' : 'text-secondary'
                                }`}
                            >
                              Từ {s.basePrice.toLocaleString('vi-VN')}đ
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* B. Flavors Selection */}
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="font-label-lg text-label-lg text-primary flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px] text-secondary">
                          bakery_dining
                        </span>
                        Hương vị Cốt &amp; Kem:
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                      {FLAVORS.map((flavor) => {
                        const isSelected = selectedFlavors.includes(flavor.id)
                        return (
                          <div
                            key={flavor.id}
                            className={`p-3.5 sm:p-4 rounded-xl shadow-xs flex flex-col justify-between cursor-pointer transition-all ${isSelected
                                ? 'bg-primary-container text-on-primary shadow-sm ring-2 ring-secondary'
                                : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container border border-outline-variant/20'
                              }`}
                            onClick={() => toggleFlavor(flavor.id)}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span
                                className={`w-3.5 h-3.5 rounded-full ${flavor.color} inline-block shadow-xs`}
                              ></span>
                              {isSelected && (
                                <span className="material-symbols-outlined text-[18px] text-secondary-container font-bold">
                                  done
                                </span>
                              )}
                            </div>
                            <div className="mt-1 flex flex-col justify-between flex-1">
                              <div>
                                <div className="font-label-md text-sm sm:text-base font-bold leading-tight">
                                  {flavor.name}
                                </div>
                                <div
                                  className={`font-body-sm text-xs sm:text-sm mt-1 leading-snug ${isSelected ? 'text-primary-fixed-dim' : 'text-on-surface-variant'
                                    }`}
                                >
                                  {flavor.desc}
                                </div>
                              </div>
                              <div
                                className={`font-label-md text-xs sm:text-sm font-bold mt-2.5 ${
                                  isSelected ? 'text-secondary-fixed' : 'text-secondary'
                                }`}
                              >
                                {flavor.price > 0
                                  ? `+${flavor.price.toLocaleString('vi-VN')}đ`
                                  : 'Tiêu chuẩn'}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* C. Toppings Selection */}
                  <div>
                    <span className="font-label-lg text-label-lg text-primary flex items-center gap-2 mb-2.5">
                      <span className="material-symbols-outlined text-[18px] text-secondary">
                        nutrition
                      </span>
                      Topping:
                    </span>
                    <div className="flex flex-wrap gap-2.5">
                      {TOPPINGS.map((topping) => {
                        const isSelected = selectedToppings.includes(topping)
                        return (
                          <button
                            key={topping}
                            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl font-label-md text-label-md shadow-sm transition-colors cursor-pointer ${isSelected
                                ? 'bg-primary text-on-primary'
                                : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container'
                              }`}
                            onClick={() => toggleTopping(topping)}
                            type="button"
                          >
                            <span
                              className={`material-symbols-outlined text-[16px] ${isSelected ? 'text-secondary-fixed' : 'text-outline'
                                }`}
                            >
                              {isSelected ? 'check' : 'add'}
                            </span>
                            {topping}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* D. Custom Inscription Message */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label
                        className="font-label-lg text-label-lg text-primary flex items-center gap-2"
                        htmlFor="cake-message"
                      >
                        <span className="material-symbols-outlined text-[18px] text-secondary">
                          draw
                        </span>
                        Nội Dung Viết Lên Bánh / Bảng Gỗ:
                      </label>
                      <span className="font-label-sm text-label-sm text-outline">
                        {cakeMessage.length}/35 ký tự
                      </span>
                    </div>

                    {/* Choose where to write */}
                    <div className="flex flex-wrap gap-2 mb-2.5">
                      {[
                        { id: 'cake', label: '🎂 Viết trực tiếp lên bánh' },
                        { id: 'wood_plaque', label: '🪵 Bảng gỗ nghệ thuật' },
                        { id: 'choco_plaque', label: '🍫 Phiến socola rời' },
                        { id: 'card', label: '💌 Thiệp mừng đính kèm' },
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          className={`px-3.5 py-2 rounded-xl font-label-md text-label-md text-sm transition-all cursor-pointer ${messagePlacement === opt.id
                              ? 'bg-secondary text-on-secondary font-bold shadow-xs'
                              : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container border border-outline-variant/30 font-medium'
                            }`}
                          onClick={() => setMessagePlacement(opt.id)}
                          type="button"
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>

                    <div className="relative">
                      <input
                        className="w-full bg-surface-container-lowest text-on-surface font-body-md text-body-md px-4 py-3 rounded-xl shadow-inner focus:outline-none focus:ring-2 focus:ring-secondary/50 transition-all font-semibold"
                        id="cake-message"
                        maxLength={35}
                        type="text"
                        value={cakeMessage}
                        onChange={(e) => setCakeMessage(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* E. Accessories Checklist with Explicit Prices */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-label-lg text-label-lg text-primary flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px] text-secondary">
                          celebration
                        </span>
                        Phụ Kiện Tiệc:
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {ACCESSORIES.map((item) => {
                        const isChecked = !!checkedAccessories[item.id]
                        return (
                          <label
                            key={item.id}
                            className={`flex items-center justify-between p-3 rounded-xl bg-surface-container-lowest hover:bg-surface-container cursor-pointer transition-colors shadow-xs ${!isChecked ? 'opacity-75' : ''
                              }`}
                          >
                            <div className="flex items-center gap-3">
                              <input
                                checked={isChecked}
                                onChange={() => toggleAccessory(item.id)}
                                className="w-4 h-4 rounded text-secondary accent-secondary focus:ring-0 cursor-pointer"
                                type="checkbox"
                              />
                              <div>
                                <div className="font-label-md text-label-md text-primary">
                                  {item.name}
                                </div>
                                <div className="font-label-sm text-label-sm text-outline">
                                  {item.desc}
                                </div>
                              </div>
                            </div>
                            <span
                              className={`font-label-md text-label-md font-bold ${isChecked ? 'text-secondary' : 'text-outline'
                                }`}
                            >
                              +{item.price.toLocaleString('vi-VN')}đ
                            </span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: AI Analysis, 3D Render, Estimation & RFQ Bidding Actions (5 cols) */}
              <div className="lg:col-span-5 flex flex-col gap-6 lg:sticky lg:top-24">
                {/* 1. Visual Cake Preview */}
                <div className="bg-surface-container-low rounded-2xl overflow-hidden shadow-md">
                  <div className="p-4 bg-secondary-fixed/35 border-b border-outline-variant/20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-secondary text-[20px]">
                        view_in_ar
                      </span>
                      <span className="font-label-md text-label-md text-primary font-bold">
                        {designMode === 'ai'
                          ? 'Phác Thảo Trực Quan AI'
                          : 'Ảnh Mẫu Đang Tải Lên'}
                      </span>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-secondary-fixed text-on-secondary-container font-label-md text-label-md text-sm font-semibold shadow-xs">
                      Bản xem trước
                    </span>
                  </div>

                  <div className="relative group bg-surface-container-lowest aspect-square sm:aspect-[4/3] lg:aspect-square overflow-hidden flex items-center justify-center">
                    <img
                      alt="Cake Preview"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      src={currentPreviewImage}
                    />

                    {/* Action Bar Overlay on Image */}
                    <div className="absolute bottom-4 inset-x-4 flex items-center justify-between gap-2 p-2 rounded-xl bg-surface-bright/95 backdrop-blur-md shadow-lg">
                      {designMode === 'ai' && (
                        <button
                          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary font-label-sm text-label-sm transition-all cursor-pointer"
                          onClick={handleReGenerate}
                          title="Tạo lại mẫu khác"
                          type="button"
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            sync
                          </span>
                          <span>Tạo lại ↻</span>
                        </button>
                      )}



                      <button
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-primary text-on-primary font-label-sm text-label-sm hover:bg-secondary transition-all cursor-pointer"
                        onClick={() =>
                          alert(
                            'Chế độ xoay 360° tương tác WebGL đang mở trong giao diện 3D Viewer!'
                          )
                        }
                        title="Xem xoay 360 độ"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          360
                        </span>
                        <span>Xem 360°</span>
                      </button>
                    </div>
                  </div>
                </div>

{/* 3. RFQ PARAMETERS: Budget, Delivery Time & Address (From Đặt bánh theo mẫu) */}
                <div className="bg-surface-container-low rounded-2xl p-6 shadow-sm space-y-6">
                  <div className="flex items-center justify-between pb-4 bg-secondary-fixed/35 border-b border-outline-variant/20 -mx-6 -mt-6 p-6 rounded-t-2xl shadow-2xs">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[20px] text-secondary">
                        payments
                      </span>
                      <h2 className="font-headline-sm text-[18px] sm:text-[20px] text-primary font-bold">
                        Ngân Sách &amp; Địa Điểm Nhận Bánh
                      </h2>
                    </div>
                  </div>

                  {/* Hàng chung: Ước Tính Theo Cấu Hình & Ngân Sách Bạn Mong Muốn Chi Trả */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end p-4 rounded-2xl bg-surface-container/50 border border-outline-variant/15">
                    {/* Cột 1: Ước Tính Theo Cấu Hình */}
                    <div>
                      <span className="font-label-md text-label-md text-sm text-outline uppercase tracking-wider block font-semibold">
                        Ước Tính Theo Cấu Hình
                      </span>
                      <div className="font-headline-md text-headline-md text-secondary font-bold mt-1">
                        {totalEstimatedPrice.toLocaleString('vi-VN')}đ
                      </div>
                      <span className="font-label-md text-label-md text-sm text-outline block mt-0.5">
                        Tự động tính từ kích thước, vị &amp; phụ kiện
                      </span>
                    </div>

                    {/* Cột 2: Ngân sách bạn mong muốn chi trả */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5 gap-1">
                        <label
                          className="font-label-md text-label-md text-sm text-primary font-bold block truncate"
                          htmlFor="budgetInput"
                        >
                          Ngân sách mong muốn:
                        </label>
                        <button
                          className="font-label-md text-label-md text-sm text-secondary font-semibold hover:underline flex items-center gap-0.5 cursor-pointer shrink-0"
                          onClick={handleSyncEstimatedBudget}
                          title="Lấy bằng giá ước tính"
                          type="button"
                        >
                          <span className="material-symbols-outlined text-[15px]">
                            sync_alt
                          </span>
                          Dùng giá ước tính
                        </button>
                      </div>

                      <div className="relative w-full">
                        <input
                          className="w-full pl-4 pr-14 py-2.5 rounded-xl bg-surface-container-lowest text-primary font-headline-sm text-headline-sm font-bold focus:outline-none focus:ring-2 focus:ring-secondary border border-outline-variant/20 transition-all"
                          id="budgetInput"
                          type="text"
                          value={budgetInputText}
                          onChange={handleBudgetChange}
                        />
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-label-md text-label-md font-bold text-secondary">
                          VNĐ
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">

                    {/* Presets */}
                    <div className="space-y-2">
                      <span className="font-label-md text-label-md text-sm text-on-surface-variant font-medium">
                        Mức ngân sách phổ biến:
                      </span>
                      <div className="flex flex-wrap gap-2.5">
                        {BUDGET_PRESETS.map((preset) => {
                          const isActive = budget === preset.value
                          return (
                            <button
                              key={preset.label}
                              className={`px-4 py-2 rounded-xl font-label-md text-label-md text-sm transition-all cursor-pointer ${isActive
                                  ? 'bg-primary text-surface font-semibold shadow-sm'
                                  : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container'
                                }`}
                              onClick={() => handleSelectPreset(preset)}
                              type="button"
                            >
                              {preset.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Delivery Schedule & Address */}
                  <div className="space-y-4 pt-4 border-t border-surface-container">
                    <div className="flex flex-col gap-4">
                      {/* Delivery Date with Calendar */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label
                            className="block font-label-md text-label-md text-on-surface font-semibold flex items-center gap-1.5 text-sm sm:text-base"
                            htmlFor="deliveryDateInput"
                          >
                            <span className="material-symbols-outlined text-[18px] text-secondary">
                              calendar_month
                            </span>
                            Ngày tiệc / Nhận bánh
                          </label>
                          <span className="font-label-md text-label-md text-sm text-secondary font-bold">
                            {deliveryDate}
                          </span>
                        </div>
                        <div className="relative">
                          <input
                            className="w-full pl-11 pr-4 py-3 rounded-xl bg-surface-container-lowest text-on-surface font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-secondary cursor-pointer"
                            id="deliveryDateInput"
                            type="date"
                            value={deliveryDateRaw}
                            onChange={(e) => {
                              const val = e.target.value
                              setDeliveryDateRaw(val)
                              if (val) {
                                const parts = val.split('-')
                                if (parts.length === 3) {
                                  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
                                  const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']
                                  setDeliveryDate(`${days[d.getDay()]}, ${parts[2]}/${parts[1]}/${parts[0]}`)
                                }
                              }
                            }}
                          />
                          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[20px] text-secondary pointer-events-none">
                            calendar_today
                          </span>
                        </div>

                        {/* Quick Date Presets */}
                        <div className="flex flex-wrap gap-2 mt-2.5">
                          {[
                            { label: 'Hôm nay', offset: 0 },
                            { label: 'Ngày mai', offset: 1 },
                            { label: 'Sau 2 ngày', offset: 2 },
                            { label: 'Cuối tuần này', offset: 3 },
                          ].map((item) => (
                            <button
                              key={item.label}
                              className="px-3.5 py-2 rounded-xl bg-surface-container-lowest hover:bg-surface-container text-on-surface hover:text-primary font-label-md text-label-md text-sm font-medium transition-colors cursor-pointer border border-outline-variant/20"
                              onClick={() => {
                                const target = new Date()
                                target.setDate(target.getDate() + item.offset)
                                const y = target.getFullYear()
                                const m = String(target.getMonth() + 1).padStart(2, '0')
                                const d = String(target.getDate()).padStart(2, '0')
                                setDeliveryDateRaw(`${y}-${m}-${d}`)
                                const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']
                                setDeliveryDate(`${days[target.getDay()]}, ${d}/${m}/${y}`)
                              }}
                              type="button"
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Delivery Time Slot with Custom Time Slot */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label
                            className="block font-label-md text-label-md text-on-surface font-semibold flex items-center gap-1.5 text-sm sm:text-base"
                            htmlFor="deliveryTimeSlot"
                          >
                            <span className="material-symbols-outlined text-[18px] text-secondary">
                              schedule
                            </span>
                            Khung giờ giao
                          </label>
                          <button
                            className="font-label-md text-label-md text-sm sm:text-base text-secondary hover:underline font-bold cursor-pointer"
                            onClick={() => setIsCustomTimeSlot(!isCustomTimeSlot)}
                            type="button"
                          >
                            {isCustomTimeSlot ? 'Chọn giờ có sẵn' : '+ Tự nhập khung giờ'}
                          </button>
                        </div>

                        {!isCustomTimeSlot ? (
                          <div className="relative">
                            <select
                              className="w-full pl-11 pr-8 py-3 rounded-xl bg-surface-container-lowest text-on-surface font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-secondary appearance-none cursor-pointer"
                              id="deliveryTimeSlot"
                              value={deliveryTimeSlot}
                              onChange={(e) => {
                                if (e.target.value === 'custom') {
                                  setIsCustomTimeSlot(true)
                                } else {
                                  setDeliveryTimeSlot(e.target.value)
                                }
                              }}
                            >
                              <option value="15:30 - 16:30">15:30 - 16:30</option>
                              <option value="09:00 - 11:00 (Buổi sáng)">09:00 - 11:00 (Buổi sáng)</option>
                              <option value="11:00 - 13:00 (Buổi trưa)">11:00 - 13:00 (Buổi trưa)</option>
                              <option value="14:00 - 16:00 (Trước giờ tiệc)">14:00 - 16:00 (Trước giờ tiệc)</option>
                              <option value="17:00 - 19:00 (Tiệc tối)">17:00 - 19:00 (Tiệc tối)</option>
                              <option value="custom">✏️ Tự nhập khung giờ khác...</option>
                            </select>
                            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[20px] text-secondary">
                              schedule
                            </span>
                            <span className="material-symbols-outlined absolute right-3.5 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant pointer-events-none">
                              expand_more
                            </span>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <input
                                autoFocus
                                className="w-full pl-11 pr-4 py-3 rounded-xl bg-surface-container-lowest text-on-surface font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-secondary"
                                placeholder="Ví dụ: 16:15 - 17:00 hoặc Đúng 18:30..."
                                type="text"
                                value={customTimeInput}
                                onChange={(e) => {
                                  setCustomTimeInput(e.target.value)
                                  setDeliveryTimeSlot(e.target.value)
                                }}
                              />
                              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[20px] text-secondary">
                                edit_calendar
                              </span>
                            </div>
                            <button
                              className="px-4 py-3 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md text-sm font-bold cursor-pointer"
                              onClick={() => setIsCustomTimeSlot(false)}
                              title="Quay lại danh sách giờ có sẵn"
                              type="button"
                            >
                              Hủy
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label
                        className="block font-label-md text-label-md text-on-surface font-semibold mb-2"
                        htmlFor="deliveryAddress"
                      >
                        Địa chỉ giao bánh chi tiết
                      </label>
                      <div className="relative">
                        <input
                          className="w-full pl-11 pr-4 py-3 rounded-xl bg-surface-container-lowest text-on-surface font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-secondary"
                          id="deliveryAddress"
                          placeholder="Số nhà, tên đường, phường/xã, quận/huyện..."
                          type="text"
                          value={deliveryAddress}
                          onChange={(e) => setDeliveryAddress(e.target.value)}
                        />
                        <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[20px] text-secondary">
                          location_on
                        </span>
                      </div>
                    </div>

                    {/* Customer Note Sent to Bakeries */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label
                          className="block font-label-md text-label-md text-on-surface font-semibold flex items-center gap-1.5"
                          htmlFor="customerNote"
                        >
                          <span className="material-symbols-outlined text-[18px] text-secondary">
                            edit_note
                          </span>
                          Ghi chú của khách hàng gửi đến các tiệm
                        </label>
                      </div>
                      <div className="relative">
                        <textarea
                          className="w-full pl-11 pr-4 py-3 rounded-xl bg-surface-container-lowest text-on-surface font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-secondary border border-outline-variant/20 resize-none transition-all leading-relaxed"
                          id="customerNote"
                          placeholder="Ví dụ: Giảm ngọt 30%, bé dị ứng đậu phộng, tạo hình Pikachu thật tươi vui kèm nến số 7..."
                          rows={3}
                          value={customerNote}
                          onChange={(e) => setCustomerNote(e.target.value)}
                        />
                        <span className="material-symbols-outlined absolute left-3.5 top-3.5 text-[20px] text-secondary">
                          sticky_note_2
                        </span>
                      </div>
                    </div>

                  </div>
                </div>

                {/* PRIMARY ACTION: MARKETPLACE RFQ */}
                <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-md space-y-3">
                  <div className="flex flex-col gap-3 pt-1">
                    {/* Primary CTA: RFQ Marketplace Bidding */}
                    <button
                      className="w-full py-4 px-6 rounded-2xl bg-secondary text-on-secondary font-label-lg text-label-lg font-bold shadow-lg hover:bg-secondary/90 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-75"
                      disabled={isSubmitted}
                      onClick={handleSubmitRfq}
                      type="button"
                    >
                      {isSubmitted ? (
                        <>
                          <span className="material-symbols-outlined text-[20px] animate-spin">
                            progress_activity
                          </span>
                          <span>Đang đưa yêu cầu lên Sàn Marketplace...</span>
                        </>
                      ) : (
                        <>
                          <span>Đăng Yêu Cầu Lên Sàn - Nhận Báo Giá Từ Các Tiệm</span>
                          <span className="material-symbols-outlined text-[20px]">
                            arrow_forward
                          </span>
                        </>
                      )}
                    </button>

                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AiCakeStudioPage
