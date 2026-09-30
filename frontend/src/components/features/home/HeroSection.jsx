import ScrollReveal from '../../common/ScrollReveal.jsx'

export const HeroSection = ({ onNavigate }) => {
  return (
    <>
      <section className="snap-section relative w-full overflow-hidden sunburst-bg -mt-24 sm:-mt-28 pt-24 sm:pt-28 border-b-2 border-wine scroll-mt-24 min-h-[calc(100vh-5.5rem)] flex flex-col justify-center">
        {/* Background Radial Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_248px,rgba(255,250,235,0.4),transparent_70%)] pointer-events-none"></div>

        {/* ==========================================
            PART 1: KAWAII VINTAGE BAKERY KIOSK STAGE
            (Sugary Sparks x SweetCake Petit Pâtisserie)
           ========================================== */}
        <div className="relative z-20 w-full pt-6 pb-0">


          {/* Main Kiosk Booth Stage Container */}
          <div className="max-w-4xl mx-auto relative flex flex-col items-center z-20 px-4">

            {/* BEGIN: Floating Decorative Clouds (Positioned further OUTWARDS from kiosk tent) */}
            {/* Top Left Cloud Cluster (Mint Dots + Ribbon) */}
            <div className="absolute top-4 -left-20 sm:-left-36 md:-left-52 lg:-left-64 pointer-events-none select-none z-0 scale-75 sm:scale-90 md:scale-100 opacity-95">
              <div className="relative w-48 h-28">
                <div className="absolute inset-0 rounded-full pattern-dots-mint border-2 border-wine shadow-[2px_2px_0_#9f1e31]"></div>
                <div className="absolute -top-6 left-8 w-24 h-24 rounded-full pattern-dots-mint border-t-2 border-l-2 border-wine"></div>
                <div className="absolute -top-3 right-6 w-20 h-20 rounded-full pattern-dots-mint border-t-2 border-r-2 border-wine"></div>
                <div className="absolute -bottom-2 right-10 bg-[#be4876] text-white rounded-full w-6 h-6 flex items-center justify-center border border-wine text-xs shadow-xs">
                  🎀
                </div>
              </div>
            </div>

            {/* Mid Left Cloud Cluster (Pink Stripes + Heart) */}
            <div className="absolute top-48 -left-24 sm:-left-44 md:-left-60 lg:-left-72 pointer-events-none select-none z-0 scale-75 sm:scale-90 md:scale-95">
              <div className="relative w-64 h-36">
                <div className="absolute inset-0 rounded-full pattern-stripes-pink border-2 border-wine shadow-[3px_3px_0_#9f1e31]"></div>
                <div className="absolute -top-8 left-10 w-32 h-32 rounded-full pattern-stripes-pink border-t-2 border-l-2 border-wine"></div>
                <div className="absolute -top-4 right-10 w-28 h-28 rounded-full pattern-stripes-pink border-t-2 border-r-2 border-wine"></div>
                <div className="absolute top-1/2 left-8 w-6 h-6 rounded-full bg-[#ffe4a6] border-2 border-wine"></div>
                <div className="absolute top-8 right-16 text-wine text-xl font-bold">♥</div>
              </div>
            </div>

            {/* Top Right Cloud Cluster (White + Star) */}
            <div className="absolute top-2 -right-18 sm:-right-32 md:-right-48 lg:-right-60 pointer-events-none select-none z-0 scale-75 sm:scale-90 md:scale-100 opacity-95">
              <div className="relative w-52 h-28">
                <div className="absolute inset-0 rounded-full bg-white border-2 border-wine pattern-dots-pink shadow-[2px_2px_0_#9f1e31] opacity-90"></div>
                <div className="absolute -top-6 right-10 w-24 h-24 rounded-full bg-white border-t-2 border-r-2 border-wine"></div>
                <div className="absolute bottom-2 left-6 text-sm text-wine font-bold">★</div>
              </div>
            </div>

            {/* Mid Right Cloud Cluster (Mint Dots + Strawberry & Heart) */}
            <div className="absolute top-44 -right-20 sm:-right-40 md:-right-56 lg:-right-68 pointer-events-none select-none z-0 scale-75 sm:scale-90 md:scale-100">
              <div className="relative w-60 h-32">
                <div className="absolute inset-0 rounded-full pattern-dots-mint border-2 border-wine shadow-[3px_3px_0_#9f1e31]"></div>
                <div className="absolute -top-8 left-12 w-28 h-28 rounded-full pattern-dots-mint border-t-2 border-l-2 border-wine"></div>
                <div className="absolute -top-2 right-12 w-8 h-8 rounded-full bg-wine border-2 border-white shadow flex items-center justify-center text-white text-xs">
                  🍓
                </div>
                <div className="absolute bottom-4 right-14 w-8 h-8 rounded-full bg-[#ffe4a6] border-2 border-wine flex items-center justify-center text-wine text-xs font-bold">
                  ♥
                </div>
              </div>
            </div>
            {/* END: Floating Decorative Clouds */}

            {/* Main Kiosk Booth Canopy (Higher Z-Index: z-20 so it sits ON TOP of clouds) */}
            <div className="relative w-full max-w-3xl mx-auto flex flex-col items-center z-20">
              {/* Ornate Candy Signboard */}
              <div className="relative z-30 -mb-5 px-8 py-3 bg-[#fffaf3] border-4 border-wine rounded-3xl shadow-[0_4px_0_#741329] flex items-center justify-center">
                <div className="absolute -inset-1.5 border border-dashed border-wine rounded-3xl pointer-events-none"></div>
                <div className="text-center px-6">
                  <span className="text-xs uppercase tracking-widest text-wine font-bold block">
                    ♥ PETIT PÂTISSERIE ♥
                  </span>
                  <h2 className="font-savoure text-3xl md:text-5xl text-wine font-bold tracking-wide drop-shadow-xs">
                    SweetCake
                  </h2>
                </div>
                <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-[#ffc6db] border-2 border-wine rounded-full flex items-center justify-center shadow text-xs">
                  🎀
                </div>
                <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-[#ffc6db] border-2 border-wine rounded-full flex items-center justify-center shadow text-xs">
                  🎀
                </div>
              </div>

              {/* Awning Canopy (Striped Mint & White with Wine Hearts) */}
              <div className="relative w-full overflow-hidden rounded-t-3xl border-4 border-wine bg-[#ffe2e9] shadow-[0_6px_0_#741329] z-20">
                <div className="h-24 w-full flex">
                  <div className="flex-1 bg-white border-r-2 border-wine"></div>
                  <div className="flex-1 bg-[#6fb9c6] border-r-2 border-wine"></div>
                  <div className="flex-1 bg-white border-r-2 border-wine"></div>
                  <div className="flex-1 bg-[#6fb9c6] border-r-2 border-wine"></div>
                  <div className="flex-1 bg-white border-r-2 border-wine"></div>
                  <div className="flex-1 bg-[#6fb9c6] border-r-2 border-wine"></div>
                  <div className="flex-1 bg-white border-r-2 border-wine"></div>
                  <div className="flex-1 bg-[#6fb9c6] border-r-2 border-wine"></div>
                  <div className="flex-1 bg-white border-r-2 border-wine"></div>
                  <div className="flex-1 bg-[#6fb9c6] border-r-2 border-wine"></div>
                  <div className="flex-1 bg-white"></div>
                </div>
                <div className="w-full h-7 bg-wine flex justify-around items-center px-2">
                  <span className="text-[#ffe2e9] text-xs">♥</span>
                  <span className="text-[#ffe2e9] text-xs">♥</span>
                  <span className="text-[#ffe2e9] text-xs">♥</span>
                  <span className="text-[#ffe2e9] text-xs">♥</span>
                  <span className="text-[#ffe2e9] text-xs">♥</span>
                  <span className="text-[#ffe2e9] text-xs">♥</span>
                  <span className="text-[#ffe2e9] text-xs">♥</span>
                  <span className="text-[#ffe2e9] text-xs">♥</span>
                  <span className="text-[#ffe2e9] text-xs">♥</span>
                </div>
              </div>

              {/* Side Curtains / Pink Drapes (z-25 so they drape ON TOP of clouds) */}
              <div className="absolute -left-5 top-14 w-11 h-48 bg-[#be4876] border-2 border-wine rounded-b-full transform -rotate-3 z-25 flex flex-col justify-end items-center pb-3">
                <div className="w-6 h-6 rounded-full bg-white border-2 border-wine flex items-center justify-center text-xs">
                  🎀
                </div>
              </div>
              <div className="absolute -right-5 top-14 w-11 h-48 bg-[#be4876] border-2 border-wine rounded-b-full transform rotate-3 z-25 flex flex-col justify-end items-center pb-3">
                <div className="w-6 h-6 rounded-full bg-white border-2 border-wine flex items-center justify-center text-xs">
                  🎀
                </div>
              </div>
            </div>

            {/* Booth Interior: Cat Baker & Manga Speech Bubbles */}
            <div className="relative w-full max-w-3xl min-h-[270px] flex items-center justify-center -mt-2 z-30">
              {/* Left Pillar Pole */}
              <div className="absolute left-4 top-0 bottom-0 w-4 bg-[#ffe4a6] border-x-2 border-wine flex flex-col justify-between py-4">
                <div className="w-full h-4 bg-wine/30"></div>
                <div className="w-full h-4 bg-wine/30"></div>
              </div>
              {/* Right Pillar Pole */}
              <div className="absolute right-4 top-0 bottom-0 w-4 bg-[#ffe4a6] border-x-2 border-wine flex flex-col justify-between py-4">
                <div className="w-full h-4 bg-wine/30"></div>
                <div className="w-full h-4 bg-wine/30"></div>
              </div>

              {/* Shoujo White Cat Baker Vector Illustration (Centered in dead center) */}
              <div className="relative z-10 flex flex-col items-center justify-center mx-auto">
                <svg className="w-44 h-52 sm:w-52 sm:h-60 md:w-60 md:h-68 drop-shadow-md" fill="none" viewBox="0 0 240 280" xmlns="http://www.w3.org/2000/svg">
                  {/* Cat Ears */}
                  <polygon fill="#FFFFFF" points="50,65 25,10 80,45" stroke="#9f1e31" strokeJoin="round" strokeWidth="3.5" />
                  <polygon fill="#ffc6db" points="45,55 35,25 70,45" />
                  <polygon fill="#FFFFFF" points="190,65 215,10 160,45" stroke="#9f1e31" strokeJoin="round" strokeWidth="3.5" />
                  <polygon fill="#ffc6db" points="195,55 205,25 170,45" />
                  {/* White Head */}
                  <path d="M45,85 C35,130 55,170 120,170 C185,170 205,130 195,85 C185,45 55,45 45,85 Z" fill="#FFFFFF" stroke="#9f1e31" strokeWidth="3.5" />
                  {/* Whiskers */}
                  <path d="M30,120 L5,115 M30,130 L8,135 M210,120 L235,115 M210,130 L232,135" stroke="#9f1e31" strokeLinecap="round" strokeWidth="2.5" />
                  {/* Shoujo Sparkle Eyes */}
                  <ellipse cx="85" cy="112" fill="#6fb9c6" rx="15" ry="18" stroke="#9f1e31" strokeWidth="2.5" />
                  <circle cx="80" cy="106" fill="#FFFFFF" r="6" />
                  <circle cx="92" cy="120" fill="#FFFFFF" r="3" />
                  <text fill="#FFFFFF" fontSize="8" x="83" y="117">♥</text>

                  <ellipse cx="155" cy="112" fill="#6fb9c6" rx="15" ry="18" stroke="#9f1e31" strokeWidth="2.5" />
                  <circle cx="150" cy="106" fill="#FFFFFF" r="6" />
                  <circle cx="162" cy="120" fill="#FFFFFF" r="3" />
                  <text fill="#FFFFFF" fontSize="8" x="153" y="117">♥</text>
                  {/* Blushing Cheeks */}
                  <ellipse cx="65" cy="132" fill="#ffc6db" opacity="0.9" rx="10" ry="6" />
                  <ellipse cx="175" cy="132" fill="#ffc6db" opacity="0.9" rx="10" ry="6" />
                  {/* Nose & Mouth */}
                  <polygon fill="#9f1e31" points="120,126 116,122 124,122" />
                  <path d="M112,132 C116,136 120,133 120,133 C120,133 124,136 128,132" fill="none" stroke="#9f1e31" strokeLinecap="round" strokeWidth="2.5" />
                  {/* Baker Costume Body */}
                  <path d="M75,168 L50,260 L190,260 L165,168 Z" fill="#ffe4a6" stroke="#9f1e31" strokeWidth="3.5" />
                  {/* Teal Ribbon */}
                  <path d="M120,172 L95,190 L120,182 L145,190 Z" fill="#6fb9c6" stroke="#9f1e31" strokeWidth="2.5" />
                  <circle cx="120" cy="178" fill="#5AAEA1" r="8" stroke="#9f1e31" strokeWidth="2" />
                  <path d="M112,185 L100,225 L116,215 L120,190" fill="#6fb9c6" stroke="#9f1e31" strokeWidth="2" />
                  <path d="M128,185 L140,225 L124,215 L120,190" fill="#6fb9c6" stroke="#9f1e31" strokeWidth="2" />
                  {/* Apron Bib & Heart Pocket */}
                  <rect fill="#FFFFFF" height="60" rx="6" stroke="#9f1e31" strokeWidth="2.5" width="70" x="85" y="200" />
                  <path d="M120,215 C115,208 105,210 105,220 C105,228 120,236 120,236 C120,236 135,228 135,220 C135,210 125,208 120,215 Z" fill="#ffc6db" stroke="#9f1e31" strokeWidth="1.5" />
                  {/* Paws Holding Whisk */}
                  <circle cx="70" cy="210" fill="#FFFFFF" r="16" stroke="#9f1e31" strokeWidth="3" />
                  <circle cx="170" cy="210" fill="#FFFFFF" r="16" stroke="#9f1e31" strokeWidth="3" />
                  <line stroke="#6fb9c6" strokeLinecap="round" strokeWidth="4" x1="168" x2="190" y1="195" y2="155" />
                  <circle cx="192" cy="153" fill="#ffc6db" r="8" stroke="#9f1e31" strokeWidth="2" />
                </svg>
              </div>

              {/* Manga Speech Bubbles (Positioned right next to the cat inside the kiosk frame) */}
              <div className="absolute right-3 sm:right-6 md:right-12 lg:right-18 top-1 sm:top-2 z-30 flex flex-col gap-2.5 max-w-[185px] sm:max-w-[220px] md:max-w-[250px] transform translate-x-1 sm:translate-x-2">
                <div className="relative bg-white border-2 border-wine rounded-2xl p-2.5 sm:p-3 shadow-[3px_3px_0_#9f1e31]">
                  <p className="text-[11px] sm:text-xs md:text-sm font-bold leading-snug text-wine">
                    Chào mừng bạn đến với{' '}
                    <span className="font-savoure text-sm sm:text-base md:text-lg block text-wine tracking-wide font-extrabold">
                      SweetCake
                    </span>
                  </p>
                  <div className="absolute -left-2.5 bottom-3 w-0 h-0 border-t-[6px] border-t-transparent border-r-[10px] border-r-white border-b-[6px] border-b-transparent"></div>
                  <div className="absolute -left-[13px] bottom-2.5 w-0 h-0 border-t-[7px] border-t-transparent border-r-[12px] border-r-wine border-b-[7px] border-b-transparent -z-10"></div>
                </div>

                <div className="relative bg-white border-2 border-wine rounded-2xl p-2.5 sm:p-3 shadow-[3px_3px_0_#9f1e31]">
                  <p className="text-[11px] sm:text-xs md:text-sm font-semibold text-wine leading-relaxed">
                    “Nơi chúng mình biến tình iu của bạn thành cái đẹp ăn được”
                  </p>
                  <div className="absolute -left-2.5 top-3 w-0 h-0 border-t-[6px] border-t-transparent border-r-[10px] border-r-white border-b-[6px] border-b-transparent"></div>
                  <div className="absolute -left-[13px] top-2.5 w-0 h-0 border-t-[7px] border-t-transparent border-r-[12px] border-r-wine border-b-[7px] border-b-transparent -z-10"></div>
                </div>
              </div>
            </div>

            {/* Cake Counter Table Display (z-40 so it sits on top) */}
            <div className="relative w-full max-w-3xl -mt-4 z-40">
              {/* Counter Surface (Teal & White Stripes) */}
              <div className="h-12 w-full rounded-t-xl border-4 border-wine overflow-hidden flex shadow-md bg-white">
                <div className="flex-1 bg-white border-r border-wine"></div>
                <div className="flex-1 bg-[#6fb9c6] border-r border-wine"></div>
                <div className="flex-1 bg-white border-r border-wine"></div>
                <div className="flex-1 bg-[#6fb9c6] border-r border-wine"></div>
                <div className="flex-1 bg-white border-r border-wine"></div>
                <div className="flex-1 bg-[#6fb9c6] border-r border-wine"></div>
                <div className="flex-1 bg-white border-r border-wine"></div>
                <div className="flex-1 bg-[#6fb9c6] border-r border-wine"></div>
                <div className="flex-1 bg-white border-r border-wine"></div>
                <div className="flex-1 bg-[#6fb9c6] border-r border-wine"></div>
                <div className="flex-1 bg-white"></div>
              </div>

              {/* Counter Pastry Accents */}
              <div className="absolute -top-8 left-6 flex items-end gap-3 pointer-events-auto">
                <div className="relative bg-white border-2 border-wine rounded-t-full w-12 h-12 p-1 flex flex-col items-center justify-end shadow-xs">
                  <span className="absolute -top-2.5 text-xs">🍓</span>
                  <div className="w-9 h-5 bg-[#C98B62] rounded border border-wine flex items-center justify-center text-[8px] text-white font-bold">
                    CAKE
                  </div>
                </div>
                <div className="bg-white border-2 border-wine rounded-full px-3 py-0.5 shadow-xs flex items-center gap-1">
                  <span className="text-xs">🧁</span>
                  <span className="text-[10px] font-bold text-wine">Choco</span>
                </div>
              </div>

              <div className="absolute -top-7 right-12 bg-white border-2 border-wine rounded-full px-3 py-0.5 shadow-xs flex items-center gap-1">
                <span className="text-xs">🍰</span>
                <span className="text-[10px] font-bold text-wine">Strawberry Tart</span>
              </div>

              {/* Counter Skirt (Gingham Caro Red + Badges) */}
              <div className="relative w-full h-20 pattern-gingham-red border-4 border-t-0 border-wine shadow-[0_6px_0_#741329] rounded-b-xl flex items-center justify-around px-4">
                <div className="px-3 py-1 bg-[#ffc6db] border-2 border-wine rounded-full text-xs font-bold shadow-xs flex items-center gap-1 text-wine">
                  <span>🎀</span> <span>Handmade</span>
                </div>
                <div className="px-3 py-1 bg-[#ffc6db] border-2 border-wine rounded-full text-xs font-bold shadow-xs flex items-center gap-1 text-wine">
                  <span>🍓</span> <span>Fresh Daily</span>
                </div>
                <div className="px-3 py-1 bg-[#ffc6db] border-2 border-wine rounded-full text-xs font-bold shadow-xs flex items-center gap-1 text-wine">
                  <span>🎀</span> <span>Custom Style</span>
                </div>
              </div>
            </div>

          </div>

          {/* Floral Meadow Garland Footer */}
          <div className="w-full mt-6 bg-[#A9CA69] border-t-4 border-b-2 border-wine py-4 px-4 sm:px-8 select-none shadow-sm">
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Left Flower Bouquet Cluster */}
              <div className="flex items-center gap-3 text-2xl">
                <div className="flex items-center gap-1.5 bg-[#FFF9E6] border-2 border-wine px-3.5 py-1 rounded-full text-xs font-bold text-wine shadow-[2px_2px_0_#9f1e31]">
                  <span className="text-base">🌼</span>
                  <span>Hoa Cúc Đồng Nội</span>
                </div>
                <span className="text-xl">🌸</span>
                <span className="text-xl">🌻</span>
                <span className="text-xl">🌷</span>
              </div>

              {/* Center Copyright Tag */}
              <div className="text-center font-bold text-xs text-wine tracking-wide">
                © 2026 SUGARY SPARKS • TIỆM BÁNH THỦ CÔNG KAWAII VINTAGE
              </div>

              {/* Right Flower Bouquet Cluster */}
              <div className="flex items-center gap-3 text-2xl">
                <span className="text-xl">🌷</span>
                <span className="text-xl">🌻</span>
                <span className="text-xl">🌸</span>
                <div className="flex items-center gap-1.5 bg-[#FFF9E6] border-2 border-wine px-3.5 py-1 rounded-full text-xs font-bold text-wine shadow-[2px_2px_0_#9f1e31]">
                  <span className="text-base">✨</span>
                  <span>Ngọt Ngào Từng Khoảnh Khắc</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================
          PART 2: MAIN HERO SECTION EDITORIAL
          ("Một chiếc bánh, thật là bạn.")
         ========================================== */}
      <section className="snap-section relative z-10 w-full striped-hero-bg pt-10 sm:pt-14 pb-0 border-b-2 border-wine scroll-mt-24 sm:scroll-mt-28 min-h-[calc(100vh-5.5rem)] flex flex-col justify-between">
        <div className="max-w-[1220px] w-full mx-auto px-6 lg:px-8 my-auto py-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center min-h-[440px]">
            {/* Left Editorial Copy */}
            <div className="lg:col-span-7 flex flex-col items-start">
              <ScrollReveal animation="fade-up" delay={100}>
                <span className="inline-block -rotate-3 bg-[#fffaf3] border-2 border-wine rounded-full text-wine px-5 py-2 mb-5 text-sm font-extrabold shadow-[3px_3px_0_#ffc6db]">
                  ✦ Bánh kem theo ý bạn ✦
                </span>
              </ScrollReveal>

              <ScrollReveal animation="fade-up" delay={150}>
                <h1 className="font-savoure text-5xl sm:text-6xl lg:text-7xl font-bold text-wine tracking-normal leading-[1.05] mb-6 drop-shadow-[3px_3px_0_#ffe2cd]">
                  Một chiếc bánh,<br />
                  <em className="font-normal italic text-[#be4876]">thật là bạn.</em>
                </h1>
              </ScrollReveal>

              <ScrollReveal animation="fade-up" delay={200}>
                <p className="text-base sm:text-lg text-[#52202b] bg-[#fffaf3]/90 backdrop-blur-sm p-4 rounded-xl border border-wine/20 max-w-xl mb-8 leading-relaxed shadow-sm">
                  Kể cho chúng mình chiếc bánh bạn đang nghĩ tới. SweetCake giúp bạn tìm mẫu phù hợp từ hơn 200+ bánh có sẵn hoặc kết nối với tiệm nghệ nhân có thể làm theo ý tưởng ấy.
                </p>
              </ScrollReveal>

              <ScrollReveal animation="fade-up" delay={250}>
                <div className="flex flex-wrap items-center gap-4 mb-4">
                  <a
                    className="cakematch-btn"
                    href="/ai-studio"
                    onClick={(e) => {
                      e.preventDefault()
                      onNavigate && onNavigate('ai-studio')
                    }}
                  >
                    <span>Tạo bánh theo ý tôi</span>
                    <span className="material-symbols-outlined text-lg" aria-hidden="true">arrow_outward</span>
                  </a>

                  <a
                    className="cakematch-btn-secondary"
                    href="/explore"
                    onClick={(e) => {
                      e.preventDefault()
                      onNavigate && onNavigate('explore')
                    }}
                  >
                    <span>Xem thực đơn bánh</span>
                  </a>

                  <a
                    className="cakematch-btn-secondary"
                    href="/bidding"
                    onClick={(e) => {
                      e.preventDefault()
                      onNavigate && onNavigate('bidding')
                    }}
                  >
                    <span>Đăng yêu cầu đấu giá</span>
                    <span className="material-symbols-outlined text-base" aria-hidden="true">arrow_outward</span>
                  </a>
                </div>

                <div className="text-[#9f1e31] text-sm font-bold mt-3">
                  Từ chiếc bánh có sẵn đến thiết kế dành riêng cho bạn ♡
                </div>
              </ScrollReveal>
            </div>

            {/* Right Visual Art */}
            <div className="lg:col-span-5 relative flex justify-center items-center">
              <ScrollReveal animation="zoom-in" delay={250}>
                <div className="relative max-w-md w-full">
                  {/* Backdrop radial glow */}
                  <div className="absolute inset-0 bg-radial from-[#fff3d2] via-[#fff3d2]/70 to-transparent rounded-full -z-10 scale-125 blur-xl"></div>

                  <div className="relative rounded-[160px_160px_28px_28px] border-4 border-wine bg-[#fffaf3] p-4 shadow-[10px_10px_0_#ffc6db] overflow-hidden">
                    <img
                      className="w-full h-[380px] object-cover rounded-[140px_140px_20px_20px] transition-transform duration-700 hover:scale-105"
                      alt="Bánh kem nghệ nhân SweetCake"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuAz3L8kKnfuSKlDjAaJObSn8OAEAElIZ_S4_ldaIr7AcZD7DBadskF-ZDJjk4kiqQYS66NaoD1C6ZYN8wguCBT3TPitEZH5nPX9CLZiD6mxbWpueSpAoDir3LkyqYVRSjOX_KgkA7UKkn29JXQeZeubCQ8woq3KNEQhglsikNCNbFNnkD5D-leFqnHyCy5joy1Fzl2K1tliyOcyqOM1HLH30qIQy-Juj6x9ARXf66qUVJ5raEQ8OjR9"
                    />
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-wine text-white text-xs font-bold px-4 py-1.5 rounded-full border border-white/40 shadow-md whitespace-nowrap">
                      ✦ SweetCake Atelier Edition ✦
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>

        {/* Checkerboard Band Divider */}
        <div className="check-band w-full shrink-0" aria-hidden="true"></div>
      </section>
    </>
  )
}

export default HeroSection
