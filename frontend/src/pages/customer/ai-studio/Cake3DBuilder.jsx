import React, { useRef, useState } from 'react'
import { Icon } from '../../../components/common/WorkspaceUI.jsx'
import { buttonClass, inputClass } from '../../../components/management/ApiState.jsx'
import ThreeCakeCanvas from './ThreeCakeCanvas.jsx'

export const STUDIO_RFQ_DRAFT_KEY = 'sweetcake_studio_rfq_draft'

export function saveStudioRfqDraft(draft) {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.setItem(STUDIO_RFQ_DRAFT_KEY, JSON.stringify(draft))
    }
  } catch {
    // Ignore storage errors in restricted environments
  }
}

export function consumeStudioRfqDraft() {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const raw = window.sessionStorage.getItem(STUDIO_RFQ_DRAFT_KEY)
      if (!raw) return null
      window.sessionStorage.removeItem(STUDIO_RFQ_DRAFT_KEY)
      return JSON.parse(raw)
    }
  } catch {
    // Ignore storage errors
  }
  return null
}

export const CAKE_SHAPES = [
  { id: 'round', label: 'Tròn cổ điển', icon: 'circle', desc: 'Dáng bánh kinh điển, mềm mại & thanh lịch' },
  { id: 'heart', label: 'Trái tim Sweetheart', icon: 'favorite', desc: 'Lãng mạn & ngọt ngào cho kỷ niệm' },
  { id: 'square', label: 'Khối vuông Bauhaus', icon: 'crop_square', desc: 'Góc cạnh hiện đại, phong cách đương đại' },
  { id: 'hexagon', label: 'Lục giác Origami', icon: 'hexagon', desc: 'Độc bản nghệ thuật, tạo điểm nhấn lạ mắt' },
]

export const CAKE_TIERS = [
  { id: 1, label: '1 Tầng Standard', subtitle: '4 – 8 khách · Tiệc ấm cúng' },
  { id: 2, label: '2 Tầng Grandeur', subtitle: '12 – 20 khách · Tiệc nổi bật' },
  { id: 3, label: '3 Tầng Haute Patisserie', subtitle: '25 – 40 khách · Đại tiệc & Cưới' },
]

export const CAKE_SIZES = [
  { id: '14cm', label: 'Size 14cm (Mini)', desc: 'Nhỏ xinh 2 – 4 người' },
  { id: '18cm', label: 'Size 18cm (Classic)', desc: 'Cỡ tiêu chuẩn 6 – 8 người' },
  { id: '22cm', label: 'Size 22cm (Signature)', desc: 'Cỡ lớn 10 – 14 người' },
  { id: '26cm', label: 'Size 26cm (Royal)', desc: 'Đại tiệc 16 – 22 người' },
]

export const CAKE_HEIGHT_STYLES = [
  { id: 'classic', label: 'Dáng tiêu chuẩn (Classic)', desc: 'Tỉ lệ truyền thống cân đối' },
  { id: 'tall', label: 'Dáng trụ cao (Tall Korean)', desc: 'Thân bánh cao thanh thoát hiện đại' },
]

export const SPONGE_FLAVORS = [
  { id: 'vanilla', name: 'Vanilla Bourbon Madagascar', color: '#f6e3ba', note: 'Bơ tươi Elle & Vire mịn thơm' },
  { id: 'choco', name: 'Chocolate Bỉ Cacao 70%', color: '#4e2f21', note: 'Đậm đà, vị đắng dịu quý phái' },
  { id: 'matcha', name: 'Matcha Uji Kyoto Hạng Nhất', color: '#769958', note: 'Hương trà xanh mộc mạc thanh thuần' },
  { id: 'redvelvet', name: 'Red Velvet Nhung Đỏ', color: '#9e2835', note: 'Kem chua nhẹ quyện cùng phô mai' },
  { id: 'earlgrey', name: 'Trà Bá Tước Earl Grey Anh', color: '#bca38b', note: 'Thơm ngát hương tinh dầu bergamot' },
  { id: 'mango', name: 'Xoài Cát Hoà Lộc Nhiệt Đới', color: '#f5c453', note: 'Chua ngọt tươi mát tự nhiên' },
]

export const FILLING_CREAMS = [
  { id: 'strawberry_jam', name: 'Mứt Dâu Tây Đà Lạt Tươi', color: '#e04f6b', note: 'Chua ngọt dịu, có thịt quả dâu' },
  { id: 'mascarpone', name: 'Kem Phô Mai Mascarpone Ý', color: '#fff9eb', note: 'Béo nhẹ thanh tao, tan trong miệng' },
  { id: 'salted_caramel', name: 'Sốt Caramel Muối Guerande', color: '#c97a2b', note: 'Mặn ngọt quyến rũ kiểu Pháp' },
  { id: 'dark_ganache', name: 'Ganache Socola Đen Nguyên Chất', color: '#382015', note: 'Sánh mịn đậm vị cacao nguyên bản' },
  { id: 'pistachio_cream', name: 'Kem Hạt Dẻ Cười Bronte', color: '#93b869', note: 'Bùi béo hương hạt dẻ cười tuyển chọn' },
  { id: 'passion_curd', name: 'Curd Chanh Dây Chua Dịu', color: '#f2b724', note: 'Thơm mát cân bằng vị ngọt' },
]

export const FROSTING_COLORS = [
  { id: 'sky', name: 'Xanh Pastel Ombre', hex: '#5cb6f9' },
  { id: 'rose', name: 'Hồng Dâu Ngọt', hex: '#ff8fb1' },
  { id: 'lavender', name: 'Tím Berry Pastel', hex: '#b784f7' },
  { id: 'blush', name: 'Hồng Phấn Baby', hex: '#f8bbd0' },
  { id: 'mint', name: 'Xanh Mint Tươi', hex: '#63e6be' },
  { id: 'butter', name: 'Vàng Bơ Pháp', hex: '#ffe066' },
  { id: 'peach', name: 'Cam Đào Sunset', hex: '#ffa87d' },
  { id: 'ivory', name: 'Kem Sữa Vani', hex: '#f7e6d0' },
  { id: 'matcha', name: 'Xanh Matcha', hex: '#88b06a' },
  { id: 'ruby', name: 'Đỏ Nhung Ruby', hex: '#e0314b' },
  { id: 'chocolate', name: 'Nâu Cacao Bỉ', hex: '#6d4530' },
  { id: 'midnight', name: 'Xanh Đêm Galaxy', hex: '#3b5bdb' },
]

export const FROSTING_FINISHES = [
  { id: 'smooth', label: 'Bơ láng mịn (Smooth Buttercream)', desc: 'Phẳng mịn chuẩn thẩm mỹ Hàn Quốc' },
  { id: 'fondant', label: 'Fondant lụa (Satin Fondant)', desc: 'Đứng phom sắc nét, sang trọng hoàn mỹ' },
  { id: 'glossy', label: 'Tráng gương (Mirror Glaze)', desc: 'Bóng bẩy bắt sáng lung linh' },
  { id: 'vintage', label: 'Vân kem gợn (Rustic Palette)', desc: 'Vệt phết kem nghệ thuật tự nhiên' },
]

