/**
 * SweetCake AI Cake Studio Presets & Mock Generated Designs
 */

export const STYLE_PROMPTS = [
  {
    label: '⚡ Anime Cake',
    text: 'Bánh Anime nhân vật yêu thích, phủ kem bơ mịn màng phong cách Manga, dập nổi chi tiết sắc sảo',
  },
  {
    label: '❄️ Công chúa Elsa',
    text: 'Bánh công chúa Elsa băng giá lấp lánh màu xanh pastel, vương miện kẹo đường isomalt trong suốt',
  },
  {
    label: '🎂 Minimalist Hàn Quốc',
    text: 'Bánh Minimalist Hàn Quốc tone pastel nude, viền kem vintage uốn lượn phong cách retro aesthetic',
  },
  {
    label: '💍 Bespoke Hoa Cưới',
    text: 'Bespoke bánh cưới 3 tầng hoa lan hồ điệp tươi, phủ fondant lụa trắng ngà và lá vàng 24K thực phẩm cao cấp',
  },
];

export const SUGGESTION_TAGS = [
  'Bánh Pikachu 3D',
  'Hàn Quốc Minimalist',
  'Bánh cưới hoa tươi',
  'Fondant siêu nhân',
  'Trà xanh ít ngọt',
  'Trái cây tươi Đà Lạt',
];

export const BUDGET_PRESETS = [
  { label: 'Dưới 500k', value: 450000 },
  { label: '500k - 800k', value: 700000 },
  { label: '800k - 1.200k (Khuyên dùng)', value: 1000000 },
  { label: '1.200k - 2.000k', value: 1500000 },
  { label: 'Trên 2.000k (Bánh sự kiện/Cưới)', value: 2500000 },
];

export const STUDIO_SIZES = [
  { id: '10cm', name: '10cm (Bento Mini)', basePrice: 280000 },
  { id: '12cm', name: '12cm (Petite đôi bạn)', basePrice: 350000 },
  { id: '15cm', name: '15cm (1 Tầng nhỏ)', basePrice: 450000 },
  { id: '18cm', name: '18cm (1 Tầng vừa)', basePrice: 550000 },
  { id: '20cm', name: '20cm (1 Tầng tiêu chuẩn)', basePrice: 650000 },
  { id: '22cm', name: '22cm (1 Tầng lớn)', basePrice: 750000 },
  {
    id: '2tier',
    name: '2 Tầng (25cm + 18cm)',
    guests: '12 - 18 khách tiệc lớn',
    basePrice: 850000,
  },
  {
    id: '3tier',
    name: '3 Tầng (30cm + 22cm + 15cm)',
    basePrice: 1650000,
  },
  { id: '30cm', name: '30cm (Đại tiệc tròn)', basePrice: 1250000 },
  { id: 'square20', name: 'Khay vuông 20x20cm', basePrice: 690000 },
];

export const STUDIO_FLAVORS = [
  { id: 'vanilla', name: 'Vanilla Madagascar', desc: 'Bơ tươi Pháp thượng hạng', color: 'bg-secondary-fixed', price: 0 },
  { id: 'choco', name: 'Chocolate Bỉ 70%', desc: 'Đậm vị cacao nguyên chất', color: 'bg-tertiary', price: 0 },
  { id: 'matcha', name: 'Matcha Uji Kyoto', desc: 'Trà xanh thanh tao ít ngọt', color: 'bg-[#5a7d52]', price: 35000 },
  { id: 'strawberry', name: 'Dâu Tây Đà Lạt', desc: 'Mứt dâu tươi mọng nước', color: 'bg-[#d35f79]', price: 0 },
  { id: 'tiramisu', name: 'Tiramisu Ý', desc: 'Cà phê & Mascarpone', color: 'bg-secondary', price: 45000 },
  { id: 'earlgrey', name: 'Trà Bá Tước Earl Grey', desc: 'Hương cam Bergamot tinh tế', color: 'bg-[#8d775f]', price: 35000 },
  { id: 'redvelvet', name: 'Nhung Đỏ Red Velvet', desc: 'Kem phô mai Cheese mịn', color: 'bg-[#b32638]', price: 40000 },
  { id: 'mango', name: 'Xoài & Chanh Dây', desc: 'Chua ngọt nhiệt đới tươi mát', color: 'bg-[#e5a93b]', price: 30000 },
  { id: 'pistachio', name: 'Hạt Dẻ Cười Pistachio', desc: 'Bùi béo thơm ngậy hạt dẻ', color: 'bg-[#7ba05b]', price: 55000 },
  { id: 'durian', name: 'Sầu Riêng Ri6', desc: 'Cơm sầu riêng tươi đậm đà', color: 'bg-[#d4b106]', price: 65000 },
  { id: 'caramel', name: 'Caramel Muối Biển', desc: 'Ngọt mặn hài hòa Valrhona', color: 'bg-[#b86b32]', price: 35000 },
  { id: 'sweetcorn', name: 'Bắp Phô Mai Nướng', desc: 'Ngọt thanh bắp non béo dịu', color: 'bg-[#f4d03f]', price: 30000 },
];

export const STUDIO_TOPPINGS = [
  'Fruit Tươi Theo Mùa',
  'Macaron Pháp Thủ Công',
  'Vụn Oreo Giòn',
  'KitKat Socola',
  'Chocolate Bar Nghệ Thuật',
  'Dâu Tây & Việt Quất Tươi',
  'Lá Vàng Thực Phẩm 24K',
  'Kẹo Đường Isomalt Pha Lê',
  'Hoa Tươi Ăn Được Hữu Cơ',
  'Bánh Quy Lotus Biscoff Giòn',
  'Hạnh Nhân & Hạt Dẻ Cười Nướng',
  'Nụ Meringue Giòn Xốp Pastel',
];

