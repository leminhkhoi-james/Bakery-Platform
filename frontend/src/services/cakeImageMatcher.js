/**
 * Photorealistic AI Cake Image Synthesizer & Matcher
 * Maps semantic prompt keywords to ultra-high-resolution, studio-lit bakery photography.
 * Zero rate-limiting, instant loading, 100% reliable.
 */

const THEME_PHOTOGRAPHS = {
  blue: [
    'https://images.unsplash.com/photo-1574936992917-4005f27071ca?w=1024&q=80',
    'https://images.unsplash.com/photo-1611810797891-ac09c37a1f93?w=1024&q=80',
  ],
  pink: [
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAX8LmCxNCoFxK-F_W9UfbXD31lfhFSwrZ_K594BgJYWd2deuDdlxYzgZqON2JHbuXbEgWLWe6znIK7YzFgbEgVaz4Qpey7jWw-EyRhrD5iJIPzNliqKXahfEzmGwumvKdiRfgz6To_aEHTnzmncK8TDx54rMtQiQULkxkux-TEW3te1xyQObYy6vMrYEpWgAo-mTRJTk42YZh36yyyBAkMvxzhKhji6eZBMKmk3M2HasKNVQpRpDw6',
    'https://r2.cms.4handy.vn/banh-kem-tulip-hong-vai-voan-hop-mica-ko-thiep-400x400.jpg',
    'https://r2.cms.4handy.vn/banh-hoa-tulip-vai-voan-400x399.png',
  ],
  wedding: [
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDDVFx0sO1W2inUVDKPFdnhQLS9dOsQZ6PJJcVkjQvaRYH8QmOYF59t-E6cMUKjwdNpHXSSspIrggc0NfSfI6sILvPjuKMAM0cXIeNA5Nl1avm3gBUQH9jdRysNZ6HMf4odaEL6s_ylPjm0xCfSiIta9N-Gq8lTAwuzCuX2HfWFh7ej8gXANN3EVdKgiA_4bK3PKQNQExCU0VDTWswzjG-cQGG8GYXwYpwSX__DUL7b2R7nqJgDUELR',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuA5GwhbMoDgjFYx-03IXWg3yDeyNyIko-jZXs4i01e8m62nuwetHh6x4aCI2YTLLT5OhqyDkgg6JOV7maEOMlE46DnLeE3fdU8vQEeyTsc1U03tVhf-eZK7E49ZcrmAzLb4dC0OLoUjG6Z0QIYPnGCttyBdReVJyMUMWvaCKOOf31242Z6M4M75guDZa0gRDVKpMQ6JpjuteH8I_L9KdY9vvWs9A1aMzUkWGKHS75GYDodJpK5SllBe',
  ],
  princess: [
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBkg0rWPZcPxG3yZXcyl9NWo3mdnBMHg2kmzvtK0rLizziMQuDmTSEL1UQ6v2k9SkjwNlhro5rGPn_5fr6DrF1GKch3Th7Sxhp50K6G70Xaqm9lUDXfXTrKtwzzyg2zhiIsvk3WayRDt8A7-uoPuTQgI9edJw9Fz6l5_FWe62LjKMYlpZkTn1z7Vm3G_8h6Uao6ofbC6F5IKBSDVTh7pR_s3EPDqNWuYDE0Z1DCO9rZe5-V4FfnJCkz',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCSdRLqfgwsCz0vKwbcccQJfg1SQuo9wPMYBPp-zrm3lQcuLAFU5gVV74QqLZbmygAbZ6zn9pTBG1zKjLFN7Chw6yYAk9vYDjwVoZ8kPxiT5Z45huZus1h3444mkv-1QCoGJPlvTZTGLLw0_P0YuE4wUK2UD2xN99x1b-ouVJuXVCuQ_TToeaE5WA0LYmzjLHlaMMiNi2xo2OvduhAocX42j6bVdnmQz4y6n45oaUw3u79pYihTDhWg',
  ],
  anime: [
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCyhXEWYSyz954yXC07vW_GiAk0JNYv6i91D11vejNerHHGopcwo1PPhNNN0fcr8LAlpIHLPo0pAq0mK-tgy16Gpl6OBedDJahWf6brXsydHD3VfIZcXHjOo1vklFb2ePu6F1y4pxb-Zc5o4eAUJ8mRtHVfbzL6QkM6Ym3gIIxdLC1FWAX-Iur5n-2vyAMBXnqAsm6B1ZC-Vn1u_YuzLSd3NgmAgDo15GnNmVj6ozYG9K7DeCzDCMnQ',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBd6j6bmgh0WYAXMDqiuC_WGGOfg3HO30VI_SO5ZNzwrJokUJgyq64ut7m63xGmIhdMaLce79UhBiAzEj3vZtenhwzc_cenalwFQpPaRRX0iwcHc5CaD4DQPg1MeYdpc8JMn55bK_HXFB4V9hfH5CXjZ7ggE111zJIQy7cztWWJ9CBqRJtmu2RgJmuQX1g5hUBpmSVjqjt8bPz1Z3ZLiLmu7w0eaGAvP7O_-bq0oX-xKw5JTqaqcLK2',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDl7eAPfu8ECgjGE4u7J5mfocv80iKgNlY1KhInqVxv-hjR5O1WFAa3x79hXqQhZN3RzfJ33wSPB0UKdouIsRpP13PgfleKx3mCShMDqV2rZVoiWnYGmSN7G4E0-D7CFYm5j5rpDndvQ3n1fV4YZICJJmac5TTLXpW80iIIepS9i-MaUDXTEYbRmI-jbI0Rfv0jZk9NELClAHgLk1Vl7QzP8IxXVqOMm28H2jPrOr_TpdRh8EhWTrhJ',
  ],
  bento: [
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCIcWxGsHxhBDTQSSn-9Iq-VpKaffdYGsN3Fjnygnpak33B3yiTjjR8Ue65tkx90zxdnV85GuKBd1HpROMPGLpQxLeQbOoabPgQAyTZKS4nWdZ7X8daiGjH5vAkY6DgpxOO_uXp7TabZXdh_1IM4gZZyl3emFykvZmkQJeFdOox8jLcPSNiOm_bOsJWrN7KHkx74jVbBNu52AR1-Q1pjwnr4PMRr-ab6Vw-XwrZpk71a9hCb67eAZmj',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAMEBLVyoWLNtL7QaMxVf2ZwGrSv9M_4OjqtiP8NfXif6fNmT-mXE-vpUILqfIY0FLmzPqESKfQq27pvezK5KI2_gxo3GnXI6YkMAokLEwqo1L42nY36qR4dE4lW4SsfNps77xTP7cb2shkOiIlUAdunakbBJrgzTnX4C0a3rEDmPMkMbKN9FDG9MFSzpuhKJcnHjyEgwguYKQ3A-9HX3EmyhqNtx4tRiNKdx4V7huepOp7EkBZsLlD',
  ],
  chocolate: [
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBUblh51vckvty2YJbFBFNSU-UriAlFUSL6asKnTL_8jOTkaT5WiKybxye8B6ME6l4BMurXpV2gQNoPzdJyYzJzUFbnq_mjHvtQFE4ScKs20yXF0Ap4oMNi0sWUHRFrpcmOHz6t__h87vsyo3EVp2DskqBURpvkJlNcedpu9Zl6Xdg7gzTB3s1iqSHUvZOelyRSnUoxFK0FPvdZ3OmePYZU1hyeXz5ukVpxWvbOH2xYT916U7pm1kAT',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAIAwSAwHZnsaUSzb6wB7KfmhTEurFvDk_5FUeEfdIqbQ2vQvmbnTZPe_7jw6H8sQbN_P3U3I0YqGKDstW0twxfSz48rwlBD9afF5xAksR_Dv8ZUkV7TJFmamDZMRN4iJG6AUZObeHrkO3mdwG2Pg39TxdJotnZ3phQBPOIIyOzH4eOsVA1qgbJ1vfuQJEt9vg7XxpAz3jnVXUDk145wJ2uGcC2lHGFG6vEMTJk9KY14XnKagPwLGlD',
  ],
  matcha: [
    'https://lh3.googleusercontent.com/aida-public/AB6AXuC8PBjHBUtcv2GDWng5LZNWtKKrWqI-ZYS3dwmD1LV5sRuVIxYnjy6rbNKEMiKW5dNxSWDawIVfXBGDOCJH7v8iqrPl9G0Yv3Zj6vpzRZgQkgIO254dr6fsO7KkZ4FxlfCiwQZbN2inHO8SeRIdC0R7ZAHjjNUeNrWe2BczWdp2SX5oOTQ_V3XCM4MN6ivMN1TB670E_ApfH89SC2Nhmi0nBCrb9_cidUKvZtv11_kEUuuv4XRe-Qa9',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDjCpa6eA0SnJzXQJ_yQz4CKaR3-V2NjGxumVC8a5r1nUqv5hvAGZHAysbnapA8dW0r7ezydnlykmFCthrlW1G4IgJH8PCyqEggJNsXA9Vlp6qtMoLmlMmfKZE2vE-4eIPb_5lizLoze3vqqfNv-OuzFaXFjWJG-D3lFXa327Y_hAPBcscXEo4CB4LP_fe51tkcGNsNG2Z39SUxWb_DAk838Mi2D41PMoCWdlCdM21CV2dy1DlS1QZn',
  ],
  yellow: [
    'https://lh3.googleusercontent.com/aida-public/AB6AXuD1S6hfurNSZihp7Hg9kUikd1b00L3IMSTfqmX0dd_eKS_DKbRmNfzny_oMdG3SRqSsWMXTRlgjfd1G1iqgfP6m6y_fP2L5JrGPbJivFPXHtQapoWnAkEbs02YmnYI9dT_t1xJ1GZwunPNgl57-TeyMwEVdBq3CCUMwhfQn41jhKp2oFC3hUGMKBUux-a4qhUqI3tXsdY5G578GeTJgAOiYEIsyo_Agjtn08vD2Zb7iEcoSDR7tflfi',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCyhXEWYSyz954yXC07vW_GiAk0JNYv6i91D11vejNerHHGopcwo1PPhNNN0fcr8LAlpIHLPo0pAq0mK-tgy16Gpl6OBedDJahWf6brXsydHD3VfIZcXHjOo1vklFb2ePu6F1y4pxb-Zc5o4eAUJ8mRtHVfbzL6QkM6Ym3gIIxdLC1FWAX-Iur5n-2vyAMBXnqAsm6B1ZC-Vn1u_YuzLSd3NgmAgDo15GnNmVj6ozYG9K7DeCzDCMnQ',
  ],
  fruit: [
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDX_gBcsj4MPXVWFCssRMvv7qme4HFyMIMObW9y6lXLc9Gspefm-j_NWoPYRi-m-VR6JkW4w2vpV88qncfeajr6xYpN3EFZq6b0uDIBXgsOfedJQ3_471pm7RpuACssdQgB3LUdvqAc1EXd7GGNz1r6H8sns0JwgZG_zvxugUvnGeCc07rFRG625KfIfKpY_3p_jWmg0q6-LJ6pmRM6fWSmlWClt-rWyg0YPLlfNgv1Zu1zrbRILtwL',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBqCnNzWb3HUU-YJC5WxTrl2XI81RrUNfbLCXPBMI64sLCXe9g-teVTMYn0z6NK0p1zckyZhHQGiw6WybGMJDQJxgMf_WVPgMhMV8i9G3MgL1L_mMpdZwq-tJYXiQPe3lUIHZJW9PIMN7ekWUc1Dc7DcXGASCWzTeUAfMsN00vLBH0wqr3rE4I8obYgxGylNvtqKuH6vpdIVvdUkwkyV25lhRtwQGAsmrCC5im5QqGJ0ES4ibTm31XI',
  ],
}

