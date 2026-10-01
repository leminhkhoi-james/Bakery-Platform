# Project Rules — MSS Bakery Platform

> Quy ước phát triển và các nguyên tắc kiến trúc bắt buộc cho MSS Bakery
> Platform. Developer và AI coding agents phải đọc file này trước khi sửa code.
> Đây là nguồn quy ước chính; tài liệu nghiệp vụ và schema vẫn lấy từ `docs/`.

---

## 0. Bối cảnh và thứ tự ưu tiên

MSS Bakery Platform là marketplace kết nối khách hàng với nhiều tiệm bánh:

- Bakery đăng sản phẩm bánh, option và add-on riêng.
- Khách có thể mua sản phẩm có sẵn, custom từ một sản phẩm hoặc đăng yêu cầu
  custom mở để nhiều bakery gửi offer.
- Khách và bakery có thể chat theo cake request/order.
- Cake AI Service tạo mẫu bánh từ prompt và ảnh tham khảo.
- Nền tảng không theo dõi payment mua bánh giữa khách và bakery.
- Bakery phải mua gói thuê tháng và gửi payment để admin xác nhận.

Khi có xung đột, áp dụng thứ tự ưu tiên sau:

1. Yêu cầu hiện tại của người dùng.
2. `AGENTS.md` và file này.
3. `docs/decisions/` và tài liệu kiến trúc đã được duyệt.
4. `docs/API_SPEC.md` và `docs/DATABASE.md`.
5. Code hiện có và convention cục bộ của module.

Không tự ý thay đổi nghiệp vụ, service boundary hoặc schema chỉ để code thuận
tiện hơn. Nếu thay đổi là cần thiết, cập nhật tài liệu trước hoặc cùng commit.

---

## 1. Tech stack

| Layer | Technology |
|---|---|
| Language | Java 21 |
| Backend | Spring Boot 4.1.1 / Spring Framework 7 |
| Security | Spring Security 7 + OAuth2 Resource Server + JWT |
| Database | PostgreSQL, database-per-service |
| Persistence | Spring Data JPA, Hibernate 7, Flyway |
| Service communication | REST đồng bộ; không dùng message broker |
| Validation | Jakarta Bean Validation |
| Build | Maven Wrapper |
| Test | JUnit, Mockito, MockMvc, Testcontainers PostgreSQL |
| Frontend | ReactJS; gọi backend qua API Gateway |
| Object storage | MinIO hoặc S3; database chỉ lưu object key/metadata |
| Local runtime | Docker Compose khi các service được scaffold đầy đủ |

Không giả định dependency đã tồn tại. Trước khi sử dụng thư viện, kiểm tra
`pom.xml`/`package.json` và thêm dependency tối thiểu cần thiết.

---

## 2. Microservice boundaries

Hệ thống có bảy bounded context chính:

| Service | Database | Dữ liệu sở hữu |
|---|---|---|
| Identity Service | `identity_db` | User, profile, address, role, refresh token |
| Bakery Service | `bakery_db` | Bakery, member, catalog, product option, add-on |
| Marketplace Service | `marketplace_db` | Cake request, preference, offer |
| Order Service | `order_db` | Customer order, item snapshot, delivery snapshot, review |
| Chat Service | `chat_db` | Conversation, participant, message, receipt |
| Cake AI Service | `cake_ai_db` | Generation job, prompt revision, generated design |
| Subscription Service | `subscription_db` | Plan, subscription order, bakery payment, subscription period |

### Boundary rules

- Mỗi service chỉ đọc/ghi database của chính mình.
- Không tạo foreign key xuyên database.
- Không import JPA entity/repository của service khác.
- ID tham chiếu service khác là `UUID` thuần, ví dụ `bakeryId`, `customerId`.
- Muốn kiểm tra external ID phải gọi API của service sở hữu dữ liệu.
- Không thực hiện distributed join bằng cách truy cập trực tiếp database khác.
- Không tạo shared database/schema để né database-per-service.
- Chỉ chia sẻ contract kỹ thuật nhỏ; không tạo shared domain model khổng lồ.

Ví dụ đúng trong Order Service:

```java
@Column(name = "bakery_id", nullable = false)
private UUID bakeryId; // External Bakery Service reference, không phải @ManyToOne
```

Ví dụ sai:

```java
@ManyToOne
private Bakery bakery; // Bakery entity không thuộc Order Service
```

