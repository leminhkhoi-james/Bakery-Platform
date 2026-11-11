# DataInit — dữ liệu mẫu bằng Java

Mỗi service nghiệp vụ có `config/DataInit.java`, tự chạy bằng `CommandLineRunner`
mỗi lần khởi động, không cần profile hoặc biến bật/tắt riêng. Gateway không sở hữu
DB nên không cần DataInit.
Không cần nhập file SQL. Flyway vẫn tạo schema trước, sau đó DataInit ghi dữ liệu
vào DB riêng của service bằng entity và Spring Data JPA repository, trong một
transaction cục bộ. Không dùng `JdbcClient`, native query hoặc đọc file SQL trong
DataInit. Ví dụ cách gán dữ liệu trong Bakery:

```java
if (!bakeryRepository.existsById(id(10, number))) {
    Bakery bakery = new Bakery();
    bakery.setId(id(10, number));
    bakery.setName("Tiệm Bánh Dâu Tây");
    bakery.setPhoneNumber(phone(owner));
    bakery.setEmail(email);
    bakery.setStatus(BakeryStatus.ACTIVE);
    bakeryRepository.save(bakery);
}
```

Các entity dùng UUID tự sinh kế thừa `UuidEntity`: `setId` chỉ yêu cầu UUID mẫu,
Hibernate gán ID thật lúc persist. Khi tạo dữ liệu thông thường không gọi `setId`,
UUID vẫn tự sinh như trước; ID thật của object mới vẫn null trước persist, giữ
cách nhận biết entity mới, merge và optimistic locking của JPA. Lớp dùng chung chỉ
chứa kỹ thuật ID, không chứa dữ liệu nghiệp vụ. Entity có ID gán sẵn hoặc `@MapsId`
giữ mapping tương ứng. Bổ sung entity/repository cho địa chỉ Identity và prompt/
execution Cake AI để seed qua JPA; các API hiện có của chúng không đổi.

## Cách chạy local

1. Cấu hình các DB và secret trong `backend/.env` như bình thường; working directory
   của ứng dụng là `backend` (xem `LOCAL-SETUP.md`).
2. Run/restart Identity, Bakery, Subscription, Marketplace, Order, Chat và Cake AI.
   Nên chạy Identity → Bakery → Subscription trước để đăng nhập/test được ngay,
   rồi các service còn lại. Seed không gọi HTTP sang service khác, nên thứ tự không
   ảnh hưởng việc insert; dữ liệu liên kết đầy đủ sau khi cả 7 service đã seed xong.
3. Những lần Run sau tự kiểm tra và nạp phần còn thiếu; dữ liệu đã có được giữ lại.
   Không cần thêm `spring.profiles.active=seed` hoặc Program arguments riêng.

Với Docker, build/up bằng bộ Compose hiện có; DataInit tự chạy khi container khởi
động. Không cần biến `SPRING_PROFILES_ACTIVE=seed`, không đổi volume hoặc xóa DB.

Mỗi máy chạy cùng code sẽ có cùng bộ mẫu, nhưng các chỉnh sửa sau đó vẫn
thuộc DB riêng từng máy. Muốn đồng bộ chỉnh sửa giữa nhiều máy cần backend/DB dùng chung.

## Tài khoản

Tất cả tài khoản mẫu dùng mật khẩu **`123123`**, được lưu bằng PasswordEncoder
của Identity, không lưu plaintext trong DB.

| Email | Vai trò/tình trạng ban đầu |
|---|---|
| `admin@gmail.com`, `admin2@gmail.com` | ADMIN |
| `user1@gmail.com` … `user6@gmail.com` | CUSTOMER, có địa chỉ giao hàng |
| `shop1@gmail.com` … `shop3@gmail.com` | CUSTOMER + BAKERY_OWNER, tiệm ACTIVE và gói còn hạn |
| `newshop1@gmail.com` | CUSTOMER, hồ sơ tiệm PENDING_APPROVAL, chưa mua gói |
| `newshop2@gmail.com` | CUSTOMER, tiệm ACTIVE, chứng từ gói đang chờ admin duyệt |
| `newshop3@gmail.com` | CUSTOMER, tiệm DRAFT |
| `block@gmail.com` | CUSTOMER bị khóa |

Để test trọn luồng customer → owner từ đầu, dùng một tài khoản `user*` chưa có
tiệm hoặc đăng ký tài khoản mới; các `shop*` dùng để test chức năng sau kích hoạt.
Đây là email đăng nhập mẫu cho DB local, không dùng để gửi thư.