export const DRIP_STYLES = [
  { id: 'none', label: 'Không phủ sốt chảy', color: null },
  { id: 'white_choco', label: 'Sốt Socola Trắng Mịn', color: '#fff8e8' },
  { id: 'dark_choco', label: 'Sốt Socola Đen Drip', color: '#3b2114' },
  { id: 'caramel', label: 'Sốt Caramel Hổ Phách', color: '#d4822a' },
  { id: 'strawberry', label: 'Sốt Dâu Tây Phấn', color: '#eb6588' },
  { id: 'gold_glaze', label: 'Sốt Nhũ Vàng Hoàng Gia', color: '#d4af37' },
]

export const BORDER_PIPINGS = [
  { id: 'pearl', label: 'Chuỗi hạt ngọc trai kem (Ảnh 1)', desc: 'Viền hạt tròn kem mịn ở chân tầng' },
  { id: 'whipped_swirls', label: 'Búp kem xoắn Meringue (Ảnh 2 & 3)', desc: 'Chóp kem xoắn chuẩn phong cách Patisserie Pháp' },
  { id: 'shell', label: 'Viền sò vỏ ốc cổ điển', desc: 'Múi kem bắt sò đều đặn truyền thống' },
  { id: 'vintage_ruffle', label: 'Viền ren bèo nhún Lambeth', desc: 'Bắt kem nhiều lớp cầu kỳ + dây kem rủ' },
  { id: 'none', label: 'Tối giản không bắt viền', desc: 'Cạnh bánh phẳng hiện đại' },
]

export const TOPPING_ITEMS = [
  { id: 'confetti_dots', label: 'Chấm bi Polka Dots đa sắc (Ảnh 1)', color: '#ff8fa3' },
  { id: 'whipped_kisses', label: 'Búp kem xoắn Meringue dâu (Ảnh 2)', color: '#e62872' },
  { id: 'strawberries', label: 'Dâu tây / Cherry đỏ căng bóng (Ảnh 3)', color: '#e0314b' },
  { id: 'macarons', label: 'Bánh Macaron Pháp pastel', color: '#f3a6c8' },
  { id: 'roses', label: 'Hoa hồng kem bơ 3D', color: '#f49cbb' },
  { id: 'bows', label: 'Nơ ruy băng Coquette', color: '#e15b85' },
  { id: 'gold_leaf', label: 'Dát lá vàng thực phẩm 24K', color: '#e6c14c' },
  { id: 'crown', label: 'Vương miện hoàng gia 3D', color: '#e0b841' },
]

export const CANDLE_STYLES = [
  { id: 'twisted', label: 'Bộ 3 nến kẹo sọc Pastel phát sáng (Ảnh 1 & 2)' },
  { id: 'single_wish', label: '1 nến ước nguyện chính giữa (Ảnh 3)' },
  { id: 'party_ring', label: 'Vòng nến sinh nhật quanh bánh (Ảnh 4)' },
  { id: 'gold_tall', label: 'Nến thon dài nhũ vàng (3 cây)' },
  { id: 'none', label: 'Không cắm nến' },
]

export const MESSAGE_POSITIONS = [
  { id: 'topper', label: 'Bảng cắm đỉnh bánh (Topper)', icon: 'flag' },
  { id: 'surface', label: 'Viết lên thẻ Socola mặt bánh', icon: 'edit_note' },
]

export const DESIGN_PRESETS = [
  {
    id: 'pastel_clay_duo',
    label: 'Pastel Clay 2 Tầng (Ảnh mẫu 1)',
    config: {
      tiers: 2,
      shape: 'round',
      size: '18cm',
      heightStyle: 'classic',
      sponge: 'vanilla',
      filling: 'strawberry_jam',
      finish: 'smooth',
      tierColors: ['#ceb0ec', '#bee3f8', '#ff8fb1'],
      activeTierColorIndex: 0,
      drip: 'white_choco',
      piping: 'pearl',
      pipingColor: '#cca9ea',
      toppings: ['confetti_dots'],
      candles: 'twisted',
      messageText: '',
      messagePosition: 'topper',
    },
  },
  {
    id: 'royal_blue_cream',
    label: 'Xanh Coban & Búp Kem Xoắn (Ảnh mẫu 2)',
    config: {
      tiers: 2,
      shape: 'round',
      size: '18cm',
      heightStyle: 'classic',
      sponge: 'choco',
      filling: 'dark_ganache',
      finish: 'smooth',
      tierColors: ['#2f66d4', '#2f66d4', '#2f66d4'],
      activeTierColorIndex: 0,
      drip: 'white_choco',
      piping: 'whipped_swirls',
      pipingColor: '#e62872',
      toppings: ['whipped_kisses'],
      candles: 'twisted',
      messageText: '',
      messagePosition: 'topper',
    },
  },
  {
    id: 'strawberry_cream',
    label: 'Dâu & Búp Kem Vani (Ảnh mẫu 3)',
    config: {
      tiers: 2,
      shape: 'round',
      size: '18cm',
      heightStyle: 'classic',
      sponge: 'vanilla',
      filling: 'strawberry_jam',
      finish: 'smooth',
      tierColors: ['#fff3df', '#ff8fb1', '#fff3df'],
      activeTierColorIndex: 0,
      drip: 'strawberry',
      piping: 'whipped_swirls',
      pipingColor: '#ffffff',
      toppings: ['strawberries', 'whipped_kisses'],
      candles: 'single_wish',
      messageText: '',
      messagePosition: 'topper',
    },
  },
  {
    id: 'party_candle_ring',
    label: 'Đại Tiệc Vòng Nến (Ảnh mẫu 4)',
    config: {
      tiers: 1,
      shape: 'round',
      size: '22cm',
      heightStyle: 'classic',
      sponge: 'vanilla',
      filling: 'strawberry_jam',
      finish: 'smooth',
      tierColors: ['#ffffff', '#ffffff', '#ffffff'],
      activeTierColorIndex: 0,
      drip: 'strawberry',
      piping: 'whipped_swirls',
      pipingColor: '#e62872',
      toppings: ['gold_leaf'],
      candles: 'party_ring',
      messageText: '',
      messagePosition: 'topper',
    },
  },
  {
    id: 'coquette_vintage',
    label: 'Trái Tim Coquette',
    config: {
      tiers: 1,
      shape: 'heart',
      size: '18cm',
      heightStyle: 'classic',
      sponge: 'redvelvet',
      filling: 'mascarpone',
      finish: 'smooth',
      tierColors: ['#ff8fb1', '#f8bbd0', '#ff8fb1'],
      activeTierColorIndex: 0,
      drip: 'white_choco',
      piping: 'vintage_ruffle',
      pipingColor: '#fffdf7',
      toppings: ['strawberries', 'bows', 'roses'],
      candles: 'single_wish',
      messageText: 'Sweet Love',
      messagePosition: 'surface',
    },
  },
]

const DEFAULT_CONFIG = {
  tiers: 2,
  shape: 'round',
  size: '18cm',
  heightStyle: 'classic',
  sponge: 'vanilla',
  filling: 'strawberry_jam',
  finish: 'smooth',
  tierColors: ['#ceb0ec', '#bee3f8', '#ff8fb1'],
  activeTierColorIndex: 0,
  drip: 'white_choco',
  piping: 'pearl',
  pipingColor: '#cca9ea',
  toppings: ['confetti_dots'],
  candles: 'twisted',
  messageText: '',
  messagePosition: 'topper',
}