---

## 3. Repository layout và package structure

Project hiện có module bootstrap `backend/`. Khi scaffold microservices, ưu
tiên monorepo với mỗi service là một Spring Boot application độc lập:

```text
Bakery Platform/
├── backend/
│   ├── pom.xml                         # Parent/aggregator khi chuyển multi-module
│   ├── identity-service/
│   ├── bakery-service/
│   ├── marketplace-service/
│   ├── order-service/
│   ├── chat-service/
│   ├── cake-ai-service/
│   ├── subscription-service/
│   └── api-gateway/
├── frontend/
├── database/postgresql/
├── docs/
├── AGENTS.md
└── .codex-rules/project-rules.md
```

Không biến `backend/` thành monolith chứa toàn bộ bảy domain nếu mục tiêu môn
học là microservices. Mỗi service phải build, test và deploy độc lập.

### Package bên trong một service

Ví dụ với Order Service:

```text
com.se193262.orderservice/
├── OrderServiceApplication.java
├── config/
├── security/
├── exception/
├── shared/
│   └── dto/
├── feature/
│   └── order/
│       ├── CustomerOrder.java
│       ├── OrderItem.java
│       ├── OrderRepository.java
│       ├── OrderController.java
│       ├── OrderService.java
│       ├── OrderServiceImpl.java
│       ├── OrderMapper.java
│       ├── CONTEXT.md
│       └── dto/
│           ├── CreateDirectOrderRequest.java
│           ├── CreateOfferOrderRequest.java
│           └── OrderResponse.java
└── infrastructure/
    ├── client/
    ├── storage/
    └── scheduler/
```

### Package rules

- Base package hiện tại của bootstrap là `com.se193262.backend`.
- Service mới dùng base package rõ nghĩa như `com.se193262.orderservice`.
- Một feature chứa controller, service, repository, entity, mapper và DTO của
  chính feature đó.
- DTO dùng chung rất ít mới đặt trong `shared/dto`.
- HTTP client, storage adapter và scheduler đặt trong `infrastructure`.
- Không đặt business controller hoặc domain rule trong `infrastructure`.
- Test mirror package của production code trong `src/test/java`.

---

## 4. Naming conventions

### Classes

| Type | Pattern | Ví dụ |
|---|---|---|
| Entity | `[BusinessName]` | `Bakery`, `CakeRequest`, `CustomerOrder` |
| Controller | `[Feature]Controller` | `ProductController`, `OfferController` |
| Service interface | `[Feature]Service` | `OrderService`, `SubscriptionService` |
| Service implementation | `[Feature]ServiceImpl` | `OrderServiceImpl` |
| Repository | `[Entity]Repository` | `CakeRequestRepository` |
| Request DTO | `[Action][Feature]Request` | `CreateOfferRequest` |
| Response DTO | `[Feature]Response` | `BakeryResponse` |
| HTTP client | `[RemoteService]Client` | `SubscriptionClient` |
| Mapper | `[Feature]Mapper` | `ProductMapper` |
| Exception | `[Reason]Exception` | `OfferAlreadyAcceptedException` |
| Config | `[Concern]Config` | `SecurityConfig`, `RestClientConfig` |

Tránh đặt entity là `Order`; dùng `CustomerOrder` để rõ nghiệp vụ và tránh gây
nhầm với từ khóa SQL.

### Methods and variables

- Dùng `camelCase`; constant dùng `UPPER_SNAKE_CASE`.
- Tên thể hiện nghiệp vụ: `acceptOffer()`, `activateSubscription()`,
  `generateCakeDesign()`.
- Tránh viết tắt như `repo`, `svc`, `req`, `res` trong production code.
- Boolean dùng tiền tố `is`, `has`, `can`: `isCustomizable`, `hasActivePlan`.
- Repository query tuân theo Spring Data: `findByBakeryIdAndStatus(...)`.

### Database naming

- Table và column dùng `snake_case`, số nhiều cho table.
- Java field dùng `camelCase` và khai báo `@Column(name = "...")` rõ ràng.
- Primary key dùng UUID; tiền dùng `NUMERIC(12,2)`/`BigDecimal`.
- Timestamp dùng `TIMESTAMPTZ`/`Instant`.

---

## 5. Controller và REST API

