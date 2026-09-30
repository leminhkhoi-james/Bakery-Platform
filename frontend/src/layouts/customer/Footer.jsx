import { useState } from 'react'
import BrandLogo from '../../components/common/BrandLogo'
import PolicyModal from '../../components/common/PolicyModal'
import { FOOTER_DATA } from '../../mockData/shared/navigation.js'

export const Footer = ({ onNavigate }) => {
  const [isPolicyOpen, setIsPolicyOpen] = useState(false)
  const [policyTab, setPolicyTab] = useState('terms') // 'terms' | 'privacy' | 'regulations'

  const openPolicy = (tabKey) => {
    setPolicyTab(tabKey)
    setIsPolicyOpen(true)
  }

  return (
    <footer className="scroll-mt-24 w-full bg-[#fffaf3] text-wine border-t-4 border-wine relative z-20 font-savoure">
      {/* Top Decorator: Vintage Polka Dot Scallop Ribbon Trim at Top of Footer */}
      <div className="relative w-full select-none overflow-hidden" aria-hidden="true">
        {/* Polka Dot Pink Curtain Ribbon */}
        <div className="h-3.5 w-full bg-[#ffc6db] pattern-dots-pink border-b border-wine"></div>

        {/* White Pearl Scallop Ruffle Edge */}
        <div
          className="w-full h-3 bg-repeat-x relative -mt-0.5"
          style={{
            backgroundImage: 'radial-gradient(circle at 10px 0px, #ffc6db 7px, transparent 8px)',
            backgroundSize: '20px 10px'
          }}
        >
          <div
            className="w-full h-full bg-repeat-x"
            style={{
              backgroundImage: 'radial-gradient(circle at 10px 5px, #ffffff 2px, transparent 2.5px)',
              backgroundSize: '20px 10px'
            }}
          ></div>
        </div>
      </div>

      <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 pt-12 pb-10">
        {/* Evenly Spaced 4-Column Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-12">
          {/* Brand Column */}
          <div className="space-y-4">
            <BrandLogo onClick={() => onNavigate && onNavigate('home')} />
            <p className="text-sm text-wine/80 font-bold leading-relaxed">
              Nền tảng thương mại điện tử kết nối các tiệm bánh nghệ nhân, mang đến những kiệt tác ngọt ngào cho mọi khoảnh khắc đáng nhớ.
            </p>
            <div className="inline-flex items-center gap-2 bg-[#ffc6db]/50 border border-wine/40 rounded-full px-3 py-1 text-xs font-extrabold text-wine">
              <span>🍓 Sugary Sparks x SweetCake</span>
            </div>
          </div>

          {/* Menu Categories */}
          <div className="space-y-3">
            <h3 className="font-savoure text-wine text-lg sm:text-xl font-bold border-b border-wine/20 pb-2">
              Thực đơn nổi bật
            </h3>
            <ul className="space-y-2 text-sm text-wine font-bold">
              {FOOTER_DATA.categories.map((item, idx) => (
                <li
                  key={idx}
                  className="hover:text-[#b8273b] hover:translate-x-1 transition-all cursor-pointer flex items-center gap-1.5"
                  onClick={() => onNavigate && onNavigate(item.route)}
                >
                  <span className="text-xs text-wine/60">✦</span>
                  <span>{item.label}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Partner Bakeries */}
          <div className="space-y-3">
            <h3 className="font-savoure text-wine text-lg sm:text-xl font-bold border-b border-wine/20 pb-2">
              Tiệm bánh đối tác
            </h3>
            <ul className="space-y-2 text-sm text-wine font-bold">
              {FOOTER_DATA.partnerBakeries.map((item, idx) => (
                <li
                  key={idx}
                  className="hover:text-[#b8273b] hover:translate-x-1 transition-all cursor-pointer flex items-center gap-1.5"
                  onClick={() => onNavigate && onNavigate(item.route)}
                >
                  <span className="text-xs text-wine/60">✦</span>
                  <span>{item.label}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Branch & Hotline */}
          <div className="space-y-3">
            <h3 className="font-savoure text-wine text-lg sm:text-xl font-bold border-b border-wine/20 pb-2">
              Hệ thống &amp; Trụ sở
            </h3>
            <div className="space-y-2.5 text-sm text-wine font-bold">
              {FOOTER_DATA.branches.map((b, idx) => (
                <p key={idx} className="leading-relaxed">
                  <strong className="text-wine font-extrabold">{b.city}:</strong>{' '}
                  <span className="text-wine/80">{b.address || b.hotline}</span>
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom copyright & Legal Links */}
        <div className="pt-6 border-t-2 border-wine/20 flex flex-col sm:flex-row items-center justify-between text-xs sm:text-sm text-wine font-bold gap-4">
          <p>© 2026 SweetCake x Sugary Sparks Platform. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <button
              onClick={() => openPolicy('terms')}
              className="hover:text-[#b8273b] hover:underline transition-colors cursor-pointer text-left"
              type="button"
            >
              Điều khoản dịch vụ
            </button>
            <button
              onClick={() => openPolicy('privacy')}
              className="hover:text-[#b8273b] hover:underline transition-colors cursor-pointer text-left"
              type="button"
            >
              Chính sách bảo mật
            </button>
            <button
              onClick={() => openPolicy('regulations')}
              className="hover:text-[#b8273b] hover:underline transition-colors cursor-pointer text-left"
              type="button"
            >
              Quy chế sàn thương mại điện tử
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Policy & Legal Modal */}
      <PolicyModal
        isOpen={isPolicyOpen}
        initialTab={policyTab}
        onClose={() => setIsPolicyOpen(false)}
      />
    </footer>
  )
}

export default Footer
