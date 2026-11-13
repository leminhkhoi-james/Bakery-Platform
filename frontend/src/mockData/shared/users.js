/**
 * SweetCake Shared Customer Profile & Demo Users Mock Data
 */

export const DEFAULT_CUSTOMER_PROFILE = {
  name: 'Hân Mai',
  fullName: 'Nguyễn Mai Thảo Hân',
  email: 'hanmai.sweetcake@example.com',
  phone: '0918 234 567',
  cakesEnjoyed: 18,
  savedDesigns: 12,
  reviewsGiven: 14,
  vipStatus: 'Diamond VIP',
  memberSince: '10/2023',
  address: 'Căn hộ 18.04, Tháp Opal, Saigon Pearl, 92 Nguyễn Hữu Cảnh, Bình Thạnh, TP.HCM',
  tasteNotes: 'Cốt Chiffon vani dâu tây ít ngọt 30%, kem whipping động vật Pháp',
};

export const MOCK_CURRENT_USER = {
  id: 'CUST-DEMO',
  name: 'Mai Lan',
  email: 'mailan.patisserie@gmail.com',
  tier: 'gold',
  tierLabel: 'Khách Đặt Tiệc',
};

export const DEFAULT_SAVED_ADDRESSES = [
  {
    id: 'addr-1',
    title: 'Nhà riêng (Mặc định)',
    phone: '0918 234 567',
    address: 'Căn hộ 18.04, Tháp Opal, Saigon Pearl, 92 Nguyễn Hữu Cảnh, P. 22, Q. Bình Thạnh, TP.HCM',
    isDefault: true,
  },
  {
    id: 'addr-2',
    title: 'Công ty (Văn phòng Thảo Điền)',
    phone: '0903 112 334',
    address: 'Tầng 4, The Galleria Office Park, 21 Võ Trường Toản, P. Thảo Điền, TP. Thủ Đức',
    isDefault: false,
  },
];