```java
@RestController
@RequestMapping("/api/v1/cake-requests")
public class CakeRequestController {

    private final CakeRequestService cakeRequestService;

    public CakeRequestController(CakeRequestService cakeRequestService) {
        this.cakeRequestService = cakeRequestService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CakeRequestResponse>> createCakeRequest(
            @Valid @RequestBody CreateCakeRequestRequest request) {
        CakeRequestResponse response = cakeRequestService.createCakeRequest(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(response));
    }
}
```

### Controller rules

- Controller chỉ nhận request, gọi service và trả response.
- Không chứa business logic, transaction hoặc repository call.
- Luôn dùng `@Valid` cho request body.
- Dùng constructor injection với field `final`; không field injection.
- Controller phụ thuộc service interface, không phụ thuộc implementation.
- Không trả JPA entity trực tiếp.
- Public API dùng prefix `/api/v1`.
- Service-to-service API dùng `/internal/v1` và phải được bảo vệ riêng.
- Tạo resource trả HTTP `201`; xóa thành công có thể trả `204`.
- Pagination dùng `Pageable` hoặc request record thống nhất; không trả `Page`
  entity trực tiếp nếu API contract dùng wrapper riêng.

---

## 6. Standard API response

```java
public record ApiResponse<T>(
        int statusCode,
        String message,
        T data,
        Instant timestamp
) {
    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(200, "Success", data, Instant.now());
    }

    public static <T> ApiResponse<T> created(T data) {
        return new ApiResponse<>(201, "Created", data, Instant.now());
    }

    public static <T> ApiResponse<T> error(int statusCode, String message) {
        return new ApiResponse<>(statusCode, message, null, Instant.now());
    }
}
```

- Dùng một response envelope thống nhất trong toàn bộ public API.
- Dùng factory method; không dựng response lặp lại trong controller.
- Error response phải đi qua `GlobalExceptionHandler`.
- Không đưa stack trace, SQL error hoặc internal URL ra client.
- Internal API có thể dùng DTO gọn hơn nếu được ghi rõ trong API spec.

---

## 7. DTO và mapping

```java
public record CreateOfferRequest(
        @NotNull UUID cakeRequestId,
        @NotNull UUID bakeryId,
        @NotNull @DecimalMin("0.00") BigDecimal cakePrice,
        @NotNull @DecimalMin("0.00") BigDecimal deliveryFee,
        @Future Instant expiresAt,
        String message
) {}
```

### DTO rules

- Ưu tiên Java `record` cho request/response DTO.
- Request DTO phải có Jakarta validation phù hợp.
- Không dùng entity làm request hoặc response.
- Không expose password hash, refresh token hash, payment proof object key hoặc
  dữ liệu nội bộ không cần thiết.
- Mapping phức tạp đặt trong mapper riêng; mapping đơn giản có thể dùng static
  factory như `OrderResponse.fromEntity(order)`.
- Không gọi repository hoặc remote service từ mapper.
- Snapshot DTO phải phản ánh dữ liệu tại thời điểm giao dịch, không tự lấy lại
  giá hiện tại của product/add-on.

---

## 8. Service layer và transaction

```java
public interface OfferService {
    OfferResponse createOffer(CreateOfferRequest request);
    OrderReferenceResponse acceptOffer(UUID offerId, UUID customerId);
}

@Service
public class OfferServiceImpl implements OfferService {

    private final OfferRepository offerRepository;
    private final SubscriptionClient subscriptionClient;

    public OfferServiceImpl(
            OfferRepository offerRepository,
            SubscriptionClient subscriptionClient) {
        this.offerRepository = offerRepository;
        this.subscriptionClient = subscriptionClient;
    }

    @Override
    @Transactional
    public OfferResponse createOffer(CreateOfferRequest request) {
        if (!subscriptionClient.hasActiveSubscription(request.bakeryId())) {
            throw new SubscriptionRequiredException(request.bakeryId());
        }
        // Validate request and persist only Marketplace-owned data.
        return null;
    }
}
```

### Service rules

- Service interface định nghĩa contract; implementation chứa business logic.
- `@Service` chỉ đặt trên implementation.
- Write operation dùng `@Transactional` trong phạm vi một database.
- Không giữ database transaction mở trong lúc upload file hoặc gọi AI lâu.
- Không giả lập distributed transaction bằng nhiều datasource.
- Multi-service workflow phải có trạng thái trung gian, idempotency và hành
  động bù khi cần.