Tên hiển thị dùng tên người và tiệm tự nhiên: Tiệm Bánh Dâu Tây, Tiệm Bánh Cacao,
Mây Trắng Bakery, Lò Bánh Góc Nhỏ, Tiệm Bánh An Nhiên và Bếp Bánh Hạnh Phúc.
Trạng thái DRAFT/PENDING_APPROVAL/ACTIVE hiển thị bằng trường trạng thái, không
chèn vào tên tiệm. Nội dung sản phẩm, yêu cầu, tin nhắn và đánh giá mô phỏng tình
huống sử dụng thông thường; tài khoản đăng nhập ngắn và mật khẩu không đổi.

## Dữ liệu ban đầu

| Service | Dữ liệu |
|---|---|
| Identity | 15 tài khoản, role/profile, 6 địa chỉ |
| Bakery | 6 tiệm, thành viên OWNER, địa chỉ/vùng giao/giờ mở cửa, 3 danh mục, 12 sản phẩm (9 PUBLISHED), option kích thước, 6 add-on |
| Subscription | Giữ 3 gói có sẵn; 5 đơn đăng ký, 4 chứng từ, 3 kỳ gói ACTIVE |
| Marketplace | 8 yêu cầu ở nhiều trạng thái, sở thích bánh, 9 báo giá và lịch sử trạng thái |
| Order | 9 đơn (7 direct, 2 từ offer), item/địa chỉ snapshot, lịch sử, 2 đánh giá |
| Chat | 4 hội thoại, 8 thành viên, 12 tin TEXT, biên nhận đọc |
| Cake AI | 4 job FAILED/CANCELLED, prompt revision và execution tương ứng |

Các ID mẫu có prefix `a110`, được cố định giống nhau giữa các service. Các tham chiếu
liên service là UUID, không có FK/query xuyên DB. Đơn mẫu dùng mã `ORD-260001`,
đơn gói `SUB-260001`, reference `CK-SUB-260001` theo số thứ tự; chúng là dữ liệu
kiểm thử, không chứng minh có
chuyển tiền ngân hàng. Không tạo VNPay checkout/IPN hay gọi provider AI. Job AI ở
trạng thái kết thúc để scheduler không lấy chạy. Không tạo object key ảnh/chứng từ
giả; ảnh thật upload qua API với storage đã cấu hình. Các gói mẫu còn hạn khoảng
30 ngày từ lần seed đầu với gói tháng mặc định, không tự gia hạn khi restart.

## Chạy lại và giữ dữ liệu cũ

- Kiểm tra `repository.existsById`/`findById` rồi chỉ `save` entity còn thiếu.
  Riêng email cũ `@demo.test` của đúng UUID fixture được đổi sang tên ngắn ở bảng
  trên khi Run lại service (kèm email liên hệ tiệm). Email đã tự chỉnh không bị đổi.
  Các nội dung seed cũ chứa “Demo” được thay bằng nội dung tự nhiên khi vẫn khớp
  chính xác giá trị gốc và UUID mẫu. Tên, mô tả hoặc tin nhắn đã tự chỉnh giữ nguyên;
  tin đã sửa/xóa không được tạo lại. Chỉ đổi nội dung trình bày của snapshot mẫu,
  giữ ID, số tiền, trạng thái, role, mật khẩu và kỳ gói hiện có. Slug cũ đang dùng
  vẫn giữ để không đổi liên kết; bản ghi tạo mới dùng slug không có “demo”.
  Không đặt lại mật khẩu, role, giá gói, trạng thái hoặc lịch sử đã chỉnh. Snapshot
  của đơn gói mới lấy từ plan hiện có trong Subscription.
- Seed sử dụng transaction trong từng DB; lỗi lưu rollback seed của service đó.
  Chạy một instance seed cho mỗi service; không bật đồng thời nhiều instance cùng
  seed vào một DB. Không có transaction xuyên 7 DB; sửa lỗi rồi chạy lại service
  chưa xong, không cần xóa DB của các service đã hoàn tất.
- Nếu email demo đã thuộc một UUID khác, Identity dừng seed với thông báo rõ ràng
  thay vì gắn role/tiệm vào tài khoản đó. Cần xử lý xung đột email hoặc dùng DB
  riêng cho bộ mẫu, không tự gán thêm quyền vào tài khoản hiện có.
- DataInit không phải công cụ reset/đồng bộ DB. Nếu đã xóa/chỉnh từng phần dữ liệu
  mẫu hoặc đã nhập bộ fixture khác, nên dùng DB demo riêng để có trạng thái ban đầu
  đúng như bảng trên. Theo lựa chọn hiện tại, bộ tài khoản mẫu được khởi tạo ở mọi
  lần chạy ứng dụng; đây là cách chạy dự án với dữ liệu phục vụ học tập/kiểm thử.

Chỉ thêm DataInit/config mẫu/hướng dẫn; không đổi schema, API, frontend, secret hoặc
đường dẫn DB đang dùng. Việc chạy seed cần DB/Flyway của service đã hoạt động; seed
không sửa lỗi sai mật khẩu DB, kết nối hoặc checksum migration.