export function build3DCakePrompt(config) {
  const shapeObj = CAKE_SHAPES.find((s) => s.id === config.shape) || CAKE_SHAPES[0]
  const tierObj = CAKE_TIERS.find((t) => t.id === config.tiers) || CAKE_TIERS[0]
  const sizeObj = CAKE_SIZES.find((s) => s.id === config.size) || CAKE_SIZES[1]
  const heightObj = CAKE_HEIGHT_STYLES.find((h) => h.id === config.heightStyle) || CAKE_HEIGHT_STYLES[0]
  const spongeObj = SPONGE_FLAVORS.find((f) => f.id === config.sponge) || SPONGE_FLAVORS[0]
  const fillingObj = FILLING_CREAMS.find((f) => f.id === config.filling) || FILLING_CREAMS[0]
  const finishObj = FROSTING_FINISHES.find((f) => f.id === config.finish) || FROSTING_FINISHES[0]
  const dripObj = DRIP_STYLES.find((d) => d.id === config.drip) || DRIP_STYLES[0]
  const pipingObj = BORDER_PIPINGS.find((p) => p.id === config.piping) || BORDER_PIPINGS[0]
  const candleObj = CANDLE_STYLES.find((c) => c.id === config.candles) || CANDLE_STYLES[0]

  const tierColorsDesc = Array.from({ length: config.tiers }, (_, idx) => {
    const colorHex = config.tierColors[idx] || config.tierColors[0]
    const matched = FROSTING_COLORS.find((c) => c.hex.toLowerCase() === colorHex.toLowerCase())
    return `Tầng ${idx + 1}: ${matched ? matched.name : `màu ${colorHex}`}`
  }).join(', ')

  const pipingColorMatched = FROSTING_COLORS.find(
    (c) => c.hex.toLowerCase() === (config.pipingColor || '#fffdf7').toLowerCase()
  )
  const pipingColorLabel = pipingColorMatched ? pipingColorMatched.name : config.pipingColor

  const toppingsDesc = config.toppings?.length
    ? config.toppings
        .map((id) => TOPPING_ITEMS.find((t) => t.id === id)?.label)
        .filter(Boolean)
        .join(', ')
    : 'Trang trí tối giản'

  const parts = [
    `Bánh kem thiết kế 3D chuyên nghiệp (${tierObj.label}, hình dáng ${shapeObj.label}, ${sizeObj.label}, ${heightObj.label})`,
    `Lớp phủ ngoài: ${finishObj.label} (${tierColorsDesc})`,
    `Cốt bánh & nhân: ${spongeObj.name} kết hợp cùng ${fillingObj.name}`,
    dripObj.id !== 'none' ? `Hiệu ứng sốt chảy: ${dripObj.label}` : null,
    pipingObj.id !== 'none' ? `Viền bắt kem: ${pipingObj.label} (tông màu ${pipingColorLabel})` : null,
    `Toppings trang trí: ${toppingsDesc}`,
    candleObj.id !== 'none' ? `Nến: ${candleObj.label}` : null,
    config.messageText?.trim()
      ? `Lời chúc (${config.messagePosition === 'topper' ? 'Topper cắm đỉnh bánh' : 'Viết trên thẻ mặt bánh'}): "${config.messageText.trim()}"`
      : null,
  ].filter(Boolean)

  return parts.join('. ') + '.'
}

export const BUDGET_PRESETS = [
  { id: '300_500', label: '300k – 500k', min: '300000', max: '500000' },
  { id: '500_800', label: '500k – 800k', min: '500000', max: '800000' },
  { id: '800_1200', label: '800k – 1.2Tr', min: '800000', max: '1200000' },
  { id: '1200_2500', label: '1.2Tr – 2.5Tr', min: '1200000', max: '2500000' },
]

export function build3DRfqDraft(config, snapshotDataUrl = null, orderMeta = {}) {
  const shapeObj = CAKE_SHAPES.find((s) => s.id === config.shape) || CAKE_SHAPES[0]
  const tierObj = CAKE_TIERS.find((t) => t.id === config.tiers) || CAKE_TIERS[0]
  const sizeObj = CAKE_SIZES.find((s) => s.id === config.size) || CAKE_SIZES[1]
  const heightObj = CAKE_HEIGHT_STYLES.find((h) => h.id === config.heightStyle) || CAKE_HEIGHT_STYLES[0]
  const spongeObj = SPONGE_FLAVORS.find((f) => f.id === config.sponge) || SPONGE_FLAVORS[0]
  const fillingObj = FILLING_CREAMS.find((f) => f.id === config.filling) || FILLING_CREAMS[0]
  const finishObj = FROSTING_FINISHES.find((f) => f.id === config.finish) || FROSTING_FINISHES[0]
  const dripObj = DRIP_STYLES.find((d) => d.id === config.drip) || DRIP_STYLES[0]
  const pipingObj = BORDER_PIPINGS.find((p) => p.id === config.piping) || BORDER_PIPINGS[0]
  const candleObj = CANDLE_STYLES.find((c) => c.id === config.candles) || CANDLE_STYLES[0]
  const prompt = build3DCakePrompt(config)

  const tierColorsDesc = Array.from({ length: config.tiers }, (_, idx) => {
    const colorHex = config.tierColors[idx] || config.tierColors[0]
    const matched = FROSTING_COLORS.find((c) => c.hex.toLowerCase() === colorHex.toLowerCase())
    return `Tầng ${idx + 1}: ${matched ? matched.name : colorHex}`
  }).join(', ')

  const toppingsDesc = config.toppings?.length
    ? config.toppings
        .map((id) => TOPPING_ITEMS.find((t) => t.id === id)?.label)
        .filter(Boolean)
        .join(', ')
    : 'Trang trí tối giản'

  const decorParts = [
    dripObj.id !== 'none' ? dripObj.label : null,
    pipingObj.id !== 'none' ? pipingObj.label : null,
    `Toppings: ${toppingsDesc}`,
    candleObj.id !== 'none' ? candleObj.label : null,
    config.messageText?.trim() ? `Chữ lời chúc: "${config.messageText.trim()}"` : null,
  ]
    .filter(Boolean)
    .join(' · ')

  const servingMap = { 1: 8, 2: 16, 3: 30 }
  const neededAtIso = orderMeta.neededAt
    ? new Date(orderMeta.neededAt).toISOString()
    : new Date(Date.now() + 3 * 86400000).toISOString()
  const deadlineTime = Math.max(
    Date.now() + 3600000,
    Math.min(Date.parse(neededAtIso) - 12 * 3600000, Date.now() + 24 * 3600000)
  )

  return {
    requestType: 'OPEN_CUSTOM',
    title: `Bánh 3D ${tierObj.label} (${shapeObj.label}) - ${spongeObj.name}`.slice(0, 180),
    description: prompt,
    occasion:
      orderMeta.occasion?.trim() ||
      (config.messageText?.toLowerCase().includes('birthday') ? 'Sinh nhật' : 'Kỷ niệm / Sự kiện'),
    servingSize: String(orderMeta.servingSize || servingMap[config.tiers] || 10),
    budgetMin: orderMeta.budgetMin != null ? String(orderMeta.budgetMin).trim() : '',
    budgetMax: orderMeta.budgetMax != null ? String(orderMeta.budgetMax).trim() : '',
    deliveryDistrict: orderMeta.deliveryDistrict?.trim() || 'Quận 1',
    deliveryCity: orderMeta.deliveryCity?.trim() || 'TP. Hồ Chí Minh',
    neededAt: neededAtIso,
    offerDeadline: new Date(deadlineTime).toISOString(),
    preference: {
      cakeSize: `${sizeObj.label} · ${config.tiers} tầng (${heightObj.label})`,
      cakeShape: shapeObj.label,
      flavor: spongeObj.name,
      filling: fillingObj.name,
      frosting: finishObj.label,
      colorPalette: tierColorsDesc,
      decorationNotes: decorParts,
      allergyNotes: orderMeta.allergyNotes?.trim() || '',
      extraOptions: {
        designMode: '3D_STUDIO',
        cake3DConfig: {
          ...config,
          spongeColor: spongeObj.color,
          fillingColor: fillingObj.color,
        },
        cake3DSnapshotUrl: snapshotDataUrl || null,
      },
    },
  }
}