- Entity-to-DTO conversion hoàn thành trước khi ra controller.
- Service không phụ thuộc `HttpServletRequest`, `ResponseEntity` hay HTTP status.

### Optimistic locking

- Entity có column `version` phải dùng `@Version`.
- Bắt và chuyển `OptimisticLockingFailureException` thành lỗi conflict `409`.
- Bắt buộc cho các thao tác cạnh tranh: accept offer, cập nhật order status,
  duyệt bakery payment và kích hoạt subscription.

---

## 9. JPA entity và PostgreSQL

```java
@Entity
@Table(name = "customer_orders")
public class CustomerOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "bakery_id", nullable = false)
    private UUID bakeryId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private OrderStatus status;

    @Column(name = "total_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalAmount;

    @Version
    private long version;

    protected CustomerOrder() {}
}
```

### Entity rules

- Khai báo rõ `@Table`, `@Column`, length, precision và nullability.
- Enum luôn dùng `EnumType.STRING`; không dùng ordinal.
- ID dùng `UUID`; không đổi sang auto-increment nếu schema đã chốt UUID.
- Tiền dùng `BigDecimal`; không dùng `double`/`float`.
- Thời gian dùng `Instant` hoặc `OffsetDateTime`; không dùng `java.util.Date`.
- Không dùng Lombok `@Data` trên entity.
- Không đưa collection lazy vào `toString`, `equals` hoặc `hashCode`.
- Constructor rỗng cho JPA dùng `protected` nếu có thể.
- Quan hệ trong cùng service mặc định `FetchType.LAZY`.
- Chỉ cascade khi lifecycle thực sự phụ thuộc, ví dụ order → order items.
- External reference chỉ là UUID, không có JPA association.

### JSONB

Các trường như `extra_options`, `configuration_snapshot` và
`generation_parameters` dùng JSONB:

```java
@JdbcTypeCode(SqlTypes.JSON)
@Column(name = "configuration_snapshot", columnDefinition = "jsonb", nullable = false)
private Map<String, Object> configurationSnapshot;
```

Không dùng JSONB thay cho mọi bảng quan hệ; chỉ dùng cho cấu hình linh hoạt hoặc
snapshot có cấu trúc không ổn định.

---

## 10. Flyway và schema ownership

- Mỗi service có migration riêng và chỉ migration vào database của mình.
- Không tạo FK tới table của database khác.
- Không sửa migration đã chạy; tạo migration version mới.
- Production dùng `spring.jpa.hibernate.ddl-auto=validate`.
- Không dùng `ddl-auto=update` cùng Flyway.
- DDL gốc hiện nằm tại `database/postgresql/{service}/`.
- Khi service module được scaffold, đặt migration tương ứng tại
  `src/main/resources/db/migration/` và xác định một nguồn canonical để tránh
  hai bản migration lệch nhau.
- Schema change phải cập nhật đồng thời:
  - Mermaid trong `docs/erd/`;
  - `docs/DATABASE.md`;
  - Flyway migration;
  - Entity/repository/test liên quan.

Không seed user, bakery, order hoặc payment giả trong production migration.
Chỉ seed reference data ổn định như role và subscription plan.

---

## 11. REST giữa các service — không message broker

```java
@HttpExchange("/internal/v1/subscriptions")
public interface SubscriptionClient {

    @GetExchange("/bakeries/{bakeryId}/entitlement")
    SubscriptionEntitlementResponse getEntitlement(@PathVariable UUID bakeryId);

    default boolean hasActiveSubscription(UUID bakeryId) {
        return getEntitlement(bakeryId).active();
    }
}
```

### Communication rules

- Frontend chỉ gọi API Gateway/public API, không điều phối nhiều service.
- Backend service chịu trách nhiệm orchestration.
- Cấu hình connect timeout và read timeout cho mọi HTTP client.
- Retry có giới hạn và chỉ dùng an toàn cho idempotent operation.
- Không retry mù `POST`; dùng `Idempotency-Key` cho create order, accept offer,
  gửi payment hoặc thao tác có nguy cơ tạo trùng.
- Trả correlation/trace ID qua các service để debug.
- Remote error phải được map thành exception nghiệp vụ rõ ràng.
- Cache entitlement subscription trong thời gian ngắn; không cache vô hạn.
- Không trả thành công giả khi remote validation bắt buộc bị lỗi.

### Luồng accept offer

