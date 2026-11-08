/**
 * SweetCake Procedural AI Cake Generator
 * Dynamically synthesizes custom cake design vectors from user prompts.
 */

export function generateCakeSvg(prompt = '', variant = 0, ratio = '1:1') {
  const p = (prompt || '').toLowerCase()
  const w = ratio === '4:3' ? 1024 : ratio === '3:4' ? 768 : 1024
  const h = ratio === '4:3' ? 768 : ratio === '3:4' ? 1024 : 1024

  // Determine tiers
  const tierCount = p.includes('3 tầng') || p.includes('3-tier') || p.includes('ba tầng') ? 3
    : p.includes('1 tầng') || p.includes('bento') || p.includes('mini') ? 1
    : 2

  // Determine primary theme & color palette
  let bgTop = '#FBF8F5', bgBottom = '#EFE6DE'
  let tierBase = '#FBF9F6', tierShadow = '#E8E1D9'
  let frosting = '#FFFDFB', frostingShadow = '#ECE4DC'
  let accent = '#D4AF37', accentLight = '#FFDF73'
  let themeType = 'classic'

  if (p.includes('biển') || p.includes('vỏ sò') || p.includes('xanh pastel') || p.includes('ocean') || p.includes('sea')) {
    themeType = 'ocean'
    bgTop = '#F0F9FF'; bgBottom = '#E0F2FE'
    tierBase = '#E0F7FA'; tierShadow = '#B2EBF2'
    frosting = '#F0FDFA'; frostingShadow = '#CCFBF1'
    accent = '#0D9488'; accentLight = '#5EEAD4'
  } else if (p.includes('cưới') || p.includes('hoa lan') || p.includes('vàng 24k') || p.includes('wedding') || p.includes('fondant')) {
    themeType = 'wedding'
    bgTop = '#FAF7F2'; bgBottom = '#EDE4D8'
    tierBase = '#FDFCFA'; tierShadow = '#EFE8DE'
    frosting = '#FFFFFF'; frostingShadow = '#F5EFE6'
    accent = '#D4AF37'; accentLight = '#FDE047'
  } else if (p.includes('hồng') || p.includes('dâu') || p.includes('strawberry') || p.includes('korean') || p.includes('hàn quốc')) {
    themeType = 'korean_pink'
    bgTop = '#FFF1F2'; bgBottom = '#FCE7F3'
    tierBase = '#FFE4E6'; tierShadow = '#FECDD3'
    frosting = '#FFF5F7'; frostingShadow = '#FBCFE8'
    accent = '#E11D48'; accentLight = '#FB7185'
  } else if (p.includes('socola') || p.includes('choc') || p.includes('cacao')) {
    themeType = 'chocolate'
    bgTop = '#FAF5F0'; bgBottom = '#EFE0D5'
    tierBase = '#451A03'; tierShadow = '#270E02'
    frosting = '#78350F'; frostingShadow = '#451A03'
    accent = '#D97706'; accentLight = '#FCD34D'
  } else if (p.includes('matcha') || p.includes('trà xanh')) {
    themeType = 'matcha'
    bgTop = '#F2F9F2'; bgBottom = '#E2EFE2'
    tierBase = '#86A789'; tierShadow = '#6B8A6E'
    frosting = '#EBF3E8'; frostingShadow = '#D2E3C8'
    accent = '#4F6F52'; accentLight = '#A9C4A6'
  } else if (p.includes('elsa') || p.includes('băng giá') || p.includes('công chúa')) {
    themeType = 'elsa'
    bgTop = '#F0F9FF'; bgBottom = '#E0F2FE'
    tierBase = '#BAE6FD'; tierShadow = '#7DD3FC'
    frosting = '#F0F9FF'; frostingShadow = '#E0F2FE'
    accent = '#0284C7'; accentLight = '#38BDF8'
  }

  // Coordinates
  const cx = w / 2
  const tableY = Math.round(h * 0.77)
  const standW = Math.round(w * 0.72)

  // Generate tier dimensions
  const tiers = []
  if (tierCount === 3) {
    tiers.push({ w: Math.round(w * 0.48), h: Math.round(h * 0.15) })
    tiers.push({ w: Math.round(w * 0.36), h: Math.round(h * 0.14) })
    tiers.push({ w: Math.round(w * 0.24), h: Math.round(h * 0.13) })
  } else if (tierCount === 2) {
    tiers.push({ w: Math.round(w * 0.50), h: Math.round(h * 0.19) })
    tiers.push({ w: Math.round(w * 0.34), h: Math.round(h * 0.17) })
  } else {
    tiers.push({ w: Math.round(w * 0.46), h: Math.round(h * 0.24) })
  }

  // Render SVG layers
  let currentY = tableY
  const tierSvgBlocks = []
  tiers.forEach((tier, idx) => {
    const y = currentY - tier.h
    const x = cx - tier.w / 2
    currentY = y + 8 // slight overlap

    // Drips or borders
    const dripCount = 8 + idx * 3
    const step = tier.w / dripCount
    let drips = ''
    for (let d = 0; d < dripCount; d++) {
      const dx = x + d * step + step * 0.2
      const dy = y + tier.h * 0.4
      const dLen = ((d * 7 + variant * 3) % 4 + 2) * (tier.h * 0.12)
      drips += `<rect x="${dx.toFixed(1)}" y="${dy.toFixed(1)}" width="${(step * 0.6).toFixed(1)}" height="${dLen.toFixed(1)}" rx="4" fill="url(#frostGrad)" />`
    }

    // Pearls along bottom
    let pearls = ''
    const pearlCount = Math.round(tier.w / 18)
    for (let pr = 0; pr < pearlCount; pr++) {
      const px = x + pr * 18 + 4
      const py = y + tier.h - 5
      pearls += `<circle cx="${px}" cy="${py}" r="5" fill="${accent}" opacity="0.9" />`
      pearls += `<circle cx="${px - 1}" cy="${py - 1}" r="1.5" fill="#FFF" opacity="0.8" />`
    }

    tierSvgBlocks.unshift(`
      <g class="tier-${idx}">
        <!-- Tier Shadow -->
        <rect x="${x + 6}" y="${y + 6}" width="${tier.w}" height="${tier.h}" rx="14" fill="#000" opacity="0.08" />
        <!-- Tier Body -->
        <rect x="${x}" y="${y}" width="${tier.w}" height="${tier.h}" rx="12" fill="url(#tierGrad)" />
        <!-- Top Frosting Coat -->
        <rect x="${x}" y="${y}" width="${tier.w}" height="${Math.round(tier.h * 0.42)}" rx="10" fill="url(#frostGrad)" />
        ${drips}
        ${pearls}
        <!-- Specular Highlight -->
        <path d="M ${x + 10} ${y + 6} Q ${cx} ${y + 12} ${x + tier.w - 10} ${y + 6}" stroke="#FFFFFF" stroke-width="2.5" opacity="0.6" fill="none" />
      </g>
    `)
  })

  // Topper decorations based on prompt
  const topY = currentY - 10
  let topperSvg = ''
  const hasCandle = p.includes('nến') || p.includes('candle') || p.includes('tuổi') || p.includes('sinh nhật')

  if (hasCandle) {
    [-32, 0, 32].forEach((ox, i) => {
      const candleX = cx + ox
      topperSvg += `
        <g class="candle-${i}">
          <rect x="${candleX - 4}" y="${topY - 46}" width="8" height="44" rx="2" fill="url(#goldGrad)" />
          <line x1="${candleX}" y1="${topY - 46}" x2="${candleX}" y2="${topY - 54}" stroke="#333" stroke-width="2" />
          <circle cx="${candleX}" cy="${topY - 66}" r="14" fill="#FFB703" opacity="0.3" filter="url(#glow)" />
          <ellipse cx="${candleX}" cy="${topY - 65}" rx="5" ry="10" fill="#FB8500" />
          <ellipse cx="${candleX}" cy="${topY - 62}" rx="2.5" ry="6" fill="#FFFBEB" />
        </g>
      `
    })
  } else if (themeType === 'ocean') {
    // Seashells & Sea star topper
    topperSvg += `
      <g class="seashell-cluster">
        <!-- Center Giant Pearl -->
        <circle cx="${cx}" cy="${topY - 24}" r="22" fill="#F0FDFA" stroke="#99F6E4" stroke-width="2" />
        <circle cx="${cx - 6}" cy="${topY - 30}" r="6" fill="#FFF" opacity="0.9" />
        <!-- Shell Leaves -->
        <path d="M ${cx - 36} ${topY - 8} Q ${cx - 50} ${topY - 44} ${cx - 20} ${topY - 32} Z" fill="url(#accentGrad)" />
        <path d="M ${cx + 36} ${topY - 8} Q ${cx + 50} ${topY - 44} ${cx + 20} ${topY - 32} Z" fill="url(#accentGrad)" />
        <!-- Sea Star -->
        <polygon points="${cx},${topY - 52} ${cx + 7},${topY - 34} ${cx + 26},${topY - 34} ${cx + 11},${topY - 22} ${cx + 17},${topY - 4} ${cx},${topY - 16} ${cx - 17},${topY - 4} ${cx - 11},${topY - 22} ${cx - 26},${topY - 34} ${cx - 7},${topY - 34}" fill="#FDBA74" stroke="#FB923C" stroke-width="1.5" />
      </g>
    `
  } else if (themeType === 'wedding') {
    // Elegant Cascading Orchids & Gold Leaf Topper
    topperSvg += `
      <g class="orchid-cluster">
        <circle cx="${cx}" cy="${topY - 26}" r="26" fill="url(#goldGrad)" opacity="0.3" filter="url(#glow)" />
        <!-- Orchid Petals -->
        <ellipse cx="${cx}" cy="${topY - 34}" rx="14" ry="24" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5" transform="rotate(-20 ${cx} ${topY - 34})" />
        <ellipse cx="${cx}" cy="${topY - 34}" rx="14" ry="24" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5" transform="rotate(20 ${cx} ${topY - 34})" />
        <ellipse cx="${cx - 24}" cy="${topY - 24}" rx="16" ry="12" fill="#FFFDF5" stroke="#E2E8F0" stroke-width="1.5" />
        <ellipse cx="${cx + 24}" cy="${topY - 24}" rx="16" ry="12" fill="#FFFDF5" stroke="#E2E8F0" stroke-width="1.5" />
        <!-- Orchid Center / Lip -->
        <circle cx="${cx}" cy="${topY - 24}" r="9" fill="#E879F9" />
        <circle cx="${cx}" cy="${topY - 24}" r="5" fill="#FDE047" />
        <!-- Gold Leaf Accents -->
        <circle cx="${cx - 36}" cy="${topY - 14}" r="7" fill="url(#goldGrad)" />
        <circle cx="${cx + 38}" cy="${topY - 18}" r="8" fill="url(#goldGrad)" />
      </g>
    `
  } else {
    // Fresh Berries & Floral Bouquet
    [-38, -16, 12, 38].forEach((bx, i) => {
      const by = topY - 14 - Math.abs(bx) / 6
      topperSvg += `
        <circle cx="${cx + bx}" cy="${by}" r="15" fill="${accent}" />
        <circle cx="${cx + bx - 4}" cy="${by - 4}" r="4" fill="#FFF" opacity="0.7" />
        <path d="M ${cx + bx + 8} ${by - 8} Q ${cx + bx + 18} ${by - 18} ${cx + bx + 6} ${by - 18} Z" fill="#15803D" />
      `
    })
  }

  // Sanitize prompt for SVG text
  const cleanPrompt = (prompt || 'Bánh nghệ thuật SweetCake AI')
    .replace(/[<>&"']/g, '')
    .slice(0, 68)

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="100%" height="100%">
  <defs>
    <radialGradient id="bgGrad" cx="50%" cy="40%" r="65%">
      <stop offset="0%" stop-color="${bgTop}" />
      <stop offset="100%" stop-color="${bgBottom}" />
    </radialGradient>
    <linearGradient id="tierGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${tierShadow}" />
      <stop offset="25%" stop-color="${tierBase}" />
      <stop offset="70%" stop-color="${tierBase}" />
      <stop offset="100%" stop-color="${tierShadow}" />
    </linearGradient>
    <linearGradient id="frostGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${frosting}" />
      <stop offset="100%" stop-color="${frostingShadow}" />
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FDE047" />
      <stop offset="50%" stop-color="#D4AF37" />
      <stop offset="100%" stop-color="#A16207" />
    </linearGradient>
    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${accentLight}" />
      <stop offset="100%" stop-color="${accent}" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Background Canvas -->
  <rect width="${w}" height="${h}" fill="url(#bgGrad)" />

  <!-- Ambient Light Circle -->
  <circle cx="${cx}" cy="${Math.round(h * 0.48)}" r="${Math.round(w * 0.42)}" fill="#FFFFFF" opacity="0.45" filter="url(#glow)" />

  <!-- Cake Stand / Pedestal -->
  <g class="pedestal">
    <!-- Stand Shadow -->
    <ellipse cx="${cx}" cy="${tableY + 36}" rx="${Math.round(standW * 0.46)}" ry="18" fill="#000" opacity="0.12" />
    <!-- Stand Rim -->
    <ellipse cx="${cx}" cy="${tableY + 20}" rx="${Math.round(standW * 0.42)}" ry="14" fill="#CBD5E1" />
    <rect x="${cx - Math.round(standW * 0.40)}" y="${tableY + 4}" width="${Math.round(standW * 0.80)}" height="16" fill="#E2E8F0" rx="4" />
    <ellipse cx="${cx}" cy="${tableY + 4}" rx="${Math.round(standW * 0.40)}" ry="16" fill="#F8FAFC" />
  </g>

  <!-- Cake Tiers -->
  ${tierSvgBlocks.join('\n')}

  <!-- Topper Decorations -->
  ${topperSvg}

  <!-- Watermark & Prompt Showcase Badge -->
  <g class="prompt-badge" transform="translate(${Math.round(w * 0.08)}, ${Math.round(h * 0.88)})">
    <rect width="${Math.round(w * 0.84)}" height="76" rx="16" fill="#1E1B18" fill-opacity="0.88" />
    <rect width="${Math.round(w * 0.84)}" height="76" rx="16" stroke="#D4AF37" stroke-width="1.2" stroke-opacity="0.4" fill="none" />
    <text x="24" y="28" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="700" font-size="13" fill="#FDE047" letter-spacing="1.5">SWEETCAKE AI STUDIO · MẪU PHÁC THẢO TỰ ĐỘNG #${variant + 1}</text>
    <text x="24" y="54" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="400" font-size="14" fill="#FFFFFF" opacity="0.95">“${cleanPrompt}”</text>
  </g>
</svg>`
}

/**
 * Returns a self-contained Data URI containing the generated SVG cake design.
 */
export function generateCakeDataUri(prompt, variant = 0, ratio = '1:1') {
  const svg = generateCakeSvg(prompt, variant, ratio)
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
}