export const STUDIO_ACCESSORIES = [
  { id: 'candle', name: 'Nến số mạ vàng', desc: 'Số 7 lấp lánh', price: 20000, defaultChecked: true },
  { id: 'cutlery', name: 'Dao + Dĩa giấy Kraft', desc: 'Set cho 10 người', price: 15000, defaultChecked: true },
  { id: 'card', name: 'Thiệp chúc mừng thủ công', desc: 'In lời chúc cá nhân', price: 10000, defaultChecked: true },
  { id: 'flowers', name: 'Hoa tươi trang trí đế', desc: 'Hoa baby & hoa hồng cam', price: 50000, defaultChecked: true },
  { id: 'balloons', name: 'Bong bóng sinh nhật', desc: 'Combo 5 quả pastel', price: 35000, defaultChecked: false },
  { id: 'mica_box', name: 'Hộp mica trong suốt cao cấp', desc: 'Viền ruy băng lụa sang trọng', price: 40000, defaultChecked: true },
];

export const AI_RENDER_IMAGES = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCyhXEWYSyz954yXC07vW_GiAk0JNYv6i91D11vejNerHHGopcwo1PPhNNN0fcr8LAlpIHLPo0pAq0mK-tgy16Gpl6OBedDJahWf6brXsydHD3VfIZcXHjOo1vklFb2ePu6F1y4pxb-Zc5o4eAUJ8mRtHVfbzL6QkM6Ym3gIIxdLC1FWAX-Iur5n-2vyAMBXnqAsm6B1ZC-Vn1u_YuzLSd3NgmAgDo15GnNmVj6ozYG9K7DeCzDCMnQ',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBd6j6bmgh0WYAXMDqiuC_WGGOfg3HO30VI_SO5ZNzwrJokUJgyq64ut7m63xGmIhdMaLce79UhBiAzEj3vZtenhwzc_cenalwFQpPaRRX0iwcHc5CaD4DQPg1MeYdpc8JMn55bK_HXFB4V9hfH5CXjZ7ggE111zJIQy7cztWWJ9CBqRJtmu2RgJmuQX1g5hUBpmSVjqjt8bPz1Z3ZLiLmu7w0eaGAvP7O_-bq0oX-xKw5JTqaqcLK2',
];

export const AI_SHOWCASE_DATA = {
  promptText: 'Bánh Pikachu 2 tầng màu vàng rực rỡ, tai socola 3D, cốt chiffon dâu tây, chữ Happy Birthday Han 7 tuổi',
  extractedTags: [
    { label: 'Phong cách Anime', icon: 'palette', isHighlight: true },
    { label: 'Bé trai 7 tuổi', isHighlight: false },
    { label: '2 Tầng (25cm + 18cm)', isHighlight: false },
    { label: 'Vị Vanilla & Dâu tươi', isHighlight: false },
  ],
  metrics: {
    complexityScore: '4.2 / 5.0 (Cần nghệ nhân 3D tay nghề cao)',
    complexityPercent: '84%',
    priceEstimate: '800k - 1.100k',
    craftTime: '24 - 48 Giờ',
  },
  conceptImage: {
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCSdRLqfgwsCz0vKwbcccQJfg1SQuo9wPMYBPp-zrm3lQcuLAFU5gVV74QqLZbmygAbZ6zn9pTBG1zKjLFN7Chw6yYAk9vYDjwVoZ8kPxiT5Z45huZus1h3444mkv-1QCoGJPlvTZTGLLw0_P0YuE4wUK2UD2xN99x1b-ouVJuXVCuQ_TToeaE5WA0LYmzjLHlaMMiNi2xo2OvduhAocX42j6bVdnmQz4y6n45oaUw3u79pYihTDhWg',
    alt: 'A vivid and whimsical 2-tier Pikachu inspired birthday cake created by AI',
    matchCommitment: 'Cam kết giống ảnh >95%',
  },
  liveQuotes: [
    {
      id: 'quote-1',
      bakery: 'Sweet Bakery Studio',
      rating: '⭐ 4.9 (420 đánh giá)',
      sla: 'Giao xe lạnh 14:00 ngày mai',
      price: '950.000đ',
    },
    {
      id: 'quote-2',
      bakery: 'ABC Artisan Bakery',
      rating: '⭐ 4.8 (190 đánh giá)',
      sla: 'Miễn phí nến số và thiệp',
      price: '900.000đ',
    },
    {
      id: 'quote-3',
      bakery: 'Moon Cake Haute',
      rating: '⭐ 5.0 (310 đánh giá)',
      sla: 'Tặng kèm hộp mica trong suốt cao cấp',
      price: '1.050.000đ',
    },
  ],
  valuePillars: [
    {
      icon: 'visibility',
      title: 'Sinh Ảnh Mẫu Chuẩn Xác',
      desc: 'Hình dung trước 100% thành phẩm trước khi làm. Không còn cảnh đặt bánh qua ảnh mạng rồi nhận bánh biến dạng khác xa mong đợi.',
    },
    {
      icon: 'price_check',
      title: 'Định Giá Minh Bạch',
      desc: 'Không lo bị hét giá hay phụ thu bất ngờ. Nắm rõ bóc tách từng chi phí cốt bánh, kem whipping, phụ kiện nến, topper và hộp giữ nhiệt.',
    },
    {
      icon: 'handshake',
      title: 'Đấu Thầu Cạnh Tranh',
      desc: 'Nhiều tiệm bánh cùng chào giá trực tiếp cho một ý tưởng. Khách hàng hoàn toàn chủ động chọn nghệ nhân làm bánh có tay nghề tốt và giá hợp lý nhất.',
    },
  ],
};