1. Marketplace chuyển offer sang trạng thái chờ chấp nhận bằng optimistic lock.
2. Gọi Order Service với idempotency key dựa trên `offerId`.
3. Order Service tạo tối đa một order vì `offer_id` unique.
4. Marketplace đánh dấu offer `ACCEPTED`; các offer khác `REJECTED`.
5. Nếu lỗi, giữ trạng thái có thể retry/compensate; không để frontend tự sửa.

---

## 12. Security và JWT

- Identity Service sở hữu đăng ký, đăng nhập, refresh và revoke token.
- Các protected service dùng Spring Security OAuth2 Resource Server để validate
  JWT; không tự viết filter parse JWT nếu framework đã hỗ trợ.
- Thuật toán/ký JWT phải được ghi trong architecture decision trước khi chốt.
  Với microservices, ưu tiên asymmetric signing để resource services chỉ giữ
  public key/JWK, không chia sẻ private signing secret.
- Access token ngắn hạn; refresh token chỉ lưu hash và có thể revoke.
- Role nền tảng: `CUSTOMER`, `BAKERY_OWNER`, `BAKERY_STAFF`, `ADMIN`.
- Bakery membership role (`OWNER`, `MANAGER`, `STAFF`) là dữ liệu Bakery
  Service, không thay thế platform role.
- Authorization phải kiểm tra cả role và resource ownership.
- Không tin `customerId`, `bakeryId` do client gửi nếu có thể suy ra từ JWT và
  membership hiện tại.
- Internal endpoint cần service credential/mTLS hoặc cơ chế nội bộ được ghi rõ;
  không chỉ dựa vào đường dẫn `/internal`.
- Không log password, raw token, JWT secret, payment proof URL ký hoặc PII.
- Secrets lấy từ environment/secret manager; không commit vào Git.

---

## 13. Exception handling

```java
public abstract class AppException extends RuntimeException {
    private final HttpStatus status;
    private final String errorCode;

    protected AppException(String message, HttpStatus status, String errorCode) {
        super(message);
        this.status = status;
        this.errorCode = errorCode;
    }

    public HttpStatus getStatus() { return status; }
    public String getErrorCode() { return errorCode; }
}
```

- Custom exception kế thừa `AppException`.
- `@RestControllerAdvice` xử lý exception tập trung.
- Controller không `try/catch` lỗi nghiệp vụ.
- Validation error trả field → message.
- Conflict nghiệp vụ như offer đã được chọn trả `409`.
- Unexpected error log stack trace nội bộ nhưng trả message chung cho client.
- Remote service unavailable map thành `503` nếu operation không thể tiếp tục.

---

## 14. Repository và query

- Ưu tiên Spring Data derived query cho query đơn giản.
- Dùng JPQL/Criteria/Specification cho query động.
- Chỉ dùng native SQL khi PostgreSQL feature thực sự cần thiết và phải có test.
- Single result trả `Optional<T>`, không trả `null`.
- Không đặt business logic trong repository.
- Query theo external ID phải có index tương ứng.
- Luôn review N+1; dùng projection/entity graph/fetch join có chủ đích.
- Không fetch toàn bộ collection không giới hạn.
- Endpoint danh sách phải pagination trừ danh mục nhỏ, ổn định.

Ví dụ:

```java
public interface CustomerOrderRepository extends JpaRepository<CustomerOrder, UUID> {
    Optional<CustomerOrder> findByOfferId(UUID offerId);
    Page<CustomerOrder> findByBakeryIdAndStatus(
            UUID bakeryId, OrderStatus status, Pageable pageable);
}
```

---

## 15. Object storage và upload

- File ảnh lưu trên MinIO/S3; PostgreSQL chỉ lưu `object_key`, MIME type, size
  và metadata cần thiết.
- Không lưu base64 hoặc binary ảnh trong database.
- Validate MIME bằng nội dung file, không chỉ extension do client cung cấp.
- Giới hạn kích thước và loại file theo từng use case.
- Object key không chứa đường dẫn người dùng tùy ý; server tự sinh key.
- Upload và database write không nằm trong một transaction giả. Nếu DB write
  thất bại sau upload, thực hiện cleanup/compensation.
- Signed URL có thời hạn ngắn; không lưu signed URL vào database.
- AI source image, generated design, product image và payment proof phải nằm ở
  prefix/bucket tách biệt.

---

## 16. Cake AI rules

