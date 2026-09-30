/**
 * SweetCake Admin Dashboard Mock Data
 */

export const ADMIN_PERIOD_METRICS = {
    today: { gmv: '124.500.000₫', fee: '6.225.000₫', orders: '186 đơn', growth: '+8.2%' },
    '7days': { gmv: '780.200.000₫', fee: '39.010.000₫', orders: '1.045 đơn', growth: '+15.4%' },
    month: { gmv: '2.485.600.000₫', fee: '124.280.000₫', orders: '3.420 đơn', growth: '+24.5%' },
    quarter: { gmv: '7.850.200.000₫', fee: '392.510.000₫', orders: '10.840 đơn', growth: '+31.8%' },
  };

export const INITIAL_PENDING_BAKERIES = [
    {
      id: 1,
      name: 'Atelier De Gâteau',
      location: 'Thảo Điền, TP. Thủ Đức',
      specialty: 'Bánh cưới cao cấp Pháp',
      experience: 'Kinh nghiệm 7 năm',
      badge: 'Đạt chuẩn ATTP',
      image:
        'https://lh3.googleusercontent.com/aida/AEtjO1UmHzVt93pL6w5j9UzqGREgPi3PiEwZ4KiuKgwiKeJ8rMQQIS34ijOpBtGHIly7eaEmOqqi2MeXsmQfIl3OrOkbdUgDZuc_bUV-vfm4cSLMnwc-EbQSVTT3SHAkPuZdzuQO7__mcBu_i75DOEEwSS1eH_2iwD4eTHcFXF6KEvr58KgxO0_rNAzaYlV-PK2iLehgDSfOHkLhAqourDsButDlEEyq2o2EXMeeUeV4ojG6O5tM7UFw5KN1GvE',
      status: 'pending',
    },
    {
      id: 2,
      name: 'Sweet Mochi & Bento',
      location: 'Bình Thạnh, TP. HCM',
      specialty: 'Bento & Mini Cake',
      experience: 'Kinh nghiệm 3 năm',
      badge: 'Cần thêm ảnh bếp nướng',
      badgeType: 'warning',
      image:
        'https://lh3.googleusercontent.com/aida/AEtjO1UMavpQzOpzZX2VWjO17tVHyBL_U7c3LvWWo2SnCpdIBCLUvu__ivGOikYFjcWFrnZlNEfUNDfFdyDOXvRZurrdsV55n346G4XeD9JuIzluQ0JDzxSX4qgEACFBNEJWEQy9oZ_8XI2dazaH9UrIbbZBokHJICncGVG-_mTzlLk6YsU-tqSYpW9CJtJWwlEWnb8Hr8RSNFvp3GSwxgt-Jk9R5JcFbND6guF8XvKwpWLb8r8-IIXloL2NTA',
      status: 'pending',
    },
    {
      id: 3,
      name: 'Dark Velvet Pâtisserie',
      location: 'Quận 1, TP. HCM',
      specialty: 'Truffle Chocolate Chuyên sâu',
      experience: 'Kinh nghiệm 5 năm',
      badge: 'Chứng chỉ Le Cordon Bleu',
      image:
        'https://lh3.googleusercontent.com/aida/AEtjO1Xuu58O1Y591BJyodt5j8gpFRBi3I85x-jVHXtnOVvQsYarJpyBHKIz7gDaO76RQm_qv32W3EfmI9QrQoHQvJNRbOF0tm4eS98s1SHxp4f0dvvX4ykdiZokcN2b0Jq1Q5RRrM1GBwovtVpgXyi8iwse8zzzNIuQJ32GZ0EG1s6hMs2ZkLIgg6XIdeFqs__E7-ciWrtDyEodJPu_ma-VIweQFi7TE-UxKMBWM9BLcOT-4sUxi0up_C2ebyA',
      status: 'pending',
    },
  ];

export const INITIAL_ESCROW_AUDIT_ORDERS = [
    {
      id: '#ORD-2025-9982',
      customerName: 'Chị Mai Lan',
      avatar:
        'https://lh3.googleusercontent.com/aida/AEtjO1WZRjjnQUSZWO0GO2HHbYzb_pF_Cb1GouEXNwCe8hr80KU7z8gLbqNO3e3r49bcYMylM4EN5qZ5rfSHF1zUax8zf2l6gvDphlkKepCJcgJpJgnBDvnC4dR6oFg-YO8Y-lt4GcA3go2fuzEy5axSH7juE_RlDcYLmaPw_30hlnTVCtvSJ3vukYWt6WPKODHMIF2CcVCVPOAYMYqDniTJB6oVTDtxpPeUSgsrCuTo-RuHJ1fkwE4a5dmjb30',
      vendor: 'La Crème Atelier',
      cakeType: 'Bánh cưới 3 tầng hoa đường',
      amount: 5200000,
      status: 'Khóa cọc 100%',
      statusCode: 'locked',
    },
    {
      id: '#ORD-2025-9975',
      customerName: 'Anh Tuấn Kiệt',
      avatar: null,
      initials: 'TK',
      vendor: 'The Sweet Art Boutique',
      cakeType: 'AI Gen Custom Sculpture',
      amount: 3850000,
      status: 'Đang giao xe lạnh 5°C',
      statusCode: 'delivering',
    },
    {
      id: '#ORD-2025-9968',
      customerName: 'Hoàng Phương Pâtisserie',
      avatar: null,
      initials: 'HP',
      vendor: 'Maison De Mousse',
      cakeType: 'Entremet Set 12 phần',
      amount: 1450000,
      status: 'Đã giao - Chờ giải ngân',
      statusCode: 'ready_payout',
    },
    {
      id: '#ORD-2025-9954',
      customerName: 'Quang Thịnh Event Co.',
      avatar: null,
      initials: 'QT',
      vendor: 'ChocoLuxe Master',
      cakeType: 'Tháp Macaron & Tartlet Sự Kiện',
      amount: 4600000,
      status: 'Khóa cọc 100%',
      statusCode: 'locked',
    },
  ];
