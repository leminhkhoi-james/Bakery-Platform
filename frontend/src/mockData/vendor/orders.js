/**
 * SweetCake Vendor Kitchen Kanban Orders Mock Data
 */

export const INITIAL_KANBAN_ORDERS = {
    // CỘT 1: Chờ duyệt (Khách đã cọc Escrow, chờ tiệm nhận)
    pending: [
      {
        id: '#ORD-2025-9982',
        customer: 'Chị Hân Mai',
        phone: '0918 234 567',
        category: 'birthday',
        deliveryTime: '25/10 - 15:30',
        address: 'Saigon Pearl, Bình Thạnh',
        title: 'Bánh Sinh Nhật Pikachu Tạo Hình 3D (2 Tầng)',
        sizeSpec: '2 Tầng (20cm + 14cm) • Bé Minh Khang 7 tuổi',
        description:
          'Cốt Chiffon Vani dâu tây organic ít ngọt 30%, tượng Pikachu 3D nặn fondant, nến số 7 mạ vàng.',
        price: 950000,
        image:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuDl7eAPfu8ECgjGE4u7J5mfocv80iKgNlY1KhInqVxv-hjR5O1WFAa3x79hXqQhZN3RzfJ33wSPB0UKdouIsRpP13PgfleKx3mCShMDqV2rZVoiWnYGmSN7G4E0-D7CFYm5j5rpDndvQ3n1fV4YZICJJmac5TTLXpW80iIIepS9i-MaUDXTEYbRmI-jbI0Rfv0jZk9NELClAHgLk1Vl7QzP8IxXVqOMm28H2jPrOr_TpdRh8EhWTrhJ',
        escrowLocked: true,
        isUrgent: true,
        urgentReason: 'Khách vừa chốt báo giá • Cần xác nhận trong 15 phút',
        timeline: [
          { time: '10:00', text: 'Khách đăng yêu cầu RFQ trên sàn' },
          { time: '10:15', text: 'Tiệm gửi báo giá chi tiết 950.000đ' },
          { time: '10:30', text: 'Khách chốt tiệm & Đặt cọc Escrow 950.000đ thành công' },
          { time: '10:35', text: 'Chờ tiệm xác nhận nhận đơn' },
        ],
      },
      {
        id: '#ORD-2025-9985',
        customer: 'Bạn Hoàng Anh',
        phone: '0912 344 123',
        category: 'birthday',
        deliveryTime: 'Hôm nay - 18:30',
        address: 'Landmark 81, Bình Thạnh',
        title: 'Bento Cake Vintage Hàn Quốc "Happy 1st Anniversary"',
        sizeSpec: 'Size 10cm Mini • 2 người',
        description: 'Cốt bông lan phô mai trứng muối, phủ kem pastel viền ren vintage Hàn Quốc.',
        price: 450000,
        image:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuAMEBLVyoWLNtL7QaMxVf2ZwGrSv9M_4OjqtiP8NfXif6fNmT-mXE-vpUILqfIY0FLmzPqESKfQq27pvezK5KI2_gxo3GnXI6YkMAokLEwqo1L42nY36qR4dE4lW4SsfNps77xTP7cb2shkOiIlUAdunakbBJrgzTnX4C0a3rEDmPMkMbKN9FDG9MFSzpuhKJcnHjyEgwguYKQ3A-9HX3EmyhqNtx4tRiNKdx4V7huepOp7EkBZsLlD',
        escrowLocked: true,
        isUrgent: false,
        timeline: [
          { time: '11:10', text: 'Khách thanh toán Escrow 450.000đ' },
          { time: '11:12', text: 'Chờ tiệm xác nhận nhận đơn' },
        ],
      },
    ],

    // CỘT 2: Đã lên lịch (Tiệm đã nhận đơn, chuẩn bị nguyên liệu & lịch làm)
    scheduled: [
      {
        id: '#ORD-2025-9978',
        customer: 'Anh Tuấn Kiệt',
        phone: '0988 567 123',
        category: 'birthday',
        deliveryTime: 'Hôm nay - 16:30',
        address: 'Thảo Điền, TP. Thủ Đức',
        title: 'Mousse Trà Bá Tước Parisian Earl Grey',
        sizeSpec: 'Size 18cm • 6-8 phần',
        description: 'Kèm hoa tươi chúc mừng và bộ nến xoắn ánh kim vàng sang trọng.',
        price: 520000,
        chefAssigned: 'Bếp phó Kim',
        prepStatus: 'Đã chuẩn bị nguyên liệu cốt bánh & trà bá tước',
        image:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuBsxkqibCk8UM_SegIA4FpIItNqdFxBMbOkJ5NzxtKJ474ZF682nyfMhBFyI2H0Kw7H1X_Zd5J2ypYDDEQNy4AWYkTtRn_oSPXzzaOvRU5FDRzf-dqHGeSxEq2aa8Z3L0AoAlXp2aO-3MHqkDXACV3oFKwvqnCP9ST0NqRq4XT-SCsVyosOEd6emxUIfEPvugX0OWsssqDZTqKloXH7P_erNFrCCtqYpU50UJOiOOBHmIwibrfgRhBf',
        isUrgent: false,
        timeline: [
          { time: '09:00', text: 'Khách đặt cọc Escrow' },
          { time: '09:15', text: 'Tiệm đã xác nhận nhận đơn' },
          { time: '13:00', text: 'Đã phân công thợ & chuẩn bị nguyên liệu' },
        ],
      },
    ],

    // CỘT 3: Đang nướng & tạo hình (Giai đoạn sản xuất, checklist, chụp duyệt)
    baking: [
      {
        id: '#ORD-2025-9970',
        customer: 'Chị Thu Trang',
        phone: '0934 888 776',
        category: 'birthday',
        deliveryTime: 'Hôm nay - 15:00',
        address: 'Quận 1, TP.HCM',
        title: 'Nhung Đỏ Red Velvet Raspberry Bliss',
        sizeSpec: 'Size 16cm • 4-6 phần',
        description: 'Cốt Red Velvet cacao bơ sữa, kem phô mai mascarpone Pháp & mâm xôi tươi.',
        price: 480000,
        progressPercent: 80,
        steps: [
          { name: 'Chuẩn bị nguyên liệu', done: true },
          { name: 'Nướng cốt bánh', done: true },
          { name: 'Đánh kem phô mai', done: true },
          { name: 'Tạo hình & phủ mâm xôi', done: true },
          { name: 'Đóng hộp bảo quản', done: false },
        ],
        image:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuB_lI4A0XNV_ppOwWy79h2__L9OmXBh2_0YNbNhXiY8lw2_MUL_LjEZlTJRmCaRllXUjGzJ2flscr1zFF0DdcNF_VhyrkKN706EppbvQEStry_T23xSiRtzXdFDB5tkN3uauXx_zwSsmf2qX25mnWWhWWauRfHOSV_ATahp7hK0r4uTieUKkRtPw-lwB51nev6C2RPWbalhafgXMFTGvoFxwZKloYImpttXOxr6TFYPLal0-Fonpu8X',
        isUrgent: true,
        urgentReason: '🔴 Cần xong trước 14:15 để kịp giao lúc 15:00',
        timeline: [
          { time: '08:30', text: 'Khách chốt đơn & cọc Escrow' },
          { time: '08:45', text: 'Tiệm xác nhận đơn' },
          { time: '11:00', text: 'Bắt đầu nướng cốt Red Velvet' },
          { time: '12:30', text: 'Nướng xong, đang trang trí mâm xôi' },
        ],
      },
      {
        id: '#ORD-2025-9965',
        customer: 'Cặp đôi Hoàng & Mai',
        phone: '0903 999 111',
        category: 'wedding',
        deliveryTime: '28/10 - 17:00',
        address: 'GEM Center, Quận 1',
        title: 'Bánh Cưới 3 Tầng Rustic Floral Chiffon',
        sizeSpec: '3 Tầng (26cm + 20cm + 14cm) • 40-50 khách',
        description: 'Đang đính hoa mẫu đơn hữu cơ và phủ viền kem semi-naked mộc mạc.',
        price: 2450000,
        progressPercent: 40,
        steps: [
          { name: 'Chuẩn bị nguyên liệu', done: true },
          { name: 'Nướng cốt 3 tầng', done: true },
          { name: 'Đánh kem whipping', done: false },
          { name: 'Ráp tầng & cắm hoa thật', done: false },
          { name: 'Đóng hộp bảo quản', done: false },
        ],
        image:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuCR2j74H993yM6NqXVcF6wFIZTba-3LyB9Mq5cXciFkaHgd0-MXI6xzgoAaWwb2_hNdLishY5yB5ubAb4KofzP4jF5JL7c-zDqoqPzM10xtlujZ7uF0x9GJPZV9NY_hL7ZDuMcBpSpuFvtg6zwYBpafGz4nYd3b2NDHFuiWHu6FfVd0PlacveqsrIUQVJ0nwdtvUBS3eg9SLrFrFb-jhZF1-BGH3SVOvCJQOWqa-_oNCP1QT8wy0Ans',
        isUrgent: false,
        timeline: [
          { time: 'Hôm qua', text: 'Khách chốt thầu bánh cưới' },
          { time: '08:00', text: 'Bắt đầu nướng cốt 3 tầng' },
        ],
      },
    ],

    // CỘT 4: Đang giao xe lạnh (Tài xế, GPS, Nhiệt độ 4.5°C)
    delivering: [
      {
        id: '#ORD-2025-9958',
        customer: 'Chị Lê Vy',
        phone: '0908 555 666',
        category: 'corporate',
        deliveryTime: 'Dự kiến: 14:20',
        address: 'Bitexco Financial Tower, Quận 1',
        title: 'Mango Passion Mousse Vàng Ánh Kim',
        sizeSpec: 'Size 20cm • 10 phần',
        price: 650000,
        driverName: 'Nguyễn Văn Hùng',
        driverPhone: '0908 123 456',
        licensePlate: '59-C1 882.19',
        vanCode: 'Xe Lạnh SH04',
        tempC: '4.5°C',
        remainingMins: 'Còn ~12 phút',
        image:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuCOCINIeq92usLKKBjllKJEw2BGksgvlM54RNO5sH1zI9aREyYgU7f6Cn-IS9rk7clD0h1eFbRtS6-dAapJ8HtdskQhg5_Kf3AX7TiRWAOngK8uVWBA-0uYjSmz3m84tFu7tvSAkBchlAJw0ffXDJ7LZvm_1k8sqdVnbMrnXb32QSBLmOzkhbgkSXWD_L2MnNY0x3XVBLRLE481ngVQwvlG8jbCLxp298aHIcwV3QbtONav7jhoAeHW',
        isUrgent: false,
        timeline: [
          { time: '10:00', text: 'Tiệm hoàn thành bánh & chụp ảnh duyệt' },
          { time: '13:45', text: 'Đóng thùng lạnh bàn giao tài xế Xe SH04' },
          { time: '14:00', text: 'Đang di chuyển trên đường (Nhiệt độ 4.5°C)' },
        ],
      },
    ],

    // CỘT 5: Hoàn tất (Khách đã nhận, Escrow mở khóa, Tiền về ví)
    completed: [
      {
        id: '#ORD-2025-9942',
        customer: 'Anh Minh Đức',
        phone: '0919 777 888',
        category: 'birthday',
        completedAt: 'Hoàn tất lúc 11:30',
        address: 'Quận 3, TP.HCM',
        title: 'Truffle Dark Chocolate 70% Bỉ',
        sizeSpec: 'Size 18cm',
        price: 550000,
        netPayout: 522500, // 95% sau 5% phí sàn
        escrowReleased: true,
        image:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuDQc3-sChlCzc2ggdfbTb-K34Fx0N8Nq1Yad9S6mpY8e2_TsT5AqG3bBjGsCzzyIIvH4XoZp8JZLjW3hFSfeyKQJvyNh_43DUUvnarGr-1Ly7npVePgmKU44Z9PPmTbqrwTMnEFmLOOdVBiHg6NpGMo0lWxwRxdNJGR0ezBbmYJr1X0nt56OD-NSwugzRwdOCR_XQkve6QCkxESWoZj4zPuKtJBro0jrLdJBbQ_JtGokzv53HveVvZj',
        timeline: [
          { time: '07:30', text: 'Khách chốt đơn' },
          { time: '09:30', text: 'Hoàn thành làm bánh' },
          { time: '11:00', text: 'Xe giao tới điểm tiệc' },
          { time: '11:30', text: 'Khách xác nhận nhận bánh nguyên vẹn' },
          { time: '11:31', text: 'Escrow mở khóa • 522.500đ đã về ví tiệm' },
        ],
      },
    ],
  };

export const MOCK_KANBAN_ORDERS = INITIAL_KANBAN_ORDERS;