- AI generation là job có trạng thái: `QUEUED`, `PROCESSING`, `SUCCEEDED`,
  `FAILED`, `CANCELLED`.
- API tạo job trả nhanh; frontend polling trạng thái thay vì giữ HTTP request
  lâu đến khi ảnh hoàn tất.
- Lưu model name, generation parameters, prompt revision và error an toàn.
- Không lưu API key hoặc raw provider response chứa secret.
- Mỗi generated design phải trỏ đúng prompt revision của cùng job.
- Marketplace Service sở hữu `selected_design_id`; Cake AI Service không tạo
  source of truth thứ hai cho lựa chọn của khách.
- Kiểm duyệt prompt/ảnh và validate quyền truy cập trước khi trả signed URL.

---

## 17. Order, review và subscription invariants

### Order

- `DIRECT_CATALOG`: không có `cakeRequestId` và `offerId`.
- `ACCEPTED_OFFER`: bắt buộc có cả `cakeRequestId` và `offerId`.
- Order lưu snapshot tên khách, tên bakery, địa chỉ, item, cấu hình và giá.
- Không cập nhật order cũ khi product/add-on/profile nguồn thay đổi.
- Platform không lưu trạng thái khách đã trả tiền mua bánh cho bakery.

### Review

- Review thuộc Order Service, không thuộc trực tiếp Bakery Service.
- Chỉ customer sở hữu order `COMPLETED` mới được review.
- Mỗi order có tối đa một review.
- Rating bakery được aggregate qua `customer_orders.bakery_id`.

### Subscription

- Bakery phải có subscription `ACTIVE` và còn hạn để được public catalog/gửi
  offer.
- `SUBSCRIPTION_ORDER` không phải hóa đơn điện tử.
- `BAKERY_PAYMENT` ghi nhận payment bakery gửi nền tảng để admin duyệt.
- Một subscription order chỉ kích hoạt tối đa một subscription period.
- Duyệt payment và kích hoạt subscription phải idempotent và có audit fields.

---

## 18. Testing

### Test levels

- Unit test: service/mapper/domain rule với Mockito, không load Spring context.
- Repository test: PostgreSQL Testcontainers, không dùng H2.
- Controller integration: `@SpringBootTest`/MockMvc với profile `test`.
- HTTP client test: mock server hoặc stub service; test timeout/error mapping.
- Contract test: public/internal API quan trọng giữa các service.

```java
@ExtendWith(MockitoExtension.class)
class OfferServiceImplTest {

    @Mock
    private OfferRepository offerRepository;

    @Mock
    private SubscriptionClient subscriptionClient;

    @InjectMocks
    private OfferServiceImpl offerService;

    @Test
    @DisplayName("Từ chối tạo offer khi bakery không có subscription hoạt động")
    void createOffer_withoutActiveSubscription_throwsException() {
        UUID bakeryId = UUID.randomUUID();
        when(subscriptionClient.hasActiveSubscription(bakeryId)).thenReturn(false);

        assertThrows(SubscriptionRequiredException.class,
                () -> offerService.createOffer(TestData.offerRequest(bakeryId)));
    }
}
```

### Test rules

- Tên test: `[method]_[scenario]_[expected]`.
- Mỗi test có `@DisplayName` mô tả hành vi.
- Test happy path, validation, not found, forbidden, conflict và remote failure.
- Integration test luôn dùng profile `test`.
- Không dùng H2 vì khác PostgreSQL về UUID, JSONB, partial index và constraint.
- Test concurrency/idempotency cho accept offer và approve bakery payment.
- Không phụ thuộc thứ tự chạy test.
- Test data builder/fixture không chứa secret thật.

---

## 19. Configuration

- Ưu tiên `application.yml` và profile `application-dev.yml`,
  `application-test.yml`, `application-prod.yml`.
- Config binding dùng `@ConfigurationProperties`, ưu tiên record.
- Không hardcode URL service, database credential, JWT key, S3/MinIO key hoặc
  AI provider key.
- Environment variable đặt tên theo service, ví dụ:
  `ORDER_DB_URL`, `SUBSCRIPTION_SERVICE_BASE_URL`, `AI_PROVIDER_API_KEY`.
- Timeout, retry và pool size phải cấu hình được.
- Production bật health/readiness endpoints cần thiết nhưng không expose secret.

---

## 20. Logging và observability

