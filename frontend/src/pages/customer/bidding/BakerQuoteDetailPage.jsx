import { DEFAULT_BAKER_CHAT_MESSAGES } from '../../../mockData/shared/conversations.js'
import { useState } from 'react'

export const BakerQuoteDetailPage = ({ onAddToCart, onNavigate }) => {
  const [isEscrowModalOpen, setIsEscrowModalOpen] = useState(false)
  const [isProcessingEscrow, setIsProcessingEscrow] = useState(false)
  const [escrowSuccess, setEscrowSuccess] = useState(false)

  const [isChatOpen, setIsChatOpen] = useState(false)
  const [chatMessage, setChatMessage] = useState('')
  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'chef',
      text: 'Chào bạn Hân Mai, mình là Chef Jean-Luc phụ trách tiệm La Crème Pâtisserie. Mình đã nghiên cứu bản phác thảo bánh Pikachu 2 tầng của bạn và đã lên sẵn cốt bánh chiffon ít ngọt. Bạn có cần điều chỉnh màu sắc hay thêm chi tiết nào không?',
      time: '10:05',
    },
  ])

  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false)
  const [adjustNote, setAdjustNote] = useState('')
  const [adjustSuccess, setAdjustSuccess] = useState(false)
  const [copiedShare, setCopiedShare] = useState(false)

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href)
    setCopiedShare(true)
    setTimeout(() => setCopiedShare(false), 2500)
  }

  const handleSendChat = (e) => {
    e.preventDefault()
    if (!chatMessage.trim()) return
    const userMsg = {
      sender: 'user',
      text: chatMessage,
      time: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    }
    setChatMessages((prev) => [...prev, userMsg])
    setChatMessage('')

    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'chef',
          text: 'Dạ vâng chị Hân, xưởng em sẽ chú ý làm tai Pikachu dài dựng đứng và nến số 7 mạ vàng đính kèm riêng để chị cắm lúc khai tiệc nhé!',
          time: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
        },
      ])
    }, 1200)
  }

  const handleProceedEscrow = () => {
    setIsProcessingEscrow(true)
    setTimeout(() => {
      setIsProcessingEscrow(false)
      setEscrowSuccess(true)

      if (onAddToCart) {
        onAddToCart({
          id: 'quote-lacreme-8892',
          title: 'Bánh Pikachu 3D (Sweet Bakery - Chef Minh Vũ)',
          price: 950000,
          selectedSize: '2 Tầng (20cm + 14cm)',
          cakeMessage: 'Happy 7th Birthday Minh Khang!',
        })
      }

      setTimeout(() => {
        setIsEscrowModalOpen(false)
        setEscrowSuccess(false)
        if (onNavigate) {
          onNavigate('payment')
        }
        window.history.pushState(null, '', '/payment')
      }, 500)
    }, 600)
  }

  const handleSendAdjustRequest = (e) => {
    e.preventDefault()
    if (!adjustNote.trim()) return
    setAdjustSuccess(true)
    setTimeout(() => {
      setAdjustSuccess(false)
      setIsAdjustModalOpen(false)
      setAdjustNote('')
    }, 2000)
  }

  return (
    <div className="w-full bg-surface flex-1 min-h-screen">
      <div className="flex flex-col w-full">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 py-8 w-full">
          {/* Top Context & Action Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6">
            <div className="flex items-center gap-3">
              <button
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-surface-container hover:bg-surface-container-high text-primary font-label-md text-label-md transition-all cursor-pointer font-medium"
                onClick={() => onNavigate && onNavigate('bidding')}
                type="button"
              >
                <span className="material-symbols-outlined text-base leading-none">
                  arrow_back
                </span>
                Quay lại so sánh báo giá
              </button>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-md text-label-md font-semibold">
                <span className="w-2 h-2 rounded-full bg-secondary animate-ping"></span>
                Báo giá còn hiệu lực • Hết hạn sau 18h 30m
              </span>
            </div>

            <div className="flex items-center gap-2">

            </div>
          </div>

          {/* Baker Credibility & Shop Header Card */}
          <div className="bg-surface-container-lowest rounded-2xl p-6 lg:p-8 shadow-[0_8px_30px_rgba(45,30,24,0.04)] mb-8 border border-outline-variant/30">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              {/* Left: Shop & Chef Branding */}
              <div className="flex items-start gap-5">
                <div className="relative shrink-0">
                  <img
                    alt="Sweet Bakery Parisian boutique storefront"
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover shadow-[0_4px_16px_rgba(45,30,24,0.08)]"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDkTzEb09KzuQ0fli-TRx6Nuibo16u2NDsZiZzg2WIngfpUlVMdcXFB6oenEeBDj6RiOK6zZQY1L4y5AFY22eLDq7WPojP9p8GbZKnEbpyLqSb0rc4tEVoIZWkBo5Y6NVRla4192lkMNQqbpXRMxFL2hTPhGTUudFdRP513AsilpR6HTNhfb-OxjO_zzhLH0zEbEjaigGU1HTw07GEa4qIJa__RxMop5Z-KTPM5qUOn6Z1_S8GyUprJ"
                  />
                  <div className="absolute -bottom-1 -right-1 bg-secondary text-surface w-6 h-6 rounded-full flex items-center justify-center text-xs shadow-sm">
                    <span className="material-symbols-outlined text-xs">
                      storefront
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <h1 className="font-headline-md text-headline-md text-primary tracking-tight">
                      Sweet Bakery
                    </h1>
                    <p className="font-body-sm text-body-sm text-on-surface-variant font-medium">
                      Xưởng Bánh Nghệ Thuật &amp; Fondant 3D
                    </p>
                  </div>


                </div>
              </div>

              {/* Right: Baker In-Charge & Quick Chat */}
              <div className="w-full lg:w-auto flex flex-row sm:flex-col lg:items-end justify-between items-center gap-3 bg-surface-container-low/70 lg:bg-transparent p-4 lg:p-0 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="text-left lg:text-right">
                    <span className="block font-label-sm text-label-sm uppercase tracking-wider text-secondary font-bold">
                      Pastry Chef phụ trách
                    </span>
                    <span className="font-headline-sm text-base text-primary block font-semibold">
                      Chef Minh Vũ
                    </span>
                    <span className="font-body-sm text-body-sm text-outline">
                      8 năm Haute Pâtisserie
                    </span>
                  </div>
                  <img
                    alt="Chef Minh Vu portrait"
                    className="w-12 h-12 rounded-full object-cover shadow-[0_2px_8px_rgba(45,30,24,0.06)] ring-2 ring-secondary/30"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCI9oyXSizIxcI3odx7CWVMnFvBvRnA_iWlnLGJz8SDaAz850bJOLVNRfxkudrHCxFzw_8VKg_XZl6n2S6afX7ZCws-t8mFqXMFu62C1Ua4sGFrEB2jXk5wW6GyUUrFUzd8bq_zHdNnPcn0HeFXiudXtexoG36iiPj_010HDR8ZwiQ-11KwEWQJYSGiQWWwGeSXJ8-4Q0yiLar2PUdIpKL_ffx8KaPu-Zme5CYFjYgibB54AEll9ul7"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-secondary-fixed text-on-secondary-fixed hover:bg-secondary hover:text-surface font-label-md text-label-md font-semibold transition-colors cursor-pointer shadow-sm"
                    onClick={() => setIsChatOpen(true)}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-base">
                      chat
                    </span>
                    Nhắn tin với Chef
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Technical Proposal & Visual Proofs (7 cols) */}
            <div className="lg:col-span-7 space-y-8">
              {/* Visual Comparison: AI Model vs Workshop Portfolio */}
              <div className="bg-surface-container-lowest rounded-2xl p-6 lg:p-8 shadow-[0_8px_30px_rgba(45,30,24,0.04)] space-y-6 border border-outline-variant/30">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary font-bold">
                      Phương án trực quan
                    </span>
                    <h2 className="font-headline-sm text-headline-sm text-primary">
                      Đối chiếu thiết kế &amp; Thực tế thi công
                    </h2>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm font-semibold">
                    Độ chính xác cam kết 96%
                  </span>
                </div>

                {/* Comparative Stage */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Customer AI Request */}
                  <div className="bg-surface-container-low rounded-xl p-4 flex flex-col space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 font-label-md text-label-md text-secondary font-bold">
                        <span className="material-symbols-outlined text-sm">
                          auto_awesome
                        </span>{' '}
                        Mẫu AI bạn đã yêu cầu
                      </span>
                      <span className="font-label-sm text-label-sm text-outline font-mono">
                        #RFQ-2025-8892
                      </span>
                    </div>
                    <div className="relative overflow-hidden rounded-lg aspect-[4/3] bg-surface-container group">
                      <img
                        alt="Playful two tier custom birthday cake AI"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuCO6Y8lPvDYQcuBYgJbUi3QySd8A3ccGgr8gYGuTlGeKw_8gkXm3EKboxnBzMH6uIT0JkraAOyvDAUQ8sPJlYkZ_KWh9Q0Xm6uEpe783US56iRi6mpezydlsmjU8TRNRR1PzGsX_HRikWuL6nE9J9Enhw2ToKo_F7U_vPn8oJXMKioGTd9YARTfV9ZmbmisVy1ACiJvPv1WdFEM-1OKrpxQeA3bZUeoKJzPEThlFobfjuJDQzgTJMHv"
                      />
                      <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-md bg-primary/80 backdrop-blur text-surface font-label-sm text-label-sm font-medium">
                        Phác thảo AI gốc
                      </div>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Bánh kem Pikachu 2 tầng sắc thái vàng bơ và kem sữa thanh lịch cho bé Minh Khang.
                    </p>
                  </div>

                  {/* Workshop 3D Construction Plan */}
                  <div className="bg-secondary-fixed/30 rounded-xl p-4 flex flex-col space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 font-label-md text-label-md text-primary font-bold">
                        <span className="material-symbols-outlined text-sm text-secondary">
                          architecture
                        </span>{' '}
                        Phác thảo thi công từ tiệm
                      </span>
                      <span className="font-label-sm text-label-sm text-secondary font-semibold">
                        Tỉ lệ 1:1
                      </span>
                    </div>
                    <div className="relative overflow-hidden rounded-lg aspect-[4/3] bg-surface-container group">
                      <img
                        alt="Sweet bakery workshop 3D plan"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuBz1iW3dGMhv7vwFyUjImCZQiwAicZ9NTPRmlOC3cvDsuQ8-vJSCVLsQUcrWI5uZZl2FOK7J6-KjWZH8LbCGT9f7iI7wu70MD8DKN6aRm_t46R4DBTylCcLyKIxtkNB44jsQBHqJ1NKSd3Dl4_35xgVrnxtgN0TXHWYipcLXA6FXegbv7VA-z5fVMi_8g_ef3DFfOgn1iObPM_N4w82T8h-p2dA2JhIO_tg1O1F3GKSHjUbl784iYq1"
                      />
                      <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-md bg-secondary text-surface font-label-sm text-label-sm font-semibold">
                        Bản dựng xưởng Sweet Bakery
                      </div>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Bổ sung trụ đỡ an toàn thực phẩm, định lượng bơ kem chống chảy chuẩn tiệc 3 tiếng.
                    </p>
                  </div>
                </div>

                {/* Real Works by this shop */}
                <div className="space-y-3 pt-2">
                  <span className="font-label-md text-label-md text-primary font-bold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-secondary text-base">
                      photo_library
                    </span>
                    Sản phẩm 3D / Fondant tương tự tiệm từng thực hiện gần đây
                  </span>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="group relative rounded-xl overflow-hidden aspect-square bg-surface-container-high shadow-sm cursor-pointer">
                      <img
                        alt="Cake 1"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuDKDb3oYQNxybrSUkMXkgogzAgrJam-Bkt_zRDFaHyzJd7H858SUdul6WsSTatwiahG-AwWImb7zsKL0wTUBhhcWk_5gidtFz-MKXqbbES-6sHew8mISbXADdYkyNDd7jW3HNR3B00OmSXahVWuI0JP2Qo0SXi8vKuY_SNSX_viZMs5h4IALcF4by-wMeTHMMKrxRRsql3Ao1DGC-hi-QJYo1FJGAJEhlrvmc6twk_Em2e7KRecQdG7"
                      />
                      <div className="absolute inset-0 bg-primary/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-surface font-label-sm text-label-sm font-semibold">
                        Đơn tháng 9
                      </div>
                    </div>

                    <div className="group relative rounded-xl overflow-hidden aspect-square bg-surface-container-high shadow-sm cursor-pointer">
                      <img
                        alt="Cake 2"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuBCE1WrnvXAKKQv8N3WUjZc_ID0zMgGI1OCcUuTZ_PCMfYBUwYEdd_2u6V01sa2j623Q5GLRunXeoNt5kebIN8yYhLDl9ZwdMVeeDFK9tHOHxkkyPv4F4DM2Y1gZaZwZotMkoLAPuQEyfl4nw_vff5sjGEb1bIOJqetb2nxkf4nm0VKlQVJLTzjUZ2Pofj9MilCwfeJEiWJRlqHFgYEkp0h8y_PWdjdsO-vBi7OrtzkGQ069ajD6RJt"
                      />
                      <div className="absolute inset-0 bg-primary/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-surface font-label-sm text-label-sm font-semibold">
                        Đơn tháng 10
                      </div>
                    </div>

                    <div className="group relative rounded-xl overflow-hidden aspect-square bg-surface-container-high shadow-sm cursor-pointer">
                      <img
                        alt="Cake 3"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuCJg1MtLulzRtvSodXHeRZ4FBIbkzA1S9GM988R1hsSpVx95Vni1fMmP-Jwfk6pFM4OB3X-iaxmTttVQIWEpnKlwXT2KIjn7r5cuI0h1M2lPeJT8vYLj-Ve0XmzH5xhP3mZEIRa-DxdQEdCL1UoNfYqAcX3dRjdW5tbT2Ey1s4TZY8Me9_6NZU7O7mJ9KeFkWbXy5NIpdnWbnL1lyADMUVeD4VbL4VD8haHVve0JFfxDMpxqQGFm9qJ"
                      />
                      <div className="absolute inset-0 bg-primary/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-surface font-label-sm text-label-sm font-semibold">
                        Đơn tiệc sự kiện
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Baker's Technical Specification Table */}
              <div className="bg-surface-container-lowest rounded-2xl p-6 lg:p-8 shadow-[0_8px_30px_rgba(45,30,24,0.04)] space-y-6 border border-outline-variant/30">
                <div>
                  <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary font-bold">
                    Quy chuẩn tay nghề
                  </span>
                  <h2 className="font-headline-sm text-headline-sm text-primary">
                    Bảng thông số kỹ thuật đề xuất
                  </h2>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-surface-container-low/70 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-secondary-fixed flex items-center justify-center text-secondary shrink-0">
                      <span className="material-symbols-outlined text-lg">
                        cake
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-label-lg text-label-lg text-primary font-bold">
                          Cốt bánh (Cake Base)
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-full bg-surface-container-highest text-secondary font-label-sm text-label-sm font-semibold">
                          Healthy • Giảm 35% ngọt
                        </span>
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                        Chiffon vani dâu tây hữu cơ Đà Lạt ít ngọt, mềm ẩm tơi xốp, nướng tươi lúc 06:00 sáng trong ngày giao để đạt hương vị tươi nguyên nhất.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-surface-container-low/70 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-secondary-fixed flex items-center justify-center text-secondary shrink-0">
                      <span className="material-symbols-outlined text-lg">
                        icecream
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-label-lg text-label-lg text-primary font-bold">
                          Lớp phủ &amp; Kem lót (Cream &amp; Frosting)
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-full bg-surface-container-highest text-secondary font-label-sm text-label-sm font-semibold">
                          100% Animal Fat Dairy
                        </span>
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                        Whipping cream Anchor New Zealand đánh bông tươi thanh mát, phối cùng mascarpone tươi tạo độ đứng form chuẩn ngoài phòng máy lạnh mà không gắt dầu.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-surface-container-low/70 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-secondary-fixed flex items-center justify-center text-secondary shrink-0">
                      <span className="material-symbols-outlined text-lg">
                        brush
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-label-lg text-label-lg text-primary font-bold">
                          Tạo hình nghệ thuật 3D
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold">
                          Marshmallow Fondant
                        </span>
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                        Pikachu 3D fondant dẻo kẹo marshmallow cao cấp ăn được thơm ngon; chi tiết tai vểnh và đuôi sấm sét gia cố bằng khung socola Bỉ nguyên chất (an toàn cho trẻ nhỏ).
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-surface-container-low/70 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-secondary-fixed flex items-center justify-center text-secondary shrink-0">
                      <span className="material-symbols-outlined text-lg">
                        straighten
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-label-lg text-label-lg text-primary font-bold">
                          Kích thước &amp; Khẩu phần
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-full bg-surface-container-highest text-primary font-label-sm text-label-sm font-semibold">
                          15 - 20 Khách mời
                        </span>
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                        2 Tầng hoành tráng: Tầng 1 (Đường kính 20cm × Cao 12cm) + Tầng 2 (Đường kính 14cm × Cao 12cm). Tổng chiều cao hoàn thiện kèm Pikachu ~28cm.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-surface-container-low/70 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-secondary-fixed flex items-center justify-center text-secondary shrink-0">
                      <span className="material-symbols-outlined text-lg">
                        edit_note
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-label-lg text-label-lg text-primary font-bold">
                          Thông điệp thiệp &amp; Viết chữ
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-full bg-surface-container-highest text-secondary font-label-sm text-label-sm font-semibold">
                          Calligraphy thủ công
                        </span>
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                        Khắc chữ nổi socola trắng nghệ thuật:{' '}
                        <strong className="text-primary font-semibold">
                          "Happy 7th Birthday Minh Khang!"
                        </strong>{' '}
                        gắn chân đế tầng 1.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Personal Message from Baker */}
              <div className="relative overflow-hidden bg-primary-container text-on-primary-fixed rounded-2xl p-6 lg:p-8 shadow-[0_12px_32px_rgba(45,30,24,0.12)]">
                <div className="flex items-start gap-4">
                  <span className="material-symbols-outlined text-3xl text-secondary-fixed shrink-0">
                    format_quote
                  </span>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-headline-sm text-base text-surface font-semibold">
                        Thư ngỏ từ Trưởng bếp Chef Minh Vũ
                      </span>
                      <span className="px-2 py-0.5 rounded bg-surface/10 text-secondary-fixed font-label-sm text-label-sm">
                        Gửi riêng bạn Hân Mai
                      </span>
                    </div>
                    <p className="font-body-md text-body-md text-inverse-on-surface leading-relaxed italic">
                      "Chào bạn Hân Mai, xưởng La Crème Pâtisserie rất hào hứng với mẫu bánh Pikachu 2 tầng cho tiệc tròn 7 tuổi của bé Minh Khang! Chúng tôi cam kết tạo hình chuẩn 96% so với bản phác thảo. Kem sẽ được điều chỉnh độ ngọt thanh mát phù hợp khẩu vị trẻ em, dâu tây tươi chọn lọc loại 1 chuyển trực tiếp từ nông trại Đà Lạt. Trước khi đóng hộp gửi xe lạnh, xưởng sẽ gửi ảnh chụp 360 độ cho bạn duyệt trước 1 tiếng."
                    </p>
                  </div>
                </div>
              </div>


            </div>

            {/* Right Column: Price Breakdown, Timeline & Escrow CTA (5 cols) */}
            <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-28">
              {/* Price Breakdown Card */}
              <div className="bg-surface-container-lowest rounded-2xl p-6 lg:p-8 shadow-[0_12px_36px_rgba(45,30,24,0.06)] space-y-6 border border-outline-variant/30">
                {/* Price Header */}
                <div className="flex items-end justify-between pb-4 border-b border-outline-variant/30">
                  <div>
                    <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-bold">
                      Tổng chi phí báo giá
                    </span>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="font-display-lg text-3xl sm:text-4xl text-primary font-bold">
                        950.000
                      </span>
                      <span className="font-headline-sm text-lg text-primary font-semibold">
                        VNĐ
                      </span>
                    </div>
                  </div>

                </div>

                {/* Detailed Itemized List */}
                <div className="space-y-3 pt-2 font-body-sm text-body-sm">
                  <div className="flex items-center justify-between text-on-surface">
                    <span className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                      Cốt bánh chiffon 2 tầng &amp; Whipping cream Anchor
                    </span>
                    <span className="font-semibold font-mono">480.000đ</span>
                  </div>

                  <div className="flex items-center justify-between text-on-surface">
                    <span className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                      Điêu khắc tạo hình Pikachu 3D Fondant thủ công
                    </span>
                    <span className="font-semibold font-mono">350.000đ</span>
                  </div>

                  <div className="flex items-center justify-between text-on-surface">
                    <span className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                      Hộp mica trong suốt chống sốc &amp; phụ kiện Haute
                    </span>
                    <span className="font-semibold font-mono">120.000đ</span>
                  </div>

                  <div className="flex items-center justify-between text-secondary">
                    <span className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">
                        celebration
                      </span>
                      Ưu đãi sinh nhật bé từ tiệm Sweet Bakery
                    </span>
                    <span className="font-semibold font-mono">-50.000đ</span>
                  </div>

                  <div className="flex items-center justify-between text-secondary font-semibold pt-2 border-t border-outline-variant/20">
                    <span className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">
                        ac_unit
                      </span>
                      Giao hàng xe lạnh chuyên dụng 4°C - 6°C
                    </span>
                    <span className="px-2 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm uppercase font-bold">
                      MIỄN PHÍ
                    </span>
                  </div>
                </div>

                {/* Timeline Commitments */}
                <div className="bg-surface-container-low rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 font-label-md text-label-md text-primary font-bold">
                    <span className="material-symbols-outlined text-secondary text-base">
                      timer
                    </span>
                    Tiến độ &amp; Mốc thời gian cam kết
                  </div>
                  <div className="grid grid-cols-2 gap-3 font-body-sm text-body-sm">
                    <div className="bg-surface-container-lowest p-2.5 rounded-lg border border-outline-variant/20">
                      <span className="text-outline font-label-sm text-label-sm block">
                        Thời gian chế tác
                      </span>
                      <strong className="text-primary font-semibold">
                        2 ngày
                      </strong>
                    </div>
                    <div className="bg-surface-container-lowest p-2.5 rounded-lg border border-outline-variant/20">
                      <span className="text-outline font-label-sm text-label-sm block">
                        Hoàn thiện bánh
                      </span>
                      <strong className="text-primary font-semibold">
                        12:30 • 25/10/2025
                      </strong>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-secondary-fixed/40 flex items-center justify-between">
                    <div>
                      <span className="font-label-sm text-label-sm text-secondary font-bold block">
                        Giao xe lạnh đến địa chỉ
                      </span>
                      <span className="font-body-sm text-body-sm text-on-secondary-fixed font-semibold">
                        14:00 - 15:00 ngày 25/10/2025
                      </span>
                    </div>
                    <span className="px-2 py-1 rounded bg-secondary text-surface font-label-sm text-label-sm font-semibold">
                      Sớm 2 tiếng
                    </span>
                  </div>
                </div>

                {/* What's Included (Gói quà tặng kèm) */}
                <div className="space-y-2.5">
                  <span className="font-label-md text-label-md text-primary font-bold block">
                    Gói phụ kiện Haute Pâtisserie đi kèm:
                  </span>
                  <div className="grid grid-cols-1 gap-2 font-body-sm text-body-sm text-on-surface-variant">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-secondary text-base">
                        check_circle
                      </span>
                      <span>Nến số 7 mạ vàng hoàng gia cao cấp</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-secondary text-base">
                        check_circle
                      </span>
                      <span>
                        Bộ 10 set đĩa thìa dĩa sinh học mộc sang trọng
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-secondary text-base">
                        check_circle
                      </span>
                      <span>Dao cắt bánh răng cưa lưỡi dài chuyên dụng</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-secondary text-base">
                        check_circle
                      </span>
                      <span>Hộp mica trong suốt chuẩn Haute thắt nơ lụa</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-secondary text-base">
                        check_circle
                      </span>
                      <span>
                        Thiệp chúc mừng thiết kế riêng viết tay lời chúc
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-secondary text-base">
                        check_circle
                      </span>
                      <span>Pháo sáng sinh nhật mini an toàn cho trẻ em</span>
                    </div>
                  </div>
                </div>



                {/* Primary Actions */}
                <div className="space-y-3 pt-2">
                  <button
                    className="w-full py-4 px-6 rounded-xl bg-primary hover:bg-secondary text-on-primary font-label-lg text-label-lg font-bold shadow-[0_8px_20px_rgba(20,8,4,0.18)] transition-all flex items-center justify-center gap-2 group cursor-pointer"
                    onClick={() => setIsEscrowModalOpen(true)}
                    type="button"
                  >
                    <span>
                      Chấp Nhận Báo Giá &amp; Đặt Cọc Escrow (950.000đ)
                    </span>
                    <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">
                      arrow_forward
                    </span>
                  </button>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      className="w-full py-2.5 px-3 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary font-label-md text-label-md font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      onClick={() => setIsChatOpen(true)}
                      type="button"
                    >
                      <span className="material-symbols-outlined text-base">
                        forum
                      </span>
                      Trao đổi thêm
                    </button>
                    <button
                      className="w-full py-2.5 px-3 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary font-label-md text-label-md font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      onClick={() => setIsAdjustModalOpen(true)}
                      type="button"
                    >
                      <span className="material-symbols-outlined text-base">
                        tune
                      </span>
                      Yêu cầu điều chỉnh
                    </button>
                  </div>
                </div>
              </div>


            </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: Escrow Deposit Confirmation */}
      {isEscrowModalOpen && (
        <div className="fixed inset-0 z-50 bg-primary/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-surface rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-[0_24px_48px_rgba(45,30,24,0.2)] border border-outline-variant/30 relative">
            <button
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant cursor-pointer transition-colors"
              onClick={() => setIsEscrowModalOpen(false)}
              type="button"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>

            <div className="w-14 h-14 rounded-2xl bg-secondary-fixed flex items-center justify-center text-secondary mx-auto shadow-sm">
              <span className="material-symbols-outlined text-3xl">lock</span>
            </div>

            <div className="text-center space-y-2">
              <h3 className="font-headline-sm text-headline-sm text-primary font-semibold">
                Xác nhận Đặt cọc Escrow
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                Bạn đang chuyển số tiền{' '}
                <strong className="text-primary font-bold">950.000 VNĐ</strong>{' '}
                vào tài khoản Ký quỹ Trung lập Sweet Cake để bắt đầu làm bánh
                cho bé Minh Khang.
              </p>
            </div>

            <div className="bg-surface-container-low p-4 rounded-xl space-y-2 font-body-sm text-body-sm">
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Tiệm tiếp nhận:</span>
                <span className="font-semibold text-primary">Sweet Bakery</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">
                  Thời gian nhận bánh:
                </span>
                <span className="font-semibold text-primary">
                  14:00 25/10/2025
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">
                  Chính sách bảo hiểm:
                </span>
                <span className="font-semibold text-secondary">
                  Hoàn tiền 100%
                </span>
              </div>
            </div>

            {escrowSuccess ? (
              <div className="p-4 rounded-xl bg-green-50 text-green-800 text-center font-medium text-sm flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-green-600">
                  check_circle
                </span>
                <span>
                  Khởi tạo hợp đồng Ký quỹ Escrow thành công! Đang chuyển trang...
                </span>
              </div>
            ) : (
              <div className="flex gap-3 pt-2">
                <button
                  className="flex-1 py-3 rounded-xl bg-surface-container hover:bg-surface-container-high text-primary font-label-md text-label-md font-semibold transition-colors cursor-pointer"
                  onClick={() => setIsEscrowModalOpen(false)}
                  type="button"
                >
                  Xem lại
                </button>
                <button
                  className="flex-1 py-3 rounded-xl bg-primary hover:bg-secondary text-on-primary font-label-md text-label-md font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  disabled={isProcessingEscrow}
                  onClick={handleProceedEscrow}
                  type="button"
                >
                  {isProcessingEscrow ? (
                    <>
                      <span className="material-symbols-outlined text-base animate-spin">
                        sync
                      </span>
                      <span>Đang kết nối Escrow...</span>
                    </>
                  ) : (
                    <span>Thanh toán an toàn</span>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: Chat Directly with Pastry Chef Minh Vu */}
      {isChatOpen && (
        <div className="fixed inset-0 z-50 bg-primary/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-surface rounded-3xl max-w-lg w-full h-[540px] flex flex-col shadow-2xl border border-outline-variant/30 overflow-hidden">
            {/* Header */}
            <div className="p-4 bg-surface-container-low flex items-center justify-between border-b border-outline-variant/20">
              <div className="flex items-center gap-3">
                <img
                  alt="Chef Minh Vu"
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-secondary/30"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCI9oyXSizIxcI3odx7CWVMnFvBvRnA_iWlnLGJz8SDaAz850bJOLVNRfxkudrHCxFzw_8VKg_XZl6n2S6afX7ZCws-t8mFqXMFu62C1Ua4sGFrEB2jXk5wW6GyUUrFUzd8bq_zHdNnPcn0HeFXiudXtexoG36iiPj_010HDR8ZwiQ-11KwEWQJYSGiQWWwGeSXJ8-4Q0yiLar2PUdIpKL_ffx8KaPu-Zme5CYFjYgibB54AEll9ul7"
                />
                <div>
                  <h4 className="font-label-md text-primary font-bold text-base flex items-center gap-1">
                    Chef Minh Vũ
                    <span className="material-symbols-outlined text-secondary text-sm">
                      verified
                    </span>
                  </h4>
                  <p className="text-xs text-secondary flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
                    Sweet Bakery • Trực tuyến
                  </p>
                </div>
              </div>
              <button
                className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant cursor-pointer transition-colors"
                onClick={() => setIsChatOpen(false)}
                type="button"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-surface-container-lowest">
              <div className="text-center">
                <span className="px-3 py-1 rounded-full bg-surface-container text-outline font-label-sm text-[11px]">
                  Bắt đầu hội thoại tư vấn bánh #RFQ-2025-8892
                </span>
              </div>
              {chatMessages.map((msg, idx) => {
                const isChef = msg.sender === 'chef'
                return (
                  <div
                    key={idx}
                    className={`flex flex-col ${isChef ? 'items-start' : 'items-end'
                      }`}
                  >
                    <div
                      className={`max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed ${isChef
                          ? 'bg-surface-container-high text-primary rounded-bl-none'
                          : 'bg-primary text-on-primary rounded-br-none'
                        }`}
                    >
                      {msg.text}
                    </div>
                    <span className="text-[10px] text-outline mt-1 px-1">
                      {msg.time}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Input */}
            <form
              className="p-3 bg-surface-container-low border-t border-outline-variant/20 flex items-center gap-2"
              onSubmit={handleSendChat}
            >
              <input
                className="flex-1 px-4 py-2.5 rounded-full bg-surface-container-lowest text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-1 focus:ring-secondary"
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Nhắn tin với Chef Minh Vũ..."
                type="text"
                value={chatMessage}
              />
              <button
                className="w-10 h-10 rounded-full bg-primary hover:bg-secondary text-on-primary flex items-center justify-center transition-colors cursor-pointer shrink-0"
                type="submit"
              >
                <span className="material-symbols-outlined text-sm">send</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Yêu Cầu Điều Chỉnh Báo Giá */}
      {isAdjustModalOpen && (
        <div className="fixed inset-0 z-50 bg-primary/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-surface rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-outline-variant/30 relative">
            <button
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant cursor-pointer transition-colors"
              onClick={() => setIsAdjustModalOpen(false)}
              type="button"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>

            <div>
              <span className="font-label-md uppercase tracking-wider text-secondary font-bold text-xs sm:text-sm">
                Yêu Cầu Tinh Chỉnh
              </span>
              <h3 className="font-headline-sm text-primary text-xl sm:text-2xl font-bold mt-1.5 leading-snug">
                Điều chỉnh thông số với Sweet Bakery
              </h3>
              <p className="text-sm sm:text-base text-on-surface-variant font-medium mt-1">
                Gửi phản hồi để tiệm cập nhật lại giá hoặc phụ kiện kèm theo.
              </p>
            </div>

            <form className="space-y-4" onSubmit={handleSendAdjustRequest}>
              <textarea
                className="w-full p-4 rounded-2xl bg-surface-container-low text-base text-on-surface placeholder:text-outline/70 focus:outline-none focus:ring-2 focus:ring-secondary resize-none h-36 font-medium leading-relaxed"
                onChange={(e) => setAdjustNote(e.target.value)}
                placeholder="Ví dụ: Giảm bớt kích thước xuống 1 tầng để hạ ngân sách, hoặc đổi vị sang matcha socola..."
                required
                value={adjustNote}
              ></textarea>

              {adjustSuccess ? (
                <div className="p-4 bg-green-50 text-green-900 border border-green-200 rounded-2xl text-sm sm:text-base font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-xl text-green-700">
                    check_circle
                  </span>
                  Đã gửi yêu cầu điều chỉnh tới Sweet Bakery!
                </div>
              ) : (
                <div className="flex gap-3 pt-2">
                  <button
                    className="flex-1 py-3 rounded-2xl bg-surface-container hover:bg-surface-container-high text-primary font-label-md text-base font-bold transition-colors cursor-pointer"
                    onClick={() => setIsAdjustModalOpen(false)}
                    type="button"
                  >
                    Đóng
                  </button>
                  <button
                    className="flex-1 py-3 rounded-2xl bg-primary hover:bg-secondary text-on-primary font-label-md text-base font-bold transition-all shadow-md cursor-pointer"
                    type="submit"
                  >
                    Gửi đề xuất
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default BakerQuoteDetailPage
