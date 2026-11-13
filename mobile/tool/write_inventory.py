"""Sinh ma trận có thể truy vết từ enum route và mô tả capability đã triển khai."""
from pathlib import Path
import json, re

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'mobile/docs/demo-preview'
source = (ROOT/'mobile/lib/app/router/screen_id.dart').read_text(encoding='utf-8')
routes = re.findall(r"^\s*(\w+)\('([^']+)', '([^']+)', '(public|customer|vendor|admin)'\)", source, re.M)
details = [
('Catalog','Hero, mascot, danh mục, bánh mới, tiệm và CTA','Điều hướng thanh dưới, chọn persona'),
('Catalog','Tìm kiếm, danh mục, sắp xếp giá, tải thêm','Tìm không có kết quả rồi xóa tìm kiếm'),
('Catalog / Cart','Ảnh phóng to, size, vị, add-on, số lượng, giá','Chọn size 16 cm, thêm giỏ và đối chiếu giá'),
('Bakery','Tìm tiệm và lọc khu vực','Mở/layout/trạng thái; thao tác bộ lọc rà source'),
('Bakery / Catalog','Thông tin vận hành, thực đơn, mở chat','Mở/layout/trạng thái; liên kết rà source'),
('Subscription','Ba gói, hạn mức và chọn gói','Mở/layout/trạng thái; liên kết rà source'),
('Identity UI','Đăng nhập/đăng ký local, validation, quên mật khẩu chưa hỗ trợ','Mở/layout/trạng thái; xác thực thật ngoài phạm vi'),
('Cart','Sửa số lượng, bỏ bánh, tổng snapshot, lưu preview','Android thêm giỏ, tăng lượng, lưu preview'),
('Identity UI','Hồ sơ, sửa tên/email/địa chỉ, liên kết tác vụ','Sửa hồ sơ qua sheet, kiểm tra vòng đời controller'),
('Order','Tìm/lọc đơn, detail, timeline, hủy/hoàn tất, review','Mở/layout/trạng thái; state machine domain'),
('Order / Chat','Thông tin thỏa thuận trực tiếp với tiệm','Mở/layout/trạng thái; không có payment giả'),
('Cake AI UI','Prompt, màu/tầng/vị, ảnh mẫu, lưu draft/revision, RFQ handoff','Mở/layout/trạng thái; không có AI/3D thật'),
('Marketplace','Tìm/lọc RFQ, tạo yêu cầu, mở detail','Android retry khôi phục danh sách'),
('Marketplace','Form, ngân sách, ngày, loại, mẫu bánh, lưu DRAFT','Widget validation và Android tạo nháp'),
('Marketplace','Xem RFQ, sửa DRAFT, publish/cancel local, mở báo giá','Android mở bản nháp vừa lưu; domain publish/cancel'),
('Marketplace','Sắp tổng giá, đối chiếu và chọn preview','Widget chọn preview, vẫn giữ PENDING'),
('Marketplace','Breakdown giá, hiệu lực, preview, chat','Mở/layout/trạng thái; không tạo giao dịch'),
('Chat','Danh sách, unread, thread, gửi/ảnh/xóa/đóng local','Android gửi tin; domain chặn tin rỗng và hội thoại đóng'),
('Bakery / Catalog / Order','Chỉ số fixture theo tiệm, liên kết tác vụ','Mở/layout/trạng thái; chọn persona owner'),
('Catalog','Danh mục, sản phẩm, ảnh, option, add-on, xuất bản/lưu trữ','Widget tạo sản phẩm DRAFT'),
('Order','Lọc đơn theo tiệm, detail, chuyển trạng thái có xác nhận','Widget PENDING→CONFIRMED, Android detail'),
('Marketplace','RFQ OPEN, tìm kiếm, lọc tiệm đích','Mở/layout/trạng thái; điều kiện tiệm đích rà source'),
('Marketplace','Soạn/sửa/rút một báo giá mỗi tiệm/yêu cầu','Mở/layout/trạng thái; domain chặn báo giá trùng sau rút'),
('Bakery','Chọn tiệm, sửa vận hành, membership, gửi hồ sơ local','Mở/layout/trạng thái; phạm vi OWNER rà source'),
('Bakery UI','Thông báo doanh thu chưa có API, liên kết đơn/gói','Mở/layout/trạng thái; không bịa số dư'),
('Chat','Hội thoại theo tiệm, thread, gửi/ảnh/xóa local','Mở/layout/trạng thái; dùng cùng Chat repository'),
('Subscription','Chọn gói, tạo đơn, tham chiếu/ảnh mẫu, lịch sử','Widget tạo đơn và gửi chứng từ vào PAYMENT_REVIEW'),
('Admin UI','Hàng chờ, chỉ số fixture, điều hướng quản trị','Widget điều hướng đến quản lý người dùng'),
('Identity UI','Tìm/lọc/phân trang, thêm/sửa/khóa/xóa local','Widget tạo user; API thật chưa có'),
('Bakery','Lọc hồ sơ, xem, duyệt/bổ sung/tạm dừng local','Mở/layout/trạng thái; chuyển trạng thái rà source'),
('Subscription','Hàng chờ chứng từ, duyệt/từ chối có lý do','Android duyệt local; domain từ chối phải có lý do'),
('Subscription','Tạo/sửa gói, hạn mức, ngừng cung cấp','Mở/layout/trạng thái; đơn cũ giữ giá snapshot'),
('Order','Danh sách/detail, timeline và state controls local','Mở/layout/trạng thái; chung state machine Order'),
('Cake AI / Order','Duyệt thiết kế, lý do từ chối, ẩn/hiện review','Mở/layout/trạng thái; quyết định local'),
('Subscription','Tổng giá trị gói PAID, đối chiếu theo gói','Mở/layout/trạng thái; không gồm doanh thu bánh'),
]
assert len(routes) == len(details) == 35
rows = []
lines = ['# Danh mục màn hình SweetCake Mobile', '', 'Ngày đối chiếu: 07/11/2026. Baseline 35 route xác minh lại từ Web hiện tại; alias `/vendor-settings` không tính là màn hình thứ 36. Có 7 Public, 11 Customer, 9 Bakery Owner và 8 Admin. Form/sheet, thread chat, order detail và thư viện ảnh là trạng thái phụ, không cộng vào 35.', '', 'Mọi màn hình có nội dung local, loading/empty/error/retry, kiểm tra bố cục ở 320/360/390/430/768 px, chữ 1.8 và landscape. Cột bằng chứng phân biệt thao tác được tự động hóa với kiểm tra mở/layout và rà source; không khẳng định mọi tổ hợp thao tác đã test trên thiết bị.', '', '| # | Web | Màn hình Flutter / vai | Domain | Capability local | Bằng chứng thao tác | Ảnh Android |', '|---|---|---|---|---|---|---|']
for i, ((name,path,title,group),(domain,capability,verification)) in enumerate(zip(routes,details)):
    role = {'public':'Guest / mọi vai','customer':'CUSTOMER','vendor':'BAKERY_OWNER','admin':'ADMIN'}[group]
    if name == 'cart': role += ' / Guest'
    if name == 'vendorSubscription': role += ' / CUSTOMER onboarding demo'
    screenshot = f'{i:02d}-{name}.png'
    lines.append(f'| {i+1} | `{path}` | {title} · {role} | {domain} | {capability} | {verification} | [Ảnh](screenshots/{screenshot}) |')
    rows.append({'screen':name,'path':path,'title':title,'role':role,'domain':domain,'capability':capability,'verification':verification,'screenshot':screenshot})
lines += ['', '## Cách đọc kết quả', '', '`PASS` cho 35 route mở và render cùng các tình huống local trong automated tests; độ phủ layout không phải chứng nhận usability. Thao tác trọng tâm có widget/integration assertions như cột bằng chứng. Các đường còn lại được rà logic và trạng thái từ source, chưa có tự động hóa mọi nhánh. iOS runtime, TalkBack thủ công và hiệu năng release là `NOT VERIFIED`. Backend không thuộc phạm vi mobile UI này.', '', 'Guest mở chức năng cần tài khoản sẽ gặp trạng thái yêu cầu đúng persona. Bộ chọn Demo thay vai và xóa navigation stack. Đây là quyền local để xem UI, không phải lớp bảo mật. Phạm vi chủ tiệm được giới hạn bằng membership fixture và bộ chọn tiệm.']
(OUT/'MOBILE_SCREEN_INVENTORY_VI.md').write_text('\n'.join(lines)+'\n',encoding='utf-8')
(OUT/'evidence/mobile-screen-inventory.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'screens':len(rows),'groups':{'public':7,'customer':11,'vendor':9,'admin':8}}))