```java
private static final Logger log = LoggerFactory.getLogger(OfferServiceImpl.class);

log.info("Offer accepted: offerId={}, orderId={}", offerId, orderId);
log.warn("Subscription inactive: bakeryId={}", bakeryId);
```

- Dùng SLF4J parameterized logging; không nối chuỗi.
- Không log password, token, secret, full prompt nhạy cảm, PII hoặc ảnh chứng từ.
- Log business event quan trọng ở service layer, không log tràn lan ở controller.
- Mọi request xuyên service nên có correlation/trace ID.
- ERROR: cần xử lý; WARN: bất thường; INFO: business event; DEBUG: chẩn đoán.
- Không nuốt exception; log kèm context an toàn và rethrow/map phù hợp.

---

## 21. React frontend rules

- Frontend gọi API Gateway/public API, không gọi database hoặc điều phối nhiều
  service.
- Tổ chức code theo feature: auth, bakery, product, marketplace, order, chat,
  cake-ai, subscription-admin.
- Tập trung HTTP config trong API client; không rải base URL khắp component.
- Không lưu refresh token nhạy cảm trong `localStorage` nếu kiến trúc chọn
  secure cookie; tuân theo security decision của project.
- Component không chứa business calculation giá quan trọng; backend là nguồn
  xác thực cuối cùng.
- Tiền hiển thị bằng formatter, không tính bằng floating point tùy tiện.
- Trạng thái enum frontend phải lấy từ API contract, không tự phát minh.
- Upload phải hiển thị giới hạn file và xử lý progress/error rõ ràng.
- Chat gửi `clientMessageId` để hỗ trợ idempotency.

---

## 22. Code quality limits

| Metric | Giới hạn khuyến nghị | Hành động khi vượt |
|---|---:|---|
| File production | dưới 300 dòng | Tách responsibility |
| Method | dưới 50 dòng | Extract method/domain component |
| Method parameters | dưới 5 | Gom vào request/command record |
| Constructor dependencies | dưới 7 | Tách service responsibility |
| Nested blocks | dưới 3 tầng | Early return/extract method |

- Không tạo abstraction chỉ để giảm số dòng.
- Không copy-paste business rule giữa service; nhưng cũng không tạo shared
  domain library phá vỡ ownership.
- Comment giải thích **vì sao**, không lặp lại code đang làm gì.
- Xóa dead code và import thừa trước khi commit.

---

## 23. Documentation requirements

| Khi nào | Bắt buộc cập nhật |
|---|---|
| Kết thúc coding session có thay đổi đáng kể | `docs/PROJECT-STATUS.md` |
| Thêm/sửa endpoint | `docs/API_SPEC.md` |
| Thay đổi bảng/cột/index/constraint | Mermaid, `docs/DATABASE.md`, Flyway |
| Quyết định kiến trúc mới | ADR trong `docs/decisions/` |
| Feature có logic khó hiểu | `CONTEXT.md` trong feature package |
| Thay đổi service boundary | `docs/02-system-architecture.md` và ADR |

Không tạo tài liệu giả hoặc đánh dấu hoàn thành khi code/test chưa tồn tại.
Nếu file tài liệu được tham chiếu trong `AGENTS.md` chưa tồn tại, tạo file khi
task thực sự cần nó thay vì bỏ qua âm thầm.

---

## 24. Commit checklist

- [ ] Đang sửa đúng Git repository và đúng microservice.
- [ ] Không có FK/JPA association xuyên service.
- [ ] Không để controller chứa business logic.
- [ ] Constructor injection; không field `@Autowired`.
- [ ] Không trả entity trực tiếp; request/response dùng DTO.
- [ ] `@Valid` áp dụng cho request body.
- [ ] Tiền dùng `BigDecimal`, ID dùng UUID, enum lưu dạng STRING.
- [ ] Write method có transaction đúng phạm vi một database.
- [ ] Remote call có timeout và error mapping.
- [ ] Operation có nguy cơ tạo trùng hỗ trợ idempotency.
- [ ] Không log/commit secret, raw token hoặc PII.
- [ ] Flyway, Mermaid, `DATABASE.md` và entity đồng bộ nếu schema đổi.
- [ ] Unit/integration test cần thiết đã chạy và pass.
- [ ] Không dùng H2 cho PostgreSQL integration test.
- [ ] API spec, project status, ADR/CONTEXT được cập nhật khi cần.
- [ ] `git diff` chỉ chứa thay đổi thuộc task hiện tại.
