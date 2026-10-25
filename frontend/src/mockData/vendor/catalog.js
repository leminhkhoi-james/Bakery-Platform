/**
 * SweetCake Vendor Menu Catalog Mock Data
 */

export const INITIAL_VENDOR_CAKES = [
  {
    id: '#CK-BLISS-01',
    title: 'Velvet Raspberry Bliss',
    category: 'Bánh sinh nhật nghệ thuật',
    badge: 'Best Seller',
    isTop1: true,
    description: 'Cốt bánh red velvet mượt mà, nhân mứt mâm xôi Pháp, phủ Mascarpone bông mịn.',
    flavor: 'Cốt Velvet cacao, mứt mâm xôi',
    sweetness: '35%',
    prepTimeText: 'Lấy liền 2 giờ',
    prepTimeDetail: 'Cốt bánh mát sẵn sàng',
    prepTimeCategory: 'express', // 'express' | 'same-day' | 'preorder'
    rating: 4.9,
    reviewsCount: 142,
    soldCount: 238,
    isOpenForSale: true,
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBxX8ICx4fPde4rXUODn3NnOaKK2KxYNBfnJ5iZJcwMZ4r38JAgUGkhzyt56nsl3sD99jvdDXb3tAmsKcyyiN7iHHnDoEjqolsCDqe6KOSTpVOLldRUpe92sRdaCE99KmqeL0K451OYj9FoDXQne6QLO0Db7-nmnbcGQqSNMQAY4u5DqiAK-T2YhG-yZ_IAIDenpjXii5Vx7BAxcN3KstWVeTTWO45to-5BxjilAd0KPKQqwo3wt0wB',
    sizes: [
      { label: '14cm (2-4 pax)', price: 420000, cost: 130000, margin: '69.0%' },
      { label: '16cm (4-6 pax)', price: 480000, cost: 148000, margin: '69.2%', isPopular: true },
      { label: '18cm (6-8 pax)', price: 560000, cost: 180000, margin: '67.8%' },
    ],
    complimentaryGift: true,
    freeCalligraphy: true,
    freshFlowersAddon: false,
  },
  {
    id: '#CK-EARL-02',
    title: 'Parisian Earl Grey & Hazelnut Mousse',
    category: 'Bánh Mousse & Entremet',
    badge: 'Signature',
    isTop1: false,
    description: 'Trà Bá Tước Bergamot thanh nhã, lớp tráng caramel mặn & hạt phỉ nướng giòn rụm.',
    flavor: 'Trà Bá Tước, caramel mặn, hạt phỉ',
    sweetness: '30%',
    prepTimeText: 'Chuẩn bị 4-6 giờ',
    prepTimeDetail: 'Cần đông lạnh mousse',
    prepTimeCategory: 'same-day',
    rating: 4.95,
    reviewsCount: 89,
    soldCount: 114,
    isOpenForSale: true,
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuA1uNcwx6YFJ78hCUIwQSD2gqLIConeYVbp1Oaqic02i_FVOTU0M9UfDn_EM2qNzk46cgbDtKKdnSVsf8LW73aLik3T44g5nhXL-UuIEm6zdoHXamMI3Fmzg_rNCsSQQADlDLXirm7rV_vboKNEo1EGi-l4k-dPsKqHWlCZCcDE3aan_OQfFvoflp9JnFqQFUiligUPY0mHph8EZPJkuO5EszkQNhd1_lZ3j9r60JQsc8pVcMqVtEm7',
    sizes: [
      { label: '16cm (4-6 pax)', price: 520000, cost: 160000, margin: '69.2%' },
      { label: '20cm (8-10 pax)', price: 690000, cost: 215000, margin: '68.8%' },
    ],
    complimentaryGift: true,
    freeCalligraphy: true,
    freshFlowersAddon: true,
  }
];