export function buildPromptRfqDraft(promptText = '', orderMeta = {}) {
  const clean = String(promptText || '').trim() || 'Bánh kem nghệ thuật thiết kế theo yêu cầu riêng'
  const shortTitle = clean.length > 65 ? clean.slice(0, 62) + '...' : clean
  const neededAtIso = orderMeta.neededAt
    ? new Date(orderMeta.neededAt).toISOString()
    : new Date(Date.now() + 3 * 86400000).toISOString()
  const deadlineTime = Math.max(
    Date.now() + 3600000,
    Math.min(Date.parse(neededAtIso) - 12 * 3600000, Date.now() + 24 * 3600000)
  )
  return {
    requestType: 'OPEN_CUSTOM',
    title: `Đặt bánh thiết kế AI: ${shortTitle}`.slice(0, 180),
    description: clean,
    occasion: orderMeta.occasion?.trim() || 'Sinh nhật / Kỷ niệm',
    servingSize: String(orderMeta.servingSize || '10'),
    budgetMin: orderMeta.budgetMin != null ? String(orderMeta.budgetMin).trim() : '',
    budgetMax: orderMeta.budgetMax != null ? String(orderMeta.budgetMax).trim() : '',
    deliveryDistrict: orderMeta.deliveryDistrict?.trim() || 'Quận 1',
    deliveryCity: orderMeta.deliveryCity?.trim() || 'TP. Hồ Chí Minh',
    neededAt: neededAtIso,
    offerDeadline: new Date(deadlineTime).toISOString(),
    preference: {
      cakeSize: 'Size 18cm (Classic)',
      cakeShape: 'Tròn cổ điển',
      flavor: 'Vanilla Bourbon Madagascar',
      filling: 'Mứt Dâu Tây Đà Lạt Tươi',
      frosting: 'Kem bơ láng mịn',
      colorPalette: 'Theo mô tả thiết kế',
      decorationNotes: clean.slice(0, 500),
      allergyNotes: orderMeta.allergyNotes?.trim() || '',
    },
  }
}

