import React, { useState, useEffect } from 'react'

/**
 * SweetCake Official Legal & Platform Policy Modal Component
 * Covers:
 * 1. Terms of Service (Điều khoản dịch vụ)
 * 2. Privacy Policy (Chính sách bảo mật)
 * 3. E-Commerce Platform Regulations (Quy chế hoạt động sàn TMĐT)
 */
export default function PolicyModal({
  isOpen = false,
  initialTab = 'terms', // 'terms' | 'privacy' | 'regulations'
  onClose,
}) {
  const [activeTab, setActiveTab] = useState(initialTab)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    setActiveTab(initialTab)
  }, [initialTab, isOpen])

  if (!isOpen) return null

  const tabs = [
    {
      id: 'terms',
      title: 'Điều Khoản Dịch Vụ',
      shortTitle: 'Điều khoản',
      icon: 'gavel',
      subtitle: 'Quy định sử dụng tài khoản, đặt bánh & thanh toán Escrow',
    },
    {
      id: 'privacy',
      title: 'Chính Sách Bảo Mật',
      shortTitle: 'Bảo mật',
      icon: 'shield_lock',
      subtitle: 'Bảo vệ dữ liệu cá nhân theo NĐ 13/2023/NĐ-CP',
    },
    {
      id: 'regulations',
      title: 'Quy Chế Sàn TMĐT',
      shortTitle: 'Quy chế sàn',
      icon: 'verified_user',
      subtitle: 'Quy chế hoạt động sàn TMĐT theo NĐ 52/2013 & NĐ 85/2021',
    },
  ]

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 lg:p-8 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-primary/60 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-5xl h-[90vh] bg-surface-container-lowest rounded-3xl shadow-2xl border border-outline-variant/30 flex flex-col overflow-hidden z-10 font-body">
        {/* Header Bar */}
        <div className="px-6 py-5 bg-surface-container-low border-b border-outline-variant/30 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-secondary/15 text-secondary flex items-center justify-center font-bold shrink-0">
              <span className="material-symbols-outlined text-2xl">policy</span>
            </div>
            <div>
              <h2 className="font-headline-sm text-lg sm:text-xl font-bold text-primary flex items-center gap-2">
                Trung Tâm Pháp Lý &amp; Quy Chế SweetCake
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed">
                  Chính thức 2026
                </span>
              </h2>
              <p className="text-xs text-on-surface-variant font-medium">
                Cập nhật lần cuối: 15/01/2026 • Tuân thủ pháp luật Thương mại điện tử Việt Nam
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-primary flex items-center justify-center transition-colors cursor-pointer shrink-0"
            title="Đóng"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Tab Navigation & Search Bar */}
        <div className="px-6 py-3 bg-surface-container/50 border-b border-outline-variant/20 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-secondary text-on-secondary shadow-sm'
                    : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-primary'
                }`}
              >
                <span className="material-symbols-outlined text-base">
                  {tab.icon}
                </span>
                <span>{tab.title}</span>
              </button>
            ))}
          </div>

          {/* Quick Search */}
          <div className="relative w-full sm:w-64 shrink-0">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">
              search
            </span>
            <input
              type="text"
              placeholder="Tìm kiếm quy định..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-surface-container-lowest border border-outline-variant/40 text-xs text-primary focus:outline-none focus:border-secondary transition-colors"
            />
          </div>
        </div>

        {/* Content Body (Scrollable Panel) */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8 leading-relaxed text-on-surface text-sm sm:text-base">
          {/* TAB 1: ĐIỀU KHOẢN DỊCH VỤ */}
          {activeTab === 'terms' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="p-4 rounded-2xl bg-secondary-container/40 border border-secondary/20 flex items-start gap-3">
                <span className="material-symbols-outlined text-secondary text-2xl shrink-0 mt-0.5">
                  info
                </span>
                <div className="text-xs text-on-secondary-container font-medium">
                  <strong className="block text-sm font-bold mb-1">
                    Tóm Tắt Điều Khoản Dịch Vụ
                  </strong>
                  Bằng việc đăng ký tài khoản hoặc sử dụng nền tảng SweetCake, bạn đồng ý với các quy định về đặt hàng, thanh toán tạm giữ Escrow, bảo mật thiết kế AI và cơ chế bồi hoàn 100% tiền nếu bánh giao không đạt cam kết.
                </div>
              </div>

              <section className="space-y-3">
                <h3 className="font-headline-sm text-lg font-bold text-primary flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-primary text-on-primary text-xs flex items-center justify-center font-bold">1</span>
                  Tài Khoản &amp; Quyền Hạn Người Dùng
                </h3>
                <p className="text-on-surface-variant font-medium text-xs sm:text-sm">
                  • Khách hàng cần từ 15 tuổi trở lên hoặc có sự giám sát của người giám hộ pháp lý khi thực hiện giao dịch thanh toán trực tuyến.
                </p>
                <p className="text-on-surface-variant font-medium text-xs sm:text-sm">
                  • Thông tin tài khoản đăng ký (Số điện thoại, địa chỉ nhận bánh, tên người nhận) phải chính xác để đảm bảo đối soát giao hàng xe lạnh đúng khung giờ.
                </p>
                <p className="text-on-surface-variant font-medium text-xs sm:text-sm">
                  • Khách hàng bảo mật mật khẩu cá nhân và chịu trách nhiệm cho các đơn đặt hàng được gửi từ tài khoản của mình.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="font-headline-sm text-lg font-bold text-primary flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-primary text-on-primary text-xs flex items-center justify-center font-bold">2</span>
                  Quy Trình Đặt Bánh &amp; Đấu Thầu Báo Giá Custom
                </h3>
                <p className="text-on-surface-variant font-medium text-xs sm:text-sm">
                  • Khách hàng có thể tạo bản vẽ bánh 3D bằng công cụ AI Studio hoặc đăng yêu cầu báo giá (RFQ) kèm theo ngân sách dự kiến và khung giờ cần giao.
                </p>
                <p className="text-on-surface-variant font-medium text-xs sm:text-sm">
                  • Các tiệm bánh đối tác verified trên hệ thống sẽ gửi báo giá chi tiết (Cốt bánh, loại kem, phụ kiện trang trí, phí vận chuyển). Báo giá có hiệu lực trong 48 giờ.
                </p>
                <p className="text-on-surface-variant font-medium text-xs sm:text-sm">
                  • Khi Khách hàng chấp nhận 1 báo giá, đơn hàng bước vào trạng thái "Chờ Tiệm Xác Nhận Lần Cuối" trước khi tiến hành thanh toán Ký Quỹ.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="font-headline-sm text-lg font-bold text-primary flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-primary text-on-primary text-xs flex items-center justify-center font-bold">3</span>
                  Cơ Chế Thanh Toán Tạm Giữ Bằng Tài Khoản Escrow
                </h3>
                <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/30 space-y-2">
                  <p className="font-bold text-primary text-xs sm:text-sm">
                    🔒 Bảo Vệ Tiền Nạp 100% Với Ví Escrow SweetCake:
                  </p>
                  <p className="text-xs text-on-surface-variant font-medium">
                    Khi bạn chuyển khoản thanh toán, số tiền được tạm giữ tại tài khoản đảm bảo Escrow trung lập của SweetCake. Tiệm bánh **CHƯA ĐƯỢC NHẬN TIỀN** cho đến khi bạn nhận bánh, kiểm tra đúng hình dáng, hương vị và xác nhận "Hoàn thành đơn hàng".
                  </p>
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="font-headline-sm text-lg font-bold text-primary flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-primary text-on-primary text-xs flex items-center justify-center font-bold">4</span>
                  Chính Sách Hủy Đơn &amp; Bồi Thường
                </h3>
                <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-on-surface-variant font-medium">
                  <li><strong>Hủy trước khi tiệm làm bánh:</strong> Hoàn lại 100% tiền tạm giữ trong 15 phút.</li>
                  <li><strong>Bánh hỏng trong quá trình vận chuyển / Không đúng hình mẫu &gt; 30%:</strong> SweetCake hoàn 100% tiền Escrow + hỗ trợ voucher 200.000đ cho đơn kế tiếp.</li>
                  <li><strong>Tiệm bánh tự ý hủy sau khi xác nhận nhận làm:</strong> Tiệm bị trừ 200 điểm uy tín và bồi thường 15% giá trị đơn hàng cho khách.</li>
                </ul>
              </section>
            </div>
          )}

          {/* TAB 2: CHÍNH SÁCH BẢO MẬT */}
          {activeTab === 'privacy' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-start gap-3">
                <span className="material-symbols-outlined text-emerald-700 text-2xl shrink-0 mt-0.5">
                  verified_user
                </span>
                <div className="text-xs text-emerald-950 font-medium">
                  <strong className="block text-sm font-bold mb-1">
                    Cam Kết Tuân Thủ Nghị Định 13/2023/NĐ-CP Về Bảo Vệ Dữ Liệu Cá Nhân
                  </strong>
                  SweetCake cam kết mã hóa tuyệt đối toàn bộ thông tin thanh toán, số điện thoại và vị trí giao hàng. Dữ liệu của bạn không bao giờ bị chia sẻ cho bên thứ ba vì mục đích quảng cáo rác.
                </div>
              </div>

              <section className="space-y-3">
                <h3 className="font-headline-sm text-lg font-bold text-primary flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-primary text-on-primary text-xs flex items-center justify-center font-bold">1</span>
                  Thông Tin Thu Thập &amp; Mục Đích Sử Dụng
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                  <div className="p-3.5 rounded-xl bg-surface-container border border-outline-variant/30">
                    <strong className="block text-primary font-bold mb-1">Thông tin tài khoản:</strong>
                    Tên, số điện thoại, email để xác thực đăng nhập OTP &amp; thông báo tiến trình đơn hàng.
                  </div>
                  <div className="p-3.5 rounded-xl bg-surface-container border border-outline-variant/30">
                    <strong className="block text-primary font-bold mb-1">Thông tin giao nhận:</strong>
                    Địa chỉ và thời gian nhận bánh để điều phối shipper xe lạnh định vị GPS real-time.
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="font-headline-sm text-lg font-bold text-primary flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-primary text-on-primary text-xs flex items-center justify-center font-bold">2</span>
                  Bảo Mật Giao Dịch &amp; Mã Hóa Dữ Liệu
                </h3>
                <p className="text-on-surface-variant font-medium text-xs sm:text-sm">
                  • Mọi dữ liệu nhạy cảm được mã hóa chuẩn SSL 256-bit trong suốt quá trình truyền tải.
                </p>
                <p className="text-on-surface-variant font-medium text-xs sm:text-sm">
                  • Hệ thống không lưu trữ trực tiếp số thẻ tín dụng hoặc thông tin tài khoản ngân hàng của khách hàng (chỉ giao dịch qua cổng VietQR/MOMO/VNPAY chuẩn PCI-DSS).
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="font-headline-sm text-lg font-bold text-primary flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-primary text-on-primary text-xs flex items-center justify-center font-bold">3</span>
                  Quyền Hạn Của Khách Hàng Với Dữ Liệu Cá Nhân
                </h3>
                <p className="text-on-surface-variant font-medium text-xs sm:text-sm">
                  Khách hàng có quyền truy cập, chỉnh sửa hoặc yêu cầu xóa vĩnh viễn dữ liệu tài khoản bất kỳ lúc nào bằng cách gửi yêu cầu tại trang Hồ Sơ Cá Nhân hoặc liên hệ hotline Pháp Lý: <strong className="text-secondary">1900 6886</strong>.
                </p>
              </section>
            </div>
          )}

          {/* TAB 3: QUY CHẾ SÀN TMĐT */}
          {activeTab === 'regulations' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3">
                <span className="material-symbols-outlined text-amber-900 text-2xl shrink-0 mt-0.5">
                  account_balance
                </span>
                <div className="text-xs text-amber-950 font-medium">
                  <strong className="block text-sm font-bold mb-1">
                    Quy Chế Hoạt Động Sàn Giao Dịch Thương Mại Điện Tử SweetCake.vn
                  </strong>
                  Tuân thủ Nghị định số 52/2013/NĐ-CP và Nghị định số 85/2021/NĐ-CP của Chính phủ về Thương mại điện tử.
                </div>
              </div>

              <section className="space-y-3">
                <h3 className="font-headline-sm text-lg font-bold text-primary flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-primary text-on-primary text-xs flex items-center justify-center font-bold">1</span>
                  Tiêu Chuẩn Kiểm Duyệt Tiệm Bánh Đối Tác (Vendor Standard)
                </h3>
                <p className="text-on-surface-variant font-medium text-xs sm:text-sm">
                  • 100% Tiệm bánh nghệ nhân trên SweetCake phải có Giấy chứng nhận Đủ điều kiện Vệ sinh An toàn Thực phẩm (VSATTP) còn hiệu lực do Cục An toàn Thực phẩm cấp.
                </p>
                <p className="text-on-surface-variant font-medium text-xs sm:text-sm">
                  • Tiệm bánh cam kết chỉ sử dụng nguyên liệu có nguồn gốc xuất xứ rõ ràng, kem tươi whipping cream và phẩm màu thực phẩm đạt chứng nhận an toàn sức khỏe.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="font-headline-sm text-lg font-bold text-primary flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-primary text-on-primary text-xs flex items-center justify-center font-bold">2</span>
                  Quy Trình Giải Quyết Tranh Chấp &amp; Bồi Thường
                </h3>
                <div className="space-y-2 text-xs sm:text-sm text-on-surface-variant font-medium">
                  <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/30">
                    <strong className="text-primary font-bold block mb-1">Bước 1: Tiếp nhận khiếu nại (Trong vòng 24h)</strong>
                    Khách hàng bấm "Khiếu nại / Yêu cầu hoàn tiền" tại trang Theo Dõi Đơn Hàng và tải ảnh/video thực tế chiếc bánh.
                  </div>
                  <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/30">
                    <strong className="text-primary font-bold block mb-1">Bước 2: Trọng tài SweetCake kiểm tra độc lập</strong>
                    Hệ thống kiểm tra đối chiếu bản vẽ thiết kế 3D AI ban đầu với ảnh tiệm nộp trước khi giao.
                  </div>
                  <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/30">
                    <strong className="text-primary font-bold block mb-1">Bước 3: Xử lý tiền bồi hoàn Escrow</strong>
                    Nếu sai sót do tiệm bánh, số tiền Escrow lập tức hoàn trả 100% về ví khách hàng trong vòng 30 phút.
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="font-headline-sm text-lg font-bold text-primary flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-primary text-on-primary text-xs flex items-center justify-center font-bold">3</span>
                  Quyền Sở Hữu Trí Tuệ Với Mẫu Thiết Kế Bánh AI
                </h3>
                <p className="text-on-surface-variant font-medium text-xs sm:text-sm">
                  Bản vẽ thiết kế sáng tạo được sinh ra từ công cụ SweetCake AI Studio thuộc quyền sở hữu cá nhân của khách hàng sáng tạo ra nó. Các tiệm bánh đối tác không được tự ý thương mại hóa bản vẽ này cho bên thứ ba nếu chưa được sự đồng ý của tác giả.
                </p>
              </section>
            </div>
          )}
        </div>

        {/* Footer Actions Bar */}
        <div className="px-6 py-4 bg-surface-container-low border-t border-outline-variant/30 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-on-surface-variant font-medium">
            <span className="material-symbols-outlined text-secondary text-base">
              verified
            </span>
            <span>Bản quyền © 2026 SweetCake Inc. Đã đăng ký với Bộ Công Thương.</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-8 py-2.5 rounded-xl bg-secondary text-on-secondary hover:bg-secondary/90 font-bold text-xs transition-all shadow-sm cursor-pointer"
            >
              Đã Hiểu &amp; Đồng Ý
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