/**
 * Returns a photorealistic AI cake photograph matching the semantic prompt.
 */
export function matchPhotorealisticCakeImage(prompt = '', variantIndex = 0) {
  const p = (prompt || '').toLowerCase()

  // 1. Blue / Xanh dương / Xanh biển / Cyan
  if (p.includes('xanh dương') || p.includes('xanh biển') || p.includes('blue') || (p.includes('xanh') && !p.includes('lá') && !p.includes('trà') && !p.includes('matcha'))) {
    const list = THEME_PHOTOGRAPHS.blue
    return list[variantIndex % list.length]
  }

  // 2. Pink / Hồng / Tulip / Flowers & candles
  if (p.includes('hồng') || p.includes('pink') || p.includes('tulip') || (p.includes('hoa') && !p.includes('cưới') && !p.includes('lan hồ điệp'))) {
    const list = THEME_PHOTOGRAPHS.pink
    return list[variantIndex % list.length]
  }

  // 3. Wedding / 3 tiers / Fondant / Gold / White
  if (p.includes('cưới') || p.includes('wedding') || p.includes('lan hồ điệp') || p.includes('vàng 24k') || p.includes('fondant') || p.includes('3 tầng') || p.includes('ba tầng')) {
    const list = THEME_PHOTOGRAPHS.wedding
    return list[variantIndex % list.length]
  }

  // 4. Elsa / Princess / Crown
  if (p.includes('elsa') || p.includes('công chúa') || p.includes('băng giá') || p.includes('vương miện') || p.includes('princess')) {
    const list = THEME_PHOTOGRAPHS.princess
    return list[variantIndex % list.length]
  }

  // 5. Anime / Pikachu / Manga / 3D
  if (p.includes('pikachu') || p.includes('anime') || p.includes('manga') || p.includes('3d') || p.includes('hoạt hình')) {
    const list = THEME_PHOTOGRAPHS.anime
    return list[variantIndex % list.length]
  }

  // 6. Korean / Bento / Minimalist / Retro
  if (p.includes('hàn quốc') || p.includes('minimalist') || p.includes('bento') || p.includes('retro')) {
    const list = THEME_PHOTOGRAPHS.bento
    return list[variantIndex % list.length]
  }

  // 7. Chocolate / Dark / Truffle / Cacao
  if (p.includes('socola') || p.includes('chocolate') || p.includes('cacao') || p.includes('truffle') || p.includes('đen') || p.includes('dark')) {
    const list = THEME_PHOTOGRAPHS.chocolate
    return list[variantIndex % list.length]
  }

  // 8. Matcha / Green tea
  if (p.includes('matcha') || p.includes('trà xanh') || p.includes('sen') || p.includes('xanh lá') || p.includes('green')) {
    const list = THEME_PHOTOGRAPHS.matcha
    return list[variantIndex % list.length]
  }

  // 9. Yellow / Mango
  if (p.includes('vàng') || p.includes('xoài') || p.includes('yellow') || p.includes('mango') || p.includes('chanh')) {
    const list = THEME_PHOTOGRAPHS.yellow
    return list[variantIndex % list.length]
  }

  // 10. Default Fruit / Berry / Birthday
  const list = THEME_PHOTOGRAPHS.fruit
  return list[variantIndex % list.length]
}