export default function Cake3DBuilder({
  disabled,
  forExistingRequest = false,
  initialOrderMeta = null,
  onSubmit3DDesign,
  onGenerateDirect,
  onCreateRfqWith3D,
}) {
  const [activeTab, setActiveTab] = useState('structure')
  const [autoRotate, setAutoRotate] = useState(true)
  const [showCrossSection, setShowCrossSection] = useState(false)
  const [config, setConfig] = useState(() => {
    const saved3D = initialOrderMeta?.preference?.extraOptions?.cake3DConfig
    return saved3D ? { ...DEFAULT_CONFIG, ...saved3D } : DEFAULT_CONFIG
  })
  const captureRef = useRef(null)

  const defaultNeededLocal = () => {
    const d = new Date(Date.now() + 3 * 86400000)
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
  }

  const [orderMeta, setOrderMeta] = useState(() => ({
    budgetMin: initialOrderMeta?.budgetMin != null ? String(initialOrderMeta.budgetMin) : '500000',
    budgetMax: initialOrderMeta?.budgetMax != null ? String(initialOrderMeta.budgetMax) : '800000',
    occasion: initialOrderMeta?.occasion || 'Sinh nhật',
    servingSize: initialOrderMeta?.servingSize != null ? String(initialOrderMeta.servingSize) : '12',
    deliveryDistrict: initialOrderMeta?.deliveryDistrict || 'Quận 1',
    deliveryCity: initialOrderMeta?.deliveryCity || 'TP. Hồ Chí Minh',
    neededAt: initialOrderMeta?.neededAt
      ? new Date(Date.parse(initialOrderMeta.neededAt) - new Date().getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16)
      : defaultNeededLocal(),
    allergyNotes: initialOrderMeta?.preference?.allergyNotes || initialOrderMeta?.allergyNotes || '',
  }))

  const updateOrderMeta = (patch) => setOrderMeta((prev) => ({ ...prev, ...patch }))

  const updateConfig = (patch) => setConfig((prev) => ({ ...prev, ...patch }))

  const setTierColor = (idx, hex) => {
    setConfig((prev) => {
      const next = [...prev.tierColors]
      next[idx] = hex
      return { ...prev, tierColors: next }
    })
  }

  const applyColorToAllTiers = (hex) => {
    setConfig((prev) => ({
      ...prev,
      tierColors: [hex, hex, hex],
    }))
  }

  const toggleTopping = (id) => {
    setConfig((prev) => {
      const exists = prev.toppings.includes(id)
      return {
        ...prev,
        toppings: exists ? prev.toppings.filter((i) => i !== id) : [...prev.toppings, id],
      }
    })
  }

  const spongeObj = SPONGE_FLAVORS.find((f) => f.id === config.sponge) || SPONGE_FLAVORS[0]
  const fillingObj = FILLING_CREAMS.find((f) => f.id === config.filling) || FILLING_CREAMS[0]
  const shapeObj = CAKE_SHAPES.find((s) => s.id === config.shape) || CAKE_SHAPES[0]
  const sizeObj = CAKE_SIZES.find((s) => s.id === config.size) || CAKE_SIZES[1]
  const generatedPrompt = build3DCakePrompt(config)

  const TABS = [
    { id: 'structure', step: 1, label: '1. Tầng & Dáng', icon: 'layers' },
    { id: 'flavor', step: 2, label: '2. Cốt & Nhân', icon: 'cake' },
    { id: 'color', step: 3, label: '3. Màu & Kem', icon: 'palette' },
    { id: 'finish', step: 4, label: '4. Sốt & Viền', icon: 'water_drop' },
    { id: 'decor', step: 5, label: '5. Topping & Chữ', icon: 'auto_awesome' },
    { id: 'budget', step: 6, label: '6. Ngân sách', icon: 'payments' },
  ]
  const currentTabIndex = Math.max(0, TABS.findIndex((t) => t.id === activeTab))

  return (
    <div className="space-y-4 rounded-3xl border border-stone-200/80 bg-white p-4 sm:p-6 shadow-sm">
      {/* Compact Header with Preset Styles */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-amber-200 shadow-xs">
            <Icon name="view_in_ar" className="text-xl" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-xl font-bold tracking-tight text-stone-900">
                Bàn Thiết Kế Bánh 3D (Xoay 360°)
              </h2>
              <span className="rounded-full bg-rose-500/10 px-2.5 py-0.5 text-[11px] font-bold text-rose-800">
                Trực quan 3D
              </span>
            </div>
            <p className="text-xs text-stone-500">
              Chọn nhanh mẫu gợi ý bên phải hoặc chỉnh từng bước từ Bước 1 đến Bước 6
            </p>
          </div>
        </div>

        {/* Preset Styles & Reset Controls */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 mr-1">
            Mẫu có sẵn:
          </span>
          {DESIGN_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => setConfig({ ...preset.config })}
              className="rounded-xl border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-xs font-semibold text-stone-700 transition-all hover:border-rose-500 hover:bg-rose-50/60 hover:text-stone-900 cursor-pointer"
            >
              {preset.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setConfig(DEFAULT_CONFIG)
              setShowCrossSection(false)
            }}
            className="inline-flex items-center gap-1 rounded-xl border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-stone-500 transition-all hover:border-stone-400 hover:text-stone-900 cursor-pointer"
            title="Khôi phục mặc định"
          >
            <Icon name="restart_alt" className="text-sm" />
            Đặt lại
          </button>
        </div>
      </div>

      {/* Main Studio Viewport (Left: Sticky 3D Stage | Right: Step-by-Step Customizer) */}
      <div className="grid gap-5 lg:grid-cols-12 items-start">
        {/* Left Column: 3D Interactive Canvas Stage (Sticky so cake never scrolls out of view) */}
        <div className="lg:col-span-6 lg:sticky lg:top-20 flex flex-col justify-between rounded-3xl border border-stone-200/90 bg-gradient-to-b from-[#ffffff] via-[#fdf9f7] to-[#f2eae4] p-3.5 sm:p-4 relative overflow-hidden shadow-inner">
          {/* Top Quick Actions over 3D Canvas */}
          <div className="flex flex-wrap items-center justify-between gap-2 z-10">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setAutoRotate((v) => !v)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold backdrop-blur-md transition-all shadow-xs cursor-pointer ${
                  autoRotate
                    ? 'bg-primary text-white'
                    : 'bg-white/90 text-stone-700 hover:bg-white'
                }`}
              >
                <Icon name="360" className="text-sm text-amber-300" />
                {autoRotate ? 'Đang xoay 360°' : 'Tự xoay 360°'}
              </button>

              <button
                type="button"
                onClick={() => setShowCrossSection((v) => !v)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold backdrop-blur-md transition-all shadow-xs cursor-pointer ${
                  showCrossSection
                    ? 'bg-amber-700 text-white'
                    : 'bg-white/90 text-stone-700 hover:bg-white'
                }`}
              >
                <Icon name="pie_chart" className="text-sm" />
                {showCrossSection ? 'Ẩn lát cắt' : 'Xem lát cắt bánh'}
              </button>
            </div>

            <span className="rounded-full bg-white/85 px-2.5 py-1 text-[11px] font-semibold text-stone-600 shadow-xs">
              🖱️ Kéo để xoay · Cuộn để phóng to
            </span>
          </div>

          {/* Real WebGL Three.js 3D Viewport */}
          <div className="relative flex items-center justify-center">
            <ThreeCakeCanvas
              config={config}
              spongeColor={spongeObj.color}
              fillingColor={fillingObj.color}
              showCrossSection={showCrossSection}
              autoRotate={autoRotate}
              onCaptureReady={(fn) => {
                captureRef.current = fn
              }}
            />
          </div>

          {/* Bottom Layer Status Legend */}
          <div className="z-10 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-white/90 p-2.5 backdrop-blur-md border border-stone-200/60 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span
                  className="h-3 w-3 rounded-full border border-black/15 shadow-2xs"
                  style={{ backgroundColor: spongeObj.color }}
                />
                <span className="font-medium text-stone-800">Cốt: {spongeObj.name}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className="h-3 w-3 rounded-full border border-black/15 shadow-2xs"
                  style={{ backgroundColor: fillingObj.color }}
                />
                <span className="font-medium text-stone-800">Nhân: {fillingObj.name}</span>
              </div>
            </div>
            <span className="font-bold text-rose-900">
              {config.tiers} Tầng · {shapeObj.label} · {sizeObj.id}
            </span>
          </div>
        </div>

        {/* Right Column: Step-by-Step Customizer Dashboard */}
        <div className="lg:col-span-6 flex flex-col justify-between space-y-3.5">
          {/* Navigation Category Tabs - 6 Clear Steps in 3x2 / 6-col Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 rounded-2xl bg-stone-100 p-1.5 border border-stone-200/70">
            {TABS.map((t) => {
              const active = activeTab === t.id
              const isBudgetTab = t.id === 'budget'
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id)}
                  className={`flex flex-col items-center justify-center gap-1 rounded-xl px-1.5 py-2 text-center text-[11px] font-bold transition-all cursor-pointer ${
                    active
                      ? 'bg-primary text-white shadow-xs'
                      : isBudgetTab
                        ? 'bg-rose-100/80 text-rose-950 hover:bg-rose-200/70'
                        : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
                  }`}
                >
                  <Icon
                    name={t.icon}
                    className={`text-base ${
                      active ? 'text-amber-300' : isBudgetTab ? 'text-rose-700' : 'text-stone-400'
                    }`}
                  />
                  <span className="leading-tight">{t.label}</span>
                </button>
              )
            })}
          </div>

          {/* Tab 1: Structure & Tiers */}
          {activeTab === 'structure' && (
            <div className="space-y-4 rounded-2xl border border-stone-200 bg-stone-50/50 p-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-500">
                  Số tầng bánh (Tiers)
                </label>
                <div className="grid gap-2">
                  {CAKE_TIERS.map((tier) => {
                    const active = config.tiers === tier.id
                    return (
                      <button
                        key={tier.id}
                        type="button"
                        onClick={() =>
                          updateConfig({
                            tiers: tier.id,
                            activeTierColorIndex: Math.min(config.activeTierColorIndex, tier.id - 1),
                          })
                        }
                        className={`flex items-center justify-between rounded-xl border p-3 text-left transition-all cursor-pointer ${
                          active
                            ? 'border-primary bg-primary text-white shadow-sm'
                            : 'border-stone-200 bg-white text-stone-800 hover:border-stone-400'
                        }`}
                      >
                        <div>
                          <p className="text-sm font-bold">{tier.label}</p>
                          <p className={`text-xs ${active ? 'text-stone-300' : 'text-stone-500'}`}>
                            {tier.subtitle}
                          </p>
                        </div>
                        <Icon
                          name={active ? 'check_circle' : 'radio_button_unchecked'}
                          className={`text-lg ${active ? 'text-amber-300' : 'text-stone-300'}`}
                        />
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-500">
                  Hình khối bánh 3D (Shape)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {CAKE_SHAPES.map((shape) => {
                    const active = config.shape === shape.id
                    return (
                      <button
                        key={shape.id}
                        type="button"
                        onClick={() => updateConfig({ shape: shape.id })}
                        className={`flex items-center gap-2 rounded-xl border p-2.5 text-xs font-semibold transition-all cursor-pointer ${
                          active
                            ? 'border-primary bg-primary text-white shadow-xs'
                            : 'border-stone-200 bg-white text-stone-700 hover:border-stone-400'
                        }`}
                      >
                        <Icon name={shape.icon} className="text-base text-rose-500" />
                        <span className="truncate">{shape.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-500">
                  Kích cỡ đường kính (Size)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {CAKE_SIZES.map((sz) => {
                    const active = config.size === sz.id
                    return (
                      <button
                        key={sz.id}
                        type="button"
                        onClick={() => updateConfig({ size: sz.id })}
                        className={`rounded-xl border p-2.5 text-left text-xs transition-all cursor-pointer ${
                          active
                            ? 'border-primary bg-primary text-white font-bold'
                            : 'border-stone-200 bg-white text-stone-700 hover:border-stone-400'
                        }`}
                      >
                        <div>{sz.label}</div>
                        <div className={`text-[11px] mt-0.5 ${active ? 'text-stone-300' : 'text-stone-400'}`}>
                          {sz.desc}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-500">
                  Tỉ lệ chiều cao thân bánh
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {CAKE_HEIGHT_STYLES.map((hs) => {
                    const active = (config.heightStyle || 'classic') === hs.id
                    return (
                      <button
                        key={hs.id}
                        type="button"
                        onClick={() => updateConfig({ heightStyle: hs.id })}
                        className={`rounded-xl border p-2.5 text-left text-xs transition-all cursor-pointer ${
                          active
                            ? 'border-primary bg-primary/10 font-bold text-primary ring-1 ring-primary'
                            : 'border-stone-200 bg-white text-stone-700 hover:border-stone-400'
                        }`}
                      >
                        <div>{hs.label}</div>
                        <div className="text-[11px] text-stone-400 mt-0.5">{hs.desc}</div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Flavor & Filling */}
          {activeTab === 'flavor' && (
            <div className="space-y-4 rounded-2xl border border-stone-200 bg-stone-50/50 p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-500">
                    Cốt bánh bông lan (Sponge)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowCrossSection((v) => !v)}
                    className="text-xs font-semibold text-rose-700 underline cursor-pointer"
                  >
                    {showCrossSection ? 'Đóng lát cắt 3D' : 'Xem lát cắt 3D'}
                  </button>
                </div>
                <div className="grid gap-2">
                  {SPONGE_FLAVORS.map((sp) => {
                    const active = config.sponge === sp.id
                    return (
                      <button
                        key={sp.id}
                        type="button"
                        onClick={() => {
                          updateConfig({ sponge: sp.id })
                          setShowCrossSection(true)
                        }}
                        className={`flex items-center justify-between rounded-xl border p-2.5 text-left text-xs transition-all cursor-pointer ${
                          active
                            ? 'border-primary bg-primary text-white font-bold'
                            : 'border-stone-200 bg-white text-stone-800 hover:border-stone-400'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className="h-4 w-4 shrink-0 rounded-full border border-black/20"
                            style={{ backgroundColor: sp.color }}
                          />
                          <div>
                            <div>{sp.name}</div>
                            <div className={`text-[10px] ${active ? 'text-stone-300' : 'text-stone-400'}`}>
                              {sp.note}
                            </div>
                          </div>
                        </div>
                        <Icon
                          name={active ? 'check_circle' : 'circle'}
                          className={`text-base ${active ? 'text-amber-300' : 'text-stone-200'}`}
                        />
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-stone-200">
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-500">
                  Lớp nhân mứt / kem xen kẽ (Filling)
                </label>
                <div className="grid gap-2">
                  {FILLING_CREAMS.map((fl) => {
                    const active = config.filling === fl.id
                    return (
                      <button
                        key={fl.id}
                        type="button"
                        onClick={() => {
                          updateConfig({ filling: fl.id })
                          setShowCrossSection(true)
                        }}
                        className={`flex items-center justify-between rounded-xl border p-2.5 text-left text-xs transition-all cursor-pointer ${
                          active
                            ? 'border-primary bg-primary text-white font-bold'
                            : 'border-stone-200 bg-white text-stone-700 hover:border-stone-400'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className="h-4 w-4 shrink-0 rounded-full border border-black/20"
                            style={{ backgroundColor: fl.color }}
                          />
                          <div>
                            <div>{fl.name}</div>
                            <div className={`text-[10px] ${active ? 'text-stone-300' : 'text-stone-400'}`}>
                              {fl.note}
                            </div>
                          </div>
                        </div>
                        <Icon
                          name={active ? 'check_circle' : 'circle'}
                          className={`text-base ${active ? 'text-amber-300' : 'text-stone-200'}`}
                        />
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Colors & Surface */}
          {activeTab === 'color' && (
            <div className="space-y-4 rounded-2xl border border-stone-200 bg-stone-50/50 p-4">
              {config.tiers > 1 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-500">
                      Chọn tầng để phối màu
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        applyColorToAllTiers(config.tierColors[config.activeTierColorIndex] || '#fffdf7')
                      }
                      className="text-[11px] font-semibold text-rose-800 underline cursor-pointer"
                    >
                      Đồng bộ màu mọi tầng
                    </button>
                  </div>
                  <div className="flex gap-2">
                    {Array.from({ length: config.tiers }).map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => updateConfig({ activeTierColorIndex: idx })}
                        className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-bold transition-all cursor-pointer ${
                          config.activeTierColorIndex === idx
                            ? 'border-primary bg-primary text-white'
                            : 'border-stone-200 bg-white text-stone-700'
                        }`}
                      >
                        <span
                          className="h-3 w-3 rounded-full border border-black/20"
                          style={{ backgroundColor: config.tierColors[idx] || config.tierColors[0] }}
                        />
                        Tầng {idx + 1}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-500">
                    Bảng màu kem (Tầng {config.activeTierColorIndex + 1})
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-rose-800 font-semibold cursor-pointer">
                    <span>Tùy chỉnh mã màu:</span>
                    <input
                      type="color"
                      value={config.tierColors[config.activeTierColorIndex] || '#fffdf7'}
                      onChange={(e) => setTierColor(config.activeTierColorIndex, e.target.value)}
                      className="h-6 w-7 cursor-pointer rounded border border-stone-300"
                    />
                  </label>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {FROSTING_COLORS.map((c) => {
                    const currentHex = config.tierColors[config.activeTierColorIndex] || config.tierColors[0]
                    const selected = currentHex.toLowerCase() === c.hex.toLowerCase()
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setTierColor(config.activeTierColorIndex, c.hex)}
                        className={`flex items-center gap-2 rounded-xl border p-2 text-left text-xs transition-all cursor-pointer ${
                          selected
                            ? 'border-primary bg-white font-bold ring-2 ring-primary'
                            : 'border-stone-200 bg-white text-stone-700 hover:border-stone-400'
                        }`}
                      >
                        <span
                          className="h-4 w-4 shrink-0 rounded-full border border-black/15"
                          style={{ backgroundColor: c.hex }}
                        />
                        <span className="truncate text-[11px]">{c.name}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-stone-200">
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-500">
                  Chất liệu hoàn thiện bề mặt
                </label>
                <div className="grid gap-2">
                  {FROSTING_FINISHES.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => updateConfig({ finish: f.id })}
                      className={`rounded-xl border p-2.5 text-left transition-all cursor-pointer ${
                        config.finish === f.id
                          ? 'border-primary bg-primary text-white font-bold'
                          : 'border-stone-200 bg-white text-stone-800 hover:border-stone-400'
                      }`}
                    >
                      <div className="text-xs">{f.label}</div>
                      <div className={`text-[11px] ${config.finish === f.id ? 'text-stone-300' : 'text-stone-500'}`}>
                        {f.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Drip & Piping */}
          {activeTab === 'finish' && (
            <div className="space-y-4 rounded-2xl border border-stone-200 bg-stone-50/50 p-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-500">
                  Hiệu ứng sốt Drip chảy thành bánh
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {DRIP_STYLES.map((d) => {
                    const active = config.drip === d.id
                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => updateConfig({ drip: d.id })}
                        className={`flex items-center gap-2 rounded-xl border p-2.5 text-left text-xs transition-all cursor-pointer ${
                          active
                            ? 'border-primary bg-primary text-white font-bold'
                            : 'border-stone-200 bg-white text-stone-700 hover:border-stone-400'
                        }`}
                      >
                        <span
                          className="h-3.5 w-3.5 shrink-0 rounded-full border border-black/15"
                          style={{ backgroundColor: d.color || '#e5e5e5' }}
                        />
                        <span className="truncate">{d.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-stone-200">
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-500">
                  Kiểu viền bắt kem (Piping Border)
                </label>
                <div className="grid gap-2">
                  {BORDER_PIPINGS.map((p) => {
                    const active = config.piping === p.id
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => updateConfig({ piping: p.id })}
                        className={`flex items-center justify-between rounded-xl border p-2.5 text-left text-xs transition-all cursor-pointer ${
                          active
                            ? 'border-primary bg-primary text-white font-bold'
                            : 'border-stone-200 bg-white text-stone-700 hover:border-stone-400'
                        }`}
                      >
                        <div>
                          <div>{p.label}</div>
                          <div className={`text-[10px] ${active ? 'text-stone-300' : 'text-stone-400'}`}>
                            {p.desc}
                          </div>
                        </div>
                        <Icon
                          name={active ? 'check_circle' : 'circle'}
                          className={`text-base ${active ? 'text-amber-300' : 'text-stone-200'}`}
                        />
                      </button>
                    )
                  })}
                </div>
              </div>

              {config.piping !== 'none' && (
                <div className="space-y-2 pt-2 border-t border-stone-200">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-stone-500">
                      Màu viền bắt kem
                    </label>
                    <input
                      type="color"
                      value={config.pipingColor || '#fffdf7'}
                      onChange={(e) => updateConfig({ pipingColor: e.target.value })}
                      className="h-6 w-7 cursor-pointer rounded border border-stone-300"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {FROSTING_COLORS.slice(0, 8).map((c) => {
                      const active = (config.pipingColor || '#fffdf7').toLowerCase() === c.hex.toLowerCase()
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => updateConfig({ pipingColor: c.hex })}
                          title={c.name}
                          className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all cursor-pointer ${
                            active
                              ? 'border-primary bg-primary text-white'
                              : 'border-stone-200 bg-white text-stone-700 hover:border-stone-400'
                          }`}
                        >
                          <span
                            className="h-3 w-3 rounded-full border border-black/15"
                            style={{ backgroundColor: c.hex }}
                          />
                          <span>{c.name}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 5: Toppings & Message */}
          {activeTab === 'decor' && (
            <div className="space-y-4 rounded-2xl border border-stone-200 bg-stone-50/50 p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-500">
                    Toppings 3D trang trí (Bật / tắt tự do)
                  </label>
                  {config.toppings.length > 0 && (
                    <button
                      type="button"
                      onClick={() => updateConfig({ toppings: [] })}
                      className="text-[11px] font-semibold text-stone-500 hover:text-stone-900 underline cursor-pointer"
                    >
                      Bỏ chọn hết
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {TOPPING_ITEMS.map((item) => {
                    const active = config.toppings.includes(item.id)
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleTopping(item.id)}
                        className={`flex items-center justify-between rounded-xl border p-2.5 text-left text-xs transition-all cursor-pointer ${
                          active
                            ? 'border-primary bg-primary text-white font-bold'
                            : 'border-stone-200 bg-white text-stone-700 hover:border-stone-400'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="h-3.5 w-3.5 shrink-0 rounded-full border border-black/15"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="truncate">{item.label}</span>
                        </div>
                        <Icon
                          name={active ? 'check_box' : 'check_box_outline_blank'}
                          className={`text-base shrink-0 ${active ? 'text-amber-300' : 'text-stone-300'}`}
                        />
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-stone-200">
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-500">
                  Kiểu nến lung linh
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {CANDLE_STYLES.map((c) => {
                    const active = config.candles === c.id
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => updateConfig({ candles: c.id })}
                        className={`rounded-xl border p-2 text-left text-xs transition-all cursor-pointer ${
                          active
                            ? 'border-primary bg-primary text-white font-bold'
                            : 'border-stone-200 bg-white text-stone-700 hover:border-stone-400'
                        }`}
                      >
                        {c.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-2.5 pt-2 border-t border-stone-200">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-500">
                    Lời chúc hiển thị trên bánh 3D
                  </label>
                  {config.messageText && (
                    <button
                      type="button"
                      onClick={() => updateConfig({ messageText: '' })}
                      className="text-[11px] text-stone-400 hover:text-stone-700 underline cursor-pointer"
                    >
                      Xóa chữ
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  maxLength={36}
                  placeholder="Nhập chữ (VD: Happy Birthday Anna)..."
                  value={config.messageText}
                  onChange={(e) => updateConfig({ messageText: e.target.value })}
                  className={inputClass + ' w-full text-xs'}
                />

                <div className="grid grid-cols-2 gap-2">
                  {MESSAGE_POSITIONS.map((pos) => {
                    const active = (config.messagePosition || 'topper') === pos.id
                    return (
                      <button
                        key={pos.id}
                        type="button"
                        onClick={() => updateConfig({ messagePosition: pos.id })}
                        className={`flex items-center gap-1.5 rounded-xl border p-2 text-xs font-semibold transition-all cursor-pointer ${
                          active
                            ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary'
                            : 'border-stone-200 bg-white text-stone-600 hover:border-stone-400'
                        }`}
                      >
                        <Icon name={pos.icon} className="text-sm text-rose-600" />
                        <span className="truncate">{pos.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Tab 6: Budget & Delivery Info */}
          {activeTab === 'budget' && (
            <div className="space-y-3.5 rounded-2xl border-2 border-rose-200/80 bg-rose-50/40 p-4">
              <div className="flex items-center justify-between border-b border-rose-200/60 pb-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-amber-200">
                    <Icon name="payments" className="text-base" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-stone-900">
                      6. Ngân sách mong muốn & Thông tin nhận bánh
                    </h3>
                    <p className="text-[11px] text-stone-500">
                      Nhập khoảng ngân sách để các tiệm bánh gửi báo giá phù hợp nhất
                    </p>
                  </div>
                </div>
              </div>

              {/* Budget Min & Max Inputs */}
              <div className="grid grid-cols-2 gap-2.5">
                <label className="space-y-1">
                  <span className="block text-xs font-semibold text-stone-700">
                    Ngân sách tối thiểu (VNĐ)
                  </span>
                  <input
                    type="number"
                    min={0}
                    step="10000"
                    placeholder="VD: 500000"
                    value={orderMeta.budgetMin}
                    onChange={(e) => updateOrderMeta({ budgetMin: e.target.value })}
                    className={inputClass + ' w-full bg-white text-xs font-semibold'}
                  />
                </label>
                <label className="space-y-1">
                  <span className="block text-xs font-semibold text-stone-700">
                    Ngân sách tối đa (VNĐ)
                  </span>
                  <input
                    type="number"
                    min={0}
                    step="10000"
                    placeholder="VD: 800000"
                    value={orderMeta.budgetMax}
                    onChange={(e) => updateOrderMeta({ budgetMax: e.target.value })}
                    className={inputClass + ' w-full bg-white text-xs font-semibold'}
                  />
                </label>
              </div>

              {/* Delivery Date & Occasion */}
              <div className="grid grid-cols-2 gap-2.5">
                <label className="space-y-1">
                  <span className="block text-xs font-semibold text-stone-700">
                    Ngày & giờ cần bánh
                  </span>
                  <input
                    type="datetime-local"
                    value={orderMeta.neededAt}
                    onChange={(e) => updateOrderMeta({ neededAt: e.target.value })}
                    className={inputClass + ' w-full bg-white text-xs'}
                  />
                </label>
                <label className="space-y-1">
                  <span className="block text-xs font-semibold text-stone-700">
                    Dịp đặt bánh
                  </span>
                  <input
                    type="text"
                    maxLength={100}
                    placeholder="Sinh nhật, Kỷ niệm..."
                    value={orderMeta.occasion}
                    onChange={(e) => updateOrderMeta({ occasion: e.target.value })}
                    className={inputClass + ' w-full bg-white text-xs'}
                  />
                </label>
              </div>

              {/* District & City */}
              <div className="grid grid-cols-2 gap-2.5">
                <label className="space-y-1">
                  <span className="block text-xs font-semibold text-stone-700">
                    Quận / Huyện nhận bánh
                  </span>
                  <input
                    type="text"
                    maxLength={120}
                    placeholder="VD: Quận 1"
                    value={orderMeta.deliveryDistrict}
                    onChange={(e) => updateOrderMeta({ deliveryDistrict: e.target.value })}
                    className={inputClass + ' w-full bg-white text-xs'}
                  />
                </label>
                <label className="space-y-1">
                  <span className="block text-xs font-semibold text-stone-700">
                    Tỉnh / Thành phố
                  </span>
                  <input
                    type="text"
                    maxLength={120}
                    placeholder="VD: TP. Hồ Chí Minh"
                    value={orderMeta.deliveryCity}
                    onChange={(e) => updateOrderMeta({ deliveryCity: e.target.value })}
                    className={inputClass + ' w-full bg-white text-xs'}
                  />
                </label>
              </div>

              {/* Extra Notes / Allergy */}
              <label className="block space-y-1">
                <span className="block text-xs font-semibold text-stone-700">
                  Ghi chú thêm cho thợ bánh (Độ ngọt, dị ứng, yêu cầu riêng)
                </span>
                <input
                  type="text"
                  maxLength={500}
                  placeholder="VD: Kem ít ngọt, không dùng đậu phộng, giao trước 10h sáng..."
                  value={orderMeta.allergyNotes}
                  onChange={(e) => updateOrderMeta({ allergyNotes: e.target.value })}
                  className={inputClass + ' w-full bg-white text-xs'}
                />
              </label>
            </div>
          )}

          {/* Always-Visible Compact Budget Bar + Step Navigation + Submit CTA */}
          <div className="space-y-3 rounded-2xl border-2 border-stone-900/15 bg-gradient-to-b from-rose-50/70 to-white p-3.5 shadow-xs">
            {/* Quick Budget Chips Row */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-bold text-stone-800 flex items-center gap-1">
                  <Icon name="payments" className="text-sm text-rose-700" />
                  Ngân sách mong muốn:
                </span>
                <button
                  type="button"
                  onClick={() => setActiveTab('budget')}
                  className="text-[11px] font-bold text-rose-800 underline hover:text-stone-900 cursor-pointer"
                >
                  {orderMeta.budgetMin && orderMeta.budgetMax
                    ? `${Number(orderMeta.budgetMin).toLocaleString('vi-VN')}đ – ${Number(orderMeta.budgetMax).toLocaleString('vi-VN')}đ (Sửa chi tiết)`
                    : 'Nhập số tiền tùy ý →'}
                </button>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {BUDGET_PRESETS.map((preset) => {
                  const active =
                    orderMeta.budgetMin === preset.min && orderMeta.budgetMax === preset.max
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() =>
                        updateOrderMeta({ budgetMin: preset.min, budgetMax: preset.max })
                      }
                      className={`rounded-xl border py-1.5 px-1.5 text-[11px] font-bold transition-all cursor-pointer ${
                        active
                          ? 'border-primary bg-primary text-white shadow-xs'
                          : 'border-stone-200 bg-white text-stone-700 hover:border-rose-500'
                      }`}
                    >
                      {preset.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Step Prev/Next + Submit Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-stone-200/70">
              <button
                type="button"
                disabled={currentTabIndex <= 0}
                onClick={() => setActiveTab(TABS[Math.max(0, currentTabIndex - 1)].id)}
                className="rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-xs font-bold text-stone-700 hover:bg-stone-50 disabled:opacity-40 cursor-pointer"
              >
                ← Bước trước
              </button>

              {currentTabIndex < TABS.length - 1 && (
                <button
                  type="button"
                  onClick={() => setActiveTab(TABS[Math.min(TABS.length - 1, currentTabIndex + 1)].id)}
                  className="rounded-xl border border-rose-300 bg-rose-100/80 px-3 py-2.5 text-xs font-bold text-rose-950 hover:bg-rose-200/80 cursor-pointer"
                >
                  Bước tiếp ({TABS[currentTabIndex + 1].label}) →
                </button>
              )}

              {(onSubmit3DDesign || onGenerateDirect) && (
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    const snapshotUrl = captureRef.current ? captureRef.current() : null
                    const draft = build3DRfqDraft(config, snapshotUrl, orderMeta)
                    if (onSubmit3DDesign) {
                      onSubmit3DDesign(draft, snapshotUrl, config, generatedPrompt)
                    } else if (onGenerateDirect) {
                      onGenerateDirect(generatedPrompt, config, snapshotUrl, draft)
                    }
                  }}
                  className={
                    buttonClass +
                    ' flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-4 text-xs sm:text-sm font-bold shadow-md cursor-pointer'
                  }
                >
                  <Icon name="send" className="text-base" />
                  {disabled
                    ? 'Đang lưu mẫu bánh 3D…'
                    : forExistingRequest
                      ? 'Lưu Mẫu Bánh 3D & Ngân sách'
                      : 'Hoàn tất & Đặt Bánh 3D'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
