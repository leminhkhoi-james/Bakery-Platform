import { useState } from 'react'

export const AuthPage = ({ onNavigate, onLoginSuccess }) => {
  const [authTab, setAuthTab] = useState('login')
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [showRegPassword, setShowRegPassword] = useState(false)

  // Login form state
  const [loginPhone, setLoginPhone] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)

  // Register form state
  const [regLastName, setRegLastName] = useState('')
  const [regFirstName, setRegFirstName] = useState('')
  const [regPhone, setRegPhone] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regBirthday, setRegBirthday] = useState('')
  const [agreeTerms, setAgreeTerms] = useState(true)

  const handleLoginSubmit = (e) => {
    e.preventDefault()
    if (!loginPhone || !loginPassword) return
    if (onLoginSuccess) {
      onLoginSuccess('Đăng nhập thành công! Chào mừng quý khách trở lại.')
    }
    if (onNavigate) {
      onNavigate('home')
    }
  }

  const handleRegisterSubmit = (e) => {
    e.preventDefault()
    if (!regPhone || !regEmail || !regPassword) return
    if (onLoginSuccess) {
      onLoginSuccess(
        `Đăng ký tài khoản thành công! Chào mừng bạn đến với SweetCake.`
      )
    }
    if (onNavigate) {
      onNavigate('home')
    }
  }

  return (
    <div className="w-full py-8 pb-16 bg-background min-h-[calc(100vh-16rem)]">
      <div className="flex flex-col w-full">
        {/* Subtle Ambient Top Glow */}
        <div className="relative w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 py-4 overflow-hidden">
          {/* Ambient Blur Circles inside parent */}
          <div className="absolute -top-24 right-10 w-96 h-96 rounded-full bg-secondary-container/15 blur-3xl pointer-events-none"></div>
          <div className="absolute top-1/2 -left-20 w-80 h-80 rounded-full bg-primary-fixed/20 blur-3xl pointer-events-none"></div>


          {/* Centered Auth Card */}
          <section className="relative z-10 w-full max-w-xl mx-auto bg-surface-container-lowest rounded-2xl shadow-[0_20px_50px_-12px_rgba(45,30,24,0.08)] border border-outline-variant/20 p-6 sm:p-10">
            <div className="w-full space-y-6">
                  {/* Switcher Tabs */}
                  <div className="flex items-center justify-center p-1 bg-surface-container rounded-lg">
                    <button
                      className={`flex-1 py-2.5 rounded-md font-label-lg text-label-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        authTab === 'login'
                          ? 'text-on-surface bg-surface-container-lowest shadow-sm font-bold'
                          : 'text-on-surface-variant hover:text-on-surface font-medium'
                      }`}
                      id="tab-login"
                      onClick={() => setAuthTab('login')}
                      type="button"
                    >
                      <span className="material-symbols-outlined text-lg">login</span>
                      <span>Đăng nhập</span>
                    </button>

                    <button
                      className={`flex-1 py-2.5 rounded-md font-label-lg text-label-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        authTab === 'register'
                          ? 'text-on-surface bg-surface-container-lowest shadow-sm font-bold'
                          : 'text-on-surface-variant hover:text-on-surface font-medium'
                      }`}
                      id="tab-register"
                      onClick={() => setAuthTab('register')}
                      type="button"
                    >
                      <span className="material-symbols-outlined text-lg">person_add</span>
                      <span>Đăng ký tài khoản</span>
                    </button>
                  </div>

                  {/* Form Section: SIGN IN */}
                  {authTab === 'login' && (
                    <div className="space-y-6" id="form-login-container">
                      <div className="space-y-1">
                        <h2 className="font-headline-sm text-headline-sm text-primary">
                          Chào mừng quý khách trở lại
                        </h2>
                      </div>

                      {/* Traditional Login Inputs */}
                      <form className="space-y-4" onSubmit={handleLoginSubmit}>
                        {/* Phone / Email Field */}
                        <div className="space-y-1.5">
                          <label className="block font-label-lg text-label-lg text-on-surface font-medium">
                            Số điện thoại
                          </label>
                          <div className="relative flex items-center">
                            <span className="material-symbols-outlined absolute left-3.5 text-on-surface-variant/70 text-[20px] pointer-events-none">
                              phone
                            </span>
                            <input
                              className="w-full bg-surface-container-low text-on-surface font-body-md text-body-md pl-11 pr-4 py-3 rounded-lg outline-none focus:bg-surface-container focus:ring-2 focus:ring-secondary/30 transition-all placeholder:text-on-surface-variant/40"
                              placeholder="VD: 0912 345 678"
                              type="tel"
                              required
                              value={loginPhone}
                              onChange={(e) => setLoginPhone(e.target.value)}
                            />
                          </div>
                        </div>

                        {/* Password Field */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="block font-label-lg text-label-lg text-on-surface font-medium">
                              Mật khẩu
                            </label>
                            <button
                              type="button"
                              className="font-label-sm text-label-sm text-secondary hover:underline font-semibold cursor-pointer bg-transparent border-none p-0"
                              onClick={() => alert('Vui lòng liên hệ quản trị viên hoặc sử dụng số điện thoại để khôi phục mật khẩu!')}
                            >
                              Quên mật khẩu?
                            </button>
                          </div>
                          <div className="relative flex items-center">
                            <span className="material-symbols-outlined absolute left-3.5 text-on-surface-variant/70 text-[20px] pointer-events-none">
                              lock
                            </span>
                            <input
                              className="w-full bg-surface-container-low text-on-surface font-body-md text-body-md pl-11 pr-11 py-3 rounded-lg outline-none focus:bg-surface-container focus:ring-2 focus:ring-secondary/30 transition-all placeholder:text-on-surface-variant/40"
                              id="login-pwd"
                              placeholder="••••••••••••"
                              type={showLoginPassword ? 'text' : 'password'}
                              required
                              value={loginPassword}
                              onChange={(e) => setLoginPassword(e.target.value)}
                            />
                            <button
                              className="absolute right-3.5 text-on-surface-variant/70 hover:text-on-surface focus:outline-none cursor-pointer"
                              onClick={() => setShowLoginPassword((prev) => !prev)}
                              type="button"
                              aria-label="Ẩn/hiện mật khẩu"
                            >
                              <span className="material-symbols-outlined text-[20px]">
                                {showLoginPassword ? 'visibility_off' : 'visibility'}
                              </span>
                            </button>
                          </div>
                        </div>

                        {/* Submit CTA Button */}
                        <button
                          className="w-full mt-2 py-3.5 px-6 rounded-lg bg-primary-container text-on-primary font-label-lg text-label-lg font-semibold hover:bg-secondary transition-all shadow-[0_4px_16px_rgba(45,30,24,0.18)] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
                          type="submit"
                        >
                          <span>Đăng Nhập Vào Tài Khoản</span>
                          <span className="material-symbols-outlined text-lg">east</span>
                        </button>
                      </form>

                    </div>
                  )}

                  {/* Form Section: SIGN UP / REGISTER */}
                  {authTab === 'register' && (
                    <div className="space-y-6" id="form-register-container">
                      <div className="space-y-1">
                        <h2 className="font-headline-sm text-headline-sm text-primary pt-1">
                          Đăng ký tài khoản
                        </h2>
                      </div>

                      <form className="space-y-3.5" onSubmit={handleRegisterSubmit}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          <div className="space-y-1">
                            <label className="block font-label-md text-label-md text-on-surface font-medium">
                              Họ &amp; Tên đệm
                            </label>
                            <input
                              className="w-full bg-surface-container-low text-on-surface font-body-md text-body-md px-3.5 py-2.5 rounded-lg outline-none focus:bg-surface-container focus:ring-2 focus:ring-secondary/30 transition-all"
                              placeholder="Nguyễn Hoàng"
                              type="text"
                              value={regLastName}
                              onChange={(e) => setRegLastName(e.target.value)}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="block font-label-md text-label-md text-on-surface font-medium">
                              Tên của bạn
                            </label>
                            <input
                              className="w-full bg-surface-container-low text-on-surface font-body-md text-body-md px-3.5 py-2.5 rounded-lg outline-none focus:bg-surface-container focus:ring-2 focus:ring-secondary/30 transition-all"
                              placeholder="Thanh Mai"
                              type="text"
                              required
                              value={regFirstName}
                              onChange={(e) => setRegFirstName(e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="block font-label-md text-label-md text-on-surface font-medium">
                            Số điện thoại
                          </label>
                          <div className="relative flex items-center">
                            <span className="material-symbols-outlined absolute left-3 text-on-surface-variant/70 text-[18px]">
                              phone
                            </span>
                            <input
                              className="w-full bg-surface-container-low text-on-surface font-body-md text-body-md pl-10 pr-3.5 py-2.5 rounded-lg outline-none focus:bg-surface-container focus:ring-2 focus:ring-secondary/30 transition-all"
                              placeholder="0901 234 567"
                              type="tel"
                              required
                              value={regPhone}
                              onChange={(e) => setRegPhone(e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="block font-label-md text-label-md text-on-surface font-medium">
                              Mật khẩu bảo mật
                            </label>
                            <span className="font-label-sm text-label-sm text-on-surface-variant/60">
                              Tối thiểu 8 ký tự
                            </span>
                          </div>
                          <div className="relative flex items-center">
                            <span className="material-symbols-outlined absolute left-3 text-on-surface-variant/70 text-[18px]">
                              lock_reset
                            </span>
                            <input
                              className="w-full bg-surface-container-low text-on-surface font-body-md text-body-md pl-10 pr-10 py-2.5 rounded-lg outline-none focus:bg-surface-container focus:ring-2 focus:ring-secondary/30 transition-all"
                              id="reg-pwd"
                              placeholder="Tạo mật khẩu an toàn"
                              type={showRegPassword ? 'text' : 'password'}
                              required
                              minLength={8}
                              value={regPassword}
                              onChange={(e) => setRegPassword(e.target.value)}
                            />
                            <button
                              className="absolute right-3 text-on-surface-variant/70 hover:text-on-surface cursor-pointer"
                              onClick={() => setShowRegPassword((prev) => !prev)}
                              type="button"
                              aria-label="Ẩn/hiện mật khẩu"
                            >
                              <span className="material-symbols-outlined text-[18px]">
                                {showRegPassword ? 'visibility_off' : 'visibility'}
                              </span>
                            </button>
                          </div>
                        </div>

                        <button
                          className="w-full py-3.5 px-6 rounded-lg bg-primary-container text-on-primary font-label-lg text-label-lg font-semibold hover:bg-secondary transition-all shadow-[0_4px_16px_rgba(45,30,24,0.18)] flex items-center justify-center gap-2 cursor-pointer"
                          type="submit"
                        >
                          <span className="material-symbols-outlined text-lg">
                            how_to_reg
                          </span>
                          <span>Tạo Tài Khoản</span>
                        </button>
                      </form>

                    </div>
                  )}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export default AuthPage
