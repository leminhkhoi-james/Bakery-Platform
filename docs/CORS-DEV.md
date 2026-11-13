# CORS trong controller

42 controller của Identity, Bakery, Subscription, Marketplace, Order, Chat và
Cake AI dùng annotation:

```java
@RestController
@CrossOrigin(originPatterns = "*", allowCredentials = "true")
public class ExampleController {
}
```

FE gửi `credentials: include`, nên dùng `originPatterns = "*"` để Spring trả lại
origin cụ thể thay vì header `Access-Control-Allow-Origin: *`, vốn không hợp lệ
với credentials. Không cần biến môi trường CORS.

Security của các service bật `.cors(Customizer.withDefaults())` để đọc annotation
MVC và xử lý OPTIONS trước JWT. Request thật vẫn phải qua xác thực và phân quyền.

Gateway không có controller; `PreflightCorsConfig` chỉ trả lời CORS OPTIONS trước
functional proxy routes. Request thật giữ header từ controller downstream, tránh
phát sinh header CORS trùng.

Gateway đã có `springdoc-openapi-starter-webmvc-ui:3.1.0`; không cần thêm dependency.
Swagger UI mặc định ở `http://localhost:8080/swagger-ui/index.html`, hoặc cổng
18080 với profile Gateway trong `compose.local-runtime.yaml`. Các service phải
chạy để Gateway tải spec và gọi API tương ứng.

Không cần tắt Docker Desktop hoặc database. Chạy bằng IDE thì restart service.
Với Compose dev, build/recreate application container để nhận code mới:

```powershell
docker compose up -d --build
```

Root Compose dev không khai báo Gateway. Gateway trong Docker cần build/recreate
đúng project có khai báo nó. Không cần xóa volume dữ liệu.
