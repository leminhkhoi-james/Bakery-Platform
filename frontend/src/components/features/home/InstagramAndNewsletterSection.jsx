import { INSTAGRAM_POSTS } from '../../../mockData/shared/social.js'
import { useState } from 'react'



export const InstagramAndNewsletterSection = () => {
  const [email, setEmail] = useState('')
  const [isSubscribed, setIsSubscribed] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (email) {
      setIsSubscribed(true)
      setTimeout(() => {
        setIsSubscribed(false)
        setEmail('')
      }, 5000)
    }
  }

  return (
    <section className="py-20 bg-background w-full">
      <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-10 xl:px-12">
        {/* Instagram Header */}
        <div className="text-center max-w-xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 text-secondary mb-2">
            <span className="material-symbols-outlined text-lg">photo_camera</span>
            <span className="font-label-md text-label-md tracking-widest uppercase font-semibold">
              @sweetcake.patisserie
            </span>
          </div>
          <h2 className="font-headline-lg text-headline-lg text-primary">
            Góc Phố Bánh &amp; Tiệc Ngọt
          </h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-2">
            Ghé thăm không gian làm bánh hàng ngày và những khoảnh khắc bừng nở nụ cười của thực khách.
          </p>
        </div>

        {/* Gallery Grid 5 Columns */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-20">
          {INSTAGRAM_POSTS.map((post, idx) => (
            <div
              key={post.id}
              className={`group relative aspect-square rounded-2xl overflow-hidden bg-surface-container ${
                idx === 4 ? 'col-span-2 sm:col-span-1' : ''
              }`}
            >
              <img
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                alt={post.alt}
                src={post.image}
              />
              <div className="absolute inset-0 bg-primary/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-on-primary cursor-pointer">
                <span className="material-symbols-outlined text-2xl text-secondary-fixed">
                  favorite
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Newsletter Banner: Cẩm Nang Tiệc Ngọt */}
        <div className="rounded-3xl bg-surface-container p-8 lg:p-12 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="max-w-xl">
            <span className="font-label-md text-label-md text-secondary uppercase tracking-widest block mb-2 font-semibold">
              Bản Tin Tiệc Ngọt &amp; Cẩm Nang Bếp Bánh
            </span>
            <h3 className="font-headline-lg text-headline-lg text-primary mb-3">
              Nhận Ebook "Cẩm Nang Bày Biện Tiệc Trà &amp; Sinh Nhật Pháp"
            </h3>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Đăng ký để nhận ngay cuốn hướng dẫn phối vị bánh - rượu vang và bí quyết bảo quản bánh kem giữ trọn hương vị tươi mới.
            </p>
          </div>

          <div className="w-full lg:w-auto flex-1 max-w-md">
            {isSubscribed ? (
              <div className="p-4 bg-secondary-fixed/60 rounded-2xl text-on-secondary-fixed text-sm font-semibold flex items-center gap-3">
                <span className="material-symbols-outlined text-secondary text-2xl">
                  task_alt
                </span>
                <span>
                  Cảm ơn bạn đã đăng ký! Sweet Cake đã gửi cẩm nang vào email của bạn.
                </span>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
                <input
                  className="w-full px-4 py-3.5 rounded-full bg-surface text-on-surface font-body-sm outline-none shadow-xs focus:bg-surface-container-lowest transition-all"
                  placeholder="Nhập địa chỉ email của bạn..."
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <button
                  className="px-6 py-3.5 rounded-full bg-primary text-on-primary font-label-lg hover:bg-secondary transition-colors shrink-0 shadow-sm cursor-pointer"
                  type="submit"
                >
                  Nhận Quà Ngay
                </button>
              </form>
            )}
            <p className="font-label-sm text-label-sm text-on-surface-variant mt-2.5 text-center sm:text-left">
              *Chúng tôi cam kết bảo mật thông tin và không gửi thư rác.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default InstagramAndNewsletterSection
