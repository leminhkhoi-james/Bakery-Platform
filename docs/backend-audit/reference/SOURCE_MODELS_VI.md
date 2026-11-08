# DTO, entity, enum và cấu trúc lớp

Khai báo giữ nguyên type/validation/nullability Java. Thiếu @NotNull không có nghĩa nghiệp vụ cho phép null; các ràng buộc thủ công nằm trong API/processing catalogue. Entity nullable và PostgreSQL là hai nguồn cần đối chiếu, không đồng nhất tự động.

## api-gateway · ApiGatewayApplication

[ApiGatewayApplication.java:6](../../../backend/api-gateway/src/main/java/com/se193262/apigateway/ApiGatewayApplication.java#L6); class_declaration. `@SpringBootApplication`

## bakery-service · BakeryServiceApplication

[BakeryServiceApplication.java:8](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/BakeryServiceApplication.java#L8); class_declaration. `@SpringBootApplication`, `@EnableFeignClients`, `@EnableScheduling`

## bakery-service · OutboundClientConfig

[OutboundClientConfig.java:9](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/config/OutboundClientConfig.java#L9); class_declaration. `@Configuration`, `@EnableConfigurationProperties(RemoteProperties.class)`, `@Import(ServiceHttpClient.class)`

## bakery-service · AppException

[AppException.java:5](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/exception/AppException.java#L5); class_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| status | HttpStatus |  | [AppException.java:7](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/exception/AppException.java#L7) |


## bakery-service · GlobalExceptionHandler

[GlobalExceptionHandler.java:26](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/exception/GlobalExceptionHandler.java#L26); class_declaration. `@RestControllerAdvice`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| log | Logger |  | [GlobalExceptionHandler.java:29](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/exception/GlobalExceptionHandler.java#L29) |


## bakery-service · AddOnController

[AddOnController.java:25](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/addon/controller/AddOnController.java#L25); class_declaration. `@RestController`, `@RequestMapping("/api/v1/bakeries/{bakeryId}/add-ons")`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| addOnService | AddOnService |  | [AddOnController.java:29](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/addon/controller/AddOnController.java#L29) |


## bakery-service · AddOnDto

[AddOnDto.java:10](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/addon/dto/AddOnDto.java#L10); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| id | UUID |  | [AddOnDto.java:11](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/addon/dto/AddOnDto.java#L11) |
| name | String | @Size(max = 160) | [AddOnDto.java:12](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/addon/dto/AddOnDto.java#L12) |
| description | String |  | [AddOnDto.java:13](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/addon/dto/AddOnDto.java#L13) |
| category | String | @Size(max = 80) | [AddOnDto.java:14](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/addon/dto/AddOnDto.java#L14) |
| price | BigDecimal | @DecimalMin("0.00") | [AddOnDto.java:15](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/addon/dto/AddOnDto.java#L15) |
| active | Boolean |  | [AddOnDto.java:16](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/addon/dto/AddOnDto.java#L16) |


## bakery-service · PublicAddOnResponse

[PublicAddOnResponse.java:6](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/addon/dto/PublicAddOnResponse.java#L6); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| id | UUID |  | [PublicAddOnResponse.java:6](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/addon/dto/PublicAddOnResponse.java#L6) |
| name | String |  | [PublicAddOnResponse.java:6](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/addon/dto/PublicAddOnResponse.java#L6) |
| description | String |  | [PublicAddOnResponse.java:6](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/addon/dto/PublicAddOnResponse.java#L6) |
| category | String |  | [PublicAddOnResponse.java:7](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/addon/dto/PublicAddOnResponse.java#L7) |
| price | BigDecimal |  | [PublicAddOnResponse.java:7](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/addon/dto/PublicAddOnResponse.java#L7) |
| imageUrl | String |  | [PublicAddOnResponse.java:7](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/addon/dto/PublicAddOnResponse.java#L7) |


## bakery-service · AddOn

[AddOn.java:21](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/addon/entity/AddOn.java#L21); class_declaration. `@Entity`, `@Table(name = "add_ons")`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| id | UUID | @Id; @GeneratedValue(strategy = GenerationType.UUID); @Column(name = "id", nullable = false) | [AddOn.java:25](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/addon/entity/AddOn.java#L25) |
| bakery | Bakery | @ManyToOne(fetch = FetchType.LAZY, optional = false); @JoinColumn(name = "bakery_id", nullable = false) | [AddOn.java:30](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/addon/entity/AddOn.java#L30) |
| name | String | @Column(name = "name", nullable = false, length = 160) | [AddOn.java:34](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/addon/entity/AddOn.java#L34) |
| description | String | @Column(name = "description", columnDefinition = "text") | [AddOn.java:37](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/addon/entity/AddOn.java#L37) |
| category | String | @Column(name = "category", nullable = false, length = 80) | [AddOn.java:40](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/addon/entity/AddOn.java#L40) |
| price | BigDecimal | @Column(name = "price", nullable = false, precision = 12, scale = 2) | [AddOn.java:43](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/addon/entity/AddOn.java#L43) |
| imageObjectKey | String | @Column(name = "image_object_key", length = 512) | [AddOn.java:46](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/addon/entity/AddOn.java#L46) |
| isActive | boolean | @Column(name = "active", nullable = false) | [AddOn.java:49](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/addon/entity/AddOn.java#L49) |
| createdAt | Instant | @CreationTimestamp; @Column(name = "created_at", nullable = false, updatable = false) | [AddOn.java:52](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/addon/entity/AddOn.java#L52) |
| updatedAt | Instant | @UpdateTimestamp; @Column(name = "updated_at", nullable = false) | [AddOn.java:56](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/addon/entity/AddOn.java#L56) |
| version | long | @Version; @Column(name = "version", nullable = false) | [AddOn.java:60](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/addon/entity/AddOn.java#L60) |


## bakery-service · AddOnRepository

[AddOnRepository.java:10](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/addon/repository/AddOnRepository.java#L10); interface_declaration. 

## bakery-service · AddOnService

[AddOnService.java:10](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/addon/service/AddOnService.java#L10); interface_declaration. 

## bakery-service · AddOnServiceImpl

[AddOnServiceImpl.java:22](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/addon/service/impl/AddOnServiceImpl.java#L22); class_declaration. `@Service`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| addOnRepository | AddOnRepository |  | [AddOnServiceImpl.java:25](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/addon/service/impl/AddOnServiceImpl.java#L25) |
| bakeryRepository | BakeryRepository |  | [AddOnServiceImpl.java:26](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/addon/service/impl/AddOnServiceImpl.java#L26) |
| imageStorage | BakeryImageStorage |  | [AddOnServiceImpl.java:27](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/addon/service/impl/AddOnServiceImpl.java#L27) |


## bakery-service · AdminBakeryController

[AdminBakeryController.java:24](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/controller/AdminBakeryController.java#L24); class_declaration. `@RestController`, `@RequestMapping("/api/v1/admin/bakeries")`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| bakeryService | BakeryService |  | [AdminBakeryController.java:27](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/controller/AdminBakeryController.java#L27) |
| adminBakeryService | AdminBakeryService |  | [AdminBakeryController.java:28](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/controller/AdminBakeryController.java#L28) |
| onboarding | BakeryOnboardingService |  | [AdminBakeryController.java:29](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/controller/AdminBakeryController.java#L29) |


## bakery-service · BakeryController

[BakeryController.java:27](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/controller/BakeryController.java#L27); class_declaration. `@RestController`, `@RequestMapping("/api/v1/bakeries")`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| bakeryService | BakeryService |  | [BakeryController.java:31](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/controller/BakeryController.java#L31) |


## bakery-service · BakeryOnboardingController

[BakeryOnboardingController.java:20](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/controller/BakeryOnboardingController.java#L20); class_declaration. `@RestController`, `@RequestMapping("/api/v1/bakeries")`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| onboarding | BakeryOnboardingService |  | [BakeryOnboardingController.java:23](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/controller/BakeryOnboardingController.java#L23) |


## bakery-service · InternalBakeryController

[InternalBakeryController.java:18](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/controller/InternalBakeryController.java#L18); class_declaration. `@RestController`, `@RequestMapping("/internal/v1/bakeries")`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| service | BakeryInternalService |  | [InternalBakeryController.java:21](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/controller/InternalBakeryController.java#L21) |
| onboarding | BakeryOnboardingService |  | [InternalBakeryController.java:22](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/controller/InternalBakeryController.java#L22) |


## bakery-service · PublicBakeryController

[PublicBakeryController.java:16](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/controller/PublicBakeryController.java#L16); class_declaration. `@RestController`, `@RequestMapping("/api/v1/bakeries")`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| service | PublicBakeryService |  | [PublicBakeryController.java:19](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/controller/PublicBakeryController.java#L19) |


## bakery-service · AdminBakeryDetailResponse

[AdminBakeryDetailResponse.java:8](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/dto/AdminBakeryDetailResponse.java#L8); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| bakery | BakeryDto |  | [AdminBakeryDetailResponse.java:8](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/dto/AdminBakeryDetailResponse.java#L8) |
| members | List<BakeryMemberDto> |  | [AdminBakeryDetailResponse.java:9](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/dto/AdminBakeryDetailResponse.java#L9) |
| subscription | SubscriptionSummary |  | [AdminBakeryDetailResponse.java:10](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/dto/AdminBakeryDetailResponse.java#L10) |


## bakery-service · SubscriptionSummary

[AdminBakeryDetailResponse.java:11](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/dto/AdminBakeryDetailResponse.java#L11); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| active | boolean |  | [AdminBakeryDetailResponse.java:11](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/dto/AdminBakeryDetailResponse.java#L11) |
| planCode | String |  | [AdminBakeryDetailResponse.java:11](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/dto/AdminBakeryDetailResponse.java#L11) |
| periodEnd | Instant |  | [AdminBakeryDetailResponse.java:12](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/dto/AdminBakeryDetailResponse.java#L12) |
| features | Map<String, String> |  | [AdminBakeryDetailResponse.java:12](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/dto/AdminBakeryDetailResponse.java#L12) |


## bakery-service · BakeryDto

[BakeryDto.java:9](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/dto/BakeryDto.java#L9); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| id | UUID |  | [BakeryDto.java:10](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/dto/BakeryDto.java#L10) |
| name | String | @Size(max = 180) | [BakeryDto.java:11](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/dto/BakeryDto.java#L11) |
| description | String |  | [BakeryDto.java:12](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/dto/BakeryDto.java#L12) |
| phoneNumber | String | @Size(max = 30) | [BakeryDto.java:13](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/dto/BakeryDto.java#L13) |
| email | String | @Email; @Size(max = 320) | [BakeryDto.java:14](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/dto/BakeryDto.java#L14) |
| status | BakeryStatus |  | [BakeryDto.java:15](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/dto/BakeryDto.java#L15) |
| operations | BakeryOperationsDto |  | [BakeryDto.java:16](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/dto/BakeryDto.java#L16) |


## bakery-service · BakeryInternalProfileResponse

[BakeryInternalProfileResponse.java:8](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/dto/BakeryInternalProfileResponse.java#L8); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| id | UUID |  | [BakeryInternalProfileResponse.java:8](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/dto/BakeryInternalProfileResponse.java#L8) |
| name | String |  | [BakeryInternalProfileResponse.java:8](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/dto/BakeryInternalProfileResponse.java#L8) |
| status | BakeryStatus |  | [BakeryInternalProfileResponse.java:8](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/dto/BakeryInternalProfileResponse.java#L8) |
| primaryAddress | Address |  | [BakeryInternalProfileResponse.java:9](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/dto/BakeryInternalProfileResponse.java#L9) |
| serviceAreas | List<Area> |  | [BakeryInternalProfileResponse.java:9](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/dto/BakeryInternalProfileResponse.java#L9) |


## bakery-service · Address

[BakeryInternalProfileResponse.java:10](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/dto/BakeryInternalProfileResponse.java#L10); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| district | String |  | [BakeryInternalProfileResponse.java:10](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/dto/BakeryInternalProfileResponse.java#L10) |
| city | String |  | [BakeryInternalProfileResponse.java:10](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/dto/BakeryInternalProfileResponse.java#L10) |


## bakery-service · Area

[BakeryInternalProfileResponse.java:11](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/dto/BakeryInternalProfileResponse.java#L11); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| district | String |  | [BakeryInternalProfileResponse.java:11](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/dto/BakeryInternalProfileResponse.java#L11) |
| city | String |  | [BakeryInternalProfileResponse.java:11](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/dto/BakeryInternalProfileResponse.java#L11) |
| deliveryFee | BigDecimal |  | [BakeryInternalProfileResponse.java:11](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/dto/BakeryInternalProfileResponse.java#L11) |
| active | boolean |  | [BakeryInternalProfileResponse.java:11](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/dto/BakeryInternalProfileResponse.java#L11) |


## bakery-service · BakeryOnboardingRequest

[BakeryOnboardingRequest.java:9](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/dto/BakeryOnboardingRequest.java#L9); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| name | String | @NotBlank; @Size(max = 180) | [BakeryOnboardingRequest.java:10](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/dto/BakeryOnboardingRequest.java#L10) |
| phoneNumber | String | @NotBlank; @Size(max = 30) | [BakeryOnboardingRequest.java:11](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/dto/BakeryOnboardingRequest.java#L11) |
| email | String | @Email; @Size(max = 320) | [BakeryOnboardingRequest.java:12](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/dto/BakeryOnboardingRequest.java#L12) |
| operations | BakeryOperationsDto | @NotNull; @Valid | [BakeryOnboardingRequest.java:13](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/dto/BakeryOnboardingRequest.java#L13) |


## bakery-service · BakeryOperationsDto

[BakeryOperationsDto.java:17](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/dto/BakeryOperationsDto.java#L17); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| addresses | List<@NotNull @Valid Address> | @NotNull | [BakeryOperationsDto.java:18](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/dto/BakeryOperationsDto.java#L18) |
| serviceAreas | List<@NotNull @Valid ServiceArea> | @NotNull | [BakeryOperationsDto.java:19](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/dto/BakeryOperationsDto.java#L19) |
| businessHours | List<@NotNull @Valid BusinessHour> | @NotNull | [BakeryOperationsDto.java:20](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/dto/BakeryOperationsDto.java#L20) |


## bakery-service · Address

[BakeryOperationsDto.java:23](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/dto/BakeryOperationsDto.java#L23); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| id | UUID |  | [BakeryOperationsDto.java:24](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/dto/BakeryOperationsDto.java#L24) |
| addressLine | String | @NotBlank; @Size(max = 255) | [BakeryOperationsDto.java:25](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/dto/BakeryOperationsDto.java#L25) |
| ward | String | @Size(max = 120) | [BakeryOperationsDto.java:26](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/dto/BakeryOperationsDto.java#L26) |
| district | String | @NotBlank; @Size(max = 120) | [BakeryOperationsDto.java:27](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/dto/BakeryOperationsDto.java#L27) |
| city | String | @NotBlank; @Size(max = 120) | [BakeryOperationsDto.java:28](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/dto/BakeryOperationsDto.java#L28) |
| latitude | BigDecimal | @DecimalMin("-90.0"); @DecimalMax("90.0") | [BakeryOperationsDto.java:29](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/dto/BakeryOperationsDto.java#L29) |
| longitude | BigDecimal | @DecimalMin("-180.0"); @DecimalMax("180.0") | [BakeryOperationsDto.java:30](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/dto/BakeryOperationsDto.java#L30) |
| isPrimary | Boolean | @NotNull | [BakeryOperationsDto.java:31](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/dto/BakeryOperationsDto.java#L31) |


## bakery-service · ServiceArea

[BakeryOperationsDto.java:35](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/dto/BakeryOperationsDto.java#L35); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| id | UUID |  | [BakeryOperationsDto.java:36](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/dto/BakeryOperationsDto.java#L36) |
| city | String | @NotBlank; @Size(max = 120) | [BakeryOperationsDto.java:37](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/dto/BakeryOperationsDto.java#L37) |
| district | String | @NotBlank; @Size(max = 120) | [BakeryOperationsDto.java:38](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/dto/BakeryOperationsDto.java#L38) |
| deliveryFee | BigDecimal | @NotNull; @DecimalMin("0.00") | [BakeryOperationsDto.java:39](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/dto/BakeryOperationsDto.java#L39) |
| minimumOrder | BigDecimal | @NotNull; @DecimalMin("0.00") | [BakeryOperationsDto.java:40](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/dto/BakeryOperationsDto.java#L40) |
| active | Boolean | @NotNull | [BakeryOperationsDto.java:41](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/dto/BakeryOperationsDto.java#L41) |


## bakery-service · BusinessHour

[BakeryOperationsDto.java:45](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/dto/BakeryOperationsDto.java#L45); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| dayOfWeek | Short | @NotNull; @Min(1); @Max(7) | [BakeryOperationsDto.java:46](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/dto/BakeryOperationsDto.java#L46) |
| opensAt | LocalTime |  | [BakeryOperationsDto.java:47](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/dto/BakeryOperationsDto.java#L47) |
| closesAt | LocalTime |  | [BakeryOperationsDto.java:48](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/dto/BakeryOperationsDto.java#L48) |
| closed | Boolean | @NotNull | [BakeryOperationsDto.java:49](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/dto/BakeryOperationsDto.java#L49) |


## bakery-service · ChangeBakeryStatusRequest

[ChangeBakeryStatusRequest.java:6](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/dto/ChangeBakeryStatusRequest.java#L6); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| status | BakeryStatus | @NotNull | [ChangeBakeryStatusRequest.java:6](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/dto/ChangeBakeryStatusRequest.java#L6) |


## bakery-service · PublicBakeryResponse

[PublicBakeryResponse.java:5](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/dto/PublicBakeryResponse.java#L5); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| id | UUID |  | [PublicBakeryResponse.java:5](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/dto/PublicBakeryResponse.java#L5) |
| name | String |  | [PublicBakeryResponse.java:5](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/dto/PublicBakeryResponse.java#L5) |
| description | String |  | [PublicBakeryResponse.java:5](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/dto/PublicBakeryResponse.java#L5) |
| logoUrl | String |  | [PublicBakeryResponse.java:6](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/dto/PublicBakeryResponse.java#L6) |
| coverUrl | String |  | [PublicBakeryResponse.java:6](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/dto/PublicBakeryResponse.java#L6) |
| primaryAddress | BakeryOperationsDto.Address |  | [PublicBakeryResponse.java:6](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/dto/PublicBakeryResponse.java#L6) |
| operations | BakeryOperationsDto |  | [PublicBakeryResponse.java:7](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/dto/PublicBakeryResponse.java#L7) |


## bakery-service · Bakery

[Bakery.java:18](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/entity/Bakery.java#L18); class_declaration. `@Entity`, `@Table(name = "bakeries")`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| id | UUID | @Id; @GeneratedValue(strategy = GenerationType.UUID); @Column(name = "id", nullable = false) | [Bakery.java:22](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/entity/Bakery.java#L22) |
| name | String | @Column(name = "name", nullable = false, length = 180) | [Bakery.java:27](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/entity/Bakery.java#L27) |
| description | String | @Column(name = "description", columnDefinition = "text") | [Bakery.java:30](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/entity/Bakery.java#L30) |
| phoneNumber | String | @Column(name = "phone_number", nullable = false, length = 30) | [Bakery.java:33](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/entity/Bakery.java#L33) |
| email | String | @Column(name = "email", length = 320) | [Bakery.java:36](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/entity/Bakery.java#L36) |
| logoObjectKey | String | @Column(name = "logo_object_key", length = 512) | [Bakery.java:39](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/entity/Bakery.java#L39) |
| coverObjectKey | String | @Column(name = "cover_object_key", length = 512) | [Bakery.java:42](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/entity/Bakery.java#L42) |
| status | BakeryStatus | @Enumerated(EnumType.STRING); @Column(name = "status", nullable = false, length = 30) | [Bakery.java:45](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/entity/Bakery.java#L45) |
| createdAt | Instant | @CreationTimestamp; @Column(name = "created_at", nullable = false, updatable = false) | [Bakery.java:49](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/entity/Bakery.java#L49) |
| updatedAt | Instant | @UpdateTimestamp; @Column(name = "updated_at", nullable = false) | [Bakery.java:53](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/entity/Bakery.java#L53) |
| version | long | @Version; @Column(name = "version", nullable = false) | [Bakery.java:57](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/entity/Bakery.java#L57) |


## bakery-service · BakeryAddress

[BakeryAddress.java:19](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/entity/BakeryAddress.java#L19); class_declaration. `@Entity`, `@Table(name = "bakery_addresses")`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| id | UUID | @Id; @GeneratedValue(strategy = GenerationType.UUID); @Column(name = "id", nullable = false) | [BakeryAddress.java:23](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/entity/BakeryAddress.java#L23) |
| bakery | Bakery | @ManyToOne(fetch = FetchType.LAZY, optional = false); @JoinColumn(name = "bakery_id", nullable = false) | [BakeryAddress.java:28](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/entity/BakeryAddress.java#L28) |
| addressLine | String | @Column(name = "address_line", nullable = false, length = 255) | [BakeryAddress.java:32](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/entity/BakeryAddress.java#L32) |
| ward | String | @Column(name = "ward", length = 120) | [BakeryAddress.java:35](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/entity/BakeryAddress.java#L35) |
| district | String | @Column(name = "district", nullable = false, length = 120) | [BakeryAddress.java:38](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/entity/BakeryAddress.java#L38) |
| city | String | @Column(name = "city", nullable = false, length = 120) | [BakeryAddress.java:41](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/entity/BakeryAddress.java#L41) |
| latitude | BigDecimal | @Column(name = "latitude", precision = 9, scale = 6) | [BakeryAddress.java:44](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/entity/BakeryAddress.java#L44) |
| longitude | BigDecimal | @Column(name = "longitude", precision = 10, scale = 6) | [BakeryAddress.java:47](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/entity/BakeryAddress.java#L47) |
| isPrimary | boolean | @Column(name = "is_primary", nullable = false) | [BakeryAddress.java:50](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/entity/BakeryAddress.java#L50) |
| createdAt | Instant | @CreationTimestamp; @Column(name = "created_at", nullable = false, updatable = false) | [BakeryAddress.java:53](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/entity/BakeryAddress.java#L53) |
| updatedAt | Instant | @UpdateTimestamp; @Column(name = "updated_at", nullable = false) | [BakeryAddress.java:57](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/entity/BakeryAddress.java#L57) |


## bakery-service · BakeryStatus

[BakeryStatus.java:3](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/entity/BakeryStatus.java#L3); enum_declaration. 

Enum: `DRAFT`, `PENDING_APPROVAL`, `ACTIVE`, `SUSPENDED`, `CLOSED`

## bakery-service · BusinessHour

[BusinessHour.java:16](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/entity/BusinessHour.java#L16); class_declaration. `@Entity`, `@Table(name = "business_hours")`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| id | UUID | @Id; @GeneratedValue(strategy = GenerationType.UUID); @Column(name = "id", nullable = false) | [BusinessHour.java:20](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/entity/BusinessHour.java#L20) |
| bakery | Bakery | @ManyToOne(fetch = FetchType.LAZY, optional = false); @JoinColumn(name = "bakery_id", nullable = false) | [BusinessHour.java:25](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/entity/BusinessHour.java#L25) |
| dayOfWeek | short | @Column(name = "day_of_week", nullable = false) | [BusinessHour.java:29](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/entity/BusinessHour.java#L29) |
| opensAt | LocalTime | @Column(name = "opens_at") | [BusinessHour.java:32](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/entity/BusinessHour.java#L32) |
| closesAt | LocalTime | @Column(name = "closes_at") | [BusinessHour.java:35](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/entity/BusinessHour.java#L35) |
| isClosed | boolean | @Column(name = "closed", nullable = false) | [BusinessHour.java:38](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/entity/BusinessHour.java#L38) |


## bakery-service · ServiceArea

[ServiceArea.java:16](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/entity/ServiceArea.java#L16); class_declaration. `@Entity`, `@Table(name = "service_areas")`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| id | UUID | @Id; @GeneratedValue(strategy = GenerationType.UUID); @Column(name = "id", nullable = false) | [ServiceArea.java:20](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/entity/ServiceArea.java#L20) |
| bakery | Bakery | @ManyToOne(fetch = FetchType.LAZY, optional = false); @JoinColumn(name = "bakery_id", nullable = false) | [ServiceArea.java:25](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/entity/ServiceArea.java#L25) |
| city | String | @Column(name = "city", nullable = false, length = 120) | [ServiceArea.java:29](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/entity/ServiceArea.java#L29) |
| district | String | @Column(name = "district", nullable = false, length = 120) | [ServiceArea.java:32](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/entity/ServiceArea.java#L32) |
| deliveryFee | BigDecimal | @Column(name = "delivery_fee", nullable = false, precision = 12, scale = 2) | [ServiceArea.java:35](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/entity/ServiceArea.java#L35) |
| minimumOrder | BigDecimal | @Column(name = "minimum_order", nullable = false, precision = 12, scale = 2) | [ServiceArea.java:38](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/entity/ServiceArea.java#L38) |
| isActive | boolean | @Column(name = "active", nullable = false) | [ServiceArea.java:41](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/entity/ServiceArea.java#L41) |


## bakery-service · BakeryAddressRepository

[BakeryAddressRepository.java:9](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/repository/BakeryAddressRepository.java#L9); interface_declaration. 

## bakery-service · BakeryRepository

[BakeryRepository.java:13](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/repository/BakeryRepository.java#L13); interface_declaration. 

## bakery-service · BusinessHourRepository

[BusinessHourRepository.java:9](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/repository/BusinessHourRepository.java#L9); interface_declaration. 

## bakery-service · ServiceAreaRepository

[ServiceAreaRepository.java:9](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/repository/ServiceAreaRepository.java#L9); interface_declaration. 

## bakery-service · AdminBakeryService

[AdminBakeryService.java:12](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/service/AdminBakeryService.java#L12); class_declaration. `@Service`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| bakeryService | BakeryService |  | [AdminBakeryService.java:14](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/service/AdminBakeryService.java#L14) |
| memberService | BakeryMemberService |  | [AdminBakeryService.java:15](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/service/AdminBakeryService.java#L15) |
| entitlementClient | SubscriptionEntitlementClient |  | [AdminBakeryService.java:16](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/service/AdminBakeryService.java#L16) |


## bakery-service · BakeryAddressService

[BakeryAddressService.java:3](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/service/BakeryAddressService.java#L3); interface_declaration. 

## bakery-service · BakeryInternalService

[BakeryInternalService.java:18](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/service/BakeryInternalService.java#L18); class_declaration. `@Service`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| bakeryRepository | BakeryRepository |  | [BakeryInternalService.java:20](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/service/BakeryInternalService.java#L20) |
| memberRepository | BakeryMemberRepository |  | [BakeryInternalService.java:21](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/service/BakeryInternalService.java#L21) |
| addressRepository | BakeryAddressRepository |  | [BakeryInternalService.java:22](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/service/BakeryInternalService.java#L22) |
| areaRepository | ServiceAreaRepository |  | [BakeryInternalService.java:23](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/service/BakeryInternalService.java#L23) |


## bakery-service · BakeryOnboardingService

[BakeryOnboardingService.java:9](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/service/BakeryOnboardingService.java#L9); interface_declaration. 

## bakery-service · BakeryService

[BakeryService.java:12](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/service/BakeryService.java#L12); interface_declaration. 

## bakery-service · BusinessHourService

[BusinessHourService.java:3](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/service/BusinessHourService.java#L3); interface_declaration. 

## bakery-service · BakeryOnboardingServiceImpl

[BakeryOnboardingServiceImpl.java:23](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/service/impl/BakeryOnboardingServiceImpl.java#L23); class_declaration. `@Service`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| log | Logger |  | [BakeryOnboardingServiceImpl.java:25](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/service/impl/BakeryOnboardingServiceImpl.java#L25) |
| bakeries | BakeryService |  | [BakeryOnboardingServiceImpl.java:26](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/service/impl/BakeryOnboardingServiceImpl.java#L26) |
| members | BakeryMemberRepository |  | [BakeryOnboardingServiceImpl.java:27](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/service/impl/BakeryOnboardingServiceImpl.java#L27) |
| identity | IdentityUserClient |  | [BakeryOnboardingServiceImpl.java:28](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/service/impl/BakeryOnboardingServiceImpl.java#L28) |
| subscriptions | SubscriptionEntitlementClient |  | [BakeryOnboardingServiceImpl.java:29](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/service/impl/BakeryOnboardingServiceImpl.java#L29) |


## bakery-service · BakeryServiceImpl

[BakeryServiceImpl.java:42](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/service/impl/BakeryServiceImpl.java#L42); class_declaration. `@Service`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| bakeryRepository | BakeryRepository |  | [BakeryServiceImpl.java:45](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/service/impl/BakeryServiceImpl.java#L45) |
| bakeryMemberRepository | BakeryMemberRepository |  | [BakeryServiceImpl.java:46](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/service/impl/BakeryServiceImpl.java#L46) |
| addressRepository | BakeryAddressRepository |  | [BakeryServiceImpl.java:47](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/service/impl/BakeryServiceImpl.java#L47) |
| serviceAreaRepository | ServiceAreaRepository |  | [BakeryServiceImpl.java:48](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/service/impl/BakeryServiceImpl.java#L48) |
| businessHourRepository | BusinessHourRepository |  | [BakeryServiceImpl.java:49](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/service/impl/BakeryServiceImpl.java#L49) |
| imageStorage | BakeryImageStorage |  | [BakeryServiceImpl.java:50](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/service/impl/BakeryServiceImpl.java#L50) |
| identityUserClient | IdentityUserClient |  | [BakeryServiceImpl.java:51](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/service/impl/BakeryServiceImpl.java#L51) |


## bakery-service · PublicBakeryService

[PublicBakeryService.java:26](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/service/PublicBakeryService.java#L26); class_declaration. `@Service`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| bakeryRepository | BakeryRepository |  | [PublicBakeryService.java:28](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/service/PublicBakeryService.java#L28) |
| addressRepository | BakeryAddressRepository |  | [PublicBakeryService.java:29](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/service/PublicBakeryService.java#L29) |
| bakeryService | BakeryService |  | [PublicBakeryService.java:30](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/service/PublicBakeryService.java#L30) |
| entitlementClient | SubscriptionEntitlementClient |  | [PublicBakeryService.java:31](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/service/PublicBakeryService.java#L31) |
| imageStorage | BakeryImageStorage |  | [PublicBakeryService.java:32](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/service/PublicBakeryService.java#L32) |


## bakery-service · ServiceAreaService

[ServiceAreaService.java:3](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/service/ServiceAreaService.java#L3); interface_declaration. 

## bakery-service · CatalogController

[CatalogController.java:12](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/CatalogController.java#L12); class_declaration. `@RestController`, `@RequestMapping("/internal/v1")`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| service | CatalogService |  | [CatalogController.java:15](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/CatalogController.java#L15) |


## bakery-service · CatalogRepository

[CatalogRepository.java:10](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/CatalogRepository.java#L10); class_declaration. `@Repository`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| jdbc | JdbcClient |  | [CatalogRepository.java:12](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/CatalogRepository.java#L12) |


## bakery-service · CatalogService

[CatalogService.java:7](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/CatalogService.java#L7); interface_declaration. 

## bakery-service · CatalogServiceImpl

[CatalogServiceImpl.java:13](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/CatalogServiceImpl.java#L13); class_declaration. `@Service`, `@Transactional(readOnly = true)`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| repository | CatalogRepository |  | [CatalogServiceImpl.java:16](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/CatalogServiceImpl.java#L16) |
| entitlementClient | SubscriptionEntitlementClient |  | [CatalogServiceImpl.java:17](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/CatalogServiceImpl.java#L17) |


## bakery-service · InternalCatalogController

[InternalCatalogController.java:13](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/controller/InternalCatalogController.java#L13); class_declaration. `@RestController`, `@RequestMapping("/internal/v1/catalog")`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| quoteService | CatalogQuoteService |  | [InternalCatalogController.java:16](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/controller/InternalCatalogController.java#L16) |


## bakery-service · CatalogContracts

[CatalogContracts.java:9](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/dto/CatalogContracts.java#L9); class_declaration. 

## bakery-service · Area

[CatalogContracts.java:12](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/dto/CatalogContracts.java#L12); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| city | String |  | [CatalogContracts.java:13](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/dto/CatalogContracts.java#L13) |
| district | String |  | [CatalogContracts.java:13](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/dto/CatalogContracts.java#L13) |
| deliveryFee | BigDecimal |  | [CatalogContracts.java:13](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/dto/CatalogContracts.java#L13) |
| minimumOrder | BigDecimal |  | [CatalogContracts.java:13](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/dto/CatalogContracts.java#L13) |


## bakery-service · Bakery

[CatalogContracts.java:15](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/dto/CatalogContracts.java#L15); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| id | UUID |  | [CatalogContracts.java:15](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/dto/CatalogContracts.java#L15) |
| name | String |  | [CatalogContracts.java:15](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/dto/CatalogContracts.java#L15) |
| status | String |  | [CatalogContracts.java:15](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/dto/CatalogContracts.java#L15) |
| serviceAreas | List<Area> |  | [CatalogContracts.java:15](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/dto/CatalogContracts.java#L15) |


## bakery-service · Membership

[CatalogContracts.java:17](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/dto/CatalogContracts.java#L17); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| bakeryId | UUID |  | [CatalogContracts.java:18](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/dto/CatalogContracts.java#L18) |
| userId | UUID |  | [CatalogContracts.java:18](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/dto/CatalogContracts.java#L18) |
| active | boolean |  | [CatalogContracts.java:18](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/dto/CatalogContracts.java#L18) |
| memberRole | String |  | [CatalogContracts.java:18](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/dto/CatalogContracts.java#L18) |
| authorized | boolean |  | [CatalogContracts.java:18](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/dto/CatalogContracts.java#L18) |


## bakery-service · Option

[CatalogContracts.java:20](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/dto/CatalogContracts.java#L20); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| optionGroupId | UUID | @NotNull | [CatalogContracts.java:21](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/dto/CatalogContracts.java#L21) |
| optionValueId | UUID | @NotNull | [CatalogContracts.java:21](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/dto/CatalogContracts.java#L21) |
| quantity | int | @Min(1) | [CatalogContracts.java:21](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/dto/CatalogContracts.java#L21) |


## bakery-service · AddOn

[CatalogContracts.java:23](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/dto/CatalogContracts.java#L23); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| addOnId | UUID | @NotNull | [CatalogContracts.java:23](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/dto/CatalogContracts.java#L23) |
| quantity | int | @Min(1) | [CatalogContracts.java:23](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/dto/CatalogContracts.java#L23) |


## bakery-service · QuoteRequest

[CatalogContracts.java:25](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/dto/CatalogContracts.java#L25); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| bakeryId | UUID | @NotNull | [CatalogContracts.java:26](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/dto/CatalogContracts.java#L26) |
| productId | UUID |  | [CatalogContracts.java:27](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/dto/CatalogContracts.java#L27) |
| deliveryCity | String | @NotBlank | [CatalogContracts.java:28](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/dto/CatalogContracts.java#L28) |
| deliveryDistrict | String | @NotBlank | [CatalogContracts.java:29](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/dto/CatalogContracts.java#L29) |
| optionSelections | List<@NotNull @Valid Option> |  | [CatalogContracts.java:30](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/dto/CatalogContracts.java#L30) |
| addOns | List<@NotNull @Valid AddOn> |  | [CatalogContracts.java:31](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/dto/CatalogContracts.java#L31) |


## bakery-service · OptionSnapshot

[CatalogContracts.java:33](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/dto/CatalogContracts.java#L33); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| optionGroupId | UUID |  | [CatalogContracts.java:34](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/dto/CatalogContracts.java#L34) |
| optionValueId | UUID |  | [CatalogContracts.java:35](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/dto/CatalogContracts.java#L35) |
| groupNameSnapshot | String |  | [CatalogContracts.java:36](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/dto/CatalogContracts.java#L36) |
| valueNameSnapshot | String |  | [CatalogContracts.java:37](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/dto/CatalogContracts.java#L37) |
| quantity | int |  | [CatalogContracts.java:38](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/dto/CatalogContracts.java#L38) |


## bakery-service · ItemSnapshot

[CatalogContracts.java:40](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/dto/CatalogContracts.java#L40); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| addOnId | UUID |  | [CatalogContracts.java:41](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/dto/CatalogContracts.java#L41) |
| itemNameSnapshot | String |  | [CatalogContracts.java:42](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/dto/CatalogContracts.java#L42) |
| descriptionSnapshot | String |  | [CatalogContracts.java:43](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/dto/CatalogContracts.java#L43) |
| quantity | int |  | [CatalogContracts.java:44](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/dto/CatalogContracts.java#L44) |
| unitPrice | BigDecimal |  | [CatalogContracts.java:45](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/dto/CatalogContracts.java#L45) |
| lineTotal | BigDecimal |  | [CatalogContracts.java:46](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/dto/CatalogContracts.java#L46) |


## bakery-service · Quote

[CatalogContracts.java:48](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/dto/CatalogContracts.java#L48); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| productId | UUID |  | [CatalogContracts.java:49](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/dto/CatalogContracts.java#L49) |
| productName | String |  | [CatalogContracts.java:50](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/dto/CatalogContracts.java#L50) |
| customizable | boolean |  | [CatalogContracts.java:51](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/dto/CatalogContracts.java#L51) |
| minimumNoticeHours | int |  | [CatalogContracts.java:52](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/dto/CatalogContracts.java#L52) |
| options | List<OptionSnapshot> |  | [CatalogContracts.java:53](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/dto/CatalogContracts.java#L53) |
| items | List<ItemSnapshot> |  | [CatalogContracts.java:54](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/dto/CatalogContracts.java#L54) |
| addOnTotal | BigDecimal |  | [CatalogContracts.java:55](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/dto/CatalogContracts.java#L55) |


## bakery-service · CatalogQuoteRequest

[CatalogQuoteRequest.java:10](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/dto/CatalogQuoteRequest.java#L10); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| bakeryId | UUID | @NotNull | [CatalogQuoteRequest.java:10](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/dto/CatalogQuoteRequest.java#L10) |
| productId | UUID | @NotNull | [CatalogQuoteRequest.java:10](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/dto/CatalogQuoteRequest.java#L10) |
| quantity | int | @Positive | [CatalogQuoteRequest.java:11](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/dto/CatalogQuoteRequest.java#L11) |
| optionSelections | List<@NotNull OptionSelection> | @Valid | [CatalogQuoteRequest.java:11](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/dto/CatalogQuoteRequest.java#L11) |
| addOns | List<@NotNull AddOnSelection> | @Valid | [CatalogQuoteRequest.java:12](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/dto/CatalogQuoteRequest.java#L12) |
| deliveryDistrict | String | @NotBlank | [CatalogQuoteRequest.java:12](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/dto/CatalogQuoteRequest.java#L12) |
| deliveryCity | String | @NotBlank | [CatalogQuoteRequest.java:13](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/dto/CatalogQuoteRequest.java#L13) |


## bakery-service · OptionSelection

[CatalogQuoteRequest.java:14](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/dto/CatalogQuoteRequest.java#L14); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| optionGroupId | UUID | @NotNull | [CatalogQuoteRequest.java:14](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/dto/CatalogQuoteRequest.java#L14) |
| optionValueIds | List<@NotNull UUID> | @NotNull | [CatalogQuoteRequest.java:15](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/dto/CatalogQuoteRequest.java#L15) |


## bakery-service · AddOnSelection

[CatalogQuoteRequest.java:16](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/dto/CatalogQuoteRequest.java#L16); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| addOnId | UUID | @NotNull | [CatalogQuoteRequest.java:16](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/dto/CatalogQuoteRequest.java#L16) |
| quantity | int | @Positive | [CatalogQuoteRequest.java:16](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/dto/CatalogQuoteRequest.java#L16) |


## bakery-service · CatalogQuoteResponse

[CatalogQuoteResponse.java:9](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/dto/CatalogQuoteResponse.java#L9); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| quoteId | UUID |  | [CatalogQuoteResponse.java:9](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/dto/CatalogQuoteResponse.java#L9) |
| bakeryId | UUID |  | [CatalogQuoteResponse.java:9](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/dto/CatalogQuoteResponse.java#L9) |
| bakeryName | String |  | [CatalogQuoteResponse.java:9](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/dto/CatalogQuoteResponse.java#L9) |
| productId | UUID |  | [CatalogQuoteResponse.java:10](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/dto/CatalogQuoteResponse.java#L10) |
| productName | String |  | [CatalogQuoteResponse.java:10](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/dto/CatalogQuoteResponse.java#L10) |
| productDescription | String |  | [CatalogQuoteResponse.java:10](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/dto/CatalogQuoteResponse.java#L10) |
| quantity | int |  | [CatalogQuoteResponse.java:10](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/dto/CatalogQuoteResponse.java#L10) |
| items | List<QuotedItem> |  | [CatalogQuoteResponse.java:11](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/dto/CatalogQuoteResponse.java#L11) |
| subtotal | BigDecimal |  | [CatalogQuoteResponse.java:11](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/dto/CatalogQuoteResponse.java#L11) |
| deliveryFee | BigDecimal |  | [CatalogQuoteResponse.java:11](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/dto/CatalogQuoteResponse.java#L11) |
| totalAmount | BigDecimal |  | [CatalogQuoteResponse.java:12](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/dto/CatalogQuoteResponse.java#L12) |
| minimumNoticeHours | int |  | [CatalogQuoteResponse.java:12](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/dto/CatalogQuoteResponse.java#L12) |
| expiresAt | Instant |  | [CatalogQuoteResponse.java:12](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/dto/CatalogQuoteResponse.java#L12) |


## bakery-service · QuotedItem

[CatalogQuoteResponse.java:13](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/dto/CatalogQuoteResponse.java#L13); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| sourceId | UUID |  | [CatalogQuoteResponse.java:13](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/dto/CatalogQuoteResponse.java#L13) |
| itemType | String |  | [CatalogQuoteResponse.java:13](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/dto/CatalogQuoteResponse.java#L13) |
| name | String |  | [CatalogQuoteResponse.java:13](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/dto/CatalogQuoteResponse.java#L13) |
| description | String |  | [CatalogQuoteResponse.java:14](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/dto/CatalogQuoteResponse.java#L14) |
| quantity | int |  | [CatalogQuoteResponse.java:14](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/dto/CatalogQuoteResponse.java#L14) |
| unitPrice | BigDecimal |  | [CatalogQuoteResponse.java:14](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/dto/CatalogQuoteResponse.java#L14) |
| lineTotal | BigDecimal |  | [CatalogQuoteResponse.java:15](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/dto/CatalogQuoteResponse.java#L15) |
| configuration | Map<String, Object> |  | [CatalogQuoteResponse.java:15](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/dto/CatalogQuoteResponse.java#L15) |


## bakery-service · CatalogQuoteService

[CatalogQuoteService.java:33](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/service/CatalogQuoteService.java#L33); class_declaration. `@Service`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| productRepository | ProductRepository |  | [CatalogQuoteService.java:35](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/service/CatalogQuoteService.java#L35) |
| groupRepository | ProductOptionGroupRepository |  | [CatalogQuoteService.java:36](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/service/CatalogQuoteService.java#L36) |
| valueRepository | ProductOptionValueRepository |  | [CatalogQuoteService.java:37](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/service/CatalogQuoteService.java#L37) |
| addOnRepository | AddOnRepository |  | [CatalogQuoteService.java:38](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/service/CatalogQuoteService.java#L38) |
| areaRepository | ServiceAreaRepository |  | [CatalogQuoteService.java:39](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/service/CatalogQuoteService.java#L39) |
| entitlementClient | SubscriptionEntitlementClient |  | [CatalogQuoteService.java:40](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/service/CatalogQuoteService.java#L40) |


## bakery-service · ProductCategoryController

[ProductCategoryController.java:21](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/category/controller/ProductCategoryController.java#L21); class_declaration. `@RestController`, `@RequestMapping("/api/v1/bakeries/{bakeryId}/categories")`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| categoryService | ProductCategoryService |  | [ProductCategoryController.java:25](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/category/controller/ProductCategoryController.java#L25) |


## bakery-service · ProductCategoryDto

[ProductCategoryDto.java:9](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/category/dto/ProductCategoryDto.java#L9); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| id | UUID |  | [ProductCategoryDto.java:10](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/category/dto/ProductCategoryDto.java#L10) |
| name | String | @Size(max = 120) | [ProductCategoryDto.java:11](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/category/dto/ProductCategoryDto.java#L11) |
| slug | String | @Size(max = 140) | [ProductCategoryDto.java:12](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/category/dto/ProductCategoryDto.java#L12) |
| displayOrder | Integer | @PositiveOrZero | [ProductCategoryDto.java:13](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/category/dto/ProductCategoryDto.java#L13) |
| active | Boolean |  | [ProductCategoryDto.java:14](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/category/dto/ProductCategoryDto.java#L14) |


## bakery-service · ProductCategory

[ProductCategory.java:19](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/category/entity/ProductCategory.java#L19); class_declaration. `@Entity`, `@Table(name = "product_categories")`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| id | UUID | @Id; @GeneratedValue(strategy = GenerationType.UUID); @Column(name = "id", nullable = false) | [ProductCategory.java:23](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/category/entity/ProductCategory.java#L23) |
| bakery | Bakery | @ManyToOne(fetch = FetchType.LAZY, optional = false); @JoinColumn(name = "bakery_id", nullable = false) | [ProductCategory.java:28](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/category/entity/ProductCategory.java#L28) |
| name | String | @Column(name = "name", nullable = false, length = 120) | [ProductCategory.java:32](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/category/entity/ProductCategory.java#L32) |
| slug | String | @Column(name = "slug", nullable = false, length = 140) | [ProductCategory.java:35](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/category/entity/ProductCategory.java#L35) |
| displayOrder | int | @Column(name = "display_order", nullable = false) | [ProductCategory.java:38](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/category/entity/ProductCategory.java#L38) |
| isActive | boolean | @Column(name = "active", nullable = false) | [ProductCategory.java:41](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/category/entity/ProductCategory.java#L41) |
| createdAt | Instant | @CreationTimestamp; @Column(name = "created_at", nullable = false, updatable = false) | [ProductCategory.java:44](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/category/entity/ProductCategory.java#L44) |
| updatedAt | Instant | @UpdateTimestamp; @Column(name = "updated_at", nullable = false) | [ProductCategory.java:48](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/category/entity/ProductCategory.java#L48) |


## bakery-service · ProductCategoryRepository

[ProductCategoryRepository.java:10](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/category/repository/ProductCategoryRepository.java#L10); interface_declaration. 

## bakery-service · ProductCategoryServiceImpl

[ProductCategoryServiceImpl.java:18](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/category/service/impl/ProductCategoryServiceImpl.java#L18); class_declaration. `@Service`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| categoryRepository | ProductCategoryRepository |  | [ProductCategoryServiceImpl.java:21](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/category/service/impl/ProductCategoryServiceImpl.java#L21) |
| bakeryRepository | BakeryRepository |  | [ProductCategoryServiceImpl.java:22](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/category/service/impl/ProductCategoryServiceImpl.java#L22) |
| productRepository | ProductRepository |  | [ProductCategoryServiceImpl.java:23](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/category/service/impl/ProductCategoryServiceImpl.java#L23) |


## bakery-service · ProductCategoryService

[ProductCategoryService.java:8](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/category/service/ProductCategoryService.java#L8); interface_declaration. 

## bakery-service · BakeryMemberController

[BakeryMemberController.java:15](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/member/controller/BakeryMemberController.java#L15); class_declaration. `@RestController`, `@RequestMapping("/api/v1/bakeries/{bakeryId}/members")`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| memberService | BakeryMemberService |  | [BakeryMemberController.java:19](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/member/controller/BakeryMemberController.java#L19) |


## bakery-service · BakeryAuthorizationResponse

[BakeryAuthorizationResponse.java:6](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/member/dto/BakeryAuthorizationResponse.java#L6); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| bakeryId | UUID |  | [BakeryAuthorizationResponse.java:6](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/member/dto/BakeryAuthorizationResponse.java#L6) |
| userId | UUID |  | [BakeryAuthorizationResponse.java:6](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/member/dto/BakeryAuthorizationResponse.java#L6) |
| active | boolean |  | [BakeryAuthorizationResponse.java:6](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/member/dto/BakeryAuthorizationResponse.java#L6) |
| memberRole | BakeryMemberRole |  | [BakeryAuthorizationResponse.java:7](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/member/dto/BakeryAuthorizationResponse.java#L7) |
| authorized | boolean |  | [BakeryAuthorizationResponse.java:7](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/member/dto/BakeryAuthorizationResponse.java#L7) |


## bakery-service · BakeryMemberDto

[BakeryMemberDto.java:10](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/member/dto/BakeryMemberDto.java#L10); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| id | UUID |  | [BakeryMemberDto.java:11](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/member/dto/BakeryMemberDto.java#L11) |
| userId | UUID |  | [BakeryMemberDto.java:12](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/member/dto/BakeryMemberDto.java#L12) |
| memberRole | BakeryMemberRole |  | [BakeryMemberDto.java:13](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/member/dto/BakeryMemberDto.java#L13) |
| status | BakeryMemberStatus |  | [BakeryMemberDto.java:14](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/member/dto/BakeryMemberDto.java#L14) |
| joinedAt | Instant |  | [BakeryMemberDto.java:15](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/member/dto/BakeryMemberDto.java#L15) |
| displayNameSnapshot | String |  | [BakeryMemberDto.java:16](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/member/dto/BakeryMemberDto.java#L16) |


## bakery-service · BakeryMember

[BakeryMember.java:20](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/member/entity/BakeryMember.java#L20); class_declaration. `@Entity`, `@Table(name = "bakery_members")`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| id | UUID | @Id; @GeneratedValue(strategy = GenerationType.UUID); @Column(name = "id", nullable = false) | [BakeryMember.java:24](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/member/entity/BakeryMember.java#L24) |
| bakery | Bakery | @ManyToOne(fetch = FetchType.LAZY, optional = false); @JoinColumn(name = "bakery_id", nullable = false) | [BakeryMember.java:29](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/member/entity/BakeryMember.java#L29) |
| userId | UUID | @Column(name = "user_id", nullable = false) | [BakeryMember.java:34](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/member/entity/BakeryMember.java#L34) |
| displayNameSnapshot | String | @Column(name = "display_name_snapshot", length = 120) | [BakeryMember.java:37](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/member/entity/BakeryMember.java#L37) |
| memberRole | BakeryMemberRole | @Enumerated(EnumType.STRING); @Column(name = "member_role", nullable = false, length = 30) | [BakeryMember.java:40](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/member/entity/BakeryMember.java#L40) |
| status | BakeryMemberStatus | @Enumerated(EnumType.STRING); @Column(name = "status", nullable = false, length = 30) | [BakeryMember.java:44](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/member/entity/BakeryMember.java#L44) |
| ownerActivationPending | boolean | @Column(name = "owner_activation_pending", nullable = false) | [BakeryMember.java:48](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/member/entity/BakeryMember.java#L48) |
| joinedAt | Instant | @CreationTimestamp; @Column(name = "joined_at", nullable = false, updatable = false) | [BakeryMember.java:51](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/member/entity/BakeryMember.java#L51) |


## bakery-service · BakeryMemberRole

[BakeryMemberRole.java:3](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/member/entity/BakeryMemberRole.java#L3); enum_declaration. 

Enum: `OWNER`

## bakery-service · BakeryMemberStatus

[BakeryMemberStatus.java:3](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/member/entity/BakeryMemberStatus.java#L3); enum_declaration. 

Enum: `INVITED`, `ACTIVE`, `INACTIVE`

## bakery-service · BakeryMemberRepository

[BakeryMemberRepository.java:18](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/member/repository/BakeryMemberRepository.java#L18); interface_declaration. 

## bakery-service · BakeryMemberService

[BakeryMemberService.java:8](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/member/service/BakeryMemberService.java#L8); interface_declaration. 

## bakery-service · BakeryMemberServiceImpl

[BakeryMemberServiceImpl.java:15](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/member/service/impl/BakeryMemberServiceImpl.java#L15); class_declaration. `@Service`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| memberRepository | BakeryMemberRepository |  | [BakeryMemberServiceImpl.java:17](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/member/service/impl/BakeryMemberServiceImpl.java#L17) |
| bakeryRepository | BakeryRepository |  | [BakeryMemberServiceImpl.java:18](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/member/service/impl/BakeryMemberServiceImpl.java#L18) |


## bakery-service · ProductController

[ProductController.java:30](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/controller/ProductController.java#L30); class_declaration. `@RestController`, `@RequestMapping("/api/v1/bakeries/{bakeryId}/products")`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| productService | ProductService |  | [ProductController.java:34](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/controller/ProductController.java#L34) |


## bakery-service · PublicProductController

[PublicProductController.java:17](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/controller/PublicProductController.java#L17); class_declaration. `@RestController`, `@RequestMapping("/api/v1/products")`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| service | PublicProductService |  | [PublicProductController.java:20](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/controller/PublicProductController.java#L20) |


## bakery-service · ProductDto

[ProductDto.java:13](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/dto/ProductDto.java#L13); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| id | UUID |  | [ProductDto.java:14](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/dto/ProductDto.java#L14) |
| categoryId | UUID |  | [ProductDto.java:15](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/dto/ProductDto.java#L15) |
| name | String | @Size(max = 180) | [ProductDto.java:16](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/dto/ProductDto.java#L16) |
| slug | String | @Size(max = 200) | [ProductDto.java:17](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/dto/ProductDto.java#L17) |
| description | String |  | [ProductDto.java:18](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/dto/ProductDto.java#L18) |
| basePrice | BigDecimal | @DecimalMin("0.00") | [ProductDto.java:19](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/dto/ProductDto.java#L19) |
| status | ProductStatus |  | [ProductDto.java:20](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/dto/ProductDto.java#L20) |
| customizable | Boolean |  | [ProductDto.java:21](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/dto/ProductDto.java#L21) |
| defaultServingSize | Integer | @Positive | [ProductDto.java:22](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/dto/ProductDto.java#L22) |
| minimumNoticeHours | Integer | @PositiveOrZero | [ProductDto.java:23](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/dto/ProductDto.java#L23) |


## bakery-service · ProductImageResponse

[ProductImageResponse.java:6](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/dto/ProductImageResponse.java#L6); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| id | UUID |  | [ProductImageResponse.java:6](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/dto/ProductImageResponse.java#L6) |
| url | String |  | [ProductImageResponse.java:6](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/dto/ProductImageResponse.java#L6) |
| expiresAt | Instant |  | [ProductImageResponse.java:6](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/dto/ProductImageResponse.java#L6) |
| mediaType | String |  | [ProductImageResponse.java:7](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/dto/ProductImageResponse.java#L7) |
| displayOrder | int |  | [ProductImageResponse.java:7](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/dto/ProductImageResponse.java#L7) |
| primary | boolean |  | [ProductImageResponse.java:7](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/dto/ProductImageResponse.java#L7) |


## bakery-service · ProductOptionsDto

[ProductOptionsDto.java:11](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/dto/ProductOptionsDto.java#L11); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| groups | List<Group> |  | [ProductOptionsDto.java:11](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/dto/ProductOptionsDto.java#L11) |


## bakery-service · Group

[ProductOptionsDto.java:13](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/dto/ProductOptionsDto.java#L13); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| id | UUID |  | [ProductOptionsDto.java:13](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/dto/ProductOptionsDto.java#L13) |
| name | String |  | [ProductOptionsDto.java:13](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/dto/ProductOptionsDto.java#L13) |
| selectionType | SelectionType |  | [ProductOptionsDto.java:13](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/dto/ProductOptionsDto.java#L13) |
| required | Boolean |  | [ProductOptionsDto.java:13](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/dto/ProductOptionsDto.java#L13) |
| minimumSelections | Integer |  | [ProductOptionsDto.java:14](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/dto/ProductOptionsDto.java#L14) |
| maximumSelections | Integer |  | [ProductOptionsDto.java:14](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/dto/ProductOptionsDto.java#L14) |
| displayOrder | Integer |  | [ProductOptionsDto.java:14](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/dto/ProductOptionsDto.java#L14) |
| values | List<Value> |  | [ProductOptionsDto.java:15](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/dto/ProductOptionsDto.java#L15) |


## bakery-service · Value

[ProductOptionsDto.java:23](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/dto/ProductOptionsDto.java#L23); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| id | UUID |  | [ProductOptionsDto.java:23](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/dto/ProductOptionsDto.java#L23) |
| name | String |  | [ProductOptionsDto.java:23](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/dto/ProductOptionsDto.java#L23) |
| description | String |  | [ProductOptionsDto.java:23](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/dto/ProductOptionsDto.java#L23) |
| priceAdjustment | BigDecimal |  | [ProductOptionsDto.java:23](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/dto/ProductOptionsDto.java#L23) |
| active | Boolean |  | [ProductOptionsDto.java:24](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/dto/ProductOptionsDto.java#L24) |
| displayOrder | Integer |  | [ProductOptionsDto.java:24](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/dto/ProductOptionsDto.java#L24) |


## bakery-service · PublicProductResponse

[PublicProductResponse.java:8](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/dto/PublicProductResponse.java#L8); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| product | ProductDto |  | [PublicProductResponse.java:8](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/dto/PublicProductResponse.java#L8) |
| bakeryId | UUID |  | [PublicProductResponse.java:8](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/dto/PublicProductResponse.java#L8) |
| bakeryName | String |  | [PublicProductResponse.java:8](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/dto/PublicProductResponse.java#L8) |
| category | ProductCategoryDto |  | [PublicProductResponse.java:9](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/dto/PublicProductResponse.java#L9) |
| images | List<ProductImageResponse> |  | [PublicProductResponse.java:9](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/dto/PublicProductResponse.java#L9) |
| options | ProductOptionsDto |  | [PublicProductResponse.java:10](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/dto/PublicProductResponse.java#L10) |
| addOns | List<PublicAddOnResponse> |  | [PublicProductResponse.java:10](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/dto/PublicProductResponse.java#L10) |


## bakery-service · Product

[Product.java:24](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/entity/Product.java#L24); class_declaration. `@Entity`, `@Table(name = "products")`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| id | UUID | @Id; @GeneratedValue(strategy = GenerationType.UUID); @Column(name = "id", nullable = false) | [Product.java:28](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/entity/Product.java#L28) |
| bakery | Bakery | @ManyToOne(fetch = FetchType.LAZY, optional = false); @JoinColumn(name = "bakery_id", nullable = false) | [Product.java:33](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/entity/Product.java#L33) |
| category | ProductCategory | @ManyToOne(fetch = FetchType.LAZY); @JoinColumn(name = "category_id") | [Product.java:37](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/entity/Product.java#L37) |
| name | String | @Column(name = "name", nullable = false, length = 180) | [Product.java:41](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/entity/Product.java#L41) |
| slug | String | @Column(name = "slug", nullable = false, length = 200) | [Product.java:44](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/entity/Product.java#L44) |
| description | String | @Column(name = "description", columnDefinition = "text") | [Product.java:47](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/entity/Product.java#L47) |
| basePrice | BigDecimal | @Column(name = "base_price", nullable = false, precision = 12, scale = 2) | [Product.java:50](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/entity/Product.java#L50) |
| status | ProductStatus | @Enumerated(EnumType.STRING); @Column(name = "status", nullable = false, length = 30) | [Product.java:53](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/entity/Product.java#L53) |
| isCustomizable | boolean | @Column(name = "customizable", nullable = false) | [Product.java:57](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/entity/Product.java#L57) |
| defaultServingSize | Integer | @Column(name = "default_serving_size") | [Product.java:60](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/entity/Product.java#L60) |
| minimumNoticeHours | int | @Column(name = "minimum_notice_hours", nullable = false) | [Product.java:63](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/entity/Product.java#L63) |
| createdAt | Instant | @CreationTimestamp; @Column(name = "created_at", nullable = false, updatable = false) | [Product.java:66](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/entity/Product.java#L66) |
| updatedAt | Instant | @UpdateTimestamp; @Column(name = "updated_at", nullable = false) | [Product.java:70](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/entity/Product.java#L70) |
| version | long | @Version; @Column(name = "version", nullable = false) | [Product.java:74](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/entity/Product.java#L74) |


## bakery-service · ProductImage

[ProductImage.java:17](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/entity/ProductImage.java#L17); class_declaration. `@Entity`, `@Table(name = "product_images")`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| id | UUID | @Id; @GeneratedValue(strategy = GenerationType.UUID); @Column(name = "id", nullable = false) | [ProductImage.java:21](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/entity/ProductImage.java#L21) |
| product | Product | @ManyToOne(fetch = FetchType.LAZY, optional = false); @JoinColumn(name = "product_id", nullable = false) | [ProductImage.java:26](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/entity/ProductImage.java#L26) |
| objectKey | String | @Column(name = "object_key", nullable = false, length = 512) | [ProductImage.java:30](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/entity/ProductImage.java#L30) |
| mediaType | String | @Column(name = "media_type", nullable = false, length = 100) | [ProductImage.java:33](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/entity/ProductImage.java#L33) |
| displayOrder | int | @Column(name = "display_order", nullable = false) | [ProductImage.java:36](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/entity/ProductImage.java#L36) |
| isPrimary | boolean | @Column(name = "is_primary", nullable = false) | [ProductImage.java:39](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/entity/ProductImage.java#L39) |
| createdAt | Instant | @CreationTimestamp; @Column(name = "created_at", nullable = false, updatable = false) | [ProductImage.java:42](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/entity/ProductImage.java#L42) |


## bakery-service · ProductOptionGroup

[ProductOptionGroup.java:17](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/entity/ProductOptionGroup.java#L17); class_declaration. `@Entity`, `@Table(name = "product_option_groups")`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| id | UUID | @Id; @GeneratedValue(strategy = GenerationType.UUID); @Column(name = "id", nullable = false) | [ProductOptionGroup.java:21](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/entity/ProductOptionGroup.java#L21) |
| product | Product | @ManyToOne(fetch = FetchType.LAZY, optional = false); @JoinColumn(name = "product_id", nullable = false) | [ProductOptionGroup.java:26](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/entity/ProductOptionGroup.java#L26) |
| name | String | @Column(name = "name", nullable = false, length = 120) | [ProductOptionGroup.java:30](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/entity/ProductOptionGroup.java#L30) |
| selectionType | SelectionType | @Enumerated(EnumType.STRING); @Column(name = "selection_type", nullable = false, length = 30) | [ProductOptionGroup.java:33](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/entity/ProductOptionGroup.java#L33) |
| isRequired | boolean | @Column(name = "required", nullable = false) | [ProductOptionGroup.java:37](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/entity/ProductOptionGroup.java#L37) |
| minimumSelections | int | @Column(name = "minimum_selections", nullable = false) | [ProductOptionGroup.java:40](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/entity/ProductOptionGroup.java#L40) |
| maximumSelections | int | @Column(name = "maximum_selections", nullable = false) | [ProductOptionGroup.java:43](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/entity/ProductOptionGroup.java#L43) |
| displayOrder | int | @Column(name = "display_order", nullable = false) | [ProductOptionGroup.java:46](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/entity/ProductOptionGroup.java#L46) |


## bakery-service · ProductOptionValue

[ProductOptionValue.java:16](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/entity/ProductOptionValue.java#L16); class_declaration. `@Entity`, `@Table(name = "product_option_values")`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| id | UUID | @Id; @GeneratedValue(strategy = GenerationType.UUID); @Column(name = "id", nullable = false) | [ProductOptionValue.java:20](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/entity/ProductOptionValue.java#L20) |
| optionGroup | ProductOptionGroup | @ManyToOne(fetch = FetchType.LAZY, optional = false); @JoinColumn(name = "option_group_id", nullable = false) | [ProductOptionValue.java:25](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/entity/ProductOptionValue.java#L25) |
| name | String | @Column(name = "name", nullable = false, length = 120) | [ProductOptionValue.java:29](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/entity/ProductOptionValue.java#L29) |
| description | String | @Column(name = "description", columnDefinition = "text") | [ProductOptionValue.java:32](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/entity/ProductOptionValue.java#L32) |
| priceAdjustment | BigDecimal | @Column(name = "price_adjustment", nullable = false, precision = 12, scale = 2) | [ProductOptionValue.java:35](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/entity/ProductOptionValue.java#L35) |
| isActive | boolean | @Column(name = "active", nullable = false) | [ProductOptionValue.java:38](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/entity/ProductOptionValue.java#L38) |
| displayOrder | int | @Column(name = "display_order", nullable = false) | [ProductOptionValue.java:41](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/entity/ProductOptionValue.java#L41) |


## bakery-service · ProductStatus

[ProductStatus.java:3](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/entity/ProductStatus.java#L3); enum_declaration. 

Enum: `DRAFT`, `PUBLISHED`, `HIDDEN`, `ARCHIVED`

## bakery-service · SelectionType

[SelectionType.java:3](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/entity/SelectionType.java#L3); enum_declaration. 

Enum: `SINGLE`, `MULTIPLE`

## bakery-service · ProductImageRepository

[ProductImageRepository.java:10](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/repository/ProductImageRepository.java#L10); interface_declaration. 

## bakery-service · ProductOptionGroupRepository

[ProductOptionGroupRepository.java:9](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/repository/ProductOptionGroupRepository.java#L9); interface_declaration. 

## bakery-service · ProductOptionValueRepository

[ProductOptionValueRepository.java:9](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/repository/ProductOptionValueRepository.java#L9); interface_declaration. 

## bakery-service · ProductRepository

[ProductRepository.java:17](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/repository/ProductRepository.java#L17); interface_declaration. 

## bakery-service · ProductServiceImpl

[ProductServiceImpl.java:43](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/service/impl/ProductServiceImpl.java#L43); class_declaration. `@Service`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| productRepository | ProductRepository |  | [ProductServiceImpl.java:46](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/service/impl/ProductServiceImpl.java#L46) |
| categoryRepository | ProductCategoryRepository |  | [ProductServiceImpl.java:47](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/service/impl/ProductServiceImpl.java#L47) |
| bakeryRepository | BakeryRepository |  | [ProductServiceImpl.java:48](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/service/impl/ProductServiceImpl.java#L48) |
| groupRepository | ProductOptionGroupRepository |  | [ProductServiceImpl.java:49](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/service/impl/ProductServiceImpl.java#L49) |
| valueRepository | ProductOptionValueRepository |  | [ProductServiceImpl.java:50](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/service/impl/ProductServiceImpl.java#L50) |
| imageRepository | ProductImageRepository |  | [ProductServiceImpl.java:51](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/service/impl/ProductServiceImpl.java#L51) |
| imageStorage | BakeryImageStorage |  | [ProductServiceImpl.java:52](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/service/impl/ProductServiceImpl.java#L52) |
| entitlementClient | SubscriptionEntitlementClient |  | [ProductServiceImpl.java:53](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/service/impl/ProductServiceImpl.java#L53) |


## bakery-service · ProductImageService

[ProductImageService.java:3](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/service/ProductImageService.java#L3); interface_declaration. 

## bakery-service · ProductOptionGroupService

[ProductOptionGroupService.java:3](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/service/ProductOptionGroupService.java#L3); interface_declaration. 

## bakery-service · ProductOptionValueService

[ProductOptionValueService.java:3](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/service/ProductOptionValueService.java#L3); interface_declaration. 

## bakery-service · ProductService

[ProductService.java:13](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/service/ProductService.java#L13); interface_declaration. 

## bakery-service · PublicProductService

[PublicProductService.java:39](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/service/PublicProductService.java#L39); class_declaration. `@Service`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| productRepository | ProductRepository |  | [PublicProductService.java:41](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/service/PublicProductService.java#L41) |
| addressRepository | BakeryAddressRepository |  | [PublicProductService.java:42](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/service/PublicProductService.java#L42) |
| imageRepository | ProductImageRepository |  | [PublicProductService.java:43](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/service/PublicProductService.java#L43) |
| groupRepository | ProductOptionGroupRepository |  | [PublicProductService.java:44](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/service/PublicProductService.java#L44) |
| valueRepository | ProductOptionValueRepository |  | [PublicProductService.java:45](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/service/PublicProductService.java#L45) |
| addOnRepository | AddOnRepository |  | [PublicProductService.java:46](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/service/PublicProductService.java#L46) |
| entitlementClient | SubscriptionEntitlementClient |  | [PublicProductService.java:47](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/service/PublicProductService.java#L47) |
| imageStorage | BakeryImageStorage |  | [PublicProductService.java:48](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/service/PublicProductService.java#L48) |


## bakery-service · IdentityUserClient

[IdentityUserClient.java:18](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/infrastructure/client/IdentityUserClient.java#L18); class_declaration. `@Component`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| client | RestClient |  | [IdentityUserClient.java:20](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/infrastructure/client/IdentityUserClient.java#L20) |
| serviceToken | String |  | [IdentityUserClient.java:21](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/infrastructure/client/IdentityUserClient.java#L21) |
| tokenClient | ServiceHttpClient |  | [IdentityUserClient.java:22](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/infrastructure/client/IdentityUserClient.java#L22) |


## bakery-service · UserProfile

[IdentityUserClient.java:85](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/infrastructure/client/IdentityUserClient.java#L85); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| id | UUID |  | [IdentityUserClient.java:85](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/infrastructure/client/IdentityUserClient.java#L85) |
| displayName | String |  | [IdentityUserClient.java:85](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/infrastructure/client/IdentityUserClient.java#L85) |
| status | String |  | [IdentityUserClient.java:85](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/infrastructure/client/IdentityUserClient.java#L85) |
| roles | List<String> |  | [IdentityUserClient.java:85](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/infrastructure/client/IdentityUserClient.java#L85) |


## bakery-service · SubscriptionEntitlementClient

[SubscriptionEntitlementClient.java:18](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/infrastructure/client/SubscriptionEntitlementClient.java#L18); class_declaration. `@Component`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| client | RestClient |  | [SubscriptionEntitlementClient.java:20](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/infrastructure/client/SubscriptionEntitlementClient.java#L20) |
| serviceToken | String |  | [SubscriptionEntitlementClient.java:21](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/infrastructure/client/SubscriptionEntitlementClient.java#L21) |
| tokenClient | ServiceHttpClient |  | [SubscriptionEntitlementClient.java:22](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/infrastructure/client/SubscriptionEntitlementClient.java#L22) |


## bakery-service · Entitlement

[SubscriptionEntitlementClient.java:64](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/infrastructure/client/SubscriptionEntitlementClient.java#L64); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| bakeryId | UUID |  | [SubscriptionEntitlementClient.java:64](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/infrastructure/client/SubscriptionEntitlementClient.java#L64) |
| active | boolean |  | [SubscriptionEntitlementClient.java:64](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/infrastructure/client/SubscriptionEntitlementClient.java#L64) |
| planCode | String |  | [SubscriptionEntitlementClient.java:64](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/infrastructure/client/SubscriptionEntitlementClient.java#L64) |
| periodEnd | Instant |  | [SubscriptionEntitlementClient.java:65](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/infrastructure/client/SubscriptionEntitlementClient.java#L65) |
| features | Map<String, String> |  | [SubscriptionEntitlementClient.java:65](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/infrastructure/client/SubscriptionEntitlementClient.java#L65) |


## bakery-service · BakeryOwnerActivationJob

[BakeryOwnerActivationJob.java:14](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/infrastructure/scheduler/BakeryOwnerActivationJob.java#L14); class_declaration. `@Component`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| members | BakeryMemberRepository |  | [BakeryOwnerActivationJob.java:16](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/infrastructure/scheduler/BakeryOwnerActivationJob.java#L16) |
| onboarding | BakeryOnboardingService |  | [BakeryOwnerActivationJob.java:17](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/infrastructure/scheduler/BakeryOwnerActivationJob.java#L17) |


## bakery-service · BakeryImageStorage

[BakeryImageStorage.java:26](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/infrastructure/storage/BakeryImageStorage.java#L26); class_declaration. `@Component`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| log | Logger |  | [BakeryImageStorage.java:28](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/infrastructure/storage/BakeryImageStorage.java#L28) |
| MAX_BYTES | long |  | [BakeryImageStorage.java:29](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/infrastructure/storage/BakeryImageStorage.java#L29) |
| URL_EXPIRY | Duration |  | [BakeryImageStorage.java:30](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/infrastructure/storage/BakeryImageStorage.java#L30) |
| endpoint | String |  | [BakeryImageStorage.java:31](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/infrastructure/storage/BakeryImageStorage.java#L31) |
| publicEndpoint | String |  | [BakeryImageStorage.java:32](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/infrastructure/storage/BakeryImageStorage.java#L32) |
| accessKey | String |  | [BakeryImageStorage.java:33](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/infrastructure/storage/BakeryImageStorage.java#L33) |
| secretKey | String |  | [BakeryImageStorage.java:34](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/infrastructure/storage/BakeryImageStorage.java#L34) |
| bucket | String |  | [BakeryImageStorage.java:35](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/infrastructure/storage/BakeryImageStorage.java#L35) |
| region | String |  | [BakeryImageStorage.java:36](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/infrastructure/storage/BakeryImageStorage.java#L36) |


## bakery-service · StoredImage

[BakeryImageStorage.java:150](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/infrastructure/storage/BakeryImageStorage.java#L150); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| objectKey | String |  | [BakeryImageStorage.java:150](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/infrastructure/storage/BakeryImageStorage.java#L150) |
| mediaType | String |  | [BakeryImageStorage.java:150](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/infrastructure/storage/BakeryImageStorage.java#L150) |


## bakery-service · JwtDecoderConfig

[JwtDecoderConfig.java:19](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/security/JwtDecoderConfig.java#L19); class_declaration. `@Configuration`

## bakery-service · SecurityConfig

[SecurityConfig.java:33](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/security/SecurityConfig.java#L33); class_declaration. `@Configuration`, `@EnableWebSecurity`, `@EnableMethodSecurity`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| memberRepository | BakeryMemberRepository |  | [SecurityConfig.java:38](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/security/SecurityConfig.java#L38) |
| serviceAudience | String |  | [SecurityConfig.java:39](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/security/SecurityConfig.java#L39) |


## bakery-service · AllowedSort

[AllowedSort.java:9](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/shared/AllowedSort.java#L9); class_declaration. 

## bakery-service · ApiResponse

[ApiResponse.java:5](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/shared/dto/ApiResponse.java#L5); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| statusCode | int |  | [ApiResponse.java:6](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/shared/dto/ApiResponse.java#L6) |
| message | String |  | [ApiResponse.java:7](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/shared/dto/ApiResponse.java#L7) |
| data | T |  | [ApiResponse.java:8](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/shared/dto/ApiResponse.java#L8) |
| timestamp | Instant |  | [ApiResponse.java:9](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/shared/dto/ApiResponse.java#L9) |


## bakery-service · MediaResponse

[MediaResponse.java:5](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/shared/dto/MediaResponse.java#L5); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| url | String |  | [MediaResponse.java:5](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/shared/dto/MediaResponse.java#L5) |
| expiresAt | Instant |  | [MediaResponse.java:5](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/shared/dto/MediaResponse.java#L5) |


## bakery-service · PageResult

[PageResult.java:7](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/shared/dto/PageResult.java#L7); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| meta | Meta |  | [PageResult.java:7](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/shared/dto/PageResult.java#L7) |
| result | List<T> |  | [PageResult.java:7](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/shared/dto/PageResult.java#L7) |


## bakery-service · Meta

[PageResult.java:9](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/shared/dto/PageResult.java#L9); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| page | int |  | [PageResult.java:9](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/shared/dto/PageResult.java#L9) |
| pageSize | int |  | [PageResult.java:9](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/shared/dto/PageResult.java#L9) |
| pages | int |  | [PageResult.java:9](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/shared/dto/PageResult.java#L9) |
| total | long |  | [PageResult.java:9](../../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/shared/dto/PageResult.java#L9) |


## cake-ai-service · CakeAiServiceApplication

[CakeAiServiceApplication.java:10](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/CakeAiServiceApplication.java#L10); class_declaration. `@SpringBootApplication`, `@Import(PlatformConfiguration.class)`, `@EnableScheduling`

## cake-ai-service · CakeAiConfig

[CakeAiConfig.java:6](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/config/CakeAiConfig.java#L6); class_declaration. `@Configuration`, `@EnableConfigurationProperties(CakeAiProperties.class)`

## cake-ai-service · CakeAiProperties

[CakeAiProperties.java:7](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/config/CakeAiProperties.java#L7); record_declaration. `@ConfigurationProperties("cake-ai")`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| apiKey | String | @DefaultValue("") | [CakeAiProperties.java:9](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/config/CakeAiProperties.java#L9) |
| providerUrl | String | @DefaultValue("https://generativelanguage.googleapis.com/v1beta") | [CakeAiProperties.java:10](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/config/CakeAiProperties.java#L10) |
| imageModel | String | @DefaultValue("gemini-nano-banana-2.1") | [CakeAiProperties.java:11](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/config/CakeAiProperties.java#L11) |
| moderationModel | String | @DefaultValue("gemini-3.8-flash") | [CakeAiProperties.java:12](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/config/CakeAiProperties.java#L12) |
| connectTimeout | Duration | @DefaultValue("5s") | [CakeAiProperties.java:13](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/config/CakeAiProperties.java#L13) |
| readTimeout | Duration | @DefaultValue("120s") | [CakeAiProperties.java:14](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/config/CakeAiProperties.java#L14) |
| workers | int | @DefaultValue("2") | [CakeAiProperties.java:15](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/config/CakeAiProperties.java#L15) |
| leaseDuration | Duration | @DefaultValue("30m") | [CakeAiProperties.java:16](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/config/CakeAiProperties.java#L16) |
| firebaseProjectId | String | @DefaultValue("") | [CakeAiProperties.java:17](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/config/CakeAiProperties.java#L17) |
| firebaseBucket | String | @DefaultValue("") | [CakeAiProperties.java:18](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/config/CakeAiProperties.java#L18) |


## cake-ai-service · DesignController

[DesignController.java:11](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/design/DesignController.java#L11); class_declaration. `@RestController`, `@RequestMapping("/api/v1")`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| service | DesignService |  | [DesignController.java:16](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/design/DesignController.java#L16) |


## cake-ai-service · ModerationStatus

[DesignController.java:14](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/design/DesignController.java#L14); enum_declaration. 

Enum: `APPROVED`, `REJECTED`

## cake-ai-service · ModerateDesignRequest

[DesignController.java:15](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/design/DesignController.java#L15); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| moderationStatus | ModerationStatus | @NotNull | [DesignController.java:15](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/design/DesignController.java#L15) |


## cake-ai-service · DesignService

[DesignService.java:7](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/design/DesignService.java#L7); interface_declaration. 

## cake-ai-service · DesignServiceImpl

[DesignServiceImpl.java:15](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/design/DesignServiceImpl.java#L15); class_declaration. `@Service`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| repository | GenerationRepository |  | [DesignServiceImpl.java:17](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/design/DesignServiceImpl.java#L17) |
| storage | ImageStorage |  | [DesignServiceImpl.java:18](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/design/DesignServiceImpl.java#L18) |
| transaction | TransactionTemplate |  | [DesignServiceImpl.java:19](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/design/DesignServiceImpl.java#L19) |
| clock | Clock |  | [DesignServiceImpl.java:20](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/design/DesignServiceImpl.java#L20) |


## cake-ai-service · DesignValidationController

[DesignValidationController.java:8](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/design/DesignValidationController.java#L8); class_declaration. `@RestController`, `@RequestMapping("/internal/v1")`, `@PreAuthorize("hasAuthority('SCOPE_cake-ai:design:validate')")`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| service | DesignValidationService |  | [DesignValidationController.java:12](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/design/DesignValidationController.java#L12) |


## cake-ai-service · DesignValidationService

[DesignValidationService.java:11](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/design/DesignValidationService.java#L11); class_declaration. `@Service`, `@Transactional(readOnly = true)`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| jdbc | JdbcClient |  | [DesignValidationService.java:14](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/design/DesignValidationService.java#L14) |


## cake-ai-service · GeneratedDesignResponse

[GeneratedDesignResponse.java:6](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/design/dto/GeneratedDesignResponse.java#L6); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| id | UUID |  | [GeneratedDesignResponse.java:6](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/design/dto/GeneratedDesignResponse.java#L6) |
| generationJobId | UUID |  | [GeneratedDesignResponse.java:6](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/design/dto/GeneratedDesignResponse.java#L6) |
| promptRevisionId | UUID |  | [GeneratedDesignResponse.java:6](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/design/dto/GeneratedDesignResponse.java#L6) |
| moderationStatus | String |  | [GeneratedDesignResponse.java:7](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/design/dto/GeneratedDesignResponse.java#L7) |
| moderationReason | String |  | [GeneratedDesignResponse.java:7](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/design/dto/GeneratedDesignResponse.java#L7) |
| imageUrl | String |  | [GeneratedDesignResponse.java:7](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/design/dto/GeneratedDesignResponse.java#L7) |
| thumbnailUrl | String |  | [GeneratedDesignResponse.java:7](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/design/dto/GeneratedDesignResponse.java#L7) |
| expiresAt | Instant |  | [GeneratedDesignResponse.java:8](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/design/dto/GeneratedDesignResponse.java#L8) |
| mediaType | String |  | [GeneratedDesignResponse.java:8](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/design/dto/GeneratedDesignResponse.java#L8) |
| sizeBytes | Long |  | [GeneratedDesignResponse.java:8](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/design/dto/GeneratedDesignResponse.java#L8) |
| width | Integer |  | [GeneratedDesignResponse.java:8](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/design/dto/GeneratedDesignResponse.java#L8) |
| height | Integer |  | [GeneratedDesignResponse.java:8](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/design/dto/GeneratedDesignResponse.java#L8) |
| createdAt | Instant |  | [GeneratedDesignResponse.java:8](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/design/dto/GeneratedDesignResponse.java#L8) |


## cake-ai-service · CreateGenerationJobRequest

[CreateGenerationJobRequest.java:7](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/dto/CreateGenerationJobRequest.java#L7); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| cakeRequestId | UUID | @NotNull | [CreateGenerationJobRequest.java:8](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/dto/CreateGenerationJobRequest.java#L8) |
| prompt | String | @NotBlank; @Size(max = 4000) | [CreateGenerationJobRequest.java:9](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/dto/CreateGenerationJobRequest.java#L9) |
| negativePrompt | String | @Size(max = 2000) | [CreateGenerationJobRequest.java:10](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/dto/CreateGenerationJobRequest.java#L10) |
| generationParameters | GenerationParameters | @Valid | [CreateGenerationJobRequest.java:11](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/dto/CreateGenerationJobRequest.java#L11) |


## cake-ai-service · CreatePromptRevisionRequest

[CreatePromptRevisionRequest.java:6](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/dto/CreatePromptRevisionRequest.java#L6); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| prompt | String | @NotBlank; @Size(max = 4000) | [CreatePromptRevisionRequest.java:7](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/dto/CreatePromptRevisionRequest.java#L7) |
| negativePrompt | String | @Size(max = 2000) | [CreatePromptRevisionRequest.java:8](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/dto/CreatePromptRevisionRequest.java#L8) |
| generationParameters | GenerationParameters | @Valid | [CreatePromptRevisionRequest.java:9](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/dto/CreatePromptRevisionRequest.java#L9) |


## cake-ai-service · GenerationJobResponse

[GenerationJobResponse.java:6](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/dto/GenerationJobResponse.java#L6); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| id | UUID |  | [GenerationJobResponse.java:6](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/dto/GenerationJobResponse.java#L6) |
| status | String |  | [GenerationJobResponse.java:6](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/dto/GenerationJobResponse.java#L6) |
| modelName | String |  | [GenerationJobResponse.java:6](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/dto/GenerationJobResponse.java#L6) |
| currentRevision | int |  | [GenerationJobResponse.java:6](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/dto/GenerationJobResponse.java#L6) |
| createdAt | Instant |  | [GenerationJobResponse.java:7](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/dto/GenerationJobResponse.java#L7) |
| updatedAt | Instant |  | [GenerationJobResponse.java:7](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/dto/GenerationJobResponse.java#L7) |


## cake-ai-service · GenerationParameters

[GenerationParameters.java:5](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/dto/GenerationParameters.java#L5); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| aspectRatio | String |  | [GenerationParameters.java:5](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/dto/GenerationParameters.java#L5) |
| numberOfDesigns | Integer |  | [GenerationParameters.java:5](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/dto/GenerationParameters.java#L5) |


## cake-ai-service · GenerationController

[GenerationController.java:12](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationController.java#L12); class_declaration. `@RestController`, `@RequestMapping("/api/v1/generation-jobs")`, `@PreAuthorize("hasRole('CUSTOMER')")`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| service | GenerationService |  | [GenerationController.java:16](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationController.java#L16) |


## cake-ai-service · GenerationData

[GenerationData.java:7](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationData.java#L7); class_declaration. 

## cake-ai-service · Job

[GenerationData.java:9](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationData.java#L9); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| id | UUID |  | [GenerationData.java:9](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationData.java#L9) |
| customerId | UUID |  | [GenerationData.java:9](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationData.java#L9) |
| cakeRequestId | UUID |  | [GenerationData.java:9](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationData.java#L9) |
| status | String |  | [GenerationData.java:9](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationData.java#L9) |
| modelName | String |  | [GenerationData.java:9](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationData.java#L9) |
| generationParameters | GenerationParameters |  | [GenerationData.java:10](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationData.java#L10) |
| errorMessage | String |  | [GenerationData.java:10](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationData.java#L10) |
| startedAt | Instant |  | [GenerationData.java:10](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationData.java#L10) |
| completedAt | Instant |  | [GenerationData.java:11](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationData.java#L11) |
| createdAt | Instant |  | [GenerationData.java:11](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationData.java#L11) |
| updatedAt | Instant |  | [GenerationData.java:11](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationData.java#L11) |


## cake-ai-service · Revision

[GenerationData.java:12](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationData.java#L12); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| id | UUID |  | [GenerationData.java:12](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationData.java#L12) |
| generationJobId | UUID |  | [GenerationData.java:12](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationData.java#L12) |
| revisionNumber | int |  | [GenerationData.java:12](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationData.java#L12) |
| prompt | String |  | [GenerationData.java:12](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationData.java#L12) |
| negativePrompt | String |  | [GenerationData.java:13](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationData.java#L13) |
| createdBy | UUID |  | [GenerationData.java:13](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationData.java#L13) |
| createdAt | Instant |  | [GenerationData.java:13](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationData.java#L13) |


## cake-ai-service · Source

[GenerationData.java:14](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationData.java#L14); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| id | UUID |  | [GenerationData.java:14](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationData.java#L14) |
| generationJobId | UUID |  | [GenerationData.java:14](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationData.java#L14) |
| objectKey | String |  | [GenerationData.java:14](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationData.java#L14) |
| mediaType | String |  | [GenerationData.java:14](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationData.java#L14) |
| sizeBytes | long |  | [GenerationData.java:15](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationData.java#L15) |
| displayOrder | int |  | [GenerationData.java:15](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationData.java#L15) |


## cake-ai-service · Execution

[GenerationData.java:16](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationData.java#L16); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| id | UUID |  | [GenerationData.java:16](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationData.java#L16) |
| generationJobId | UUID |  | [GenerationData.java:16](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationData.java#L16) |
| promptRevisionId | UUID |  | [GenerationData.java:16](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationData.java#L16) |
| status | String |  | [GenerationData.java:16](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationData.java#L16) |
| modelName | String |  | [GenerationData.java:17](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationData.java#L17) |
| generationParameters | GenerationParameters |  | [GenerationData.java:17](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationData.java#L17) |
| claimToken | UUID |  | [GenerationData.java:17](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationData.java#L17) |


## cake-ai-service · Design

[GenerationData.java:18](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationData.java#L18); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| id | UUID |  | [GenerationData.java:18](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationData.java#L18) |
| generationJobId | UUID |  | [GenerationData.java:18](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationData.java#L18) |
| promptRevisionId | UUID |  | [GenerationData.java:18](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationData.java#L18) |
| executionId | UUID |  | [GenerationData.java:18](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationData.java#L18) |
| imageObjectKey | String |  | [GenerationData.java:19](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationData.java#L19) |
| thumbnailObjectKey | String |  | [GenerationData.java:19](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationData.java#L19) |
| mediaType | String |  | [GenerationData.java:19](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationData.java#L19) |
| sizeBytes | Long |  | [GenerationData.java:19](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationData.java#L19) |
| width | Integer |  | [GenerationData.java:20](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationData.java#L20) |
| height | Integer |  | [GenerationData.java:20](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationData.java#L20) |
| moderationStatus | String |  | [GenerationData.java:20](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationData.java#L20) |
| moderationReason | String |  | [GenerationData.java:20](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationData.java#L20) |
| createdAt | Instant |  | [GenerationData.java:20](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationData.java#L20) |


## cake-ai-service · GenerationInputs

[GenerationInputs.java:13](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationInputs.java#L13); class_declaration. `@Component`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| log | org.slf4j.Logger |  | [GenerationInputs.java:15](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationInputs.java#L15) |
| marketplace | MarketplaceClient |  | [GenerationInputs.java:16](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationInputs.java#L16) |
| provider | ImageProvider |  | [GenerationInputs.java:17](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationInputs.java#L17) |
| storage | ImageStorage |  | [GenerationInputs.java:18](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationInputs.java#L18) |
| validator | ImageValidator |  | [GenerationInputs.java:19](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationInputs.java#L19) |
| properties | CakeAiProperties |  | [GenerationInputs.java:20](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationInputs.java#L20) |


## cake-ai-service · GenerationJob

[GenerationJob.java:11](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationJob.java#L11); class_declaration. `@Entity`, `@Table(name = "generation_jobs")`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| id | UUID | @Id; @Column(name = "id", nullable = false) | [GenerationJob.java:14](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationJob.java#L14) |
| customerId | UUID | @Column(name = "customer_id", nullable = false) | [GenerationJob.java:15](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationJob.java#L15) |
| cakeRequestId | UUID | @Column(name = "cake_request_id", nullable = false) | [GenerationJob.java:16](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationJob.java#L16) |
| status | GenerationStatus | @Enumerated(EnumType.STRING); @Column(name = "status", nullable = false, length = 30) | [GenerationJob.java:17](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationJob.java#L17) |
| modelName | String | @Column(name = "model_name", nullable = false, length = 120) | [GenerationJob.java:19](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationJob.java#L19) |
| generationParameters | GenerationParameters | @JdbcTypeCode(SqlTypes.JSON); @Column(name = "generation_parameters", nullable = false, columnDefinition = "jsonb") | [GenerationJob.java:20](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationJob.java#L20) |
| errorMessage | String | @Column(name = "error_message", columnDefinition = "text") | [GenerationJob.java:23](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationJob.java#L23) |
| startedAt | Instant | @Column(name = "started_at") | [GenerationJob.java:24](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationJob.java#L24) |
| completedAt | Instant | @Column(name = "completed_at") | [GenerationJob.java:25](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationJob.java#L25) |
| createdAt | Instant | @Column(name = "created_at", nullable = false) | [GenerationJob.java:26](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationJob.java#L26) |
| updatedAt | Instant | @Column(name = "updated_at", nullable = false) | [GenerationJob.java:27](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationJob.java#L27) |
| version | long | @Version; @Column(name = "version", nullable = false) | [GenerationJob.java:28](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationJob.java#L28) |


## cake-ai-service · GenerationJobRepository

[GenerationJobRepository.java:8](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationJobRepository.java#L8); interface_declaration. 

## cake-ai-service · JobView

[GenerationJobRepository.java:9](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationJobRepository.java#L9); interface_declaration. 

## cake-ai-service · GenerationQueue

[GenerationQueue.java:13](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationQueue.java#L13); class_declaration. `@Component`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| jdbc | JdbcClient |  | [GenerationQueue.java:15](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationQueue.java#L15) |
| repository | GenerationRepository |  | [GenerationQueue.java:16](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationQueue.java#L16) |
| transaction | TransactionTemplate |  | [GenerationQueue.java:17](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationQueue.java#L17) |
| properties | CakeAiProperties |  | [GenerationQueue.java:18](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationQueue.java#L18) |
| json | ObjectMapper |  | [GenerationQueue.java:19](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationQueue.java#L19) |


## cake-ai-service · GenerationReader

[GenerationReader.java:14](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationReader.java#L14); class_declaration. `@Component`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| repository | GenerationRepository |  | [GenerationReader.java:20](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationReader.java#L20) |
| storage | ImageStorage |  | [GenerationReader.java:21](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationReader.java#L21) |
| designs | DesignService |  | [GenerationReader.java:22](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationReader.java#L22) |
| clock | Clock |  | [GenerationReader.java:23](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationReader.java#L23) |


## cake-ai-service · SourceResponse

[GenerationReader.java:16](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationReader.java#L16); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| id | UUID |  | [GenerationReader.java:16](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationReader.java#L16) |
| url | String |  | [GenerationReader.java:16](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationReader.java#L16) |
| expiresAt | Instant |  | [GenerationReader.java:16](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationReader.java#L16) |
| mediaType | String |  | [GenerationReader.java:16](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationReader.java#L16) |
| sizeBytes | long |  | [GenerationReader.java:16](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationReader.java#L16) |
| displayOrder | int |  | [GenerationReader.java:16](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationReader.java#L16) |


## cake-ai-service · JobDetail

[GenerationReader.java:17](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationReader.java#L17); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| job | Job |  | [GenerationReader.java:17](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationReader.java#L17) |
| currentRevision | int |  | [GenerationReader.java:17](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationReader.java#L17) |
| promptRevisions | List<Revision> |  | [GenerationReader.java:17](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationReader.java#L17) |
| sourceImages | List<SourceResponse> |  | [GenerationReader.java:18](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationReader.java#L18) |
| generatedDesigns | List<GeneratedDesignResponse> |  | [GenerationReader.java:18](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationReader.java#L18) |


## cake-ai-service · JobPage

[GenerationReader.java:19](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationReader.java#L19); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| content | List<GenerationJobResponse> |  | [GenerationReader.java:19](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationReader.java#L19) |
| page | int |  | [GenerationReader.java:19](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationReader.java#L19) |
| size | int |  | [GenerationReader.java:19](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationReader.java#L19) |
| totalElements | long |  | [GenerationReader.java:19](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationReader.java#L19) |
| totalPages | int |  | [GenerationReader.java:19](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationReader.java#L19) |


## cake-ai-service · GenerationRepository

[GenerationRepository.java:10](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationRepository.java#L10); class_declaration. `@Repository`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| jdbc | JdbcClient |  | [GenerationRepository.java:12](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationRepository.java#L12) |
| json | ObjectMapper |  | [GenerationRepository.java:13](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationRepository.java#L13) |
| jobs | GenerationJobRepository |  | [GenerationRepository.java:14](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationRepository.java#L14) |


## cake-ai-service · GenerationService

[GenerationService.java:7](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationService.java#L7); interface_declaration. 

## cake-ai-service · GenerationServiceImpl

[GenerationServiceImpl.java:15](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationServiceImpl.java#L15); class_declaration. `@Service`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| repository | GenerationRepository |  | [GenerationServiceImpl.java:17](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationServiceImpl.java#L17) |
| reader | GenerationReader |  | [GenerationServiceImpl.java:18](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationServiceImpl.java#L18) |
| inputs | GenerationInputs |  | [GenerationServiceImpl.java:19](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationServiceImpl.java#L19) |
| queue | GenerationQueue |  | [GenerationServiceImpl.java:20](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationServiceImpl.java#L20) |
| transaction | TransactionTemplate |  | [GenerationServiceImpl.java:21](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationServiceImpl.java#L21) |
| json | ObjectMapper |  | [GenerationServiceImpl.java:22](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationServiceImpl.java#L22) |


## cake-ai-service · GenerationStatus

[GenerationStatus.java:3](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationStatus.java#L3); enum_declaration. 

Enum: `QUEUED`, `PROCESSING`, `SUCCEEDED`, `FAILED`, `CANCELLED`

## cake-ai-service · GenerationWorker

[GenerationWorker.java:11](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationWorker.java#L11); class_declaration. `@Component`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| log | org.slf4j.Logger |  | [GenerationWorker.java:13](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationWorker.java#L13) |
| queue | GenerationQueue |  | [GenerationWorker.java:14](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationWorker.java#L14) |
| repository | GenerationRepository |  | [GenerationWorker.java:15](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationWorker.java#L15) |
| provider | ImageProvider |  | [GenerationWorker.java:16](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationWorker.java#L16) |
| storage | ImageStorage |  | [GenerationWorker.java:17](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationWorker.java#L17) |
| validator | ImageValidator |  | [GenerationWorker.java:18](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationWorker.java#L18) |
| inputs | GenerationInputs |  | [GenerationWorker.java:19](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationWorker.java#L19) |


## cake-ai-service · GeminiClient

[GeminiClient.java:14](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/infrastructure/client/GeminiClient.java#L14); class_declaration. `@Component`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| properties | CakeAiProperties |  | [GeminiClient.java:16](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/infrastructure/client/GeminiClient.java#L16) |
| json | ObjectMapper |  | [GeminiClient.java:17](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/infrastructure/client/GeminiClient.java#L17) |
| images | ImageValidator |  | [GeminiClient.java:18](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/infrastructure/client/GeminiClient.java#L18) |
| http | RestClient |  | [GeminiClient.java:19](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/infrastructure/client/GeminiClient.java#L19) |


## cake-ai-service · ImageProvider

[ImageProvider.java:6](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/infrastructure/client/ImageProvider.java#L6); interface_declaration. 

## cake-ai-service · Moderation

[ImageProvider.java:7](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/infrastructure/client/ImageProvider.java#L7); enum_declaration. 

Enum: `APPROVED`, `REJECTED`, `PENDING`

## cake-ai-service · MarketplaceClient

[MarketplaceClient.java:8](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/infrastructure/client/MarketplaceClient.java#L8); class_declaration. `@Component`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| http | ServiceHttpClient |  | [MarketplaceClient.java:11](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/infrastructure/client/MarketplaceClient.java#L11) |


## cake-ai-service · RequestContext

[MarketplaceClient.java:10](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/infrastructure/client/MarketplaceClient.java#L10); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| id | UUID |  | [MarketplaceClient.java:10](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/infrastructure/client/MarketplaceClient.java#L10) |
| customerId | UUID |  | [MarketplaceClient.java:10](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/infrastructure/client/MarketplaceClient.java#L10) |
| status | String |  | [MarketplaceClient.java:10](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/infrastructure/client/MarketplaceClient.java#L10) |
| aiEligible | boolean |  | [MarketplaceClient.java:10](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/infrastructure/client/MarketplaceClient.java#L10) |


## cake-ai-service · ProviderException

[ProviderException.java:3](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/infrastructure/client/ProviderException.java#L3); class_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| code | String |  | [ProviderException.java:4](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/infrastructure/client/ProviderException.java#L4) |


## cake-ai-service · GenerationScheduler

[GenerationScheduler.java:13](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/infrastructure/scheduler/GenerationScheduler.java#L13); class_declaration. `@Component`, `@ConditionalOnProperty(name = "cake-ai.scheduler-enabled", havingValue = "true", matchIfMissing = true)`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| log | org.slf4j.Logger |  | [GenerationScheduler.java:16](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/infrastructure/scheduler/GenerationScheduler.java#L16) |
| queue | GenerationQueue |  | [GenerationScheduler.java:17](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/infrastructure/scheduler/GenerationScheduler.java#L17) |
| worker | GenerationWorker |  | [GenerationScheduler.java:18](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/infrastructure/scheduler/GenerationScheduler.java#L18) |
| storage | ImageStorage |  | [GenerationScheduler.java:19](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/infrastructure/scheduler/GenerationScheduler.java#L19) |
| clock | Clock |  | [GenerationScheduler.java:20](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/infrastructure/scheduler/GenerationScheduler.java#L20) |
| executor | ExecutorService |  | [GenerationScheduler.java:21](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/infrastructure/scheduler/GenerationScheduler.java#L21) |
| slots | Semaphore |  | [GenerationScheduler.java:22](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/infrastructure/scheduler/GenerationScheduler.java#L22) |


## cake-ai-service · FirebaseStorageAdapter

[FirebaseStorageAdapter.java:12](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/infrastructure/storage/FirebaseStorageAdapter.java#L12); class_declaration. `@Component`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| properties | CakeAiProperties |  | [FirebaseStorageAdapter.java:14](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/infrastructure/storage/FirebaseStorageAdapter.java#L14) |
| storage | Storage |  | [FirebaseStorageAdapter.java:15](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/infrastructure/storage/FirebaseStorageAdapter.java#L15) |
| pageToken | String |  | [FirebaseStorageAdapter.java:16](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/infrastructure/storage/FirebaseStorageAdapter.java#L16) |


## cake-ai-service · ImageStorage

[ImageStorage.java:6](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/infrastructure/storage/ImageStorage.java#L6); interface_declaration. 

## cake-ai-service · StoredObject

[ImageStorage.java:7](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/infrastructure/storage/ImageStorage.java#L7); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| key | String |  | [ImageStorage.java:7](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/infrastructure/storage/ImageStorage.java#L7) |
| createdAt | Instant |  | [ImageStorage.java:7](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/infrastructure/storage/ImageStorage.java#L7) |


## cake-ai-service · ImageValidator

[ImageValidator.java:10](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/infrastructure/storage/ImageValidator.java#L10); class_declaration. `@Component`

## cake-ai-service · Image

[ImageValidator.java:12](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/infrastructure/storage/ImageValidator.java#L12); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| bytes | byte[] |  | [ImageValidator.java:12](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/infrastructure/storage/ImageValidator.java#L12) |
| mediaType | String |  | [ImageValidator.java:12](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/infrastructure/storage/ImageValidator.java#L12) |
| width | int |  | [ImageValidator.java:12](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/infrastructure/storage/ImageValidator.java#L12) |
| height | int |  | [ImageValidator.java:12](../../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/infrastructure/storage/ImageValidator.java#L12) |


## chat-service · ChatServiceApplication

[ChatServiceApplication.java:6](../../../backend/chat-service/src/main/java/com/se193262/chatservice/ChatServiceApplication.java#L6); class_declaration. `@SpringBootApplication`

## chat-service · JwtProperties

[JwtProperties.java:5](../../../backend/chat-service/src/main/java/com/se193262/chatservice/config/JwtProperties.java#L5); record_declaration. `@ConfigurationProperties(prefix = "security.jwt")`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| jwkSetUri | String |  | [JwtProperties.java:7](../../../backend/chat-service/src/main/java/com/se193262/chatservice/config/JwtProperties.java#L7) |
| issuer | String |  | [JwtProperties.java:8](../../../backend/chat-service/src/main/java/com/se193262/chatservice/config/JwtProperties.java#L8) |
| userAudience | String |  | [JwtProperties.java:9](../../../backend/chat-service/src/main/java/com/se193262/chatservice/config/JwtProperties.java#L9) |
| serviceAudience | String |  | [JwtProperties.java:10](../../../backend/chat-service/src/main/java/com/se193262/chatservice/config/JwtProperties.java#L10) |


## chat-service · OpenApiConfig

[OpenApiConfig.java:10](../../../backend/chat-service/src/main/java/com/se193262/chatservice/config/OpenApiConfig.java#L10); class_declaration. `@Configuration(proxyBeanMethods = false)`, `@OpenAPIDefinition(
        info = @Info(
                title = "Bakery Platform Chat Service API",
                version = "v1"
        ),
        security = @SecurityRequirement(name = OpenApiConfig.BEARER_AUTH)
)`, `@SecurityScheme(
        name = OpenApiConfig.BEARER_AUTH,
        type = SecuritySchemeType.HTTP,
        scheme = "bearer",
        bearerFormat = "JWT"
)`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| BEARER_AUTH | String |  | [OpenApiConfig.java:26](../../../backend/chat-service/src/main/java/com/se193262/chatservice/config/OpenApiConfig.java#L26) |


## chat-service · SecurityConfig

[SecurityConfig.java:39](../../../backend/chat-service/src/main/java/com/se193262/chatservice/config/SecurityConfig.java#L39); class_declaration. `@Configuration`, `@EnableWebSecurity`, `@EnableConfigurationProperties(JwtProperties.class)`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| INVALID_TOKEN_CONTRACT | OAuth2Error |  | [SecurityConfig.java:44](../../../backend/chat-service/src/main/java/com/se193262/chatservice/config/SecurityConfig.java#L44) |


## chat-service · ServiceClientProperties

[ServiceClientProperties.java:7](../../../backend/chat-service/src/main/java/com/se193262/chatservice/config/ServiceClientProperties.java#L7); record_declaration. `@ConfigurationProperties(prefix = "clients")`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| identityUrl | String |  | [ServiceClientProperties.java:9](../../../backend/chat-service/src/main/java/com/se193262/chatservice/config/ServiceClientProperties.java#L9) |
| clientId | String |  | [ServiceClientProperties.java:10](../../../backend/chat-service/src/main/java/com/se193262/chatservice/config/ServiceClientProperties.java#L10) |
| clientSecret | String |  | [ServiceClientProperties.java:11](../../../backend/chat-service/src/main/java/com/se193262/chatservice/config/ServiceClientProperties.java#L11) |
| marketplace | Service |  | [ServiceClientProperties.java:12](../../../backend/chat-service/src/main/java/com/se193262/chatservice/config/ServiceClientProperties.java#L12) |
| bakery | Service |  | [ServiceClientProperties.java:13](../../../backend/chat-service/src/main/java/com/se193262/chatservice/config/ServiceClientProperties.java#L13) |
| connectTimeout | Duration |  | [ServiceClientProperties.java:14](../../../backend/chat-service/src/main/java/com/se193262/chatservice/config/ServiceClientProperties.java#L14) |
| readTimeout | Duration |  | [ServiceClientProperties.java:15](../../../backend/chat-service/src/main/java/com/se193262/chatservice/config/ServiceClientProperties.java#L15) |


## chat-service · Service

[ServiceClientProperties.java:17](../../../backend/chat-service/src/main/java/com/se193262/chatservice/config/ServiceClientProperties.java#L17); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| baseUrl | String |  | [ServiceClientProperties.java:17](../../../backend/chat-service/src/main/java/com/se193262/chatservice/config/ServiceClientProperties.java#L17) |
| audience | String |  | [ServiceClientProperties.java:17](../../../backend/chat-service/src/main/java/com/se193262/chatservice/config/ServiceClientProperties.java#L17) |
| scope | String |  | [ServiceClientProperties.java:17](../../../backend/chat-service/src/main/java/com/se193262/chatservice/config/ServiceClientProperties.java#L17) |


## chat-service · StorageConfig

[StorageConfig.java:6](../../../backend/chat-service/src/main/java/com/se193262/chatservice/config/StorageConfig.java#L6); class_declaration. `@Configuration`, `@EnableConfigurationProperties(StorageProperties.class)`

## chat-service · StorageProperties

[StorageProperties.java:7](../../../backend/chat-service/src/main/java/com/se193262/chatservice/config/StorageProperties.java#L7); record_declaration. `@ConfigurationProperties(prefix = "storage.minio")`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| endpoint | String |  | [StorageProperties.java:9](../../../backend/chat-service/src/main/java/com/se193262/chatservice/config/StorageProperties.java#L9) |
| accessKey | String |  | [StorageProperties.java:10](../../../backend/chat-service/src/main/java/com/se193262/chatservice/config/StorageProperties.java#L10) |
| secretKey | String |  | [StorageProperties.java:11](../../../backend/chat-service/src/main/java/com/se193262/chatservice/config/StorageProperties.java#L11) |
| bucket | String |  | [StorageProperties.java:12](../../../backend/chat-service/src/main/java/com/se193262/chatservice/config/StorageProperties.java#L12) |
| presignedUrlExpiry | Duration |  | [StorageProperties.java:13](../../../backend/chat-service/src/main/java/com/se193262/chatservice/config/StorageProperties.java#L13) |


## chat-service · ChatException

[ChatException.java:5](../../../backend/chat-service/src/main/java/com/se193262/chatservice/exception/ChatException.java#L5); class_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| status | HttpStatus |  | [ChatException.java:7](../../../backend/chat-service/src/main/java/com/se193262/chatservice/exception/ChatException.java#L7) |


## chat-service · GlobalExceptionHandler

[GlobalExceptionHandler.java:17](../../../backend/chat-service/src/main/java/com/se193262/chatservice/exception/GlobalExceptionHandler.java#L17); class_declaration. `@RestControllerAdvice`

## chat-service · Conversation

[Conversation.java:19](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/conversation/Conversation.java#L19); class_declaration. `@Entity`, `@Table(name = "conversations")`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| id | UUID | @Id; @GeneratedValue(strategy = GenerationType.UUID) | [Conversation.java:23](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/conversation/Conversation.java#L23) |
| cakeRequestId | UUID | @Column(name = "cake_request_id", nullable = false) | [Conversation.java:27](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/conversation/Conversation.java#L27) |
| orderId | UUID | @Column(name = "order_id") | [Conversation.java:30](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/conversation/Conversation.java#L30) |
| customerId | UUID | @Column(name = "customer_id", nullable = false) | [Conversation.java:33](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/conversation/Conversation.java#L33) |
| bakeryId | UUID | @Column(name = "bakery_id", nullable = false) | [Conversation.java:36](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/conversation/Conversation.java#L36) |
| status | ConversationStatus | @Enumerated(EnumType.STRING); @Column(nullable = false, length = 30) | [Conversation.java:39](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/conversation/Conversation.java#L39) |
| closeReason | String | @Column(name = "close_reason", length = 500) | [Conversation.java:43](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/conversation/Conversation.java#L43) |
| lastMessageAt | Instant | @Column(name = "last_message_at") | [Conversation.java:46](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/conversation/Conversation.java#L46) |
| createdAt | Instant | @Column(name = "created_at", nullable = false) | [Conversation.java:49](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/conversation/Conversation.java#L49) |
| updatedAt | Instant | @Column(name = "updated_at", nullable = false) | [Conversation.java:52](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/conversation/Conversation.java#L52) |
| version | long | @Version; @Column(nullable = false) | [Conversation.java:55](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/conversation/Conversation.java#L55) |


## chat-service · ConversationController

[ConversationController.java:30](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/conversation/ConversationController.java#L30); class_declaration. `@RestController`, `@Validated`, `@RequestMapping("/api/v1/conversations")`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| conversationService | ConversationService |  | [ConversationController.java:35](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/conversation/ConversationController.java#L35) |


## chat-service · ConversationParticipant

[ConversationParticipant.java:16](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/conversation/ConversationParticipant.java#L16); class_declaration. `@Entity`, `@Table(name = "conversation_participants")`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| id | UUID | @Id; @GeneratedValue(strategy = GenerationType.UUID) | [ConversationParticipant.java:20](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/conversation/ConversationParticipant.java#L20) |
| conversationId | UUID | @Column(name = "conversation_id", nullable = false) | [ConversationParticipant.java:24](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/conversation/ConversationParticipant.java#L24) |
| userId | UUID | @Column(name = "user_id", nullable = false) | [ConversationParticipant.java:27](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/conversation/ConversationParticipant.java#L27) |
| participantType | ParticipantType | @Enumerated(EnumType.STRING); @Column(name = "participant_type", nullable = false, length = 30) | [ConversationParticipant.java:30](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/conversation/ConversationParticipant.java#L30) |
| joinedAt | Instant | @Column(name = "joined_at", nullable = false) | [ConversationParticipant.java:34](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/conversation/ConversationParticipant.java#L34) |
| leftAt | Instant | @Column(name = "left_at") | [ConversationParticipant.java:37](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/conversation/ConversationParticipant.java#L37) |
| lastReadAt | Instant | @Column(name = "last_read_at") | [ConversationParticipant.java:40](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/conversation/ConversationParticipant.java#L40) |


## chat-service · ConversationParticipantRepository

[ConversationParticipantRepository.java:9](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/conversation/ConversationParticipantRepository.java#L9); interface_declaration. 

## chat-service · ConversationPersistenceService

[ConversationPersistenceService.java:11](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/conversation/ConversationPersistenceService.java#L11); class_declaration. `@Service`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| conversationRepository | ConversationRepository |  | [ConversationPersistenceService.java:14](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/conversation/ConversationPersistenceService.java#L14) |
| participantRepository | ConversationParticipantRepository |  | [ConversationPersistenceService.java:15](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/conversation/ConversationPersistenceService.java#L15) |


## chat-service · ConversationRepository

[ConversationRepository.java:12](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/conversation/ConversationRepository.java#L12); interface_declaration. 

## chat-service · ConversationService

[ConversationService.java:21](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/conversation/ConversationService.java#L21); class_declaration. `@Service`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| conversationRepository | ConversationRepository |  | [ConversationService.java:24](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/conversation/ConversationService.java#L24) |
| participantRepository | ConversationParticipantRepository |  | [ConversationService.java:25](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/conversation/ConversationService.java#L25) |
| persistenceService | ConversationPersistenceService |  | [ConversationService.java:26](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/conversation/ConversationService.java#L26) |
| messageRepository | ChatMessageRepository |  | [ConversationService.java:27](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/conversation/ConversationService.java#L27) |
| contextService | ChatContextService |  | [ConversationService.java:28](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/conversation/ConversationService.java#L28) |


## chat-service · ConversationCreation

[ConversationService.java:257](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/conversation/ConversationService.java#L257); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| conversation | Conversation |  | [ConversationService.java:257](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/conversation/ConversationService.java#L257) |
| existing | boolean |  | [ConversationService.java:257](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/conversation/ConversationService.java#L257) |


## chat-service · PageInfo

[ConversationService.java:260](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/conversation/ConversationService.java#L260); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| page | int |  | [ConversationService.java:260](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/conversation/ConversationService.java#L260) |
| size | int |  | [ConversationService.java:260](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/conversation/ConversationService.java#L260) |
| pages | int |  | [ConversationService.java:260](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/conversation/ConversationService.java#L260) |
| total | long |  | [ConversationService.java:260](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/conversation/ConversationService.java#L260) |


## chat-service · ConversationPage

[ConversationService.java:263](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/conversation/ConversationService.java#L263); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| results | List<ConversationSummaryResponse> |  | [ConversationService.java:263](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/conversation/ConversationService.java#L263) |
| meta | PageInfo |  | [ConversationService.java:263](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/conversation/ConversationService.java#L263) |


## chat-service · ConversationStatus

[ConversationStatus.java:3](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/conversation/ConversationStatus.java#L3); enum_declaration. 

Enum: `OPEN`, `CLOSED`, `ARCHIVED`

## chat-service · CloseConversationRequest

[CloseConversationRequest.java:5](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/conversation/dto/CloseConversationRequest.java#L5); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| reason | String | @Size(max = 500) | [CloseConversationRequest.java:6](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/conversation/dto/CloseConversationRequest.java#L6) |


## chat-service · ConversationResponse

[ConversationResponse.java:9](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/conversation/dto/ConversationResponse.java#L9); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| id | UUID |  | [ConversationResponse.java:10](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/conversation/dto/ConversationResponse.java#L10) |
| cakeRequestId | UUID |  | [ConversationResponse.java:11](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/conversation/dto/ConversationResponse.java#L11) |
| orderId | UUID |  | [ConversationResponse.java:12](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/conversation/dto/ConversationResponse.java#L12) |
| customerId | UUID |  | [ConversationResponse.java:13](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/conversation/dto/ConversationResponse.java#L13) |
| bakeryId | UUID |  | [ConversationResponse.java:14](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/conversation/dto/ConversationResponse.java#L14) |
| status | ConversationStatus |  | [ConversationResponse.java:15](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/conversation/dto/ConversationResponse.java#L15) |
| closeReason | String |  | [ConversationResponse.java:16](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/conversation/dto/ConversationResponse.java#L16) |
| lastMessageAt | Instant |  | [ConversationResponse.java:17](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/conversation/dto/ConversationResponse.java#L17) |
| createdAt | Instant |  | [ConversationResponse.java:18](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/conversation/dto/ConversationResponse.java#L18) |
| currentUserLastReadAt | Instant |  | [ConversationResponse.java:19](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/conversation/dto/ConversationResponse.java#L19) |
| participants | List<ParticipantResponse> |  | [ConversationResponse.java:20](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/conversation/dto/ConversationResponse.java#L20) |


## chat-service · ConversationSummaryResponse

[ConversationSummaryResponse.java:8](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/conversation/dto/ConversationSummaryResponse.java#L8); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| id | UUID |  | [ConversationSummaryResponse.java:9](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/conversation/dto/ConversationSummaryResponse.java#L9) |
| cakeRequestId | UUID |  | [ConversationSummaryResponse.java:10](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/conversation/dto/ConversationSummaryResponse.java#L10) |
| orderId | UUID |  | [ConversationSummaryResponse.java:11](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/conversation/dto/ConversationSummaryResponse.java#L11) |
| customerId | UUID |  | [ConversationSummaryResponse.java:12](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/conversation/dto/ConversationSummaryResponse.java#L12) |
| bakeryId | UUID |  | [ConversationSummaryResponse.java:13](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/conversation/dto/ConversationSummaryResponse.java#L13) |
| status | ConversationStatus |  | [ConversationSummaryResponse.java:14](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/conversation/dto/ConversationSummaryResponse.java#L14) |
| lastMessageAt | Instant |  | [ConversationSummaryResponse.java:15](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/conversation/dto/ConversationSummaryResponse.java#L15) |
| unreadCount | long |  | [ConversationSummaryResponse.java:16](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/conversation/dto/ConversationSummaryResponse.java#L16) |
| lastMessagePreview | String |  | [ConversationSummaryResponse.java:17](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/conversation/dto/ConversationSummaryResponse.java#L17) |


## chat-service · CreateConversationRequest

[CreateConversationRequest.java:7](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/conversation/dto/CreateConversationRequest.java#L7); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| cakeRequestId | UUID | @NotNull | [CreateConversationRequest.java:8](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/conversation/dto/CreateConversationRequest.java#L8) |
| bakeryId | UUID | @NotNull | [CreateConversationRequest.java:9](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/conversation/dto/CreateConversationRequest.java#L9) |


## chat-service · ParticipantResponse

[ParticipantResponse.java:8](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/conversation/dto/ParticipantResponse.java#L8); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| userId | UUID |  | [ParticipantResponse.java:9](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/conversation/dto/ParticipantResponse.java#L9) |
| participantType | ParticipantType |  | [ParticipantResponse.java:10](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/conversation/dto/ParticipantResponse.java#L10) |
| joinedAt | Instant |  | [ParticipantResponse.java:11](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/conversation/dto/ParticipantResponse.java#L11) |
| lastReadAt | Instant |  | [ParticipantResponse.java:12](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/conversation/dto/ParticipantResponse.java#L12) |


## chat-service · ParticipantType

[ParticipantType.java:3](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/conversation/ParticipantType.java#L3); enum_declaration. 

Enum: `CUSTOMER`, `BAKERY_OWNER`

## chat-service · AttachmentFile

[AttachmentFile.java:3](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/AttachmentFile.java#L3); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| originalFileName | String |  | [AttachmentFile.java:4](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/AttachmentFile.java#L4) |
| mediaType | String |  | [AttachmentFile.java:5](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/AttachmentFile.java#L5) |
| content | byte[] |  | [AttachmentFile.java:6](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/AttachmentFile.java#L6) |


## chat-service · AttachmentValidator

[AttachmentValidator.java:14](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/AttachmentValidator.java#L14); class_declaration. `@Component`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| MAX_FILE_SIZE | long |  | [AttachmentValidator.java:17](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/AttachmentValidator.java#L17) |
| MAX_FILES | int |  | [AttachmentValidator.java:18](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/AttachmentValidator.java#L18) |


## chat-service · ChatMessage

[ChatMessage.java:16](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/ChatMessage.java#L16); class_declaration. `@Entity`, `@Table(name = "messages")`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| id | UUID | @Id; @GeneratedValue(strategy = GenerationType.UUID) | [ChatMessage.java:20](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/ChatMessage.java#L20) |
| conversationId | UUID | @Column(name = "conversation_id", nullable = false) | [ChatMessage.java:24](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/ChatMessage.java#L24) |
| senderParticipantId | UUID | @Column(name = "sender_participant_id", nullable = false) | [ChatMessage.java:27](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/ChatMessage.java#L27) |
| clientMessageId | UUID | @Column(name = "client_message_id", nullable = false, unique = true) | [ChatMessage.java:30](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/ChatMessage.java#L30) |
| payloadFingerprint | String | @Column(name = "payload_fingerprint", nullable = false, length = 64) | [ChatMessage.java:33](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/ChatMessage.java#L33) |
| messageType | MessageType | @Enumerated(EnumType.STRING); @Column(name = "message_type", nullable = false, length = 30) | [ChatMessage.java:36](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/ChatMessage.java#L36) |
| content | String | @Column(columnDefinition = "text") | [ChatMessage.java:40](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/ChatMessage.java#L40) |
| editedAt | Instant | @Column(name = "edited_at") | [ChatMessage.java:43](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/ChatMessage.java#L43) |
| deletedAt | Instant | @Column(name = "deleted_at") | [ChatMessage.java:46](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/ChatMessage.java#L46) |
| createdAt | Instant | @Column(name = "created_at", nullable = false) | [ChatMessage.java:49](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/ChatMessage.java#L49) |


## chat-service · ChatMessageRepository

[ChatMessageRepository.java:14](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/ChatMessageRepository.java#L14); interface_declaration. 

## chat-service · AttachmentResponse

[AttachmentResponse.java:5](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/dto/AttachmentResponse.java#L5); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| id | UUID |  | [AttachmentResponse.java:6](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/dto/AttachmentResponse.java#L6) |
| originalFileName | String |  | [AttachmentResponse.java:7](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/dto/AttachmentResponse.java#L7) |
| mediaType | String |  | [AttachmentResponse.java:8](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/dto/AttachmentResponse.java#L8) |
| fileSize | long |  | [AttachmentResponse.java:9](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/dto/AttachmentResponse.java#L9) |
| url | String |  | [AttachmentResponse.java:10](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/dto/AttachmentResponse.java#L10) |


## chat-service · MessageMetadata

[MessageMetadata.java:9](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/dto/MessageMetadata.java#L9); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| clientMessageId | UUID | @NotNull | [MessageMetadata.java:10](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/dto/MessageMetadata.java#L10) |
| messageType | MessageType | @NotNull | [MessageMetadata.java:11](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/dto/MessageMetadata.java#L11) |
| content | String | @Size(max = 10_000) | [MessageMetadata.java:12](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/dto/MessageMetadata.java#L12) |


## chat-service · MessagePageResponse

[MessagePageResponse.java:5](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/dto/MessagePageResponse.java#L5); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| items | List<MessageResponse> |  | [MessagePageResponse.java:6](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/dto/MessagePageResponse.java#L6) |
| nextCursor | String |  | [MessagePageResponse.java:7](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/dto/MessagePageResponse.java#L7) |
| hasMore | boolean |  | [MessagePageResponse.java:8](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/dto/MessagePageResponse.java#L8) |


## chat-service · MessageResponse

[MessageResponse.java:9](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/dto/MessageResponse.java#L9); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| id | UUID |  | [MessageResponse.java:10](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/dto/MessageResponse.java#L10) |
| clientMessageId | UUID |  | [MessageResponse.java:11](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/dto/MessageResponse.java#L11) |
| senderId | UUID |  | [MessageResponse.java:12](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/dto/MessageResponse.java#L12) |
| messageType | MessageType |  | [MessageResponse.java:13](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/dto/MessageResponse.java#L13) |
| content | String |  | [MessageResponse.java:14](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/dto/MessageResponse.java#L14) |
| createdAt | Instant |  | [MessageResponse.java:15](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/dto/MessageResponse.java#L15) |
| editedAt | Instant |  | [MessageResponse.java:16](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/dto/MessageResponse.java#L16) |
| deleted | boolean |  | [MessageResponse.java:17](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/dto/MessageResponse.java#L17) |
| attachments | List<AttachmentResponse> |  | [MessageResponse.java:18](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/dto/MessageResponse.java#L18) |


## chat-service · ReadMessagesRequest

[ReadMessagesRequest.java:7](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/dto/ReadMessagesRequest.java#L7); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| throughMessageId | UUID | @NotNull | [ReadMessagesRequest.java:7](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/dto/ReadMessagesRequest.java#L7) |


## chat-service · ReadMessagesResponse

[ReadMessagesResponse.java:6](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/dto/ReadMessagesResponse.java#L6); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| conversationId | UUID |  | [ReadMessagesResponse.java:6](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/dto/ReadMessagesResponse.java#L6) |
| lastReadAt | Instant |  | [ReadMessagesResponse.java:6](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/dto/ReadMessagesResponse.java#L6) |


## chat-service · MessageAttachment

[MessageAttachment.java:12](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/MessageAttachment.java#L12); class_declaration. `@Entity`, `@Table(name = "message_attachments")`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| id | UUID | @Id; @GeneratedValue(strategy = GenerationType.UUID) | [MessageAttachment.java:16](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/MessageAttachment.java#L16) |
| messageId | UUID | @Column(name = "message_id", nullable = false) | [MessageAttachment.java:20](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/MessageAttachment.java#L20) |
| objectKey | String | @Column(name = "object_key", nullable = false, length = 512) | [MessageAttachment.java:23](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/MessageAttachment.java#L23) |
| originalFileName | String | @Column(name = "original_file_name", nullable = false) | [MessageAttachment.java:26](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/MessageAttachment.java#L26) |
| mediaType | String | @Column(name = "media_type", nullable = false, length = 100) | [MessageAttachment.java:29](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/MessageAttachment.java#L29) |
| fileSize | long | @Column(name = "file_size", nullable = false) | [MessageAttachment.java:32](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/MessageAttachment.java#L32) |
| displayOrder | int | @Column(name = "display_order", nullable = false) | [MessageAttachment.java:35](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/MessageAttachment.java#L35) |


## chat-service · MessageAttachmentRepository

[MessageAttachmentRepository.java:8](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/MessageAttachmentRepository.java#L8); interface_declaration. 

## chat-service · MessageController

[MessageController.java:32](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/MessageController.java#L32); class_declaration. `@RestController`, `@Validated`, `@RequestMapping("/api/v1/conversations/{conversationId}")`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| messageService | MessageService |  | [MessageController.java:37](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/MessageController.java#L37) |


## chat-service · MessagePersistenceService

[MessagePersistenceService.java:25](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/MessagePersistenceService.java#L25); class_declaration. `@Service`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| LOGGER | Logger |  | [MessagePersistenceService.java:28](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/MessagePersistenceService.java#L28) |
| conversationRepository | ConversationRepository |  | [MessagePersistenceService.java:30](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/MessagePersistenceService.java#L30) |
| participantRepository | ConversationParticipantRepository |  | [MessagePersistenceService.java:31](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/MessagePersistenceService.java#L31) |
| messageRepository | ChatMessageRepository |  | [MessagePersistenceService.java:32](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/MessagePersistenceService.java#L32) |
| attachmentRepository | MessageAttachmentRepository |  | [MessagePersistenceService.java:33](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/MessagePersistenceService.java#L33) |
| receiptRepository | MessageReceiptRepository |  | [MessagePersistenceService.java:34](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/MessagePersistenceService.java#L34) |
| attachmentStorage | AttachmentStorage |  | [MessagePersistenceService.java:35](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/MessagePersistenceService.java#L35) |


## chat-service · MessageReceipt

[MessageReceipt.java:10](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/MessageReceipt.java#L10); class_declaration. `@Entity`, `@Table(name = "message_receipts")`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| id | MessageReceiptId | @EmbeddedId | [MessageReceipt.java:14](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/MessageReceipt.java#L14) |
| deliveredAt | Instant | @Column(name = "delivered_at") | [MessageReceipt.java:17](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/MessageReceipt.java#L17) |
| readAt | Instant | @Column(name = "read_at") | [MessageReceipt.java:20](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/MessageReceipt.java#L20) |


## chat-service · MessageReceiptId

[MessageReceiptId.java:9](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/MessageReceiptId.java#L9); class_declaration. `@Embeddable`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| messageId | UUID | @Column(name = "message_id") | [MessageReceiptId.java:12](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/MessageReceiptId.java#L12) |
| participantId | UUID | @Column(name = "participant_id") | [MessageReceiptId.java:15](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/MessageReceiptId.java#L15) |


## chat-service · MessageReceiptRepository

[MessageReceiptRepository.java:10](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/MessageReceiptRepository.java#L10); interface_declaration. 

## chat-service · MessageService

[MessageService.java:39](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/MessageService.java#L39); class_declaration. `@Service`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| conversationService | ConversationService |  | [MessageService.java:42](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/MessageService.java#L42) |
| messageRepository | ChatMessageRepository |  | [MessageService.java:43](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/MessageService.java#L43) |
| participantRepository | ConversationParticipantRepository |  | [MessageService.java:44](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/MessageService.java#L44) |
| attachmentRepository | MessageAttachmentRepository |  | [MessageService.java:45](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/MessageService.java#L45) |
| persistenceService | MessagePersistenceService |  | [MessageService.java:46](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/MessageService.java#L46) |
| attachmentValidator | AttachmentValidator |  | [MessageService.java:47](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/MessageService.java#L47) |
| attachmentStorage | AttachmentStorage |  | [MessageService.java:48](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/MessageService.java#L48) |
| storageProperties | StorageProperties |  | [MessageService.java:49](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/MessageService.java#L49) |


## chat-service · MessageCreation

[MessageService.java:256](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/MessageService.java#L256); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| message | ChatMessage |  | [MessageService.java:256](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/MessageService.java#L256) |
| replayed | boolean |  | [MessageService.java:256](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/MessageService.java#L256) |


## chat-service · Cursor

[MessageService.java:259](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/MessageService.java#L259); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| createdAt | Instant |  | [MessageService.java:259](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/MessageService.java#L259) |
| id | UUID |  | [MessageService.java:259](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/MessageService.java#L259) |


## chat-service · MessageType

[MessageType.java:3](../../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/MessageType.java#L3); enum_declaration. 

Enum: `TEXT`, `IMAGE`, `FILE`, `SYSTEM`

## chat-service · BakeryChatClient

[BakeryChatClient.java:10](../../../backend/chat-service/src/main/java/com/se193262/chatservice/infrastructure/client/BakeryChatClient.java#L10); interface_declaration. `@HttpExchange("/internal/v1")`

## chat-service · MembershipAuthorizationResponse

[BakeryChatClient.java:19](../../../backend/chat-service/src/main/java/com/se193262/chatservice/infrastructure/client/BakeryChatClient.java#L19); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| bakeryId | UUID |  | [BakeryChatClient.java:20](../../../backend/chat-service/src/main/java/com/se193262/chatservice/infrastructure/client/BakeryChatClient.java#L20) |
| userId | UUID |  | [BakeryChatClient.java:21](../../../backend/chat-service/src/main/java/com/se193262/chatservice/infrastructure/client/BakeryChatClient.java#L21) |
| active | boolean |  | [BakeryChatClient.java:22](../../../backend/chat-service/src/main/java/com/se193262/chatservice/infrastructure/client/BakeryChatClient.java#L22) |
| memberRole | String |  | [BakeryChatClient.java:23](../../../backend/chat-service/src/main/java/com/se193262/chatservice/infrastructure/client/BakeryChatClient.java#L23) |
| authorized | boolean |  | [BakeryChatClient.java:24](../../../backend/chat-service/src/main/java/com/se193262/chatservice/infrastructure/client/BakeryChatClient.java#L24) |


## chat-service · ChatClientConfig

[ChatClientConfig.java:16](../../../backend/chat-service/src/main/java/com/se193262/chatservice/infrastructure/client/ChatClientConfig.java#L16); class_declaration. `@Configuration`, `@EnableConfigurationProperties(ServiceClientProperties.class)`

## chat-service · ChatContextService

[ChatContextService.java:11](../../../backend/chat-service/src/main/java/com/se193262/chatservice/infrastructure/client/ChatContextService.java#L11); class_declaration. `@Service`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| marketplaceClient | MarketplaceChatClient |  | [ChatContextService.java:14](../../../backend/chat-service/src/main/java/com/se193262/chatservice/infrastructure/client/ChatContextService.java#L14) |
| bakeryClient | BakeryChatClient |  | [ChatContextService.java:15](../../../backend/chat-service/src/main/java/com/se193262/chatservice/infrastructure/client/ChatContextService.java#L15) |


## chat-service · MarketplaceChatClient

[MarketplaceChatClient.java:10](../../../backend/chat-service/src/main/java/com/se193262/chatservice/infrastructure/client/MarketplaceChatClient.java#L10); interface_declaration. `@HttpExchange("/internal/v1")`

## chat-service · ChatAuthorizationResponse

[MarketplaceChatClient.java:19](../../../backend/chat-service/src/main/java/com/se193262/chatservice/infrastructure/client/MarketplaceChatClient.java#L19); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| cakeRequestId | UUID |  | [MarketplaceChatClient.java:20](../../../backend/chat-service/src/main/java/com/se193262/chatservice/infrastructure/client/MarketplaceChatClient.java#L20) |
| customerId | UUID |  | [MarketplaceChatClient.java:21](../../../backend/chat-service/src/main/java/com/se193262/chatservice/infrastructure/client/MarketplaceChatClient.java#L21) |
| bakeryId | UUID |  | [MarketplaceChatClient.java:22](../../../backend/chat-service/src/main/java/com/se193262/chatservice/infrastructure/client/MarketplaceChatClient.java#L22) |
| requestStatus | String |  | [MarketplaceChatClient.java:23](../../../backend/chat-service/src/main/java/com/se193262/chatservice/infrastructure/client/MarketplaceChatClient.java#L23) |
| authorized | boolean |  | [MarketplaceChatClient.java:24](../../../backend/chat-service/src/main/java/com/se193262/chatservice/infrastructure/client/MarketplaceChatClient.java#L24) |


## chat-service · ServiceTokenProvider

[ServiceTokenProvider.java:18](../../../backend/chat-service/src/main/java/com/se193262/chatservice/infrastructure/client/ServiceTokenProvider.java#L18); class_declaration. `@Component`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| TOKEN_PATH | String |  | [ServiceTokenProvider.java:21](../../../backend/chat-service/src/main/java/com/se193262/chatservice/infrastructure/client/ServiceTokenProvider.java#L21) |
| properties | ServiceClientProperties |  | [ServiceTokenProvider.java:22](../../../backend/chat-service/src/main/java/com/se193262/chatservice/infrastructure/client/ServiceTokenProvider.java#L22) |
| identityClient | RestClient |  | [ServiceTokenProvider.java:23](../../../backend/chat-service/src/main/java/com/se193262/chatservice/infrastructure/client/ServiceTokenProvider.java#L23) |
| tokens | Map<TokenKey, CachedToken> |  | [ServiceTokenProvider.java:24](../../../backend/chat-service/src/main/java/com/se193262/chatservice/infrastructure/client/ServiceTokenProvider.java#L24) |


## chat-service · TokenKey

[ServiceTokenProvider.java:75](../../../backend/chat-service/src/main/java/com/se193262/chatservice/infrastructure/client/ServiceTokenProvider.java#L75); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| audience | String |  | [ServiceTokenProvider.java:75](../../../backend/chat-service/src/main/java/com/se193262/chatservice/infrastructure/client/ServiceTokenProvider.java#L75) |
| scope | String |  | [ServiceTokenProvider.java:75](../../../backend/chat-service/src/main/java/com/se193262/chatservice/infrastructure/client/ServiceTokenProvider.java#L75) |


## chat-service · CachedToken

[ServiceTokenProvider.java:78](../../../backend/chat-service/src/main/java/com/se193262/chatservice/infrastructure/client/ServiceTokenProvider.java#L78); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| value | String |  | [ServiceTokenProvider.java:78](../../../backend/chat-service/src/main/java/com/se193262/chatservice/infrastructure/client/ServiceTokenProvider.java#L78) |
| expiresAt | Instant |  | [ServiceTokenProvider.java:78](../../../backend/chat-service/src/main/java/com/se193262/chatservice/infrastructure/client/ServiceTokenProvider.java#L78) |


## chat-service · ServiceTokenRequest

[ServiceTokenProvider.java:81](../../../backend/chat-service/src/main/java/com/se193262/chatservice/infrastructure/client/ServiceTokenProvider.java#L81); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| clientId | String |  | [ServiceTokenProvider.java:81](../../../backend/chat-service/src/main/java/com/se193262/chatservice/infrastructure/client/ServiceTokenProvider.java#L81) |
| clientSecret | String |  | [ServiceTokenProvider.java:81](../../../backend/chat-service/src/main/java/com/se193262/chatservice/infrastructure/client/ServiceTokenProvider.java#L81) |
| audience | String |  | [ServiceTokenProvider.java:81](../../../backend/chat-service/src/main/java/com/se193262/chatservice/infrastructure/client/ServiceTokenProvider.java#L81) |
| scope | String |  | [ServiceTokenProvider.java:81](../../../backend/chat-service/src/main/java/com/se193262/chatservice/infrastructure/client/ServiceTokenProvider.java#L81) |


## chat-service · ServiceTokenResponse

[ServiceTokenProvider.java:84](../../../backend/chat-service/src/main/java/com/se193262/chatservice/infrastructure/client/ServiceTokenProvider.java#L84); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| accessToken | String |  | [ServiceTokenProvider.java:84](../../../backend/chat-service/src/main/java/com/se193262/chatservice/infrastructure/client/ServiceTokenProvider.java#L84) |
| expiresIn | long |  | [ServiceTokenProvider.java:84](../../../backend/chat-service/src/main/java/com/se193262/chatservice/infrastructure/client/ServiceTokenProvider.java#L84) |


## chat-service · AttachmentStorage

[AttachmentStorage.java:6](../../../backend/chat-service/src/main/java/com/se193262/chatservice/infrastructure/storage/AttachmentStorage.java#L6); interface_declaration. 

## chat-service · MinioAttachmentStorage

[MinioAttachmentStorage.java:16](../../../backend/chat-service/src/main/java/com/se193262/chatservice/infrastructure/storage/MinioAttachmentStorage.java#L16); class_declaration. `@Component`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| client | MinioClient |  | [MinioAttachmentStorage.java:19](../../../backend/chat-service/src/main/java/com/se193262/chatservice/infrastructure/storage/MinioAttachmentStorage.java#L19) |
| bucket | String |  | [MinioAttachmentStorage.java:20](../../../backend/chat-service/src/main/java/com/se193262/chatservice/infrastructure/storage/MinioAttachmentStorage.java#L20) |


## chat-service · StorageUnavailableException

[StorageUnavailableException.java:3](../../../backend/chat-service/src/main/java/com/se193262/chatservice/infrastructure/storage/StorageUnavailableException.java#L3); class_declaration. 

## chat-service · ApiResponse

[ApiResponse.java:5](../../../backend/chat-service/src/main/java/com/se193262/chatservice/shared/dto/ApiResponse.java#L5); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| statusCode | int |  | [ApiResponse.java:5](../../../backend/chat-service/src/main/java/com/se193262/chatservice/shared/dto/ApiResponse.java#L5) |
| message | String |  | [ApiResponse.java:5](../../../backend/chat-service/src/main/java/com/se193262/chatservice/shared/dto/ApiResponse.java#L5) |
| data | T |  | [ApiResponse.java:5](../../../backend/chat-service/src/main/java/com/se193262/chatservice/shared/dto/ApiResponse.java#L5) |
| timestamp | Instant |  | [ApiResponse.java:5](../../../backend/chat-service/src/main/java/com/se193262/chatservice/shared/dto/ApiResponse.java#L5) |


## chat-service · PageResult

[PageResult.java:5](../../../backend/chat-service/src/main/java/com/se193262/chatservice/shared/dto/PageResult.java#L5); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| meta | Meta |  | [PageResult.java:5](../../../backend/chat-service/src/main/java/com/se193262/chatservice/shared/dto/PageResult.java#L5) |
| result | List<T> |  | [PageResult.java:5](../../../backend/chat-service/src/main/java/com/se193262/chatservice/shared/dto/PageResult.java#L5) |


## chat-service · Meta

[PageResult.java:7](../../../backend/chat-service/src/main/java/com/se193262/chatservice/shared/dto/PageResult.java#L7); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| page | int |  | [PageResult.java:7](../../../backend/chat-service/src/main/java/com/se193262/chatservice/shared/dto/PageResult.java#L7) |
| pageSize | int |  | [PageResult.java:7](../../../backend/chat-service/src/main/java/com/se193262/chatservice/shared/dto/PageResult.java#L7) |
| pages | int |  | [PageResult.java:7](../../../backend/chat-service/src/main/java/com/se193262/chatservice/shared/dto/PageResult.java#L7) |
| total | long |  | [PageResult.java:7](../../../backend/chat-service/src/main/java/com/se193262/chatservice/shared/dto/PageResult.java#L7) |


## identity-service · AuthProperties

[AuthProperties.java:7](../../../backend/identity-service/src/main/java/com/se193262/identityservice/config/AuthProperties.java#L7); record_declaration. `@ConfigurationProperties(prefix = "security.auth")`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| refreshTokenTtl | Duration |  | [AuthProperties.java:9](../../../backend/identity-service/src/main/java/com/se193262/identityservice/config/AuthProperties.java#L9) |
| refreshCookieName | String |  | [AuthProperties.java:10](../../../backend/identity-service/src/main/java/com/se193262/identityservice/config/AuthProperties.java#L10) |
| refreshCookiePath | String |  | [AuthProperties.java:11](../../../backend/identity-service/src/main/java/com/se193262/identityservice/config/AuthProperties.java#L11) |
| refreshCookieSecure | boolean |  | [AuthProperties.java:12](../../../backend/identity-service/src/main/java/com/se193262/identityservice/config/AuthProperties.java#L12) |
| refreshCookieSameSite | String |  | [AuthProperties.java:13](../../../backend/identity-service/src/main/java/com/se193262/identityservice/config/AuthProperties.java#L13) |
| bcryptStrength | int |  | [AuthProperties.java:14](../../../backend/identity-service/src/main/java/com/se193262/identityservice/config/AuthProperties.java#L14) |


## identity-service · BakeryJwtAuthenticationConverter

[BakeryJwtAuthenticationConverter.java:13](../../../backend/identity-service/src/main/java/com/se193262/identityservice/config/BakeryJwtAuthenticationConverter.java#L13); class_declaration. 

## identity-service · CorsProperties

[CorsProperties.java:7](../../../backend/identity-service/src/main/java/com/se193262/identityservice/config/CorsProperties.java#L7); record_declaration. `@ConfigurationProperties(prefix = "security.cors")`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| allowedOrigins | List<String> |  | [CorsProperties.java:8](../../../backend/identity-service/src/main/java/com/se193262/identityservice/config/CorsProperties.java#L8) |


## identity-service · JwkSetController

[JwkSetController.java:13](../../../backend/identity-service/src/main/java/com/se193262/identityservice/config/JwkSetController.java#L13); class_declaration. `@RestController`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| rsaKey | RSAKey |  | [JwkSetController.java:16](../../../backend/identity-service/src/main/java/com/se193262/identityservice/config/JwkSetController.java#L16) |


## identity-service · JwtConfig

[JwtConfig.java:40](../../../backend/identity-service/src/main/java/com/se193262/identityservice/config/JwtConfig.java#L40); class_declaration. `@Configuration`, `@EnableConfigurationProperties({JwtProperties.class, AuthProperties.class, CorsProperties.class})`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| INVALID_AUDIENCE | OAuth2Error |  | [JwtConfig.java:44](../../../backend/identity-service/src/main/java/com/se193262/identityservice/config/JwtConfig.java#L44) |


## identity-service · JwtProperties

[JwtProperties.java:8](../../../backend/identity-service/src/main/java/com/se193262/identityservice/config/JwtProperties.java#L8); record_declaration. `@ConfigurationProperties(prefix = "security.jwt")`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| privateKeyPath | Path |  | [JwtProperties.java:10](../../../backend/identity-service/src/main/java/com/se193262/identityservice/config/JwtProperties.java#L10) |
| publicKeyPath | Path |  | [JwtProperties.java:11](../../../backend/identity-service/src/main/java/com/se193262/identityservice/config/JwtProperties.java#L11) |
| keyId | String |  | [JwtProperties.java:12](../../../backend/identity-service/src/main/java/com/se193262/identityservice/config/JwtProperties.java#L12) |
| issuer | String |  | [JwtProperties.java:13](../../../backend/identity-service/src/main/java/com/se193262/identityservice/config/JwtProperties.java#L13) |
| userAudience | String |  | [JwtProperties.java:14](../../../backend/identity-service/src/main/java/com/se193262/identityservice/config/JwtProperties.java#L14) |
| serviceAudience | String |  | [JwtProperties.java:15](../../../backend/identity-service/src/main/java/com/se193262/identityservice/config/JwtProperties.java#L15) |
| accessTokenTtl | Duration |  | [JwtProperties.java:16](../../../backend/identity-service/src/main/java/com/se193262/identityservice/config/JwtProperties.java#L16) |


## identity-service · OpenApiConfig

[OpenApiConfig.java:9](../../../backend/identity-service/src/main/java/com/se193262/identityservice/config/OpenApiConfig.java#L9); class_declaration. `@Configuration(proxyBeanMethods = false)`, `@OpenAPIDefinition(
        info = @Info(
                title = "Bakery Platform Identity Service API",
                version = "v1"
        )
)`, `@SecurityScheme(
        name = OpenApiConfig.BEARER_AUTH,
        type = SecuritySchemeType.HTTP,
        scheme = "bearer",
        bearerFormat = "JWT"
)`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| BEARER_AUTH | String |  | [OpenApiConfig.java:24](../../../backend/identity-service/src/main/java/com/se193262/identityservice/config/OpenApiConfig.java#L24) |


## identity-service · SecurityConfig

[SecurityConfig.java:40](../../../backend/identity-service/src/main/java/com/se193262/identityservice/config/SecurityConfig.java#L40); class_declaration. `@Configuration`, `@EnableWebSecurity`, `@EnableMethodSecurity`

## identity-service · AccountUnavailableException

[AccountUnavailableException.java:5](../../../backend/identity-service/src/main/java/com/se193262/identityservice/exception/AccountUnavailableException.java#L5); class_declaration. 

## identity-service · AppException

[AppException.java:5](../../../backend/identity-service/src/main/java/com/se193262/identityservice/exception/AppException.java#L5); class_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| status | HttpStatus |  | [AppException.java:7](../../../backend/identity-service/src/main/java/com/se193262/identityservice/exception/AppException.java#L7) |
| errorCode | String |  | [AppException.java:8](../../../backend/identity-service/src/main/java/com/se193262/identityservice/exception/AppException.java#L8) |


## identity-service · AuthenticationFailedException

[AuthenticationFailedException.java:5](../../../backend/identity-service/src/main/java/com/se193262/identityservice/exception/AuthenticationFailedException.java#L5); class_declaration. 

## identity-service · DuplicateEmailException

[DuplicateEmailException.java:5](../../../backend/identity-service/src/main/java/com/se193262/identityservice/exception/DuplicateEmailException.java#L5); class_declaration. 

## identity-service · GlobalExceptionHandler

[GlobalExceptionHandler.java:17](../../../backend/identity-service/src/main/java/com/se193262/identityservice/exception/GlobalExceptionHandler.java#L17); class_declaration. `@RestControllerAdvice`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| log | Logger |  | [GlobalExceptionHandler.java:20](../../../backend/identity-service/src/main/java/com/se193262/identityservice/exception/GlobalExceptionHandler.java#L20) |


## identity-service · InvalidRefreshTokenException

[InvalidRefreshTokenException.java:5](../../../backend/identity-service/src/main/java/com/se193262/identityservice/exception/InvalidRefreshTokenException.java#L5); class_declaration. 

## identity-service · ResourceNotFoundException

[ResourceNotFoundException.java:5](../../../backend/identity-service/src/main/java/com/se193262/identityservice/exception/ResourceNotFoundException.java#L5); class_declaration. 

## identity-service · ServiceAuthenticationFailedException

[ServiceAuthenticationFailedException.java:5](../../../backend/identity-service/src/main/java/com/se193262/identityservice/exception/ServiceAuthenticationFailedException.java#L5); class_declaration. 

## identity-service · AccessToken

[AccessToken.java:3](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/AccessToken.java#L3); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| value | String |  | [AccessToken.java:3](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/AccessToken.java#L3) |
| expiresInSeconds | long |  | [AccessToken.java:3](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/AccessToken.java#L3) |


## identity-service · AuthenticationController

[AuthenticationController.java:29](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/AuthenticationController.java#L29); class_declaration. `@RestController`, `@RequestMapping("/api/v1/auth")`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| authenticationService | AuthenticationService |  | [AuthenticationController.java:33](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/AuthenticationController.java#L33) |
| authProperties | AuthProperties |  | [AuthenticationController.java:34](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/AuthenticationController.java#L34) |


## identity-service · AuthenticationResult

[AuthenticationResult.java:5](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/AuthenticationResult.java#L5); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| token | TokenResponse |  | [AuthenticationResult.java:5](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/AuthenticationResult.java#L5) |
| refreshToken | String |  | [AuthenticationResult.java:5](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/AuthenticationResult.java#L5) |


## identity-service · AuthenticationService

[AuthenticationService.java:9](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/AuthenticationService.java#L9); interface_declaration. 

## identity-service · AuthenticationServiceImpl

[AuthenticationServiceImpl.java:32](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/AuthenticationServiceImpl.java#L32); class_declaration. `@Service`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| userRepository | UserRepository |  | [AuthenticationServiceImpl.java:35](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/AuthenticationServiceImpl.java#L35) |
| roleRepository | RoleRepository |  | [AuthenticationServiceImpl.java:36](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/AuthenticationServiceImpl.java#L36) |
| passwordEncoder | PasswordEncoder |  | [AuthenticationServiceImpl.java:37](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/AuthenticationServiceImpl.java#L37) |
| authenticationManager | AuthenticationManager |  | [AuthenticationServiceImpl.java:38](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/AuthenticationServiceImpl.java#L38) |
| tokenSessionService | TokenSessionService |  | [AuthenticationServiceImpl.java:39](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/AuthenticationServiceImpl.java#L39) |
| clock | Clock |  | [AuthenticationServiceImpl.java:40](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/AuthenticationServiceImpl.java#L40) |


## identity-service · LoginRequest

[LoginRequest.java:7](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/dto/LoginRequest.java#L7); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| email | String | @NotBlank; @Email; @Size(max = 320) | [LoginRequest.java:8](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/dto/LoginRequest.java#L8) |
| password | String | @NotBlank; @Size(max = 100) | [LoginRequest.java:9](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/dto/LoginRequest.java#L9) |


## identity-service · RegisterRequest

[RegisterRequest.java:7](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/dto/RegisterRequest.java#L7); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| email | String | @NotBlank; @Email; @Size(max = 320) | [RegisterRequest.java:8](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/dto/RegisterRequest.java#L8) |
| password | String | @NotBlank; @Size(min = 8, max = 100) | [RegisterRequest.java:9](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/dto/RegisterRequest.java#L9) |
| displayName | String | @NotBlank; @Size(max = 120) | [RegisterRequest.java:10](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/dto/RegisterRequest.java#L10) |
| phoneNumber | String | @Size(max = 30) | [RegisterRequest.java:11](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/dto/RegisterRequest.java#L11) |


## identity-service · TokenResponse

[TokenResponse.java:3](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/dto/TokenResponse.java#L3); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| accessToken | String |  | [TokenResponse.java:4](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/dto/TokenResponse.java#L4) |
| tokenType | String |  | [TokenResponse.java:5](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/dto/TokenResponse.java#L5) |
| expiresIn | long |  | [TokenResponse.java:6](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/dto/TokenResponse.java#L6) |


## identity-service · JwtTokenService

[JwtTokenService.java:19](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/JwtTokenService.java#L19); class_declaration. `@Service`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| jwtEncoder | JwtEncoder |  | [JwtTokenService.java:22](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/JwtTokenService.java#L22) |
| properties | JwtProperties |  | [JwtTokenService.java:23](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/JwtTokenService.java#L23) |
| rsaKey | RSAKey |  | [JwtTokenService.java:24](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/JwtTokenService.java#L24) |
| clock | Clock |  | [JwtTokenService.java:25](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/JwtTokenService.java#L25) |


## identity-service · RefreshToken

[RefreshToken.java:17](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/RefreshToken.java#L17); class_declaration. `@Entity`, `@Table(name = "refresh_tokens")`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| id | UUID | @Id; @GeneratedValue(strategy = GenerationType.UUID); @Column(name = "id", nullable = false) | [RefreshToken.java:21](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/RefreshToken.java#L21) |
| user | User | @ManyToOne(fetch = FetchType.LAZY, optional = false); @JoinColumn(name = "user_id", nullable = false) | [RefreshToken.java:26](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/RefreshToken.java#L26) |
| tokenHash | String | @Column(name = "token_hash", nullable = false, unique = true, length = 255) | [RefreshToken.java:30](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/RefreshToken.java#L30) |
| expiresAt | Instant | @Column(name = "expires_at", nullable = false) | [RefreshToken.java:33](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/RefreshToken.java#L33) |
| revokedAt | Instant | @Column(name = "revoked_at") | [RefreshToken.java:36](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/RefreshToken.java#L36) |
| createdAt | Instant | @Column(name = "created_at", nullable = false) | [RefreshToken.java:39](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/RefreshToken.java#L39) |


## identity-service · RefreshTokenGenerator

[RefreshTokenGenerator.java:8](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/RefreshTokenGenerator.java#L8); class_declaration. `@Component`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| TOKEN_BYTES | int |  | [RefreshTokenGenerator.java:11](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/RefreshTokenGenerator.java#L11) |
| secureRandom | SecureRandom |  | [RefreshTokenGenerator.java:12](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/RefreshTokenGenerator.java#L12) |


## identity-service · RefreshTokenHasher

[RefreshTokenHasher.java:10](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/RefreshTokenHasher.java#L10); class_declaration. `@Component`

## identity-service · RefreshTokenRepository

[RefreshTokenRepository.java:14](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/RefreshTokenRepository.java#L14); interface_declaration. 

## identity-service · ServiceClientProperties

[ServiceClientProperties.java:7](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/ServiceClientProperties.java#L7); record_declaration. `@ConfigurationProperties("security.service-clients")`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| clients | Map<String, Client> |  | [ServiceClientProperties.java:8](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/ServiceClientProperties.java#L8) |


## identity-service · Client

[ServiceClientProperties.java:9](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/ServiceClientProperties.java#L9); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| secretHash | String |  | [ServiceClientProperties.java:9](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/ServiceClientProperties.java#L9) |
| grants | Map<String, String> |  | [ServiceClientProperties.java:9](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/ServiceClientProperties.java#L9) |


## identity-service · ServiceTokenController

[ServiceTokenController.java:7](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/ServiceTokenController.java#L7); class_declaration. `@RestController`, `@RequestMapping("/internal/v1/auth")`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| service | ServiceTokenService |  | [ServiceTokenController.java:10](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/ServiceTokenController.java#L10) |


## identity-service · ServiceTokenRequest

[ServiceTokenRequest.java:5](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/ServiceTokenRequest.java#L5); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| clientId | String | @NotBlank | [ServiceTokenRequest.java:6](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/ServiceTokenRequest.java#L6) |
| clientSecret | String | @NotBlank | [ServiceTokenRequest.java:7](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/ServiceTokenRequest.java#L7) |
| audience | String | @NotBlank | [ServiceTokenRequest.java:8](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/ServiceTokenRequest.java#L8) |
| scope | String | @NotBlank | [ServiceTokenRequest.java:9](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/ServiceTokenRequest.java#L9) |


## identity-service · ServiceTokenResponse

[ServiceTokenResponse.java:3](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/ServiceTokenResponse.java#L3); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| accessToken | String |  | [ServiceTokenResponse.java:3](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/ServiceTokenResponse.java#L3) |
| expiresIn | long |  | [ServiceTokenResponse.java:3](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/ServiceTokenResponse.java#L3) |


## identity-service · ServiceTokenService

[ServiceTokenService.java:15](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/ServiceTokenService.java#L15); class_declaration. `@Service`, `@EnableConfigurationProperties(ServiceClientProperties.class)`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| clients | ServiceClientProperties |  | [ServiceTokenService.java:18](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/ServiceTokenService.java#L18) |
| encoder | PasswordEncoder |  | [ServiceTokenService.java:19](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/ServiceTokenService.java#L19) |
| jwtEncoder | JwtEncoder |  | [ServiceTokenService.java:20](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/ServiceTokenService.java#L20) |
| jwt | JwtProperties |  | [ServiceTokenService.java:21](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/ServiceTokenService.java#L21) |
| clock | Clock |  | [ServiceTokenService.java:22](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/ServiceTokenService.java#L22) |


## identity-service · TokenSessionService

[TokenSessionService.java:18](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/TokenSessionService.java#L18); class_declaration. `@Service`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| refreshTokenRepository | RefreshTokenRepository |  | [TokenSessionService.java:21](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/TokenSessionService.java#L21) |
| userRepository | UserRepository |  | [TokenSessionService.java:22](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/TokenSessionService.java#L22) |
| jwtTokenService | JwtTokenService |  | [TokenSessionService.java:23](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/TokenSessionService.java#L23) |
| refreshTokenGenerator | RefreshTokenGenerator |  | [TokenSessionService.java:24](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/TokenSessionService.java#L24) |
| refreshTokenHasher | RefreshTokenHasher |  | [TokenSessionService.java:25](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/TokenSessionService.java#L25) |
| authProperties | AuthProperties |  | [TokenSessionService.java:26](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/TokenSessionService.java#L26) |
| clock | Clock |  | [TokenSessionService.java:27](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/TokenSessionService.java#L27) |


## identity-service · CustomerProfile

[CustomerProfile.java:16](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/user/CustomerProfile.java#L16); class_declaration. `@Entity`, `@Table(name = "customer_profiles")`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| userId | UUID | @Id; @Column(name = "user_id", nullable = false) | [CustomerProfile.java:20](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/user/CustomerProfile.java#L20) |
| user | User | @MapsId; @OneToOne(fetch = FetchType.LAZY, optional = false); @JoinColumn(name = "user_id", nullable = false) | [CustomerProfile.java:24](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/user/CustomerProfile.java#L24) |
| dateOfBirth | LocalDate | @Column(name = "date_of_birth") | [CustomerProfile.java:29](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/user/CustomerProfile.java#L29) |
| avatarObjectKey | String | @Column(name = "avatar_object_key", length = 512) | [CustomerProfile.java:32](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/user/CustomerProfile.java#L32) |
| preferredLanguage | String | @Column(name = "preferred_language", nullable = false, length = 10) | [CustomerProfile.java:35](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/user/CustomerProfile.java#L35) |
| updatedAt | Instant | @Column(name = "updated_at", nullable = false) | [CustomerProfile.java:38](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/user/CustomerProfile.java#L38) |


## identity-service · UserProfileResponse

[UserProfileResponse.java:11](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/user/dto/UserProfileResponse.java#L11); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| id | UUID |  | [UserProfileResponse.java:12](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/user/dto/UserProfileResponse.java#L12) |
| email | String |  | [UserProfileResponse.java:13](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/user/dto/UserProfileResponse.java#L13) |
| displayName | String |  | [UserProfileResponse.java:14](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/user/dto/UserProfileResponse.java#L14) |
| phoneNumber | String |  | [UserProfileResponse.java:15](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/user/dto/UserProfileResponse.java#L15) |
| status | String |  | [UserProfileResponse.java:16](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/user/dto/UserProfileResponse.java#L16) |
| emailVerified | boolean |  | [UserProfileResponse.java:17](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/user/dto/UserProfileResponse.java#L17) |
| dateOfBirth | LocalDate |  | [UserProfileResponse.java:18](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/user/dto/UserProfileResponse.java#L18) |
| preferredLanguage | String |  | [UserProfileResponse.java:19](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/user/dto/UserProfileResponse.java#L19) |
| avatarUrl | String |  | [UserProfileResponse.java:20](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/user/dto/UserProfileResponse.java#L20) |
| avatarUrlExpiresAt | Instant |  | [UserProfileResponse.java:21](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/user/dto/UserProfileResponse.java#L21) |
| roles | List<String> |  | [UserProfileResponse.java:22](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/user/dto/UserProfileResponse.java#L22) |
| createdAt | Instant |  | [UserProfileResponse.java:23](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/user/dto/UserProfileResponse.java#L23) |
| updatedAt | Instant |  | [UserProfileResponse.java:24](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/user/dto/UserProfileResponse.java#L24) |


## identity-service · PlatformRole

[PlatformRole.java:3](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/user/PlatformRole.java#L3); enum_declaration. 

Enum: `CUSTOMER`, `BAKERY_OWNER`, `ADMIN`

## identity-service · Role

[Role.java:8](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/user/Role.java#L8); class_declaration. `@Entity`, `@Table(name = "roles")`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| id | Short | @Id; @Column(name = "id", nullable = false) | [Role.java:12](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/user/Role.java#L12) |
| code | String | @Column(name = "code", nullable = false, unique = true, length = 50) | [Role.java:16](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/user/Role.java#L16) |
| description | String | @Column(name = "description", length = 255) | [Role.java:19](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/user/Role.java#L19) |


## identity-service · RoleRepository

[RoleRepository.java:7](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/user/RoleRepository.java#L7); interface_declaration. 

## identity-service · User

[User.java:24](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/user/User.java#L24); class_declaration. `@Entity`, `@Table(name = "users")`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| id | UUID | @Id; @GeneratedValue(strategy = GenerationType.UUID); @Column(name = "id", nullable = false) | [User.java:28](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/user/User.java#L28) |
| email | String | @Column(name = "email", nullable = false, unique = true, length = 320) | [User.java:33](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/user/User.java#L33) |
| passwordHash | String | @Column(name = "password_hash", nullable = false, length = 255) | [User.java:36](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/user/User.java#L36) |
| displayName | String | @Column(name = "display_name", nullable = false, length = 120) | [User.java:39](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/user/User.java#L39) |
| phoneNumber | String | @Column(name = "phone_number", length = 30) | [User.java:42](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/user/User.java#L42) |
| status | UserStatus | @Enumerated(EnumType.STRING); @Column(name = "status", nullable = false, length = 30) | [User.java:45](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/user/User.java#L45) |
| emailVerified | boolean | @Column(name = "email_verified", nullable = false) | [User.java:49](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/user/User.java#L49) |
| createdAt | Instant | @Column(name = "created_at", nullable = false) | [User.java:52](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/user/User.java#L52) |
| updatedAt | Instant | @Column(name = "updated_at", nullable = false) | [User.java:55](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/user/User.java#L55) |
| version | long | @Version; @Column(name = "version", nullable = false) | [User.java:58](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/user/User.java#L58) |
| roles | Set<Role> | @ManyToMany(fetch = FetchType.LAZY); @JoinTable(<br>            name = "user_roles",<br>            joinColumns = @JoinColumn(name = "user_id"),<br>            inverseJoinColumns = @JoinColumn(name = "role_id")<br>    ) | [User.java:62](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/user/User.java#L62) |
| customerProfile | CustomerProfile | @OneToOne(mappedBy = "user", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true) | [User.java:70](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/user/User.java#L70) |


## identity-service · UserContextController

[UserContextController.java:8](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/user/UserContextController.java#L8); class_declaration. `@RestController`, `@RequestMapping("/internal/v1/users")`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| service | UserContextService |  | [UserContextController.java:11](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/user/UserContextController.java#L11) |


## identity-service · UserContextService

[UserContextService.java:11](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/user/UserContextService.java#L11); class_declaration. `@Service`, `@Transactional(readOnly = true)`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| jdbc | JdbcClient |  | [UserContextService.java:14](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/user/UserContextService.java#L14) |


## identity-service · UserRepository

[UserRepository.java:9](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/user/UserRepository.java#L9); interface_declaration. 

## identity-service · UserStatus

[UserStatus.java:3](../../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/user/UserStatus.java#L3); enum_declaration. 

Enum: `PENDING`, `ACTIVE`, `BLOCKED`, `DELETED`

## identity-service · IdentityServiceApplication

[IdentityServiceApplication.java:6](../../../backend/identity-service/src/main/java/com/se193262/identityservice/IdentityServiceApplication.java#L6); class_declaration. `@SpringBootApplication`

## identity-service · CorrelationFilter

[CorrelationFilter.java:12](../../../backend/identity-service/src/main/java/com/se193262/identityservice/infrastructure/CorrelationFilter.java#L12); class_declaration. `@org.springframework.stereotype.Component`, `@org.springframework.core.annotation.Order(org.springframework.core.Ordered.HIGHEST_PRECEDENCE)`

## identity-service · CustomUserDetailsService

[CustomUserDetailsService.java:13](../../../backend/identity-service/src/main/java/com/se193262/identityservice/security/CustomUserDetailsService.java#L13); class_declaration. `@Service`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| INVALID_CREDENTIALS | String |  | [CustomUserDetailsService.java:16](../../../backend/identity-service/src/main/java/com/se193262/identityservice/security/CustomUserDetailsService.java#L16) |
| userRepository | UserRepository |  | [CustomUserDetailsService.java:18](../../../backend/identity-service/src/main/java/com/se193262/identityservice/security/CustomUserDetailsService.java#L18) |


## identity-service · UserPrincipal

[UserPrincipal.java:13](../../../backend/identity-service/src/main/java/com/se193262/identityservice/security/UserPrincipal.java#L13); class_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| id | UUID |  | [UserPrincipal.java:15](../../../backend/identity-service/src/main/java/com/se193262/identityservice/security/UserPrincipal.java#L15) |
| email | String |  | [UserPrincipal.java:16](../../../backend/identity-service/src/main/java/com/se193262/identityservice/security/UserPrincipal.java#L16) |
| passwordHash | String |  | [UserPrincipal.java:17](../../../backend/identity-service/src/main/java/com/se193262/identityservice/security/UserPrincipal.java#L17) |
| status | UserStatus |  | [UserPrincipal.java:18](../../../backend/identity-service/src/main/java/com/se193262/identityservice/security/UserPrincipal.java#L18) |
| authorities | List<GrantedAuthority> |  | [UserPrincipal.java:19](../../../backend/identity-service/src/main/java/com/se193262/identityservice/security/UserPrincipal.java#L19) |


## identity-service · ApiResponse

[ApiResponse.java:5](../../../backend/identity-service/src/main/java/com/se193262/identityservice/shared/dto/ApiResponse.java#L5); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| statusCode | int |  | [ApiResponse.java:6](../../../backend/identity-service/src/main/java/com/se193262/identityservice/shared/dto/ApiResponse.java#L6) |
| message | String |  | [ApiResponse.java:7](../../../backend/identity-service/src/main/java/com/se193262/identityservice/shared/dto/ApiResponse.java#L7) |
| data | T |  | [ApiResponse.java:8](../../../backend/identity-service/src/main/java/com/se193262/identityservice/shared/dto/ApiResponse.java#L8) |
| timestamp | Instant |  | [ApiResponse.java:9](../../../backend/identity-service/src/main/java/com/se193262/identityservice/shared/dto/ApiResponse.java#L9) |


## identity-service · ResultPaginationDTO

[ResultPaginationDTO.java:7](../../../backend/identity-service/src/main/java/com/se193262/identityservice/shared/dto/ResultPaginationDTO.java#L7); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| meta | Meta |  | [ResultPaginationDTO.java:8](../../../backend/identity-service/src/main/java/com/se193262/identityservice/shared/dto/ResultPaginationDTO.java#L8) |
| result | List<?> |  | [ResultPaginationDTO.java:9](../../../backend/identity-service/src/main/java/com/se193262/identityservice/shared/dto/ResultPaginationDTO.java#L9) |


## identity-service · Meta

[ResultPaginationDTO.java:11](../../../backend/identity-service/src/main/java/com/se193262/identityservice/shared/dto/ResultPaginationDTO.java#L11); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| page | int |  | [ResultPaginationDTO.java:12](../../../backend/identity-service/src/main/java/com/se193262/identityservice/shared/dto/ResultPaginationDTO.java#L12) |
| pageSize | int |  | [ResultPaginationDTO.java:13](../../../backend/identity-service/src/main/java/com/se193262/identityservice/shared/dto/ResultPaginationDTO.java#L13) |
| pages | int |  | [ResultPaginationDTO.java:14](../../../backend/identity-service/src/main/java/com/se193262/identityservice/shared/dto/ResultPaginationDTO.java#L14) |
| total | long |  | [ResultPaginationDTO.java:15](../../../backend/identity-service/src/main/java/com/se193262/identityservice/shared/dto/ResultPaginationDTO.java#L15) |


## marketplace-service · FirebaseProperties

[FirebaseProperties.java:5](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/config/FirebaseProperties.java#L5); record_declaration. `@ConfigurationProperties("marketplace.firebase")`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| projectId | String |  | [FirebaseProperties.java:7](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/config/FirebaseProperties.java#L7) |
| bucket | String |  | [FirebaseProperties.java:8](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/config/FirebaseProperties.java#L8) |
| connectTimeout | java.time.Duration |  | [FirebaseProperties.java:9](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/config/FirebaseProperties.java#L9) |
| readTimeout | java.time.Duration |  | [FirebaseProperties.java:10](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/config/FirebaseProperties.java#L10) |


## marketplace-service · OpenApiConfig

[OpenApiConfig.java:11](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/config/OpenApiConfig.java#L11); class_declaration. `@Configuration(proxyBeanMethods = false)`, `@OpenAPIDefinition(
        info = @Info(title = "Bakery Platform Marketplace Service API", version = "v1"),
        security = @SecurityRequirement(name = OpenApiConfig.BEARER_AUTH))`, `@SecurityScheme(
        name = OpenApiConfig.BEARER_AUTH,
        type = SecuritySchemeType.HTTP,
        scheme = "bearer",
        bearerFormat = "JWT")`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| BEARER_AUTH | String |  | [OpenApiConfig.java:22](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/config/OpenApiConfig.java#L22) |


## marketplace-service · CakePreference

[CakePreference.java:10](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakePreference.java#L10); class_declaration. `@Entity`, `@Table(name = "cake_preferences")`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| cakeRequestId | UUID | @Id; @Column(name = "cake_request_id", nullable = false) | [CakePreference.java:13](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakePreference.java#L13) |
| cakeSize | String | @Column(name = "cake_size", nullable = true, length = 80) | [CakePreference.java:17](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakePreference.java#L17) |
| cakeShape | String | @Column(name = "cake_shape", nullable = true, length = 80) | [CakePreference.java:20](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakePreference.java#L20) |
| flavor | String | @Column(name = "flavor", nullable = true, length = 120) | [CakePreference.java:23](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakePreference.java#L23) |
| filling | String | @Column(name = "filling", nullable = true, length = 120) | [CakePreference.java:26](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakePreference.java#L26) |
| frosting | String | @Column(name = "frosting", nullable = true, length = 120) | [CakePreference.java:29](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakePreference.java#L29) |
| colorPalette | String | @Column(name = "color_palette", nullable = true, length = 255) | [CakePreference.java:32](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakePreference.java#L32) |
| decorationNotes | String | @Column(name = "decoration_notes", nullable = true, columnDefinition = "text") | [CakePreference.java:35](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakePreference.java#L35) |
| allergyNotes | String | @Column(name = "allergy_notes", nullable = true, columnDefinition = "text") | [CakePreference.java:38](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakePreference.java#L38) |
| extraOptions | Map<String, Object> | @JdbcTypeCode(SqlTypes.JSON); @Column(name = "extra_options", nullable = false, columnDefinition = "jsonb") | [CakePreference.java:41](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakePreference.java#L41) |


## marketplace-service · CakePreferenceRepository

[CakePreferenceRepository.java:7](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakePreferenceRepository.java#L7); interface_declaration. 

## marketplace-service · CakeRequest

[CakeRequest.java:9](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequest.java#L9); class_declaration. `@Entity`, `@Table(name = "cake_requests")`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| id | UUID | @Id; @Column(name = "id", nullable = false) | [CakeRequest.java:12](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequest.java#L12) |
| customerId | UUID | @Column(name = "customer_id", nullable = false) | [CakeRequest.java:16](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequest.java#L16) |
| targetBakeryId | UUID | @Column(name = "target_bakery_id", nullable = true) | [CakeRequest.java:19](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequest.java#L19) |
| baseProductId | UUID | @Column(name = "base_product_id", nullable = true) | [CakeRequest.java:22](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequest.java#L22) |
| selectedDesignId | UUID | @Column(name = "selected_design_id", nullable = true) | [CakeRequest.java:25](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequest.java#L25) |
| requestType | RequestType | @Enumerated(EnumType.STRING); @Column(name = "request_type", nullable = false, length = 40) | [CakeRequest.java:28](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequest.java#L28) |
| title | String | @Column(name = "title", nullable = false, length = 180) | [CakeRequest.java:32](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequest.java#L32) |
| description | String | @Column(name = "description", nullable = false, columnDefinition = "text") | [CakeRequest.java:35](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequest.java#L35) |
| occasion | String | @Column(name = "occasion", nullable = true, length = 100) | [CakeRequest.java:38](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequest.java#L38) |
| servingSize | Integer | @Column(name = "serving_size", nullable = true) | [CakeRequest.java:41](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequest.java#L41) |
| budgetMin | BigDecimal | @Column(name = "budget_min", nullable = true, precision = 12, scale = 2) | [CakeRequest.java:44](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequest.java#L44) |
| budgetMax | BigDecimal | @Column(name = "budget_max", nullable = true, precision = 12, scale = 2) | [CakeRequest.java:47](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequest.java#L47) |
| neededAt | Instant | @Column(name = "needed_at", nullable = false) | [CakeRequest.java:50](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequest.java#L50) |
| deliveryDistrict | String | @Column(name = "delivery_district", nullable = false, length = 120) | [CakeRequest.java:53](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequest.java#L53) |
| deliveryCity | String | @Column(name = "delivery_city", nullable = false, length = 120) | [CakeRequest.java:56](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequest.java#L56) |
| status | RequestStatus | @Enumerated(EnumType.STRING); @Column(name = "status", nullable = false, length = 30) | [CakeRequest.java:59](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequest.java#L59) |
| offerDeadline | Instant | @Column(name = "offer_deadline", nullable = true) | [CakeRequest.java:63](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequest.java#L63) |
| createdAt | Instant | @Column(name = "created_at", nullable = false) | [CakeRequest.java:66](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequest.java#L66) |
| updatedAt | Instant | @Column(name = "updated_at", nullable = false) | [CakeRequest.java:69](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequest.java#L69) |
| version | Long | @Version; @Column(name = "version", nullable = false) | [CakeRequest.java:72](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequest.java#L72) |


## marketplace-service · CakeRequestController

[CakeRequestController.java:15](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequestController.java#L15); class_declaration. `@RestController`, `@RequestMapping("/api/v1/cake-requests")`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| service | CakeRequestService |  | [CakeRequestController.java:18](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequestController.java#L18) |
| images | RequestImageService |  | [CakeRequestController.java:19](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequestController.java#L19) |


## marketplace-service · CakeRequestData

[CakeRequestData.java:10](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequestData.java#L10); class_declaration. `@Component`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| preferences | CakePreferenceRepository |  | [CakeRequestData.java:12](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequestData.java#L12) |
| options | RequestOptionSelectionRepository |  | [CakeRequestData.java:13](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequestData.java#L13) |
| histories | RequestStatusHistoryRepository |  | [CakeRequestData.java:14](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequestData.java#L14) |


## marketplace-service · CakeRequestMapper

[CakeRequestMapper.java:11](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequestMapper.java#L11); class_declaration. `@Component`

## marketplace-service · CakeRequestReader

[CakeRequestReader.java:12](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequestReader.java#L12); class_declaration. `@Component`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| requests | CakeRequestRepository |  | [CakeRequestReader.java:14](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequestReader.java#L14) |
| preferences | CakePreferenceRepository |  | [CakeRequestReader.java:15](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequestReader.java#L15) |
| options | RequestOptionSelectionRepository |  | [CakeRequestReader.java:16](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequestReader.java#L16) |
| images | RequestImageRepository |  | [CakeRequestReader.java:17](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequestReader.java#L17) |
| history | RequestStatusHistoryRepository |  | [CakeRequestReader.java:18](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequestReader.java#L18) |
| mapper | CakeRequestMapper |  | [CakeRequestReader.java:19](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequestReader.java#L19) |
| storage | ImageStorage |  | [CakeRequestReader.java:20](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequestReader.java#L20) |
| offers | com.se193262.marketplaceservice.feature.offer.OfferRepository |  | [CakeRequestReader.java:21](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequestReader.java#L21) |
| bakery | com.se193262.marketplaceservice.infrastructure.client.BakeryClient |  | [CakeRequestReader.java:22](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequestReader.java#L22) |


## marketplace-service · CakeRequestRepository

[CakeRequestRepository.java:7](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequestRepository.java#L7); interface_declaration. 

## marketplace-service · CakeRequestRules

[CakeRequestRules.java:13](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequestRules.java#L13); class_declaration. `@Component`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| bakery | BakeryClient |  | [CakeRequestRules.java:15](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequestRules.java#L15) |
| clock | Clock |  | [CakeRequestRules.java:16](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequestRules.java#L16) |
| validator | jakarta.validation.Validator |  | [CakeRequestRules.java:17](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequestRules.java#L17) |


## marketplace-service · CakeRequestService

[CakeRequestService.java:8](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequestService.java#L8); interface_declaration. 

## marketplace-service · CakeRequestServiceImpl

[CakeRequestServiceImpl.java:20](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequestServiceImpl.java#L20); class_declaration. `@Service`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| requests | CakeRequestRepository |  | [CakeRequestServiceImpl.java:22](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequestServiceImpl.java#L22) |
| reader | CakeRequestReader |  | [CakeRequestServiceImpl.java:23](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequestServiceImpl.java#L23) |
| access | MarketplaceAccess |  | [CakeRequestServiceImpl.java:24](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequestServiceImpl.java#L24) |
| rules | CakeRequestRules |  | [CakeRequestServiceImpl.java:25](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequestServiceImpl.java#L25) |
| data | CakeRequestData |  | [CakeRequestServiceImpl.java:26](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequestServiceImpl.java#L26) |
| mapper | CakeRequestMapper |  | [CakeRequestServiceImpl.java:27](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequestServiceImpl.java#L27) |
| ai | CakeAiClient |  | [CakeRequestServiceImpl.java:28](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequestServiceImpl.java#L28) |
| images | RequestImageRepository |  | [CakeRequestServiceImpl.java:29](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequestServiceImpl.java#L29) |
| offers | OfferRepository |  | [CakeRequestServiceImpl.java:30](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequestServiceImpl.java#L30) |
| transitions | OfferTransitions |  | [CakeRequestServiceImpl.java:31](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequestServiceImpl.java#L31) |
| json | ObjectMapper |  | [CakeRequestServiceImpl.java:32](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequestServiceImpl.java#L32) |
| clock | Clock |  | [CakeRequestServiceImpl.java:33](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequestServiceImpl.java#L33) |


## marketplace-service · CakeRequestResponse

[CakeRequestResponse.java:11](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/dto/CakeRequestResponse.java#L11); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| id | UUID |  | [CakeRequestResponse.java:12](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/dto/CakeRequestResponse.java#L12) |
| customerId | UUID |  | [CakeRequestResponse.java:13](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/dto/CakeRequestResponse.java#L13) |
| targetBakeryId | UUID |  | [CakeRequestResponse.java:14](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/dto/CakeRequestResponse.java#L14) |
| baseProductId | UUID |  | [CakeRequestResponse.java:15](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/dto/CakeRequestResponse.java#L15) |
| selectedDesignId | UUID |  | [CakeRequestResponse.java:16](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/dto/CakeRequestResponse.java#L16) |
| requestType | RequestType |  | [CakeRequestResponse.java:17](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/dto/CakeRequestResponse.java#L17) |
| title | String |  | [CakeRequestResponse.java:18](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/dto/CakeRequestResponse.java#L18) |
| description | String |  | [CakeRequestResponse.java:19](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/dto/CakeRequestResponse.java#L19) |
| occasion | String |  | [CakeRequestResponse.java:20](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/dto/CakeRequestResponse.java#L20) |
| servingSize | Integer |  | [CakeRequestResponse.java:21](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/dto/CakeRequestResponse.java#L21) |
| budgetMin | BigDecimal |  | [CakeRequestResponse.java:22](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/dto/CakeRequestResponse.java#L22) |
| budgetMax | BigDecimal |  | [CakeRequestResponse.java:23](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/dto/CakeRequestResponse.java#L23) |
| neededAt | Instant |  | [CakeRequestResponse.java:24](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/dto/CakeRequestResponse.java#L24) |
| deliveryDistrict | String |  | [CakeRequestResponse.java:25](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/dto/CakeRequestResponse.java#L25) |
| deliveryCity | String |  | [CakeRequestResponse.java:26](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/dto/CakeRequestResponse.java#L26) |
| status | RequestStatus |  | [CakeRequestResponse.java:27](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/dto/CakeRequestResponse.java#L27) |
| offerDeadline | Instant |  | [CakeRequestResponse.java:28](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/dto/CakeRequestResponse.java#L28) |
| preference | CreateCakeRequestRequest.Preference |  | [CakeRequestResponse.java:29](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/dto/CakeRequestResponse.java#L29) |
| optionSelections | List<OptionSnapshot> |  | [CakeRequestResponse.java:30](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/dto/CakeRequestResponse.java#L30) |
| images | List<RequestImageResponse> |  | [CakeRequestResponse.java:31](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/dto/CakeRequestResponse.java#L31) |
| statusHistory | List<HistoryResponse> |  | [CakeRequestResponse.java:32](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/dto/CakeRequestResponse.java#L32) |
| selectedDesign | SelectedDesignSummary |  | [CakeRequestResponse.java:33](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/dto/CakeRequestResponse.java#L33) |
| offers | List<OfferSummary> |  | [CakeRequestResponse.java:34](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/dto/CakeRequestResponse.java#L34) |
| createdAt | Instant |  | [CakeRequestResponse.java:35](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/dto/CakeRequestResponse.java#L35) |
| updatedAt | Instant |  | [CakeRequestResponse.java:36](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/dto/CakeRequestResponse.java#L36) |
| version | long |  | [CakeRequestResponse.java:37](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/dto/CakeRequestResponse.java#L37) |


## marketplace-service · SelectedDesignSummary

[CakeRequestResponse.java:38](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/dto/CakeRequestResponse.java#L38); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| id | UUID |  | [CakeRequestResponse.java:38](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/dto/CakeRequestResponse.java#L38) |


## marketplace-service · OfferSummary

[CakeRequestResponse.java:40](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/dto/CakeRequestResponse.java#L40); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| id | UUID |  | [CakeRequestResponse.java:41](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/dto/CakeRequestResponse.java#L41) |
| bakeryId | UUID |  | [CakeRequestResponse.java:42](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/dto/CakeRequestResponse.java#L42) |
| status | com.se193262.marketplaceservice.feature.offer.OfferStatus |  | [CakeRequestResponse.java:43](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/dto/CakeRequestResponse.java#L43) |
| totalPrice | BigDecimal |  | [CakeRequestResponse.java:44](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/dto/CakeRequestResponse.java#L44) |
| expiresAt | Instant |  | [CakeRequestResponse.java:45](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/dto/CakeRequestResponse.java#L45) |


## marketplace-service · CakeRequestSummaryResponse

[CakeRequestSummaryResponse.java:9](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/dto/CakeRequestSummaryResponse.java#L9); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| id | UUID |  | [CakeRequestSummaryResponse.java:10](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/dto/CakeRequestSummaryResponse.java#L10) |
| targetBakeryId | UUID |  | [CakeRequestSummaryResponse.java:11](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/dto/CakeRequestSummaryResponse.java#L11) |
| requestType | RequestType |  | [CakeRequestSummaryResponse.java:12](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/dto/CakeRequestSummaryResponse.java#L12) |
| title | String |  | [CakeRequestSummaryResponse.java:13](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/dto/CakeRequestSummaryResponse.java#L13) |
| budgetMin | BigDecimal |  | [CakeRequestSummaryResponse.java:14](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/dto/CakeRequestSummaryResponse.java#L14) |
| budgetMax | BigDecimal |  | [CakeRequestSummaryResponse.java:15](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/dto/CakeRequestSummaryResponse.java#L15) |
| neededAt | Instant |  | [CakeRequestSummaryResponse.java:16](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/dto/CakeRequestSummaryResponse.java#L16) |
| deliveryCity | String |  | [CakeRequestSummaryResponse.java:17](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/dto/CakeRequestSummaryResponse.java#L17) |
| deliveryDistrict | String |  | [CakeRequestSummaryResponse.java:18](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/dto/CakeRequestSummaryResponse.java#L18) |
| status | RequestStatus |  | [CakeRequestSummaryResponse.java:19](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/dto/CakeRequestSummaryResponse.java#L19) |
| offerDeadline | Instant |  | [CakeRequestSummaryResponse.java:20](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/dto/CakeRequestSummaryResponse.java#L20) |
| createdAt | Instant |  | [CakeRequestSummaryResponse.java:21](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/dto/CakeRequestSummaryResponse.java#L21) |


## marketplace-service · ChatAuthorizationResponse

[ChatAuthorizationResponse.java:7](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/dto/ChatAuthorizationResponse.java#L7); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| cakeRequestId | UUID |  | [ChatAuthorizationResponse.java:8](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/dto/ChatAuthorizationResponse.java#L8) |
| customerId | UUID |  | [ChatAuthorizationResponse.java:9](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/dto/ChatAuthorizationResponse.java#L9) |
| bakeryId | UUID |  | [ChatAuthorizationResponse.java:10](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/dto/ChatAuthorizationResponse.java#L10) |
| requestStatus | RequestStatus |  | [ChatAuthorizationResponse.java:11](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/dto/ChatAuthorizationResponse.java#L11) |
| authorized | boolean |  | [ChatAuthorizationResponse.java:12](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/dto/ChatAuthorizationResponse.java#L12) |


## marketplace-service · CreateCakeRequestRequest

[CreateCakeRequestRequest.java:13](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/dto/CreateCakeRequestRequest.java#L13); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| requestType | RequestType | @NotNull | [CreateCakeRequestRequest.java:14](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/dto/CreateCakeRequestRequest.java#L14) |
| targetBakeryId | UUID |  | [CreateCakeRequestRequest.java:15](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/dto/CreateCakeRequestRequest.java#L15) |
| baseProductId | UUID |  | [CreateCakeRequestRequest.java:16](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/dto/CreateCakeRequestRequest.java#L16) |
| title | String | @NotBlank; @Size(max = 180) | [CreateCakeRequestRequest.java:17](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/dto/CreateCakeRequestRequest.java#L17) |
| description | String | @NotBlank; @Size(max = 10000) | [CreateCakeRequestRequest.java:18](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/dto/CreateCakeRequestRequest.java#L18) |
| occasion | String | @Size(max = 100) | [CreateCakeRequestRequest.java:19](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/dto/CreateCakeRequestRequest.java#L19) |
| servingSize | Integer | @Positive | [CreateCakeRequestRequest.java:20](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/dto/CreateCakeRequestRequest.java#L20) |
| budgetMin | BigDecimal | @DecimalMin("0"); @Digits(integer = 10, fraction = 2) | [CreateCakeRequestRequest.java:21](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/dto/CreateCakeRequestRequest.java#L21) |
| budgetMax | BigDecimal | @DecimalMin("0"); @Digits(integer = 10, fraction = 2) | [CreateCakeRequestRequest.java:22](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/dto/CreateCakeRequestRequest.java#L22) |
| neededAt | Instant | @NotNull; @Future | [CreateCakeRequestRequest.java:23](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/dto/CreateCakeRequestRequest.java#L23) |
| deliveryDistrict | String | @NotBlank; @Size(max = 120) | [CreateCakeRequestRequest.java:24](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/dto/CreateCakeRequestRequest.java#L24) |
| deliveryCity | String | @NotBlank; @Size(max = 120) | [CreateCakeRequestRequest.java:25](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/dto/CreateCakeRequestRequest.java#L25) |
| offerDeadline | Instant | @Future | [CreateCakeRequestRequest.java:26](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/dto/CreateCakeRequestRequest.java#L26) |
| preference | Preference | @Valid | [CreateCakeRequestRequest.java:27](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/dto/CreateCakeRequestRequest.java#L27) |
| optionSelections | List<@Valid Option> | @Size(max = 100) | [CreateCakeRequestRequest.java:28](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/dto/CreateCakeRequestRequest.java#L28) |


## marketplace-service · Preference

[CreateCakeRequestRequest.java:29](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/dto/CreateCakeRequestRequest.java#L29); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| cakeSize | String | @Size(max = 80) | [CreateCakeRequestRequest.java:30](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/dto/CreateCakeRequestRequest.java#L30) |
| cakeShape | String | @Size(max = 80) | [CreateCakeRequestRequest.java:31](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/dto/CreateCakeRequestRequest.java#L31) |
| flavor | String | @Size(max = 120) | [CreateCakeRequestRequest.java:32](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/dto/CreateCakeRequestRequest.java#L32) |
| filling | String | @Size(max = 120) | [CreateCakeRequestRequest.java:33](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/dto/CreateCakeRequestRequest.java#L33) |
| frosting | String | @Size(max = 120) | [CreateCakeRequestRequest.java:34](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/dto/CreateCakeRequestRequest.java#L34) |
| colorPalette | String | @Size(max = 255) | [CreateCakeRequestRequest.java:35](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/dto/CreateCakeRequestRequest.java#L35) |
| decorationNotes | String | @Size(max = 4000) | [CreateCakeRequestRequest.java:36](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/dto/CreateCakeRequestRequest.java#L36) |
| allergyNotes | String | @Size(max = 4000) | [CreateCakeRequestRequest.java:37](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/dto/CreateCakeRequestRequest.java#L37) |
| extraOptions | Map<String, Object> |  | [CreateCakeRequestRequest.java:38](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/dto/CreateCakeRequestRequest.java#L38) |


## marketplace-service · PatchCakeRequestRequest

[PatchCakeRequestRequest.java:7](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/dto/PatchCakeRequestRequest.java#L7); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| changes | Map<String, Object> |  | [PatchCakeRequestRequest.java:7](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/dto/PatchCakeRequestRequest.java#L7) |


## marketplace-service · RequestImageResponse

[RequestImageResponse.java:6](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/dto/RequestImageResponse.java#L6); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| id | UUID |  | [RequestImageResponse.java:7](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/dto/RequestImageResponse.java#L7) |
| url | String |  | [RequestImageResponse.java:8](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/dto/RequestImageResponse.java#L8) |
| expiresAt | Instant |  | [RequestImageResponse.java:9](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/dto/RequestImageResponse.java#L9) |
| mediaType | String |  | [RequestImageResponse.java:10](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/dto/RequestImageResponse.java#L10) |
| displayOrder | int |  | [RequestImageResponse.java:11](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/dto/RequestImageResponse.java#L11) |
| sizeBytes | long |  | [RequestImageResponse.java:12](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/dto/RequestImageResponse.java#L12) |


## marketplace-service · SelectDesignRequest

[SelectDesignRequest.java:7](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/dto/SelectDesignRequest.java#L7); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| generatedDesignId | UUID | @NotNull | [SelectDesignRequest.java:7](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/dto/SelectDesignRequest.java#L7) |


## marketplace-service · MarketplaceAccess

[MarketplaceAccess.java:15](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/MarketplaceAccess.java#L15); class_declaration. `@Component`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| bakery | BakeryClient |  | [MarketplaceAccess.java:17](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/MarketplaceAccess.java#L17) |
| workflows | OfferAcceptanceWorkflowRepository |  | [MarketplaceAccess.java:18](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/MarketplaceAccess.java#L18) |


## marketplace-service · MarketplaceChatAuthorizationService

[MarketplaceChatAuthorizationService.java:13](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/MarketplaceChatAuthorizationService.java#L13); class_declaration. `@Service`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| requests | CakeRequestRepository |  | [MarketplaceChatAuthorizationService.java:16](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/MarketplaceChatAuthorizationService.java#L16) |
| offers | OfferRepository |  | [MarketplaceChatAuthorizationService.java:17](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/MarketplaceChatAuthorizationService.java#L17) |
| clock | Clock |  | [MarketplaceChatAuthorizationService.java:18](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/MarketplaceChatAuthorizationService.java#L18) |


## marketplace-service · MarketplaceContextController

[MarketplaceContextController.java:11](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/MarketplaceContextController.java#L11); class_declaration. `@RestController`, `@RequestMapping("/internal/v1")`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| requests | CakeRequestService |  | [MarketplaceContextController.java:14](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/MarketplaceContextController.java#L14) |
| offers | OfferAcceptanceService |  | [MarketplaceContextController.java:15](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/MarketplaceContextController.java#L15) |
| chatAuthorization | MarketplaceChatAuthorizationService |  | [MarketplaceContextController.java:16](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/MarketplaceContextController.java#L16) |


## marketplace-service · RequestImage

[RequestImage.java:8](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/RequestImage.java#L8); class_declaration. `@Entity`, `@Table(name = "request_images")`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| id | UUID | @Id; @Column(name = "id", nullable = false) | [RequestImage.java:11](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/RequestImage.java#L11) |
| cakeRequestId | UUID | @Column(name = "cake_request_id", nullable = false) | [RequestImage.java:15](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/RequestImage.java#L15) |
| objectKey | String | @Column(name = "object_key", nullable = false, length = 512) | [RequestImage.java:18](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/RequestImage.java#L18) |
| mediaType | String | @Column(name = "media_type", nullable = false, length = 100) | [RequestImage.java:21](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/RequestImage.java#L21) |
| displayOrder | Integer | @Column(name = "display_order", nullable = false) | [RequestImage.java:24](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/RequestImage.java#L24) |
| createdAt | Instant | @Column(name = "created_at", nullable = false) | [RequestImage.java:27](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/RequestImage.java#L27) |
| sizeBytes | Long | @Column(name = "size_bytes", nullable = false) | [RequestImage.java:30](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/RequestImage.java#L30) |


## marketplace-service · RequestImageRepository

[RequestImageRepository.java:7](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/RequestImageRepository.java#L7); interface_declaration. 

## marketplace-service · RequestImageService

[RequestImageService.java:9](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/RequestImageService.java#L9); interface_declaration. 

## marketplace-service · RequestImageServiceImpl

[RequestImageServiceImpl.java:16](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/RequestImageServiceImpl.java#L16); class_declaration. `@Service`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| images | RequestImageRepository |  | [RequestImageServiceImpl.java:18](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/RequestImageServiceImpl.java#L18) |
| reader | CakeRequestReader |  | [RequestImageServiceImpl.java:19](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/RequestImageServiceImpl.java#L19) |
| access | MarketplaceAccess |  | [RequestImageServiceImpl.java:20](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/RequestImageServiceImpl.java#L20) |
| storage | ImageStorage |  | [RequestImageServiceImpl.java:21](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/RequestImageServiceImpl.java#L21) |
| transaction | TransactionTemplate |  | [RequestImageServiceImpl.java:22](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/RequestImageServiceImpl.java#L22) |
| clock | Clock |  | [RequestImageServiceImpl.java:23](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/RequestImageServiceImpl.java#L23) |
| log | org.slf4j.Logger |  | [RequestImageServiceImpl.java:24](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/RequestImageServiceImpl.java#L24) |


## marketplace-service · RequestOptionSelection

[RequestOptionSelection.java:7](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/RequestOptionSelection.java#L7); class_declaration. `@Entity`, `@Table(name = "request_option_selections")`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| id | UUID | @Id; @Column(name = "id", nullable = false) | [RequestOptionSelection.java:10](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/RequestOptionSelection.java#L10) |
| cakeRequestId | UUID | @Column(name = "cake_request_id", nullable = false) | [RequestOptionSelection.java:14](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/RequestOptionSelection.java#L14) |
| optionGroupId | UUID | @Column(name = "option_group_id", nullable = false) | [RequestOptionSelection.java:17](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/RequestOptionSelection.java#L17) |
| optionValueId | UUID | @Column(name = "option_value_id", nullable = false) | [RequestOptionSelection.java:20](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/RequestOptionSelection.java#L20) |
| groupNameSnapshot | String | @Column(name = "group_name_snapshot", nullable = false, length = 120) | [RequestOptionSelection.java:23](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/RequestOptionSelection.java#L23) |
| valueNameSnapshot | String | @Column(name = "value_name_snapshot", nullable = false, length = 120) | [RequestOptionSelection.java:26](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/RequestOptionSelection.java#L26) |
| quantity | Integer | @Column(name = "quantity", nullable = false) | [RequestOptionSelection.java:29](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/RequestOptionSelection.java#L29) |


## marketplace-service · RequestOptionSelectionRepository

[RequestOptionSelectionRepository.java:7](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/RequestOptionSelectionRepository.java#L7); interface_declaration. 

## marketplace-service · RequestStatus

[RequestStatus.java:3](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/RequestStatus.java#L3); enum_declaration. 

Enum: `DRAFT`, `OPEN`, `OFFER_SELECTED`, `CLOSED`, `CANCELLED`

## marketplace-service · RequestStatusHistory

[RequestStatusHistory.java:8](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/RequestStatusHistory.java#L8); class_declaration. `@Entity`, `@Table(name = "request_status_history")`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| id | UUID | @Id; @Column(name = "id", nullable = false) | [RequestStatusHistory.java:11](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/RequestStatusHistory.java#L11) |
| cakeRequestId | UUID | @Column(name = "cake_request_id", nullable = false) | [RequestStatusHistory.java:15](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/RequestStatusHistory.java#L15) |
| fromStatus | String | @Column(name = "from_status", nullable = true, length = 30) | [RequestStatusHistory.java:18](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/RequestStatusHistory.java#L18) |
| toStatus | String | @Column(name = "to_status", nullable = false, length = 30) | [RequestStatusHistory.java:21](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/RequestStatusHistory.java#L21) |
| changedBy | UUID | @Column(name = "changed_by", nullable = false) | [RequestStatusHistory.java:24](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/RequestStatusHistory.java#L24) |
| reason | String | @Column(name = "reason", nullable = true, columnDefinition = "text") | [RequestStatusHistory.java:27](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/RequestStatusHistory.java#L27) |
| changedAt | Instant | @Column(name = "changed_at", nullable = false) | [RequestStatusHistory.java:30](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/RequestStatusHistory.java#L30) |


## marketplace-service · RequestStatusHistoryRepository

[RequestStatusHistoryRepository.java:7](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/RequestStatusHistoryRepository.java#L7); interface_declaration. 

## marketplace-service · RequestType

[RequestType.java:3](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/RequestType.java#L3); enum_declaration. 

Enum: `OPEN_CUSTOM`, `TARGETED_PRODUCT_CUSTOM`

## marketplace-service · AcceptanceStatus

[AcceptanceStatus.java:3](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/AcceptanceStatus.java#L3); enum_declaration. 

Enum: `PREPARED`, `RETRYING`, `SUCCEEDED`, `FAILED`

## marketplace-service · AcceptanceTransactions

[AcceptanceTransactions.java:17](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/AcceptanceTransactions.java#L17); class_declaration. `@Component`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| workflows | OfferAcceptanceWorkflowRepository |  | [AcceptanceTransactions.java:19](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/AcceptanceTransactions.java#L19) |
| offers | OfferRepository |  | [AcceptanceTransactions.java:20](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/AcceptanceTransactions.java#L20) |
| requests | CakeRequestReader |  | [AcceptanceTransactions.java:21](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/AcceptanceTransactions.java#L21) |
| access | MarketplaceAccess |  | [AcceptanceTransactions.java:22](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/AcceptanceTransactions.java#L22) |
| requestData | CakeRequestData |  | [AcceptanceTransactions.java:23](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/AcceptanceTransactions.java#L23) |
| transitions | OfferTransitions |  | [AcceptanceTransactions.java:24](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/AcceptanceTransactions.java#L24) |
| clock | Clock |  | [AcceptanceTransactions.java:25](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/AcceptanceTransactions.java#L25) |


## marketplace-service · AcceptanceResponse

[AcceptanceResponse.java:5](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/dto/AcceptanceResponse.java#L5); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| offerId | UUID |  | [AcceptanceResponse.java:6](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/dto/AcceptanceResponse.java#L6) |
| cakeRequestId | UUID |  | [AcceptanceResponse.java:7](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/dto/AcceptanceResponse.java#L7) |
| orderId | UUID |  | [AcceptanceResponse.java:8](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/dto/AcceptanceResponse.java#L8) |
| orderNumber | String |  | [AcceptanceResponse.java:9](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/dto/AcceptanceResponse.java#L9) |
| offerStatus | String |  | [AcceptanceResponse.java:10](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/dto/AcceptanceResponse.java#L10) |
| requestStatus | String |  | [AcceptanceResponse.java:11](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/dto/AcceptanceResponse.java#L11) |


## marketplace-service · AcceptOfferRequest

[AcceptOfferRequest.java:7](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/dto/AcceptOfferRequest.java#L7); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| deliveryAddressId | UUID | @NotNull | [AcceptOfferRequest.java:8](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/dto/AcceptOfferRequest.java#L8) |
| customerNote | String | @Size(max = 2000) | [AcceptOfferRequest.java:8](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/dto/AcceptOfferRequest.java#L8) |


## marketplace-service · CreateOfferRequest

[CreateOfferRequest.java:12](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/dto/CreateOfferRequest.java#L12); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| bakeryId | UUID | @NotNull | [CreateOfferRequest.java:13](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/dto/CreateOfferRequest.java#L13) |
| message | String | @Size(max = 4000) | [CreateOfferRequest.java:14](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/dto/CreateOfferRequest.java#L14) |
| cakePrice | BigDecimal | @NotNull; @DecimalMin("0"); @Digits(integer = 10, fraction = 2) | [CreateOfferRequest.java:15](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/dto/CreateOfferRequest.java#L15) |
| deliveryFee | BigDecimal | @NotNull; @DecimalMin("0"); @Digits(integer = 10, fraction = 2) | [CreateOfferRequest.java:16](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/dto/CreateOfferRequest.java#L16) |
| estimatedCompletionAt | Instant | @NotNull; @Future | [CreateOfferRequest.java:17](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/dto/CreateOfferRequest.java#L17) |
| expiresAt | Instant | @NotNull; @Future | [CreateOfferRequest.java:18](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/dto/CreateOfferRequest.java#L18) |
| items | List<@Valid AddOn> | @Size(max = 100) | [CreateOfferRequest.java:19](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/dto/CreateOfferRequest.java#L19) |


## marketplace-service · OfferOrderSource

[OfferOrderSource.java:7](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/dto/OfferOrderSource.java#L7); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| offerId | UUID |  | [OfferOrderSource.java:8](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/dto/OfferOrderSource.java#L8) |
| cakeRequestId | UUID |  | [OfferOrderSource.java:9](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/dto/OfferOrderSource.java#L9) |
| customerId | UUID |  | [OfferOrderSource.java:10](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/dto/OfferOrderSource.java#L10) |
| bakeryId | UUID |  | [OfferOrderSource.java:11](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/dto/OfferOrderSource.java#L11) |
| title | String |  | [OfferOrderSource.java:12](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/dto/OfferOrderSource.java#L12) |
| description | String |  | [OfferOrderSource.java:13](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/dto/OfferOrderSource.java#L13) |
| neededAt | Instant |  | [OfferOrderSource.java:14](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/dto/OfferOrderSource.java#L14) |
| deliveryCity | String |  | [OfferOrderSource.java:15](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/dto/OfferOrderSource.java#L15) |
| deliveryDistrict | String |  | [OfferOrderSource.java:16](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/dto/OfferOrderSource.java#L16) |
| cakePrice | BigDecimal |  | [OfferOrderSource.java:17](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/dto/OfferOrderSource.java#L17) |
| deliveryFee | BigDecimal |  | [OfferOrderSource.java:18](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/dto/OfferOrderSource.java#L18) |
| addOnTotal | BigDecimal |  | [OfferOrderSource.java:19](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/dto/OfferOrderSource.java#L19) |
| totalPrice | BigDecimal |  | [OfferOrderSource.java:20](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/dto/OfferOrderSource.java#L20) |
| configuration | Map<String, Object> |  | [OfferOrderSource.java:21](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/dto/OfferOrderSource.java#L21) |
| items | List<Item> |  | [OfferOrderSource.java:22](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/dto/OfferOrderSource.java#L22) |


## marketplace-service · Item

[OfferOrderSource.java:23](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/dto/OfferOrderSource.java#L23); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| id | UUID |  | [OfferOrderSource.java:24](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/dto/OfferOrderSource.java#L24) |
| addOnId | UUID |  | [OfferOrderSource.java:25](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/dto/OfferOrderSource.java#L25) |
| itemNameSnapshot | String |  | [OfferOrderSource.java:26](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/dto/OfferOrderSource.java#L26) |
| descriptionSnapshot | String |  | [OfferOrderSource.java:27](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/dto/OfferOrderSource.java#L27) |
| quantity | int |  | [OfferOrderSource.java:28](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/dto/OfferOrderSource.java#L28) |
| unitPrice | BigDecimal |  | [OfferOrderSource.java:29](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/dto/OfferOrderSource.java#L29) |
| lineTotal | BigDecimal |  | [OfferOrderSource.java:30](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/dto/OfferOrderSource.java#L30) |


## marketplace-service · OfferResponse

[OfferResponse.java:10](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/dto/OfferResponse.java#L10); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| id | UUID |  | [OfferResponse.java:11](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/dto/OfferResponse.java#L11) |
| cakeRequestId | UUID |  | [OfferResponse.java:12](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/dto/OfferResponse.java#L12) |
| bakeryId | UUID |  | [OfferResponse.java:13](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/dto/OfferResponse.java#L13) |
| message | String |  | [OfferResponse.java:14](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/dto/OfferResponse.java#L14) |
| cakePrice | BigDecimal |  | [OfferResponse.java:15](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/dto/OfferResponse.java#L15) |
| deliveryFee | BigDecimal |  | [OfferResponse.java:16](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/dto/OfferResponse.java#L16) |
| addOnTotal | BigDecimal |  | [OfferResponse.java:17](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/dto/OfferResponse.java#L17) |
| totalPrice | BigDecimal |  | [OfferResponse.java:18](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/dto/OfferResponse.java#L18) |
| estimatedCompletionAt | Instant |  | [OfferResponse.java:19](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/dto/OfferResponse.java#L19) |
| expiresAt | Instant |  | [OfferResponse.java:20](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/dto/OfferResponse.java#L20) |
| status | OfferStatus |  | [OfferResponse.java:21](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/dto/OfferResponse.java#L21) |
| items | List<Item> |  | [OfferResponse.java:22](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/dto/OfferResponse.java#L22) |
| statusHistory | List<HistoryResponse> |  | [OfferResponse.java:23](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/dto/OfferResponse.java#L23) |
| createdAt | Instant |  | [OfferResponse.java:24](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/dto/OfferResponse.java#L24) |
| updatedAt | Instant |  | [OfferResponse.java:25](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/dto/OfferResponse.java#L25) |
| version | long |  | [OfferResponse.java:26](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/dto/OfferResponse.java#L26) |


## marketplace-service · Item

[OfferResponse.java:27](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/dto/OfferResponse.java#L27); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| id | UUID |  | [OfferResponse.java:28](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/dto/OfferResponse.java#L28) |
| addOnId | UUID |  | [OfferResponse.java:29](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/dto/OfferResponse.java#L29) |
| itemNameSnapshot | String |  | [OfferResponse.java:30](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/dto/OfferResponse.java#L30) |
| descriptionSnapshot | String |  | [OfferResponse.java:31](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/dto/OfferResponse.java#L31) |
| quantity | int |  | [OfferResponse.java:32](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/dto/OfferResponse.java#L32) |
| unitPrice | BigDecimal |  | [OfferResponse.java:33](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/dto/OfferResponse.java#L33) |
| lineTotal | BigDecimal |  | [OfferResponse.java:34](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/dto/OfferResponse.java#L34) |


## marketplace-service · PatchOfferRequest

[PatchOfferRequest.java:7](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/dto/PatchOfferRequest.java#L7); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| changes | Map<String, Object> |  | [PatchOfferRequest.java:7](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/dto/PatchOfferRequest.java#L7) |


## marketplace-service · MarketplaceExpirationService

[MarketplaceExpirationService.java:11](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/MarketplaceExpirationService.java#L11); class_declaration. `@Service`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| offers | OfferRepository |  | [MarketplaceExpirationService.java:13](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/MarketplaceExpirationService.java#L13) |
| requests | CakeRequestRepository |  | [MarketplaceExpirationService.java:14](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/MarketplaceExpirationService.java#L14) |
| access | MarketplaceAccess |  | [MarketplaceExpirationService.java:15](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/MarketplaceExpirationService.java#L15) |
| transitions | OfferTransitions |  | [MarketplaceExpirationService.java:16](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/MarketplaceExpirationService.java#L16) |
| data | CakeRequestData |  | [MarketplaceExpirationService.java:17](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/MarketplaceExpirationService.java#L17) |
| clock | Clock |  | [MarketplaceExpirationService.java:18](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/MarketplaceExpirationService.java#L18) |


## marketplace-service · Offer

[Offer.java:9](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/Offer.java#L9); class_declaration. `@Entity`, `@Table(name = "offers")`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| id | UUID | @Id; @Column(name = "id", nullable = false) | [Offer.java:12](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/Offer.java#L12) |
| cakeRequestId | UUID | @Column(name = "cake_request_id", nullable = false) | [Offer.java:16](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/Offer.java#L16) |
| bakeryId | UUID | @Column(name = "bakery_id", nullable = false) | [Offer.java:19](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/Offer.java#L19) |
| message | String | @Column(name = "message", nullable = true, columnDefinition = "text") | [Offer.java:22](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/Offer.java#L22) |
| cakePrice | BigDecimal | @Column(name = "cake_price", nullable = false, precision = 12, scale = 2) | [Offer.java:25](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/Offer.java#L25) |
| deliveryFee | BigDecimal | @Column(name = "delivery_fee", nullable = false, precision = 12, scale = 2) | [Offer.java:28](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/Offer.java#L28) |
| addOnTotal | BigDecimal | @Column(name = "add_on_total", nullable = false, precision = 12, scale = 2) | [Offer.java:31](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/Offer.java#L31) |
| totalPrice | BigDecimal | @Column(name = "total_price", nullable = false, precision = 12, scale = 2) | [Offer.java:34](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/Offer.java#L34) |
| estimatedCompletionAt | Instant | @Column(name = "estimated_completion_at", nullable = false) | [Offer.java:37](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/Offer.java#L37) |
| expiresAt | Instant | @Column(name = "expires_at", nullable = false) | [Offer.java:40](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/Offer.java#L40) |
| status | OfferStatus | @Enumerated(EnumType.STRING); @Column(name = "status", nullable = false, length = 30) | [Offer.java:43](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/Offer.java#L43) |
| createdAt | Instant | @Column(name = "created_at", nullable = false) | [Offer.java:47](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/Offer.java#L47) |
| updatedAt | Instant | @Column(name = "updated_at", nullable = false) | [Offer.java:50](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/Offer.java#L50) |
| version | Long | @Version; @Column(name = "version", nullable = false) | [Offer.java:53](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/Offer.java#L53) |


## marketplace-service · OfferAcceptanceService

[OfferAcceptanceService.java:7](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferAcceptanceService.java#L7); interface_declaration. 

## marketplace-service · OfferAcceptanceServiceImpl

[OfferAcceptanceServiceImpl.java:17](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferAcceptanceServiceImpl.java#L17); class_declaration. `@Service`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| transactions | AcceptanceTransactions |  | [OfferAcceptanceServiceImpl.java:19](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferAcceptanceServiceImpl.java#L19) |
| workflows | OfferAcceptanceWorkflowRepository |  | [OfferAcceptanceServiceImpl.java:20](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferAcceptanceServiceImpl.java#L20) |
| offers | OfferRepository |  | [OfferAcceptanceServiceImpl.java:21](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferAcceptanceServiceImpl.java#L21) |
| items | OfferItemRepository |  | [OfferAcceptanceServiceImpl.java:22](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferAcceptanceServiceImpl.java#L22) |
| requests | CakeRequestReader |  | [OfferAcceptanceServiceImpl.java:23](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferAcceptanceServiceImpl.java#L23) |
| orders | OrderClient |  | [OfferAcceptanceServiceImpl.java:24](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferAcceptanceServiceImpl.java#L24) |
| json | ObjectMapper |  | [OfferAcceptanceServiceImpl.java:25](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferAcceptanceServiceImpl.java#L25) |
| clock | Clock |  | [OfferAcceptanceServiceImpl.java:26](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferAcceptanceServiceImpl.java#L26) |
| log | org.slf4j.Logger |  | [OfferAcceptanceServiceImpl.java:27](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferAcceptanceServiceImpl.java#L27) |


## marketplace-service · OfferAcceptanceWorkflow

[OfferAcceptanceWorkflow.java:8](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferAcceptanceWorkflow.java#L8); class_declaration. `@Entity`, `@Table(name = "offer_acceptance_workflows")`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| id | UUID | @Id; @Column(name = "id", nullable = false) | [OfferAcceptanceWorkflow.java:11](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferAcceptanceWorkflow.java#L11) |
| cakeRequestId | UUID | @Column(name = "cake_request_id", nullable = false) | [OfferAcceptanceWorkflow.java:15](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferAcceptanceWorkflow.java#L15) |
| offerId | UUID | @Column(name = "offer_id", nullable = false) | [OfferAcceptanceWorkflow.java:18](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferAcceptanceWorkflow.java#L18) |
| customerId | UUID | @Column(name = "customer_id", nullable = false) | [OfferAcceptanceWorkflow.java:21](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferAcceptanceWorkflow.java#L21) |
| idempotencyKey | String | @Column(name = "idempotency_key", nullable = false, length = 128) | [OfferAcceptanceWorkflow.java:24](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferAcceptanceWorkflow.java#L24) |
| payloadFingerprint | String | @Column(name = "payload_fingerprint", nullable = false, length = 64) | [OfferAcceptanceWorkflow.java:27](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferAcceptanceWorkflow.java#L27) |
| deliveryAddressId | UUID | @Column(name = "delivery_address_id", nullable = false) | [OfferAcceptanceWorkflow.java:30](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferAcceptanceWorkflow.java#L30) |
| customerNote | String | @Column(name = "customer_note", nullable = true, length = 2000) | [OfferAcceptanceWorkflow.java:33](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferAcceptanceWorkflow.java#L33) |
| status | AcceptanceStatus | @Enumerated(EnumType.STRING); @Column(name = "status", nullable = false, length = 20) | [OfferAcceptanceWorkflow.java:36](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferAcceptanceWorkflow.java#L36) |
| attemptCount | Integer | @Column(name = "attempt_count", nullable = false) | [OfferAcceptanceWorkflow.java:40](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferAcceptanceWorkflow.java#L40) |
| nextRetryAt | Instant | @Column(name = "next_retry_at", nullable = false) | [OfferAcceptanceWorkflow.java:43](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferAcceptanceWorkflow.java#L43) |
| leaseUntil | Instant | @Column(name = "lease_until", nullable = true) | [OfferAcceptanceWorkflow.java:46](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferAcceptanceWorkflow.java#L46) |
| leaseOwner | UUID | @Column(name = "lease_owner", nullable = true) | [OfferAcceptanceWorkflow.java:49](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferAcceptanceWorkflow.java#L49) |
| orderId | UUID | @Column(name = "order_id", nullable = true) | [OfferAcceptanceWorkflow.java:52](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferAcceptanceWorkflow.java#L52) |
| orderNumber | String | @Column(name = "order_number", nullable = true, length = 40) | [OfferAcceptanceWorkflow.java:55](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferAcceptanceWorkflow.java#L55) |
| errorStatus | Integer | @Column(name = "error_status", nullable = true) | [OfferAcceptanceWorkflow.java:58](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferAcceptanceWorkflow.java#L58) |
| createdAt | Instant | @Column(name = "created_at", nullable = false) | [OfferAcceptanceWorkflow.java:61](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferAcceptanceWorkflow.java#L61) |
| updatedAt | Instant | @Column(name = "updated_at", nullable = false) | [OfferAcceptanceWorkflow.java:64](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferAcceptanceWorkflow.java#L64) |
| version | Long | @Version; @Column(name = "version", nullable = false) | [OfferAcceptanceWorkflow.java:67](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferAcceptanceWorkflow.java#L67) |


## marketplace-service · OfferAcceptanceWorkflowRepository

[OfferAcceptanceWorkflowRepository.java:7](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferAcceptanceWorkflowRepository.java#L7); interface_declaration. 

## marketplace-service · OfferController

[OfferController.java:14](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferController.java#L14); class_declaration. `@RestController`, `@RequestMapping("/api/v1")`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| service | OfferService |  | [OfferController.java:17](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferController.java#L17) |
| acceptance | OfferAcceptanceService |  | [OfferController.java:18](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferController.java#L18) |


## marketplace-service · OfferData

[OfferData.java:10](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferData.java#L10); class_declaration. `@Component`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| items | OfferItemRepository |  | [OfferData.java:12](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferData.java#L12) |
| histories | OfferStatusHistoryRepository |  | [OfferData.java:13](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferData.java#L13) |
| mapper | OfferMapper |  | [OfferData.java:14](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferData.java#L14) |


## marketplace-service · OfferItem

[OfferItem.java:8](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferItem.java#L8); class_declaration. `@Entity`, `@Table(name = "offer_items")`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| id | UUID | @Id; @Column(name = "id", nullable = false) | [OfferItem.java:11](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferItem.java#L11) |
| offerId | UUID | @Column(name = "offer_id", nullable = false) | [OfferItem.java:15](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferItem.java#L15) |
| addOnId | UUID | @Column(name = "add_on_id", nullable = true) | [OfferItem.java:18](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferItem.java#L18) |
| itemNameSnapshot | String | @Column(name = "item_name_snapshot", nullable = false, length = 160) | [OfferItem.java:21](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferItem.java#L21) |
| descriptionSnapshot | String | @Column(name = "description_snapshot", nullable = true, columnDefinition = "text") | [OfferItem.java:24](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferItem.java#L24) |
| quantity | Integer | @Column(name = "quantity", nullable = false) | [OfferItem.java:27](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferItem.java#L27) |
| unitPrice | BigDecimal | @Column(name = "unit_price", nullable = false, precision = 12, scale = 2) | [OfferItem.java:30](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferItem.java#L30) |
| lineTotal | BigDecimal | @Column(name = "line_total", nullable = false, precision = 12, scale = 2) | [OfferItem.java:33](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferItem.java#L33) |


## marketplace-service · OfferItemRepository

[OfferItemRepository.java:7](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferItemRepository.java#L7); interface_declaration. 

## marketplace-service · OfferMapper

[OfferMapper.java:10](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferMapper.java#L10); class_declaration. `@Component`

## marketplace-service · OfferRepository

[OfferRepository.java:7](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferRepository.java#L7); interface_declaration. 

## marketplace-service · OfferRules

[OfferRules.java:14](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferRules.java#L14); class_declaration. `@Component`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| bakery | BakeryClient |  | [OfferRules.java:16](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferRules.java#L16) |
| subscription | SubscriptionClient |  | [OfferRules.java:17](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferRules.java#L17) |
| clock | Clock |  | [OfferRules.java:18](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferRules.java#L18) |
| validator | jakarta.validation.Validator |  | [OfferRules.java:19](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferRules.java#L19) |


## marketplace-service · OfferService

[OfferService.java:8](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferService.java#L8); interface_declaration. 

## marketplace-service · OfferServiceImpl

[OfferServiceImpl.java:20](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferServiceImpl.java#L20); class_declaration. `@Service`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| offers | OfferRepository |  | [OfferServiceImpl.java:22](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferServiceImpl.java#L22) |
| requests | CakeRequestReader |  | [OfferServiceImpl.java:23](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferServiceImpl.java#L23) |
| access | MarketplaceAccess |  | [OfferServiceImpl.java:24](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferServiceImpl.java#L24) |
| rules | OfferRules |  | [OfferServiceImpl.java:25](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferServiceImpl.java#L25) |
| data | OfferData |  | [OfferServiceImpl.java:26](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferServiceImpl.java#L26) |
| transitions | OfferTransitions |  | [OfferServiceImpl.java:27](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferServiceImpl.java#L27) |
| bakery | BakeryClient |  | [OfferServiceImpl.java:28](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferServiceImpl.java#L28) |
| json | ObjectMapper |  | [OfferServiceImpl.java:29](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferServiceImpl.java#L29) |
| clock | Clock |  | [OfferServiceImpl.java:30](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferServiceImpl.java#L30) |


## marketplace-service · OfferStatus

[OfferStatus.java:3](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferStatus.java#L3); enum_declaration. 

Enum: `PENDING`, `ACCEPTED`, `REJECTED`, `WITHDRAWN`, `EXPIRED`

## marketplace-service · OfferStatusHistory

[OfferStatusHistory.java:8](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferStatusHistory.java#L8); class_declaration. `@Entity`, `@Table(name = "offer_status_history")`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| id | UUID | @Id; @Column(name = "id", nullable = false) | [OfferStatusHistory.java:11](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferStatusHistory.java#L11) |
| offerId | UUID | @Column(name = "offer_id", nullable = false) | [OfferStatusHistory.java:15](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferStatusHistory.java#L15) |
| fromStatus | String | @Column(name = "from_status", nullable = true, length = 30) | [OfferStatusHistory.java:18](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferStatusHistory.java#L18) |
| toStatus | String | @Column(name = "to_status", nullable = false, length = 30) | [OfferStatusHistory.java:21](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferStatusHistory.java#L21) |
| changedBy | UUID | @Column(name = "changed_by", nullable = false) | [OfferStatusHistory.java:24](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferStatusHistory.java#L24) |
| reason | String | @Column(name = "reason", nullable = true, columnDefinition = "text") | [OfferStatusHistory.java:27](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferStatusHistory.java#L27) |
| changedAt | Instant | @Column(name = "changed_at", nullable = false) | [OfferStatusHistory.java:30](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferStatusHistory.java#L30) |


## marketplace-service · OfferStatusHistoryRepository

[OfferStatusHistoryRepository.java:7](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferStatusHistoryRepository.java#L7); interface_declaration. 

## marketplace-service · OfferTransitions

[OfferTransitions.java:8](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferTransitions.java#L8); class_declaration. `@Component`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| history | OfferStatusHistoryRepository |  | [OfferTransitions.java:10](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferTransitions.java#L10) |
| clock | Clock |  | [OfferTransitions.java:11](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferTransitions.java#L11) |
| offers | OfferRepository |  | [OfferTransitions.java:12](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferTransitions.java#L12) |


## marketplace-service · BakeryClient

[BakeryClient.java:10](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/client/BakeryClient.java#L10); class_declaration. `@Component`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| http | ServiceHttpClient |  | [BakeryClient.java:12](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/client/BakeryClient.java#L12) |


## marketplace-service · CakeAiClient

[CakeAiClient.java:9](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/client/CakeAiClient.java#L9); class_declaration. `@Component`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| http | ServiceHttpClient |  | [CakeAiClient.java:21](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/client/CakeAiClient.java#L21) |


## marketplace-service · Design

[CakeAiClient.java:11](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/client/CakeAiClient.java#L11); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| id | UUID |  | [CakeAiClient.java:12](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/client/CakeAiClient.java#L12) |
| exists | boolean |  | [CakeAiClient.java:13](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/client/CakeAiClient.java#L13) |
| ownerMatches | boolean |  | [CakeAiClient.java:14](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/client/CakeAiClient.java#L14) |
| requestMatches | boolean |  | [CakeAiClient.java:15](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/client/CakeAiClient.java#L15) |
| moderationStatus | String |  | [CakeAiClient.java:16](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/client/CakeAiClient.java#L16) |
| jobStatus | String |  | [CakeAiClient.java:17](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/client/CakeAiClient.java#L17) |


## marketplace-service · GenerationContext

[CakeAiClient.java:19](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/client/CakeAiClient.java#L19); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| hasJobs | boolean |  | [CakeAiClient.java:19](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/client/CakeAiClient.java#L19) |


## marketplace-service · CatalogContracts

[CatalogContracts.java:9](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/client/CatalogContracts.java#L9); class_declaration. 

## marketplace-service · Area

[CatalogContracts.java:12](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/client/CatalogContracts.java#L12); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| city | String |  | [CatalogContracts.java:13](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/client/CatalogContracts.java#L13) |
| district | String |  | [CatalogContracts.java:13](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/client/CatalogContracts.java#L13) |
| deliveryFee | BigDecimal |  | [CatalogContracts.java:13](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/client/CatalogContracts.java#L13) |
| minimumOrder | BigDecimal |  | [CatalogContracts.java:13](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/client/CatalogContracts.java#L13) |


## marketplace-service · Bakery

[CatalogContracts.java:15](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/client/CatalogContracts.java#L15); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| id | UUID |  | [CatalogContracts.java:15](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/client/CatalogContracts.java#L15) |
| name | String |  | [CatalogContracts.java:15](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/client/CatalogContracts.java#L15) |
| status | String |  | [CatalogContracts.java:15](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/client/CatalogContracts.java#L15) |
| serviceAreas | List<Area> |  | [CatalogContracts.java:15](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/client/CatalogContracts.java#L15) |


## marketplace-service · Membership

[CatalogContracts.java:17](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/client/CatalogContracts.java#L17); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| bakeryId | UUID |  | [CatalogContracts.java:18](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/client/CatalogContracts.java#L18) |
| userId | UUID |  | [CatalogContracts.java:18](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/client/CatalogContracts.java#L18) |
| active | boolean |  | [CatalogContracts.java:18](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/client/CatalogContracts.java#L18) |
| memberRole | String |  | [CatalogContracts.java:18](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/client/CatalogContracts.java#L18) |
| authorized | boolean |  | [CatalogContracts.java:18](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/client/CatalogContracts.java#L18) |


## marketplace-service · Option

[CatalogContracts.java:20](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/client/CatalogContracts.java#L20); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| optionGroupId | UUID | @NotNull | [CatalogContracts.java:21](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/client/CatalogContracts.java#L21) |
| optionValueId | UUID | @NotNull | [CatalogContracts.java:21](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/client/CatalogContracts.java#L21) |
| quantity | int | @Min(1) | [CatalogContracts.java:21](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/client/CatalogContracts.java#L21) |


## marketplace-service · AddOn

[CatalogContracts.java:23](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/client/CatalogContracts.java#L23); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| addOnId | UUID | @NotNull | [CatalogContracts.java:23](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/client/CatalogContracts.java#L23) |
| quantity | int | @Min(1) | [CatalogContracts.java:23](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/client/CatalogContracts.java#L23) |


## marketplace-service · QuoteRequest

[CatalogContracts.java:25](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/client/CatalogContracts.java#L25); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| bakeryId | UUID | @NotNull | [CatalogContracts.java:26](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/client/CatalogContracts.java#L26) |
| productId | UUID |  | [CatalogContracts.java:27](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/client/CatalogContracts.java#L27) |
| deliveryCity | String | @NotBlank | [CatalogContracts.java:28](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/client/CatalogContracts.java#L28) |
| deliveryDistrict | String | @NotBlank | [CatalogContracts.java:29](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/client/CatalogContracts.java#L29) |
| optionSelections | List<@Valid Option> |  | [CatalogContracts.java:30](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/client/CatalogContracts.java#L30) |
| addOns | List<@Valid AddOn> |  | [CatalogContracts.java:31](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/client/CatalogContracts.java#L31) |


## marketplace-service · OptionSnapshot

[CatalogContracts.java:33](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/client/CatalogContracts.java#L33); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| optionGroupId | UUID |  | [CatalogContracts.java:34](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/client/CatalogContracts.java#L34) |
| optionValueId | UUID |  | [CatalogContracts.java:35](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/client/CatalogContracts.java#L35) |
| groupNameSnapshot | String |  | [CatalogContracts.java:36](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/client/CatalogContracts.java#L36) |
| valueNameSnapshot | String |  | [CatalogContracts.java:37](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/client/CatalogContracts.java#L37) |
| quantity | int |  | [CatalogContracts.java:38](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/client/CatalogContracts.java#L38) |


## marketplace-service · ItemSnapshot

[CatalogContracts.java:40](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/client/CatalogContracts.java#L40); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| addOnId | UUID |  | [CatalogContracts.java:41](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/client/CatalogContracts.java#L41) |
| itemNameSnapshot | String |  | [CatalogContracts.java:42](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/client/CatalogContracts.java#L42) |
| descriptionSnapshot | String |  | [CatalogContracts.java:43](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/client/CatalogContracts.java#L43) |
| quantity | int |  | [CatalogContracts.java:44](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/client/CatalogContracts.java#L44) |
| unitPrice | BigDecimal |  | [CatalogContracts.java:45](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/client/CatalogContracts.java#L45) |
| lineTotal | BigDecimal |  | [CatalogContracts.java:46](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/client/CatalogContracts.java#L46) |


## marketplace-service · Quote

[CatalogContracts.java:48](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/client/CatalogContracts.java#L48); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| productId | UUID |  | [CatalogContracts.java:49](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/client/CatalogContracts.java#L49) |
| productName | String |  | [CatalogContracts.java:50](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/client/CatalogContracts.java#L50) |
| customizable | boolean |  | [CatalogContracts.java:51](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/client/CatalogContracts.java#L51) |
| minimumNoticeHours | int |  | [CatalogContracts.java:52](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/client/CatalogContracts.java#L52) |
| options | List<OptionSnapshot> |  | [CatalogContracts.java:53](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/client/CatalogContracts.java#L53) |
| items | List<ItemSnapshot> |  | [CatalogContracts.java:54](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/client/CatalogContracts.java#L54) |
| addOnTotal | BigDecimal |  | [CatalogContracts.java:55](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/client/CatalogContracts.java#L55) |


## marketplace-service · OrderClient

[OrderClient.java:9](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/client/OrderClient.java#L9); class_declaration. `@Component`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| http | ServiceHttpClient |  | [OrderClient.java:20](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/client/OrderClient.java#L20) |


## marketplace-service · CreateOrder

[OrderClient.java:11](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/client/OrderClient.java#L11); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| offerId | UUID |  | [OrderClient.java:12](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/client/OrderClient.java#L12) |
| cakeRequestId | UUID |  | [OrderClient.java:13](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/client/OrderClient.java#L13) |
| customerId | UUID |  | [OrderClient.java:14](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/client/OrderClient.java#L14) |
| deliveryAddressId | UUID |  | [OrderClient.java:15](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/client/OrderClient.java#L15) |
| deliveryNote | String |  | [OrderClient.java:16](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/client/OrderClient.java#L16) |


## marketplace-service · OrderResult

[OrderClient.java:18](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/client/OrderClient.java#L18); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| orderId | UUID |  | [OrderClient.java:18](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/client/OrderClient.java#L18) |
| orderNumber | String |  | [OrderClient.java:18](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/client/OrderClient.java#L18) |
| status | String |  | [OrderClient.java:18](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/client/OrderClient.java#L18) |


## marketplace-service · SubscriptionClient

[SubscriptionClient.java:10](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/client/SubscriptionClient.java#L10); class_declaration. `@Component`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| http | ServiceHttpClient |  | [SubscriptionClient.java:16](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/client/SubscriptionClient.java#L16) |
| clock | Clock |  | [SubscriptionClient.java:17](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/client/SubscriptionClient.java#L17) |
| cache | Map<UUID, Cached> |  | [SubscriptionClient.java:18](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/client/SubscriptionClient.java#L18) |


## marketplace-service · Entitlement

[SubscriptionClient.java:12](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/client/SubscriptionClient.java#L12); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| bakeryId | UUID |  | [SubscriptionClient.java:12](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/client/SubscriptionClient.java#L12) |
| active | boolean |  | [SubscriptionClient.java:12](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/client/SubscriptionClient.java#L12) |
| periodEnd | Instant |  | [SubscriptionClient.java:12](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/client/SubscriptionClient.java#L12) |


## marketplace-service · Cached

[SubscriptionClient.java:14](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/client/SubscriptionClient.java#L14); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| entitlement | Entitlement |  | [SubscriptionClient.java:14](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/client/SubscriptionClient.java#L14) |
| expires | Instant |  | [SubscriptionClient.java:14](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/client/SubscriptionClient.java#L14) |


## marketplace-service · MarketplaceScheduler

[MarketplaceScheduler.java:11](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/scheduler/MarketplaceScheduler.java#L11); class_declaration. `@Component`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| acceptance | OfferAcceptanceService |  | [MarketplaceScheduler.java:13](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/scheduler/MarketplaceScheduler.java#L13) |
| expiration | MarketplaceExpirationService |  | [MarketplaceScheduler.java:14](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/scheduler/MarketplaceScheduler.java#L14) |
| offers | OfferRepository |  | [MarketplaceScheduler.java:15](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/scheduler/MarketplaceScheduler.java#L15) |
| requests | CakeRequestRepository |  | [MarketplaceScheduler.java:16](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/scheduler/MarketplaceScheduler.java#L16) |
| images | RequestImageService |  | [MarketplaceScheduler.java:17](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/scheduler/MarketplaceScheduler.java#L17) |
| clock | Clock |  | [MarketplaceScheduler.java:18](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/scheduler/MarketplaceScheduler.java#L18) |
| log | org.slf4j.Logger |  | [MarketplaceScheduler.java:19](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/scheduler/MarketplaceScheduler.java#L19) |


## marketplace-service · FirebaseStorageAdapter

[FirebaseStorageAdapter.java:15](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/storage/FirebaseStorageAdapter.java#L15); class_declaration. `@Component`, `@EnableConfigurationProperties(FirebaseProperties.class)`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| properties | FirebaseProperties |  | [FirebaseStorageAdapter.java:18](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/storage/FirebaseStorageAdapter.java#L18) |
| storage | Storage |  | [FirebaseStorageAdapter.java:19](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/storage/FirebaseStorageAdapter.java#L19) |
| pageToken | String |  | [FirebaseStorageAdapter.java:20](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/storage/FirebaseStorageAdapter.java#L20) |


## marketplace-service · ImageStorage

[ImageStorage.java:6](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/storage/ImageStorage.java#L6); interface_declaration. 

## marketplace-service · StoredObject

[ImageStorage.java:7](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/storage/ImageStorage.java#L7); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| key | String |  | [ImageStorage.java:7](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/storage/ImageStorage.java#L7) |
| createdAt | Instant |  | [ImageStorage.java:7](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/storage/ImageStorage.java#L7) |


## marketplace-service · MarketplaceServiceApplication

[MarketplaceServiceApplication.java:10](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/MarketplaceServiceApplication.java#L10); class_declaration. `@SpringBootApplication`, `@Import(PlatformConfiguration.class)`, `@EnableScheduling`

## marketplace-service · HistoryResponse

[HistoryResponse.java:6](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/shared/dto/HistoryResponse.java#L6); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| fromStatus | String |  | [HistoryResponse.java:7](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/shared/dto/HistoryResponse.java#L7) |
| toStatus | String |  | [HistoryResponse.java:7](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/shared/dto/HistoryResponse.java#L7) |
| changedBy | UUID |  | [HistoryResponse.java:7](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/shared/dto/HistoryResponse.java#L7) |
| reason | String |  | [HistoryResponse.java:7](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/shared/dto/HistoryResponse.java#L7) |
| changedAt | Instant |  | [HistoryResponse.java:7](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/shared/dto/HistoryResponse.java#L7) |


## marketplace-service · PageResponse

[PageResponse.java:7](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/shared/dto/PageResponse.java#L7); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| result | List<T> |  | [PageResponse.java:7](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/shared/dto/PageResponse.java#L7) |
| meta | Meta |  | [PageResponse.java:7](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/shared/dto/PageResponse.java#L7) |


## marketplace-service · Meta

[PageResponse.java:8](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/shared/dto/PageResponse.java#L8); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| page | int |  | [PageResponse.java:8](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/shared/dto/PageResponse.java#L8) |
| pageSize | int |  | [PageResponse.java:8](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/shared/dto/PageResponse.java#L8) |
| pages | int |  | [PageResponse.java:8](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/shared/dto/PageResponse.java#L8) |
| total | long |  | [PageResponse.java:8](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/shared/dto/PageResponse.java#L8) |


## marketplace-service · ReasonRequest

[ReasonRequest.java:5](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/shared/dto/ReasonRequest.java#L5); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| reason | String | @Size(max = 2000) | [ReasonRequest.java:5](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/shared/dto/ReasonRequest.java#L5) |


## marketplace-service · QueryPaging

[QueryPaging.java:9](../../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/shared/QueryPaging.java#L9); class_declaration. 

## order-service · JwtProperties

[JwtProperties.java:5](../../../backend/order-service/src/main/java/com/se193262/orderservice/config/JwtProperties.java#L5); record_declaration. `@ConfigurationProperties(prefix = "security.jwt")`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| jwkSetUri | String |  | [JwtProperties.java:7](../../../backend/order-service/src/main/java/com/se193262/orderservice/config/JwtProperties.java#L7) |
| issuer | String |  | [JwtProperties.java:8](../../../backend/order-service/src/main/java/com/se193262/orderservice/config/JwtProperties.java#L8) |
| userAudience | String |  | [JwtProperties.java:9](../../../backend/order-service/src/main/java/com/se193262/orderservice/config/JwtProperties.java#L9) |
| serviceAudience | String |  | [JwtProperties.java:10](../../../backend/order-service/src/main/java/com/se193262/orderservice/config/JwtProperties.java#L10) |


## order-service · OrderClockConfig

[OrderClockConfig.java:8](../../../backend/order-service/src/main/java/com/se193262/orderservice/config/OrderClockConfig.java#L8); class_declaration. `@Configuration`

## order-service · OrderPlatformClientConfiguration

[OrderPlatformClientConfiguration.java:11](../../../backend/order-service/src/main/java/com/se193262/orderservice/config/OrderPlatformClientConfiguration.java#L11); class_declaration. `@Configuration`, `@EnableConfigurationProperties(RemoteProperties.class)`, `@Import(CorrelationFilter.class)`

## order-service · RestClientConfig

[RestClientConfig.java:22](../../../backend/order-service/src/main/java/com/se193262/orderservice/config/RestClientConfig.java#L22); class_declaration. `@Configuration`, `@EnableConfigurationProperties(ServiceClientProperties.class)`

## order-service · SecurityConfig

[SecurityConfig.java:41](../../../backend/order-service/src/main/java/com/se193262/orderservice/config/SecurityConfig.java#L41); class_declaration. `@Configuration`, `@EnableWebSecurity`, `@EnableMethodSecurity`, `@EnableConfigurationProperties(JwtProperties.class)`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| INVALID_TOKEN_CONTRACT | OAuth2Error |  | [SecurityConfig.java:47](../../../backend/order-service/src/main/java/com/se193262/orderservice/config/SecurityConfig.java#L47) |


## order-service · ServiceClientProperties

[ServiceClientProperties.java:7](../../../backend/order-service/src/main/java/com/se193262/orderservice/config/ServiceClientProperties.java#L7); record_declaration. `@ConfigurationProperties(prefix = "clients")`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| identity | Service |  | [ServiceClientProperties.java:9](../../../backend/order-service/src/main/java/com/se193262/orderservice/config/ServiceClientProperties.java#L9) |
| bakery | Service |  | [ServiceClientProperties.java:10](../../../backend/order-service/src/main/java/com/se193262/orderservice/config/ServiceClientProperties.java#L10) |
| marketplace | Service |  | [ServiceClientProperties.java:11](../../../backend/order-service/src/main/java/com/se193262/orderservice/config/ServiceClientProperties.java#L11) |
| connectTimeout | Duration |  | [ServiceClientProperties.java:12](../../../backend/order-service/src/main/java/com/se193262/orderservice/config/ServiceClientProperties.java#L12) |
| readTimeout | Duration |  | [ServiceClientProperties.java:13](../../../backend/order-service/src/main/java/com/se193262/orderservice/config/ServiceClientProperties.java#L13) |


## order-service · Service

[ServiceClientProperties.java:15](../../../backend/order-service/src/main/java/com/se193262/orderservice/config/ServiceClientProperties.java#L15); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| baseUrl | String |  | [ServiceClientProperties.java:15](../../../backend/order-service/src/main/java/com/se193262/orderservice/config/ServiceClientProperties.java#L15) |
| audience | String |  | [ServiceClientProperties.java:15](../../../backend/order-service/src/main/java/com/se193262/orderservice/config/ServiceClientProperties.java#L15) |
| scope | String |  | [ServiceClientProperties.java:15](../../../backend/order-service/src/main/java/com/se193262/orderservice/config/ServiceClientProperties.java#L15) |


## order-service · GlobalExceptionHandler

[GlobalExceptionHandler.java:24](../../../backend/order-service/src/main/java/com/se193262/orderservice/exception/GlobalExceptionHandler.java#L24); class_declaration. `@RestControllerAdvice`

## order-service · CustomerOrder

[CustomerOrder.java:22](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/CustomerOrder.java#L22); class_declaration. `@Entity`, `@Table(name = "customer_orders")`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| id | UUID | @Id; @UuidGenerator | [CustomerOrder.java:26](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/CustomerOrder.java#L26) |
| orderNumber | String | @Column(name = "order_number", nullable = false, unique = true, length = 40) | [CustomerOrder.java:30](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/CustomerOrder.java#L30) |
| customerId | UUID | @Column(name = "customer_id", nullable = false) | [CustomerOrder.java:33](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/CustomerOrder.java#L33) |
| bakeryId | UUID | @Column(name = "bakery_id", nullable = false) | [CustomerOrder.java:36](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/CustomerOrder.java#L36) |
| cakeRequestId | UUID | @Column(name = "cake_request_id") | [CustomerOrder.java:39](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/CustomerOrder.java#L39) |
| offerId | UUID | @Column(name = "offer_id", unique = true) | [CustomerOrder.java:42](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/CustomerOrder.java#L42) |
| orderSource | OrderSource | @Enumerated(EnumType.STRING); @Column(name = "order_source", nullable = false, length = 30) | [CustomerOrder.java:45](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/CustomerOrder.java#L45) |
| customerNameSnapshot | String | @Column(name = "customer_name_snapshot", nullable = false, length = 120) | [CustomerOrder.java:49](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/CustomerOrder.java#L49) |
| customerPhoneSnapshot | String | @Column(name = "customer_phone_snapshot", nullable = false, length = 30) | [CustomerOrder.java:52](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/CustomerOrder.java#L52) |
| bakeryNameSnapshot | String | @Column(name = "bakery_name_snapshot", nullable = false, length = 180) | [CustomerOrder.java:55](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/CustomerOrder.java#L55) |
| customerNote | String | @Column(name = "customer_note") | [CustomerOrder.java:58](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/CustomerOrder.java#L58) |
| subtotal | BigDecimal | @Column(name = "subtotal", nullable = false, precision = 12, scale = 2) | [CustomerOrder.java:61](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/CustomerOrder.java#L61) |
| deliveryFee | BigDecimal | @Column(name = "delivery_fee", nullable = false, precision = 12, scale = 2) | [CustomerOrder.java:64](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/CustomerOrder.java#L64) |
| totalAmount | BigDecimal | @Column(name = "total_amount", nullable = false, precision = 12, scale = 2) | [CustomerOrder.java:67](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/CustomerOrder.java#L67) |
| currency | String | @Column(name = "currency", nullable = false, length = 3) | [CustomerOrder.java:70](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/CustomerOrder.java#L70) |
| status | OrderStatus | @Enumerated(EnumType.STRING); @Column(name = "status", nullable = false, length = 30) | [CustomerOrder.java:73](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/CustomerOrder.java#L73) |
| neededAt | Instant | @Column(name = "needed_at", nullable = false) | [CustomerOrder.java:77](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/CustomerOrder.java#L77) |
| acceptedAt | Instant | @Column(name = "accepted_at") | [CustomerOrder.java:80](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/CustomerOrder.java#L80) |
| completedAt | Instant | @Column(name = "completed_at") | [CustomerOrder.java:83](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/CustomerOrder.java#L83) |
| createdAt | Instant | @Column(name = "created_at", nullable = false) | [CustomerOrder.java:86](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/CustomerOrder.java#L86) |
| updatedAt | Instant | @Column(name = "updated_at", nullable = false) | [CustomerOrder.java:89](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/CustomerOrder.java#L89) |
| version | long | @Version; @Column(name = "version", nullable = false) | [CustomerOrder.java:92](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/CustomerOrder.java#L92) |
| items | List<OrderItem> | @OneToMany(mappedBy = "customerOrder", cascade = CascadeType.ALL, orphanRemoval = true) | [CustomerOrder.java:96](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/CustomerOrder.java#L96) |
| deliveryAddressSnapshot | DeliveryAddressSnapshot | @OneToOne(mappedBy = "customerOrder", cascade = CascadeType.ALL, orphanRemoval = true) | [CustomerOrder.java:99](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/CustomerOrder.java#L99) |
| statusHistory | List<OrderStatusHistory> | @OneToMany(mappedBy = "customerOrder", cascade = CascadeType.ALL, orphanRemoval = true) | [CustomerOrder.java:102](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/CustomerOrder.java#L102) |
| review | OrderReview | @OneToOne(mappedBy = "customerOrder", cascade = CascadeType.ALL, orphanRemoval = true) | [CustomerOrder.java:105](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/CustomerOrder.java#L105) |


## order-service · CustomerOrderRepository

[CustomerOrderRepository.java:10](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/CustomerOrderRepository.java#L10); interface_declaration. 

## order-service · DeliveryAddressSnapshot

[DeliveryAddressSnapshot.java:15](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/DeliveryAddressSnapshot.java#L15); class_declaration. `@Entity`, `@Table(name = "delivery_address_snapshots")`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| id | UUID | @Id; @Column(name = "order_id") | [DeliveryAddressSnapshot.java:19](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/DeliveryAddressSnapshot.java#L19) |
| customerOrder | CustomerOrder | @MapsId; @OneToOne(fetch = FetchType.LAZY, optional = false); @JoinColumn(name = "order_id", nullable = false) | [DeliveryAddressSnapshot.java:23](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/DeliveryAddressSnapshot.java#L23) |
| recipientName | String | @Column(name = "recipient_name", nullable = false, length = 120) | [DeliveryAddressSnapshot.java:28](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/DeliveryAddressSnapshot.java#L28) |
| recipientPhone | String | @Column(name = "recipient_phone", nullable = false, length = 30) | [DeliveryAddressSnapshot.java:31](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/DeliveryAddressSnapshot.java#L31) |
| addressLine | String | @Column(name = "address_line", nullable = false, length = 255) | [DeliveryAddressSnapshot.java:34](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/DeliveryAddressSnapshot.java#L34) |
| ward | String | @Column(name = "ward", length = 120) | [DeliveryAddressSnapshot.java:37](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/DeliveryAddressSnapshot.java#L37) |
| district | String | @Column(name = "district", nullable = false, length = 120) | [DeliveryAddressSnapshot.java:40](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/DeliveryAddressSnapshot.java#L40) |
| city | String | @Column(name = "city", nullable = false, length = 120) | [DeliveryAddressSnapshot.java:43](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/DeliveryAddressSnapshot.java#L43) |
| latitude | BigDecimal | @Column(name = "latitude", precision = 9, scale = 6) | [DeliveryAddressSnapshot.java:46](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/DeliveryAddressSnapshot.java#L46) |
| longitude | BigDecimal | @Column(name = "longitude", precision = 10, scale = 6) | [DeliveryAddressSnapshot.java:49](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/DeliveryAddressSnapshot.java#L49) |
| deliveryNote | String | @Column(name = "delivery_note") | [DeliveryAddressSnapshot.java:52](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/DeliveryAddressSnapshot.java#L52) |


## order-service · DeliveryAddressSnapshotRepository

[DeliveryAddressSnapshotRepository.java:7](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/DeliveryAddressSnapshotRepository.java#L7); interface_declaration. 

## order-service · CreateDirectOrderRequest

[CreateDirectOrderRequest.java:13](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/CreateDirectOrderRequest.java#L13); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| bakeryId | UUID | @NotNull | [CreateDirectOrderRequest.java:14](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/CreateDirectOrderRequest.java#L14) |
| productId | UUID | @NotNull | [CreateDirectOrderRequest.java:15](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/CreateDirectOrderRequest.java#L15) |
| quantity | Integer | @NotNull; @Positive | [CreateDirectOrderRequest.java:16](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/CreateDirectOrderRequest.java#L16) |
| optionSelections | List<@Valid OptionSelection> | @Size(max = 20) | [CreateDirectOrderRequest.java:17](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/CreateDirectOrderRequest.java#L17) |
| addOns | List<@Valid AddOnSelection> | @Size(max = 20) | [CreateDirectOrderRequest.java:18](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/CreateDirectOrderRequest.java#L18) |
| deliveryAddressId | UUID | @NotNull | [CreateDirectOrderRequest.java:19](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/CreateDirectOrderRequest.java#L19) |
| requestedDeliveryAt | Instant | @NotNull; @Future | [CreateDirectOrderRequest.java:20](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/CreateDirectOrderRequest.java#L20) |
| customerNote | String | @Size(max = 1000) | [CreateDirectOrderRequest.java:21](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/CreateDirectOrderRequest.java#L21) |


## order-service · OptionSelection

[CreateDirectOrderRequest.java:23](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/CreateDirectOrderRequest.java#L23); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| optionGroupId | UUID | @NotNull | [CreateDirectOrderRequest.java:23](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/CreateDirectOrderRequest.java#L23) |
| optionValueIds | List<@NotNull UUID> | @Size(min = 1) | [CreateDirectOrderRequest.java:23](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/CreateDirectOrderRequest.java#L23) |


## order-service · AddOnSelection

[CreateDirectOrderRequest.java:26](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/CreateDirectOrderRequest.java#L26); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| addOnId | UUID | @NotNull | [CreateDirectOrderRequest.java:26](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/CreateDirectOrderRequest.java#L26) |
| quantity | Integer | @NotNull; @Positive | [CreateDirectOrderRequest.java:26](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/CreateDirectOrderRequest.java#L26) |


## order-service · CreateOfferOrderRequest

[CreateOfferOrderRequest.java:8](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/CreateOfferOrderRequest.java#L8); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| offerId | UUID | @NotNull | [CreateOfferOrderRequest.java:9](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/CreateOfferOrderRequest.java#L9) |
| cakeRequestId | UUID | @NotNull | [CreateOfferOrderRequest.java:10](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/CreateOfferOrderRequest.java#L10) |
| customerId | UUID | @NotNull | [CreateOfferOrderRequest.java:11](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/CreateOfferOrderRequest.java#L11) |
| deliveryAddressId | UUID | @NotNull | [CreateOfferOrderRequest.java:12](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/CreateOfferOrderRequest.java#L12) |
| deliveryNote | String | @Size(max = 1000) | [CreateOfferOrderRequest.java:13](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/CreateOfferOrderRequest.java#L13) |


## order-service · OfferOrderSource

[OfferOrderSource.java:7](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OfferOrderSource.java#L7); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| offerId | UUID |  | [OfferOrderSource.java:8](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OfferOrderSource.java#L8) |
| cakeRequestId | UUID |  | [OfferOrderSource.java:9](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OfferOrderSource.java#L9) |
| customerId | UUID |  | [OfferOrderSource.java:10](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OfferOrderSource.java#L10) |
| bakeryId | UUID |  | [OfferOrderSource.java:11](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OfferOrderSource.java#L11) |
| title | String |  | [OfferOrderSource.java:12](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OfferOrderSource.java#L12) |
| description | String |  | [OfferOrderSource.java:13](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OfferOrderSource.java#L13) |
| neededAt | Instant |  | [OfferOrderSource.java:14](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OfferOrderSource.java#L14) |
| deliveryCity | String |  | [OfferOrderSource.java:15](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OfferOrderSource.java#L15) |
| deliveryDistrict | String |  | [OfferOrderSource.java:16](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OfferOrderSource.java#L16) |
| cakePrice | BigDecimal |  | [OfferOrderSource.java:17](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OfferOrderSource.java#L17) |
| deliveryFee | BigDecimal |  | [OfferOrderSource.java:18](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OfferOrderSource.java#L18) |
| addOnTotal | BigDecimal |  | [OfferOrderSource.java:19](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OfferOrderSource.java#L19) |
| totalPrice | BigDecimal |  | [OfferOrderSource.java:20](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OfferOrderSource.java#L20) |
| configuration | Map<String, Object> |  | [OfferOrderSource.java:21](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OfferOrderSource.java#L21) |
| items | List<Item> |  | [OfferOrderSource.java:22](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OfferOrderSource.java#L22) |


## order-service · Item

[OfferOrderSource.java:23](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OfferOrderSource.java#L23); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| id | UUID |  | [OfferOrderSource.java:24](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OfferOrderSource.java#L24) |
| addOnId | UUID |  | [OfferOrderSource.java:25](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OfferOrderSource.java#L25) |
| itemNameSnapshot | String |  | [OfferOrderSource.java:26](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OfferOrderSource.java#L26) |
| descriptionSnapshot | String |  | [OfferOrderSource.java:27](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OfferOrderSource.java#L27) |
| quantity | int |  | [OfferOrderSource.java:28](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OfferOrderSource.java#L28) |
| unitPrice | BigDecimal |  | [OfferOrderSource.java:29](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OfferOrderSource.java#L29) |
| lineTotal | BigDecimal |  | [OfferOrderSource.java:30](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OfferOrderSource.java#L30) |


## order-service · OrderContextResponse

[OrderContextResponse.java:7](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OrderContextResponse.java#L7); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| orderId | UUID |  | [OrderContextResponse.java:8](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OrderContextResponse.java#L8) |
| customerId | UUID |  | [OrderContextResponse.java:9](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OrderContextResponse.java#L9) |
| bakeryId | UUID |  | [OrderContextResponse.java:10](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OrderContextResponse.java#L10) |
| cakeRequestId | UUID |  | [OrderContextResponse.java:11](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OrderContextResponse.java#L11) |
| offerId | UUID |  | [OrderContextResponse.java:12](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OrderContextResponse.java#L12) |
| status | OrderStatus |  | [OrderContextResponse.java:13](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OrderContextResponse.java#L13) |
| reviewEligible | boolean |  | [OrderContextResponse.java:14](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OrderContextResponse.java#L14) |


## order-service · OrderCreationResponse

[OrderCreationResponse.java:5](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OrderCreationResponse.java#L5); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| orderId | UUID |  | [OrderCreationResponse.java:5](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OrderCreationResponse.java#L5) |
| orderNumber | String |  | [OrderCreationResponse.java:5](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OrderCreationResponse.java#L5) |
| status | String |  | [OrderCreationResponse.java:5](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OrderCreationResponse.java#L5) |


## order-service · OrderReferenceResponse

[OrderReferenceResponse.java:7](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OrderReferenceResponse.java#L7); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| orderId | UUID |  | [OrderReferenceResponse.java:7](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OrderReferenceResponse.java#L7) |
| orderNumber | String |  | [OrderReferenceResponse.java:7](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OrderReferenceResponse.java#L7) |
| status | OrderStatus |  | [OrderReferenceResponse.java:7](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OrderReferenceResponse.java#L7) |


## order-service · OrderResponse

[OrderResponse.java:12](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OrderResponse.java#L12); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| id | UUID |  | [OrderResponse.java:13](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OrderResponse.java#L13) |
| orderNumber | String |  | [OrderResponse.java:14](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OrderResponse.java#L14) |
| customerId | UUID |  | [OrderResponse.java:15](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OrderResponse.java#L15) |
| bakeryId | UUID |  | [OrderResponse.java:16](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OrderResponse.java#L16) |
| cakeRequestId | UUID |  | [OrderResponse.java:17](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OrderResponse.java#L17) |
| offerId | UUID |  | [OrderResponse.java:18](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OrderResponse.java#L18) |
| orderSource | OrderSource |  | [OrderResponse.java:19](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OrderResponse.java#L19) |
| customerName | String |  | [OrderResponse.java:20](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OrderResponse.java#L20) |
| customerPhone | String |  | [OrderResponse.java:21](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OrderResponse.java#L21) |
| bakeryName | String |  | [OrderResponse.java:22](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OrderResponse.java#L22) |
| customerNote | String |  | [OrderResponse.java:23](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OrderResponse.java#L23) |
| subtotal | BigDecimal |  | [OrderResponse.java:24](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OrderResponse.java#L24) |
| deliveryFee | BigDecimal |  | [OrderResponse.java:25](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OrderResponse.java#L25) |
| totalAmount | BigDecimal |  | [OrderResponse.java:26](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OrderResponse.java#L26) |
| currency | String |  | [OrderResponse.java:27](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OrderResponse.java#L27) |
| status | OrderStatus |  | [OrderResponse.java:28](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OrderResponse.java#L28) |
| neededAt | Instant |  | [OrderResponse.java:29](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OrderResponse.java#L29) |
| acceptedAt | Instant |  | [OrderResponse.java:30](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OrderResponse.java#L30) |
| completedAt | Instant |  | [OrderResponse.java:31](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OrderResponse.java#L31) |
| createdAt | Instant |  | [OrderResponse.java:32](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OrderResponse.java#L32) |
| updatedAt | Instant |  | [OrderResponse.java:33](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OrderResponse.java#L33) |
| items | List<OrderItemResponse> |  | [OrderResponse.java:34](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OrderResponse.java#L34) |
| deliveryAddress | DeliveryAddressResponse |  | [OrderResponse.java:35](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OrderResponse.java#L35) |
| statusHistory | List<OrderStatusHistoryResponse> |  | [OrderResponse.java:36](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OrderResponse.java#L36) |
| review | ReviewResponse |  | [OrderResponse.java:37](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OrderResponse.java#L37) |


## order-service · OrderItemResponse

[OrderResponse.java:39](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OrderResponse.java#L39); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| id | UUID |  | [OrderResponse.java:40](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OrderResponse.java#L40) |
| sourceProductId | UUID |  | [OrderResponse.java:41](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OrderResponse.java#L41) |
| sourceOfferItemId | UUID |  | [OrderResponse.java:42](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OrderResponse.java#L42) |
| itemType | String |  | [OrderResponse.java:43](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OrderResponse.java#L43) |
| name | String |  | [OrderResponse.java:44](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OrderResponse.java#L44) |
| description | String |  | [OrderResponse.java:45](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OrderResponse.java#L45) |
| configuration | Object |  | [OrderResponse.java:46](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OrderResponse.java#L46) |
| quantity | int |  | [OrderResponse.java:47](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OrderResponse.java#L47) |
| unitPrice | BigDecimal |  | [OrderResponse.java:48](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OrderResponse.java#L48) |
| lineTotal | BigDecimal |  | [OrderResponse.java:49](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OrderResponse.java#L49) |


## order-service · DeliveryAddressResponse

[OrderResponse.java:53](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OrderResponse.java#L53); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| recipientName | String |  | [OrderResponse.java:54](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OrderResponse.java#L54) |
| recipientPhone | String |  | [OrderResponse.java:55](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OrderResponse.java#L55) |
| addressLine | String |  | [OrderResponse.java:56](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OrderResponse.java#L56) |
| ward | String |  | [OrderResponse.java:57](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OrderResponse.java#L57) |
| district | String |  | [OrderResponse.java:58](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OrderResponse.java#L58) |
| city | String |  | [OrderResponse.java:59](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OrderResponse.java#L59) |
| latitude | BigDecimal |  | [OrderResponse.java:60](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OrderResponse.java#L60) |
| longitude | BigDecimal |  | [OrderResponse.java:61](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OrderResponse.java#L61) |
| deliveryNote | String |  | [OrderResponse.java:62](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OrderResponse.java#L62) |


## order-service · OrderStatusHistoryResponse

[OrderResponse.java:66](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OrderResponse.java#L66); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| fromStatus | String |  | [OrderResponse.java:67](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OrderResponse.java#L67) |
| toStatus | String |  | [OrderResponse.java:68](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OrderResponse.java#L68) |
| changedBy | UUID |  | [OrderResponse.java:69](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OrderResponse.java#L69) |
| note | String |  | [OrderResponse.java:70](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OrderResponse.java#L70) |
| changedAt | Instant |  | [OrderResponse.java:71](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OrderResponse.java#L71) |


## order-service · OrderSummaryResponse

[OrderSummaryResponse.java:10](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OrderSummaryResponse.java#L10); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| id | UUID |  | [OrderSummaryResponse.java:11](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OrderSummaryResponse.java#L11) |
| orderNumber | String |  | [OrderSummaryResponse.java:12](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OrderSummaryResponse.java#L12) |
| customerId | UUID |  | [OrderSummaryResponse.java:13](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OrderSummaryResponse.java#L13) |
| bakeryId | UUID |  | [OrderSummaryResponse.java:14](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OrderSummaryResponse.java#L14) |
| bakeryName | String |  | [OrderSummaryResponse.java:15](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OrderSummaryResponse.java#L15) |
| orderSource | OrderSource |  | [OrderSummaryResponse.java:16](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OrderSummaryResponse.java#L16) |
| status | OrderStatus |  | [OrderSummaryResponse.java:17](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OrderSummaryResponse.java#L17) |
| totalAmount | BigDecimal |  | [OrderSummaryResponse.java:18](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OrderSummaryResponse.java#L18) |
| currency | String |  | [OrderSummaryResponse.java:19](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OrderSummaryResponse.java#L19) |
| neededAt | Instant |  | [OrderSummaryResponse.java:20](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OrderSummaryResponse.java#L20) |
| createdAt | Instant |  | [OrderSummaryResponse.java:21](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/OrderSummaryResponse.java#L21) |


## order-service · TransitionOrderRequest

[TransitionOrderRequest.java:7](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/TransitionOrderRequest.java#L7); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| targetStatus | OrderStatus | @NotNull | [TransitionOrderRequest.java:8](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/TransitionOrderRequest.java#L8) |
| reason | String | @Size(max = 1000) | [TransitionOrderRequest.java:9](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/dto/TransitionOrderRequest.java#L9) |


## order-service · InternalOrderController

[InternalOrderController.java:14](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/InternalOrderController.java#L14); class_declaration. `@RestController`, `@RequestMapping("/internal/v1/orders")`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| orderManagementService | OrderManagementService |  | [InternalOrderController.java:18](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/InternalOrderController.java#L18) |


## order-service · InvalidOrderRequestException

[InvalidOrderRequestException.java:3](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/InvalidOrderRequestException.java#L3); class_declaration. 

## order-service · OfferOrderController

[OfferOrderController.java:10](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OfferOrderController.java#L10); class_declaration. `@RestController`, `@RequestMapping("/internal/v1/orders")`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| service | OfferOrderService |  | [OfferOrderController.java:13](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OfferOrderController.java#L13) |


## order-service · OfferOrderRepository

[OfferOrderRepository.java:17](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OfferOrderRepository.java#L17); class_declaration. `@Repository`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| jdbc | JdbcClient |  | [OfferOrderRepository.java:19](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OfferOrderRepository.java#L19) |
| json | ObjectMapper |  | [OfferOrderRepository.java:20](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OfferOrderRepository.java#L20) |


## order-service · OfferOrderService

[OfferOrderService.java:5](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OfferOrderService.java#L5); interface_declaration. 

## order-service · Creation

[OfferOrderService.java:6](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OfferOrderService.java#L6); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| response | OrderCreationResponse |  | [OfferOrderService.java:6](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OfferOrderService.java#L6) |
| created | boolean |  | [OfferOrderService.java:6](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OfferOrderService.java#L6) |


## order-service · OfferOrderServiceImpl

[OfferOrderServiceImpl.java:14](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OfferOrderServiceImpl.java#L14); class_declaration. `@Service`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| repository | OfferOrderRepository |  | [OfferOrderServiceImpl.java:16](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OfferOrderServiceImpl.java#L16) |
| http | ServiceHttpClient |  | [OfferOrderServiceImpl.java:17](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OfferOrderServiceImpl.java#L17) |


## order-service · OrderAccessDeniedException

[OrderAccessDeniedException.java:3](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OrderAccessDeniedException.java#L3); class_declaration. 

## order-service · OrderAuthenticationRequiredException

[OrderAuthenticationRequiredException.java:3](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OrderAuthenticationRequiredException.java#L3); class_declaration. 

## order-service · OrderAuthorizationContext

[OrderAuthorizationContext.java:5](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OrderAuthorizationContext.java#L5); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| customerId | UUID |  | [OrderAuthorizationContext.java:5](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OrderAuthorizationContext.java#L5) |
| bakeryId | UUID |  | [OrderAuthorizationContext.java:5](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OrderAuthorizationContext.java#L5) |


## order-service · OrderConflictException

[OrderConflictException.java:3](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OrderConflictException.java#L3); class_declaration. 

## order-service · OrderController

[OrderController.java:32](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OrderController.java#L32); class_declaration. `@RestController`, `@Validated`, `@RequestMapping("/api/v1/orders")`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| orderCreationService | OrderCreationService |  | [OrderController.java:37](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OrderController.java#L37) |
| orderManagementService | OrderManagementService |  | [OrderController.java:38](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OrderController.java#L38) |


## order-service · OrderCreationResult

[OrderCreationResult.java:5](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OrderCreationResult.java#L5); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| order | OrderResponse |  | [OrderCreationResult.java:5](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OrderCreationResult.java#L5) |
| replayed | boolean |  | [OrderCreationResult.java:5](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OrderCreationResult.java#L5) |


## order-service · OrderCreationService

[OrderCreationService.java:8](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OrderCreationService.java#L8); interface_declaration. 

## order-service · OrderCreationServiceImpl

[OrderCreationServiceImpl.java:24](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OrderCreationServiceImpl.java#L24); class_declaration. `@Service`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| DIRECT_OPERATION | String |  | [OrderCreationServiceImpl.java:27](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OrderCreationServiceImpl.java#L27) |
| OFFER_OPERATION | String |  | [OrderCreationServiceImpl.java:28](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OrderCreationServiceImpl.java#L28) |
| persistenceService | OrderPersistenceService |  | [OrderCreationServiceImpl.java:30](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OrderCreationServiceImpl.java#L30) |
| identityClient | IdentityServiceClient |  | [OrderCreationServiceImpl.java:31](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OrderCreationServiceImpl.java#L31) |
| bakeryClient | BakeryServiceClient |  | [OrderCreationServiceImpl.java:32](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OrderCreationServiceImpl.java#L32) |
| marketplaceClient | MarketplaceServiceClient |  | [OrderCreationServiceImpl.java:33](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OrderCreationServiceImpl.java#L33) |
| clock | Clock |  | [OrderCreationServiceImpl.java:34](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OrderCreationServiceImpl.java#L34) |


## order-service · OrderIdempotencyRecord

[OrderIdempotencyRecord.java:17](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OrderIdempotencyRecord.java#L17); class_declaration. `@Entity`, `@Table(name = "order_idempotency_records", uniqueConstraints = @UniqueConstraint(
        name = "uq_order_idempotency_records_operation_customer_key",
        columnNames = {"operation", "customer_id", "idempotency_key"}))`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| id | UUID | @Id; @UuidGenerator | [OrderIdempotencyRecord.java:23](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OrderIdempotencyRecord.java#L23) |
| operation | String | @Column(name = "operation", nullable = false, length = 40) | [OrderIdempotencyRecord.java:27](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OrderIdempotencyRecord.java#L27) |
| idempotencyKey | UUID | @Column(name = "idempotency_key", nullable = false) | [OrderIdempotencyRecord.java:30](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OrderIdempotencyRecord.java#L30) |
| customerId | UUID | @Column(name = "customer_id", nullable = false) | [OrderIdempotencyRecord.java:33](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OrderIdempotencyRecord.java#L33) |
| payloadHash | String | @Column(name = "payload_hash", nullable = false, length = 64) | [OrderIdempotencyRecord.java:36](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OrderIdempotencyRecord.java#L36) |
| customerOrder | CustomerOrder | @ManyToOne(fetch = FetchType.LAZY, optional = false); @JoinColumn(name = "order_id", nullable = false, foreignKey = @ForeignKey(name = "fk_order_idempotency_records_order")) | [OrderIdempotencyRecord.java:39](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OrderIdempotencyRecord.java#L39) |
| createdAt | Instant | @Column(name = "created_at", nullable = false) | [OrderIdempotencyRecord.java:43](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OrderIdempotencyRecord.java#L43) |


## order-service · OrderIdempotencyRepository

[OrderIdempotencyRepository.java:8](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OrderIdempotencyRepository.java#L8); interface_declaration. 

## order-service · OrderItem

[OrderItem.java:20](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OrderItem.java#L20); class_declaration. `@Entity`, `@Table(name = "order_items")`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| id | UUID | @Id; @UuidGenerator | [OrderItem.java:24](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OrderItem.java#L24) |
| customerOrder | CustomerOrder | @ManyToOne(fetch = FetchType.LAZY, optional = false); @JoinColumn(name = "order_id", nullable = false) | [OrderItem.java:28](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OrderItem.java#L28) |
| sourceProductId | UUID | @Column(name = "source_product_id") | [OrderItem.java:32](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OrderItem.java#L32) |
| sourceOfferItemId | UUID | @Column(name = "source_offer_item_id") | [OrderItem.java:35](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OrderItem.java#L35) |
| itemType | OrderItemType | @Enumerated(EnumType.STRING); @Column(name = "item_type", nullable = false, length = 30) | [OrderItem.java:38](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OrderItem.java#L38) |
| nameSnapshot | String | @Column(name = "name_snapshot", nullable = false, length = 180) | [OrderItem.java:42](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OrderItem.java#L42) |
| descriptionSnapshot | String | @Column(name = "description_snapshot") | [OrderItem.java:45](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OrderItem.java#L45) |
| configurationSnapshot | Map<String, Object> | @JdbcTypeCode(SqlTypes.JSON); @Column(name = "configuration_snapshot", nullable = false, columnDefinition = "jsonb") | [OrderItem.java:48](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OrderItem.java#L48) |
| quantity | int | @Column(name = "quantity", nullable = false) | [OrderItem.java:52](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OrderItem.java#L52) |
| unitPrice | BigDecimal | @Column(name = "unit_price", nullable = false, precision = 12, scale = 2) | [OrderItem.java:55](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OrderItem.java#L55) |
| lineTotal | BigDecimal | @Column(name = "line_total", nullable = false, precision = 12, scale = 2) | [OrderItem.java:58](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OrderItem.java#L58) |


## order-service · OrderItemRepository

[OrderItemRepository.java:8](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OrderItemRepository.java#L8); interface_declaration. 

## order-service · OrderItemType

[OrderItemType.java:3](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OrderItemType.java#L3); enum_declaration. 

Enum: `CAKE`, `ADD_ON`, `SERVICE`

## order-service · OrderManagementService

[OrderManagementService.java:12](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OrderManagementService.java#L12); interface_declaration. 

## order-service · OrderManagementServiceImpl

[OrderManagementServiceImpl.java:19](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OrderManagementServiceImpl.java#L19); class_declaration. `@Service`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| ADMIN_ROLE | String |  | [OrderManagementServiceImpl.java:22](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OrderManagementServiceImpl.java#L22) |
| BAKERY_ROLES | Set<String> |  | [OrderManagementServiceImpl.java:23](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OrderManagementServiceImpl.java#L23) |
| persistenceService | OrderQueryPersistenceService |  | [OrderManagementServiceImpl.java:25](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OrderManagementServiceImpl.java#L25) |
| bakeryClient | BakeryServiceClient |  | [OrderManagementServiceImpl.java:26](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OrderManagementServiceImpl.java#L26) |


## order-service · OrderNotFoundException

[OrderNotFoundException.java:3](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OrderNotFoundException.java#L3); class_declaration. 

## order-service · OrderPersistenceService

[OrderPersistenceService.java:12](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OrderPersistenceService.java#L12); class_declaration. `@Service`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| customerOrderRepository | CustomerOrderRepository |  | [OrderPersistenceService.java:15](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OrderPersistenceService.java#L15) |
| idempotencyRepository | OrderIdempotencyRepository |  | [OrderPersistenceService.java:16](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OrderPersistenceService.java#L16) |


## order-service · OrderQueryPersistenceService

[OrderQueryPersistenceService.java:16](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OrderQueryPersistenceService.java#L16); class_declaration. `@Service`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| orderRepository | CustomerOrderRepository |  | [OrderQueryPersistenceService.java:19](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OrderQueryPersistenceService.java#L19) |


## order-service · OrderResponseMapper

[OrderResponseMapper.java:9](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OrderResponseMapper.java#L9); class_declaration. 

## order-service · OrderSource

[OrderSource.java:3](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OrderSource.java#L3); enum_declaration. 

Enum: `DIRECT_CATALOG`, `ACCEPTED_OFFER`

## order-service · OrderStatus

[OrderStatus.java:3](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OrderStatus.java#L3); enum_declaration. 

Enum: `PENDING`, `CONFIRMED`, `BAKING`, `READY`, `DELIVERING`, `COMPLETED`, `CANCELLED`

## order-service · OrderStatusHistory

[OrderStatusHistory.java:17](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OrderStatusHistory.java#L17); class_declaration. `@Entity`, `@Table(name = "order_status_history")`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| id | UUID | @Id; @UuidGenerator | [OrderStatusHistory.java:21](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OrderStatusHistory.java#L21) |
| customerOrder | CustomerOrder | @ManyToOne(fetch = FetchType.LAZY, optional = false); @JoinColumn(name = "order_id", nullable = false) | [OrderStatusHistory.java:25](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OrderStatusHistory.java#L25) |
| fromStatus | OrderStatus | @Enumerated(EnumType.STRING); @Column(name = "from_status", length = 30) | [OrderStatusHistory.java:29](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OrderStatusHistory.java#L29) |
| toStatus | OrderStatus | @Enumerated(EnumType.STRING); @Column(name = "to_status", nullable = false, length = 30) | [OrderStatusHistory.java:33](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OrderStatusHistory.java#L33) |
| changedBy | UUID | @Column(name = "changed_by", nullable = false) | [OrderStatusHistory.java:37](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OrderStatusHistory.java#L37) |
| note | String | @Column(name = "note") | [OrderStatusHistory.java:40](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OrderStatusHistory.java#L40) |
| changedAt | Instant | @Column(name = "changed_at", nullable = false) | [OrderStatusHistory.java:43](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OrderStatusHistory.java#L43) |


## order-service · OrderStatusHistoryRepository

[OrderStatusHistoryRepository.java:8](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OrderStatusHistoryRepository.java#L8); interface_declaration. 

## order-service · CreateReviewRequest

[CreateReviewRequest.java:7](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/review/dto/CreateReviewRequest.java#L7); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| rating | int | @Min(1); @Max(5) | [CreateReviewRequest.java:8](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/review/dto/CreateReviewRequest.java#L8) |
| comment | String | @Size(max = 5000) | [CreateReviewRequest.java:9](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/review/dto/CreateReviewRequest.java#L9) |


## order-service · ReviewResponse

[ReviewResponse.java:8](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/review/dto/ReviewResponse.java#L8); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| orderId | UUID |  | [ReviewResponse.java:9](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/review/dto/ReviewResponse.java#L9) |
| customerId | UUID |  | [ReviewResponse.java:10](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/review/dto/ReviewResponse.java#L10) |
| rating | short |  | [ReviewResponse.java:11](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/review/dto/ReviewResponse.java#L11) |
| comment | String |  | [ReviewResponse.java:12](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/review/dto/ReviewResponse.java#L12) |
| status | ReviewStatus |  | [ReviewResponse.java:13](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/review/dto/ReviewResponse.java#L13) |
| createdAt | Instant |  | [ReviewResponse.java:14](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/review/dto/ReviewResponse.java#L14) |
| updatedAt | Instant |  | [ReviewResponse.java:15](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/review/dto/ReviewResponse.java#L15) |


## order-service · UpdateReviewRequest

[UpdateReviewRequest.java:7](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/review/dto/UpdateReviewRequest.java#L7); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| rating | int | @Min(1); @Max(5) | [UpdateReviewRequest.java:8](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/review/dto/UpdateReviewRequest.java#L8) |
| comment | String | @Size(max = 5000) | [UpdateReviewRequest.java:9](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/review/dto/UpdateReviewRequest.java#L9) |


## order-service · UpdateReviewStatusRequest

[UpdateReviewStatusRequest.java:6](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/review/dto/UpdateReviewStatusRequest.java#L6); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| status | ReviewStatus | @NotNull | [UpdateReviewStatusRequest.java:6](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/review/dto/UpdateReviewStatusRequest.java#L6) |


## order-service · OrderReview

[OrderReview.java:20](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/review/OrderReview.java#L20); class_declaration. `@Entity`, `@Table(name = "order_reviews")`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| id | UUID | @Id; @Column(name = "order_id") | [OrderReview.java:24](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/review/OrderReview.java#L24) |
| customerOrder | CustomerOrder | @MapsId; @OneToOne(fetch = FetchType.LAZY, optional = false); @JoinColumn(name = "order_id", nullable = false) | [OrderReview.java:28](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/review/OrderReview.java#L28) |
| customerId | UUID | @Column(name = "customer_id", nullable = false) | [OrderReview.java:33](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/review/OrderReview.java#L33) |
| rating | short | @Column(name = "rating", nullable = false) | [OrderReview.java:36](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/review/OrderReview.java#L36) |
| comment | String | @Column(name = "comment") | [OrderReview.java:39](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/review/OrderReview.java#L39) |
| status | ReviewStatus | @Enumerated(EnumType.STRING); @Column(name = "status", nullable = false, length = 30) | [OrderReview.java:42](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/review/OrderReview.java#L42) |
| createdAt | Instant | @Column(name = "created_at", nullable = false) | [OrderReview.java:46](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/review/OrderReview.java#L46) |
| updatedAt | Instant | @Column(name = "updated_at", nullable = false) | [OrderReview.java:49](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/review/OrderReview.java#L49) |
| version | long | @Version; @Column(name = "version", nullable = false) | [OrderReview.java:52](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/review/OrderReview.java#L52) |


## order-service · OrderReviewRepository

[OrderReviewRepository.java:8](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/review/OrderReviewRepository.java#L8); interface_declaration. 

## order-service · ReviewController

[ReviewController.java:25](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/review/ReviewController.java#L25); class_declaration. `@RestController`, `@RequestMapping("/api/v1")`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| reviewService | ReviewService |  | [ReviewController.java:29](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/review/ReviewController.java#L29) |


## order-service · ReviewNotFoundException

[ReviewNotFoundException.java:3](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/review/ReviewNotFoundException.java#L3); class_declaration. 

## order-service · ReviewService

[ReviewService.java:9](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/review/ReviewService.java#L9); interface_declaration. 

## order-service · ReviewServiceImpl

[ReviewServiceImpl.java:20](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/review/ReviewServiceImpl.java#L20); class_declaration. `@Service`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| orderRepository | CustomerOrderRepository |  | [ReviewServiceImpl.java:23](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/review/ReviewServiceImpl.java#L23) |
| reviewRepository | OrderReviewRepository |  | [ReviewServiceImpl.java:24](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/review/ReviewServiceImpl.java#L24) |
| clock | Clock |  | [ReviewServiceImpl.java:25](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/review/ReviewServiceImpl.java#L25) |


## order-service · ReviewStatus

[ReviewStatus.java:3](../../../backend/order-service/src/main/java/com/se193262/orderservice/feature/review/ReviewStatus.java#L3); enum_declaration. 

Enum: `PUBLISHED`, `HIDDEN`, `DELETED`

## order-service · BakeryClient

[BakeryClient.java:16](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/BakeryClient.java#L16); interface_declaration. `@HttpExchange("/internal/v1")`

## order-service · BakeryResponse

[BakeryClient.java:32](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/BakeryClient.java#L32); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| id | UUID |  | [BakeryClient.java:33](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/BakeryClient.java#L33) |
| name | String |  | [BakeryClient.java:34](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/BakeryClient.java#L34) |
| status | String |  | [BakeryClient.java:35](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/BakeryClient.java#L35) |
| primaryAddress | BakeryAddress |  | [BakeryClient.java:36](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/BakeryClient.java#L36) |
| serviceAreas | List<ServiceArea> |  | [BakeryClient.java:37](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/BakeryClient.java#L37) |


## order-service · BakeryAddress

[BakeryClient.java:41](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/BakeryClient.java#L41); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| district | String |  | [BakeryClient.java:41](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/BakeryClient.java#L41) |
| city | String |  | [BakeryClient.java:41](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/BakeryClient.java#L41) |


## order-service · ServiceArea

[BakeryClient.java:44](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/BakeryClient.java#L44); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| district | String |  | [BakeryClient.java:44](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/BakeryClient.java#L44) |
| city | String |  | [BakeryClient.java:44](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/BakeryClient.java#L44) |
| deliveryFee | BigDecimal |  | [BakeryClient.java:44](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/BakeryClient.java#L44) |
| active | boolean |  | [BakeryClient.java:44](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/BakeryClient.java#L44) |


## order-service · MembershipAuthorizationResponse

[BakeryClient.java:47](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/BakeryClient.java#L47); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| bakeryId | UUID |  | [BakeryClient.java:48](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/BakeryClient.java#L48) |
| userId | UUID |  | [BakeryClient.java:49](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/BakeryClient.java#L49) |
| active | boolean |  | [BakeryClient.java:50](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/BakeryClient.java#L50) |
| memberRole | String |  | [BakeryClient.java:51](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/BakeryClient.java#L51) |
| authorized | boolean |  | [BakeryClient.java:52](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/BakeryClient.java#L52) |


## order-service · CatalogQuoteRequest

[BakeryClient.java:56](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/BakeryClient.java#L56); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| bakeryId | UUID |  | [BakeryClient.java:57](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/BakeryClient.java#L57) |
| productId | UUID |  | [BakeryClient.java:58](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/BakeryClient.java#L58) |
| quantity | int |  | [BakeryClient.java:59](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/BakeryClient.java#L59) |
| optionSelections | List<OptionSelection> |  | [BakeryClient.java:60](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/BakeryClient.java#L60) |
| addOns | List<AddOnSelection> |  | [BakeryClient.java:61](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/BakeryClient.java#L61) |
| deliveryDistrict | String |  | [BakeryClient.java:62](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/BakeryClient.java#L62) |
| deliveryCity | String |  | [BakeryClient.java:63](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/BakeryClient.java#L63) |


## order-service · OptionSelection

[BakeryClient.java:67](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/BakeryClient.java#L67); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| optionGroupId | UUID |  | [BakeryClient.java:67](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/BakeryClient.java#L67) |
| optionValueIds | List<UUID> |  | [BakeryClient.java:67](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/BakeryClient.java#L67) |


## order-service · AddOnSelection

[BakeryClient.java:70](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/BakeryClient.java#L70); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| addOnId | UUID |  | [BakeryClient.java:70](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/BakeryClient.java#L70) |
| quantity | int |  | [BakeryClient.java:70](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/BakeryClient.java#L70) |


## order-service · CatalogQuoteResponse

[BakeryClient.java:73](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/BakeryClient.java#L73); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| quoteId | UUID |  | [BakeryClient.java:74](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/BakeryClient.java#L74) |
| bakeryId | UUID |  | [BakeryClient.java:75](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/BakeryClient.java#L75) |
| bakeryName | String |  | [BakeryClient.java:76](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/BakeryClient.java#L76) |
| productId | UUID |  | [BakeryClient.java:77](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/BakeryClient.java#L77) |
| productName | String |  | [BakeryClient.java:78](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/BakeryClient.java#L78) |
| productDescription | String |  | [BakeryClient.java:79](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/BakeryClient.java#L79) |
| quantity | int |  | [BakeryClient.java:80](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/BakeryClient.java#L80) |
| items | List<QuotedItem> |  | [BakeryClient.java:81](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/BakeryClient.java#L81) |
| subtotal | BigDecimal |  | [BakeryClient.java:82](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/BakeryClient.java#L82) |
| deliveryFee | BigDecimal |  | [BakeryClient.java:83](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/BakeryClient.java#L83) |
| totalAmount | BigDecimal |  | [BakeryClient.java:84](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/BakeryClient.java#L84) |
| minimumNoticeHours | int |  | [BakeryClient.java:85](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/BakeryClient.java#L85) |
| expiresAt | Instant |  | [BakeryClient.java:86](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/BakeryClient.java#L86) |


## order-service · QuotedItem

[BakeryClient.java:90](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/BakeryClient.java#L90); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| sourceId | UUID |  | [BakeryClient.java:91](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/BakeryClient.java#L91) |
| itemType | String |  | [BakeryClient.java:92](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/BakeryClient.java#L92) |
| name | String |  | [BakeryClient.java:93](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/BakeryClient.java#L93) |
| description | String |  | [BakeryClient.java:94](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/BakeryClient.java#L94) |
| quantity | int |  | [BakeryClient.java:95](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/BakeryClient.java#L95) |
| unitPrice | BigDecimal |  | [BakeryClient.java:96](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/BakeryClient.java#L96) |
| lineTotal | BigDecimal |  | [BakeryClient.java:97](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/BakeryClient.java#L97) |
| configuration | Map<String, Object> |  | [BakeryClient.java:98](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/BakeryClient.java#L98) |


## order-service · BakeryServiceClient

[BakeryServiceClient.java:5](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/BakeryServiceClient.java#L5); class_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| delegate | BakeryClient |  | [BakeryServiceClient.java:7](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/BakeryServiceClient.java#L7) |
| executor | RemoteClientExecutor |  | [BakeryServiceClient.java:8](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/BakeryServiceClient.java#L8) |


## order-service · IdentityClient

[IdentityClient.java:11](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/IdentityClient.java#L11); interface_declaration. `@HttpExchange("/internal/v1/users")`

## order-service · UserResponse

[IdentityClient.java:20](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/IdentityClient.java#L20); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| id | UUID |  | [IdentityClient.java:21](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/IdentityClient.java#L21) |
| email | String |  | [IdentityClient.java:22](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/IdentityClient.java#L22) |
| displayName | String |  | [IdentityClient.java:23](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/IdentityClient.java#L23) |
| phoneNumber | String |  | [IdentityClient.java:24](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/IdentityClient.java#L24) |
| status | String |  | [IdentityClient.java:25](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/IdentityClient.java#L25) |
| roles | List<String> |  | [IdentityClient.java:26](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/IdentityClient.java#L26) |


## order-service · AddressResponse

[IdentityClient.java:30](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/IdentityClient.java#L30); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| id | UUID |  | [IdentityClient.java:31](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/IdentityClient.java#L31) |
| label | String |  | [IdentityClient.java:32](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/IdentityClient.java#L32) |
| recipientName | String |  | [IdentityClient.java:33](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/IdentityClient.java#L33) |
| recipientPhone | String |  | [IdentityClient.java:34](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/IdentityClient.java#L34) |
| addressLine | String |  | [IdentityClient.java:35](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/IdentityClient.java#L35) |
| ward | String |  | [IdentityClient.java:36](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/IdentityClient.java#L36) |
| district | String |  | [IdentityClient.java:37](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/IdentityClient.java#L37) |
| city | String |  | [IdentityClient.java:38](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/IdentityClient.java#L38) |
| latitude | BigDecimal |  | [IdentityClient.java:39](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/IdentityClient.java#L39) |
| longitude | BigDecimal |  | [IdentityClient.java:40](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/IdentityClient.java#L40) |


## order-service · IdentityServiceClient

[IdentityServiceClient.java:5](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/IdentityServiceClient.java#L5); class_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| delegate | IdentityClient |  | [IdentityServiceClient.java:7](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/IdentityServiceClient.java#L7) |
| executor | RemoteClientExecutor |  | [IdentityServiceClient.java:8](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/IdentityServiceClient.java#L8) |


## order-service · MarketplaceClient

[MarketplaceClient.java:13](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/MarketplaceClient.java#L13); interface_declaration. `@HttpExchange("/internal/v1")`

## order-service · AcceptedOfferOrderSourceResponse

[MarketplaceClient.java:19](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/MarketplaceClient.java#L19); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| offerId | UUID |  | [MarketplaceClient.java:20](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/MarketplaceClient.java#L20) |
| cakeRequestId | UUID |  | [MarketplaceClient.java:21](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/MarketplaceClient.java#L21) |
| customerId | UUID |  | [MarketplaceClient.java:22](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/MarketplaceClient.java#L22) |
| bakeryId | UUID |  | [MarketplaceClient.java:23](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/MarketplaceClient.java#L23) |
| customerName | String |  | [MarketplaceClient.java:24](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/MarketplaceClient.java#L24) |
| customerPhone | String |  | [MarketplaceClient.java:25](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/MarketplaceClient.java#L25) |
| bakeryName | String |  | [MarketplaceClient.java:26](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/MarketplaceClient.java#L26) |
| items | List<OfferItemSnapshot> |  | [MarketplaceClient.java:27](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/MarketplaceClient.java#L27) |
| subtotal | BigDecimal |  | [MarketplaceClient.java:28](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/MarketplaceClient.java#L28) |
| deliveryFee | BigDecimal |  | [MarketplaceClient.java:29](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/MarketplaceClient.java#L29) |
| totalAmount | BigDecimal |  | [MarketplaceClient.java:30](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/MarketplaceClient.java#L30) |
| requestedDeliveryAt | Instant |  | [MarketplaceClient.java:31](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/MarketplaceClient.java#L31) |


## order-service · OfferItemSnapshot

[MarketplaceClient.java:35](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/MarketplaceClient.java#L35); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| sourceOfferItemId | UUID |  | [MarketplaceClient.java:36](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/MarketplaceClient.java#L36) |
| itemType | String |  | [MarketplaceClient.java:37](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/MarketplaceClient.java#L37) |
| name | String |  | [MarketplaceClient.java:38](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/MarketplaceClient.java#L38) |
| description | String |  | [MarketplaceClient.java:39](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/MarketplaceClient.java#L39) |
| quantity | int |  | [MarketplaceClient.java:40](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/MarketplaceClient.java#L40) |
| unitPrice | BigDecimal |  | [MarketplaceClient.java:41](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/MarketplaceClient.java#L41) |
| lineTotal | BigDecimal |  | [MarketplaceClient.java:42](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/MarketplaceClient.java#L42) |
| configuration | Map<String, Object> |  | [MarketplaceClient.java:43](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/MarketplaceClient.java#L43) |


## order-service · MarketplaceServiceClient

[MarketplaceServiceClient.java:5](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/MarketplaceServiceClient.java#L5); class_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| delegate | MarketplaceClient |  | [MarketplaceServiceClient.java:7](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/MarketplaceServiceClient.java#L7) |
| executor | RemoteClientExecutor |  | [MarketplaceServiceClient.java:8](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/MarketplaceServiceClient.java#L8) |


## order-service · RemoteClientExecutor

[RemoteClientExecutor.java:8](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/RemoteClientExecutor.java#L8); class_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| serviceName | String |  | [RemoteClientExecutor.java:10](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/RemoteClientExecutor.java#L10) |


## order-service · RemoteServiceException

[RemoteServiceException.java:3](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/RemoteServiceException.java#L3); class_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| serviceName | String |  | [RemoteServiceException.java:5](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/RemoteServiceException.java#L5) |
| remoteStatus | Integer |  | [RemoteServiceException.java:6](../../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/RemoteServiceException.java#L6) |


## order-service · OrderServiceApplication

[OrderServiceApplication.java:10](../../../backend/order-service/src/main/java/com/se193262/orderservice/OrderServiceApplication.java#L10); class_declaration. `@SpringBootApplication`, `@Import(OrderPlatformClientConfiguration.class)`, `@EnableScheduling`

## order-service · ApiResponse

[ApiResponse.java:5](../../../backend/order-service/src/main/java/com/se193262/orderservice/shared/dto/ApiResponse.java#L5); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| statusCode | int |  | [ApiResponse.java:5](../../../backend/order-service/src/main/java/com/se193262/orderservice/shared/dto/ApiResponse.java#L5) |
| message | String |  | [ApiResponse.java:5](../../../backend/order-service/src/main/java/com/se193262/orderservice/shared/dto/ApiResponse.java#L5) |
| data | T |  | [ApiResponse.java:5](../../../backend/order-service/src/main/java/com/se193262/orderservice/shared/dto/ApiResponse.java#L5) |
| timestamp | Instant |  | [ApiResponse.java:5](../../../backend/order-service/src/main/java/com/se193262/orderservice/shared/dto/ApiResponse.java#L5) |


## order-service · PageResult

[PageResult.java:5](../../../backend/order-service/src/main/java/com/se193262/orderservice/shared/dto/PageResult.java#L5); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| meta | Meta |  | [PageResult.java:5](../../../backend/order-service/src/main/java/com/se193262/orderservice/shared/dto/PageResult.java#L5) |
| result | List<T> |  | [PageResult.java:5](../../../backend/order-service/src/main/java/com/se193262/orderservice/shared/dto/PageResult.java#L5) |


## order-service · Meta

[PageResult.java:7](../../../backend/order-service/src/main/java/com/se193262/orderservice/shared/dto/PageResult.java#L7); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| page | int |  | [PageResult.java:7](../../../backend/order-service/src/main/java/com/se193262/orderservice/shared/dto/PageResult.java#L7) |
| pageSize | int |  | [PageResult.java:7](../../../backend/order-service/src/main/java/com/se193262/orderservice/shared/dto/PageResult.java#L7) |
| pages | int |  | [PageResult.java:7](../../../backend/order-service/src/main/java/com/se193262/orderservice/shared/dto/PageResult.java#L7) |
| total | long |  | [PageResult.java:7](../../../backend/order-service/src/main/java/com/se193262/orderservice/shared/dto/PageResult.java#L7) |


## platform-support · ServiceHttpClient

[ServiceHttpClient.java:13](../../../backend/platform-support/src/main/java/com/se193262/platform/client/ServiceHttpClient.java#L13); class_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| properties | RemoteProperties |  | [ServiceHttpClient.java:14](../../../backend/platform-support/src/main/java/com/se193262/platform/client/ServiceHttpClient.java#L14) |
| client | RestClient |  | [ServiceHttpClient.java:15](../../../backend/platform-support/src/main/java/com/se193262/platform/client/ServiceHttpClient.java#L15) |
| tokens | Map<String, Token> |  | [ServiceHttpClient.java:16](../../../backend/platform-support/src/main/java/com/se193262/platform/client/ServiceHttpClient.java#L16) |


## platform-support · Token

[ServiceHttpClient.java:18](../../../backend/platform-support/src/main/java/com/se193262/platform/client/ServiceHttpClient.java#L18); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| value | String |  | [ServiceHttpClient.java:18](../../../backend/platform-support/src/main/java/com/se193262/platform/client/ServiceHttpClient.java#L18) |
| expiry | Instant |  | [ServiceHttpClient.java:18](../../../backend/platform-support/src/main/java/com/se193262/platform/client/ServiceHttpClient.java#L18) |


## platform-support · TokenResponse

[ServiceHttpClient.java:20](../../../backend/platform-support/src/main/java/com/se193262/platform/client/ServiceHttpClient.java#L20); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| accessToken | String |  | [ServiceHttpClient.java:20](../../../backend/platform-support/src/main/java/com/se193262/platform/client/ServiceHttpClient.java#L20) |
| expiresIn | long |  | [ServiceHttpClient.java:20](../../../backend/platform-support/src/main/java/com/se193262/platform/client/ServiceHttpClient.java#L20) |


## platform-support · PlatformConfiguration

[PlatformConfiguration.java:12](../../../backend/platform-support/src/main/java/com/se193262/platform/config/PlatformConfiguration.java#L12); class_declaration. `@Configuration`, `@Import({
    ResourceSecurityConfiguration.class,
    PlatformExceptionHandler.class,
    ServiceHttpClient.class,
    CorrelationFilter.class
})`, `@EnableConfigurationProperties({SecurityProperties.class, RemoteProperties.class})`

## platform-support · RemoteProperties

[RemoteProperties.java:7](../../../backend/platform-support/src/main/java/com/se193262/platform/config/RemoteProperties.java#L7); record_declaration. `@ConfigurationProperties("platform.remote")`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| identityUrl | String |  | [RemoteProperties.java:9](../../../backend/platform-support/src/main/java/com/se193262/platform/config/RemoteProperties.java#L9) |
| bakeryUrl | String |  | [RemoteProperties.java:10](../../../backend/platform-support/src/main/java/com/se193262/platform/config/RemoteProperties.java#L10) |
| subscriptionUrl | String |  | [RemoteProperties.java:11](../../../backend/platform-support/src/main/java/com/se193262/platform/config/RemoteProperties.java#L11) |
| cakeAiUrl | String |  | [RemoteProperties.java:12](../../../backend/platform-support/src/main/java/com/se193262/platform/config/RemoteProperties.java#L12) |
| orderUrl | String |  | [RemoteProperties.java:13](../../../backend/platform-support/src/main/java/com/se193262/platform/config/RemoteProperties.java#L13) |
| marketplaceUrl | String |  | [RemoteProperties.java:14](../../../backend/platform-support/src/main/java/com/se193262/platform/config/RemoteProperties.java#L14) |
| clientId | String |  | [RemoteProperties.java:15](../../../backend/platform-support/src/main/java/com/se193262/platform/config/RemoteProperties.java#L15) |
| clientSecret | String |  | [RemoteProperties.java:16](../../../backend/platform-support/src/main/java/com/se193262/platform/config/RemoteProperties.java#L16) |
| connectTimeout | Duration |  | [RemoteProperties.java:17](../../../backend/platform-support/src/main/java/com/se193262/platform/config/RemoteProperties.java#L17) |
| readTimeout | Duration |  | [RemoteProperties.java:18](../../../backend/platform-support/src/main/java/com/se193262/platform/config/RemoteProperties.java#L18) |


## platform-support · ResourceSecurityConfiguration

[ResourceSecurityConfiguration.java:22](../../../backend/platform-support/src/main/java/com/se193262/platform/config/ResourceSecurityConfiguration.java#L22); class_declaration. `@Configuration`, `@EnableMethodSecurity`

## platform-support · SecurityProperties

[SecurityProperties.java:5](../../../backend/platform-support/src/main/java/com/se193262/platform/config/SecurityProperties.java#L5); record_declaration. `@ConfigurationProperties("platform.security")`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| audience | String |  | [SecurityProperties.java:7](../../../backend/platform-support/src/main/java/com/se193262/platform/config/SecurityProperties.java#L7) |
| jwkSetUri | String |  | [SecurityProperties.java:7](../../../backend/platform-support/src/main/java/com/se193262/platform/config/SecurityProperties.java#L7) |
| issuer | String |  | [SecurityProperties.java:7](../../../backend/platform-support/src/main/java/com/se193262/platform/config/SecurityProperties.java#L7) |
| userAudience | String |  | [SecurityProperties.java:7](../../../backend/platform-support/src/main/java/com/se193262/platform/config/SecurityProperties.java#L7) |


## platform-support · ApiResponse

[ApiResponse.java:5](../../../backend/platform-support/src/main/java/com/se193262/platform/dto/ApiResponse.java#L5); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| statusCode | int |  | [ApiResponse.java:5](../../../backend/platform-support/src/main/java/com/se193262/platform/dto/ApiResponse.java#L5) |
| message | String |  | [ApiResponse.java:5](../../../backend/platform-support/src/main/java/com/se193262/platform/dto/ApiResponse.java#L5) |
| data | T |  | [ApiResponse.java:5](../../../backend/platform-support/src/main/java/com/se193262/platform/dto/ApiResponse.java#L5) |
| timestamp | Instant |  | [ApiResponse.java:5](../../../backend/platform-support/src/main/java/com/se193262/platform/dto/ApiResponse.java#L5) |


## platform-support · AppException

[AppException.java:3](../../../backend/platform-support/src/main/java/com/se193262/platform/exception/AppException.java#L3); class_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| status | int |  | [AppException.java:4](../../../backend/platform-support/src/main/java/com/se193262/platform/exception/AppException.java#L4) |


## platform-support · BusinessException

[BusinessException.java:3](../../../backend/platform-support/src/main/java/com/se193262/platform/exception/BusinessException.java#L3); class_declaration. 

## platform-support · PlatformExceptionHandler

[PlatformExceptionHandler.java:16](../../../backend/platform-support/src/main/java/com/se193262/platform/exception/PlatformExceptionHandler.java#L16); class_declaration. `@RestControllerAdvice`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| log | org.slf4j.Logger |  | [PlatformExceptionHandler.java:18](../../../backend/platform-support/src/main/java/com/se193262/platform/exception/PlatformExceptionHandler.java#L18) |


## platform-support · Actor

[Actor.java:10](../../../backend/platform-support/src/main/java/com/se193262/platform/security/Actor.java#L10); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| id | UUID |  | [Actor.java:10](../../../backend/platform-support/src/main/java/com/se193262/platform/security/Actor.java#L10) |
| roles | Set<String> |  | [Actor.java:10](../../../backend/platform-support/src/main/java/com/se193262/platform/security/Actor.java#L10) |


## platform-support · CorrelationFilter

[CorrelationFilter.java:12](../../../backend/platform-support/src/main/java/com/se193262/platform/security/CorrelationFilter.java#L12); class_declaration. `@org.springframework.core.annotation.Order(org.springframework.core.Ordered.HIGHEST_PRECEDENCE)`

## subscription-service · OutboundClientConfig

[OutboundClientConfig.java:9](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/config/OutboundClientConfig.java#L9); class_declaration. `@Configuration`, `@EnableConfigurationProperties(RemoteProperties.class)`, `@Import(ServiceHttpClient.class)`

## subscription-service · AppException

[AppException.java:5](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/exception/AppException.java#L5); class_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| status | HttpStatus |  | [AppException.java:7](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/exception/AppException.java#L7) |


## subscription-service · GlobalExceptionHandler

[GlobalExceptionHandler.java:26](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/exception/GlobalExceptionHandler.java#L26); class_declaration. `@RestControllerAdvice`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| log | Logger |  | [GlobalExceptionHandler.java:29](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/exception/GlobalExceptionHandler.java#L29) |


## subscription-service · AdminBakeryPaymentController

[AdminBakeryPaymentController.java:27](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/payment/controller/AdminBakeryPaymentController.java#L27); class_declaration. `@RestController`, `@RequestMapping("/api/v1/admin/bakery-payments")`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| paymentService | BakeryPaymentService |  | [AdminBakeryPaymentController.java:30](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/payment/controller/AdminBakeryPaymentController.java#L30) |


## subscription-service · BakeryPaymentController

[BakeryPaymentController.java:21](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/payment/controller/BakeryPaymentController.java#L21); class_declaration. `@RestController`, `@RequestMapping("/api/v1/subscription-orders/{orderId}/payments")`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| paymentService | BakeryPaymentService |  | [BakeryPaymentController.java:24](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/payment/controller/BakeryPaymentController.java#L24) |


## subscription-service · PaymentOptionsController

[PaymentOptionsController.java:8](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/payment/controller/PaymentOptionsController.java#L8); class_declaration. `@RestController`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| payments | BakeryPaymentService |  | [PaymentOptionsController.java:10](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/payment/controller/PaymentOptionsController.java#L10) |


## subscription-service · PaymentOptions

[PaymentOptionsController.java:21](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/payment/controller/PaymentOptionsController.java#L21); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| sandboxEnabled | boolean |  | [PaymentOptionsController.java:21](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/payment/controller/PaymentOptionsController.java#L21) |


## subscription-service · BakeryPaymentDto

[BakeryPaymentDto.java:12](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/payment/dto/BakeryPaymentDto.java#L12); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| id | UUID |  | [BakeryPaymentDto.java:13](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/payment/dto/BakeryPaymentDto.java#L13) |
| subscriptionOrderId | UUID |  | [BakeryPaymentDto.java:14](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/payment/dto/BakeryPaymentDto.java#L14) |
| submittedByUserId | UUID |  | [BakeryPaymentDto.java:15](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/payment/dto/BakeryPaymentDto.java#L15) |
| paymentMethod | String | @Size(max = 50) | [BakeryPaymentDto.java:16](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/payment/dto/BakeryPaymentDto.java#L16) |
| paymentReference | String | @Size(max = 120) | [BakeryPaymentDto.java:17](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/payment/dto/BakeryPaymentDto.java#L17) |
| amount | BigDecimal | @DecimalMin("0.01") | [BakeryPaymentDto.java:18](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/payment/dto/BakeryPaymentDto.java#L18) |
| currency | String | @Size(min = 3, max = 3) | [BakeryPaymentDto.java:19](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/payment/dto/BakeryPaymentDto.java#L19) |
| status | PaymentStatus |  | [BakeryPaymentDto.java:20](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/payment/dto/BakeryPaymentDto.java#L20) |
| reviewedByAdminId | UUID |  | [BakeryPaymentDto.java:21](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/payment/dto/BakeryPaymentDto.java#L21) |
| reviewNote | String |  | [BakeryPaymentDto.java:22](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/payment/dto/BakeryPaymentDto.java#L22) |
| submittedAt | Instant |  | [BakeryPaymentDto.java:23](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/payment/dto/BakeryPaymentDto.java#L23) |
| reviewedAt | Instant |  | [BakeryPaymentDto.java:24](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/payment/dto/BakeryPaymentDto.java#L24) |
| proofUrl | String |  | [BakeryPaymentDto.java:25](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/payment/dto/BakeryPaymentDto.java#L25) |


## subscription-service · PaymentReviewResponse

[PaymentReviewResponse.java:6](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/payment/dto/PaymentReviewResponse.java#L6); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| payment | BakeryPaymentDto |  | [PaymentReviewResponse.java:6](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/payment/dto/PaymentReviewResponse.java#L6) |
| order | SubscriptionOrderDto |  | [PaymentReviewResponse.java:6](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/payment/dto/PaymentReviewResponse.java#L6) |
| subscription | BakerySubscriptionDto.Period |  | [PaymentReviewResponse.java:7](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/payment/dto/PaymentReviewResponse.java#L7) |


## subscription-service · ReviewPaymentRequest

[ReviewPaymentRequest.java:3](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/payment/dto/ReviewPaymentRequest.java#L3); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| reviewNote | String |  | [ReviewPaymentRequest.java:3](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/payment/dto/ReviewPaymentRequest.java#L3) |


## subscription-service · BakeryPayment

[BakeryPayment.java:22](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/payment/entity/BakeryPayment.java#L22); class_declaration. `@Entity`, `@Table(name = "bakery_payments")`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| id | UUID | @Id; @GeneratedValue(strategy = GenerationType.UUID); @Column(name = "id", nullable = false) | [BakeryPayment.java:25](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/payment/entity/BakeryPayment.java#L25) |
| order | SubscriptionOrder | @ManyToOne(fetch = FetchType.LAZY, optional = false); @JoinColumn(name = "subscription_order_id", nullable = false) | [BakeryPayment.java:28](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/payment/entity/BakeryPayment.java#L28) |
| submittedByUserId | UUID | @Column(name = "submitted_by_user_id", nullable = false) | [BakeryPayment.java:31](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/payment/entity/BakeryPayment.java#L31) |
| paymentMethod | String | @Column(name = "payment_method", nullable = false, length = 50) | [BakeryPayment.java:33](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/payment/entity/BakeryPayment.java#L33) |
| paymentReference | String | @Column(name = "payment_reference", unique = true, length = 120) | [BakeryPayment.java:35](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/payment/entity/BakeryPayment.java#L35) |
| idempotencyKeyHash | String | @Column(name = "idempotency_key_hash", unique = true, length = 64) | [BakeryPayment.java:37](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/payment/entity/BakeryPayment.java#L37) |
| reviewIdempotencyKeyHash | String | @Column(name = "review_idempotency_key_hash", unique = true, length = 64) | [BakeryPayment.java:39](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/payment/entity/BakeryPayment.java#L39) |
| proofObjectKey | String | @Column(name = "proof_object_key", length = 512) | [BakeryPayment.java:41](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/payment/entity/BakeryPayment.java#L41) |
| amount | BigDecimal | @Column(name = "amount", nullable = false, precision = 12, scale = 2) | [BakeryPayment.java:43](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/payment/entity/BakeryPayment.java#L43) |
| currency | String | @Column(name = "currency", nullable = false, length = 3) | [BakeryPayment.java:45](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/payment/entity/BakeryPayment.java#L45) |
| status | PaymentStatus | @Enumerated(EnumType.STRING); @Column(name = "status", nullable = false, length = 30) | [BakeryPayment.java:47](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/payment/entity/BakeryPayment.java#L47) |
| reviewedByAdminId | UUID | @Column(name = "reviewed_by_admin_id") | [BakeryPayment.java:50](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/payment/entity/BakeryPayment.java#L50) |
| reviewNote | String | @Column(name = "review_note", columnDefinition = "text") | [BakeryPayment.java:52](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/payment/entity/BakeryPayment.java#L52) |
| submittedAt | Instant | @CreationTimestamp; @Column(name = "submitted_at", nullable = false, updatable = false) | [BakeryPayment.java:54](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/payment/entity/BakeryPayment.java#L54) |
| reviewedAt | Instant | @Column(name = "reviewed_at") | [BakeryPayment.java:56](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/payment/entity/BakeryPayment.java#L56) |
| version | long | @Version; @Column(name = "version", nullable = false) | [BakeryPayment.java:58](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/payment/entity/BakeryPayment.java#L58) |


## subscription-service · PaymentStatus

[PaymentStatus.java:3](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/payment/entity/PaymentStatus.java#L3); enum_declaration. 

Enum: `SUBMITTED`, `APPROVED`, `REJECTED`

## subscription-service · BakeryPaymentRepository

[BakeryPaymentRepository.java:11](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/payment/repository/BakeryPaymentRepository.java#L11); interface_declaration. 

## subscription-service · BakeryPaymentService

[BakeryPaymentService.java:12](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/payment/service/BakeryPaymentService.java#L12); interface_declaration. 

## subscription-service · BakeryPaymentServiceImpl

[BakeryPaymentServiceImpl.java:42](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/payment/service/impl/BakeryPaymentServiceImpl.java#L42); class_declaration. `@Service`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| SANDBOX_METHOD | String |  | [BakeryPaymentServiceImpl.java:44](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/payment/service/impl/BakeryPaymentServiceImpl.java#L44) |
| paymentRepository | BakeryPaymentRepository |  | [BakeryPaymentServiceImpl.java:45](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/payment/service/impl/BakeryPaymentServiceImpl.java#L45) |
| orderRepository | SubscriptionOrderRepository |  | [BakeryPaymentServiceImpl.java:46](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/payment/service/impl/BakeryPaymentServiceImpl.java#L46) |
| subscriptionRepository | BakerySubscriptionRepository |  | [BakeryPaymentServiceImpl.java:47](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/payment/service/impl/BakeryPaymentServiceImpl.java#L47) |
| bakeryClient | BakeryAccessClient |  | [BakeryPaymentServiceImpl.java:48](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/payment/service/impl/BakeryPaymentServiceImpl.java#L48) |
| proofStorage | PaymentProofStorage |  | [BakeryPaymentServiceImpl.java:49](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/payment/service/impl/BakeryPaymentServiceImpl.java#L49) |
| transactions | TransactionTemplate |  | [BakeryPaymentServiceImpl.java:50](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/payment/service/impl/BakeryPaymentServiceImpl.java#L50) |
| sandboxCode | String |  | [BakeryPaymentServiceImpl.java:51](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/payment/service/impl/BakeryPaymentServiceImpl.java#L51) |


## subscription-service · AdminSubscriptionPlanController

[AdminSubscriptionPlanController.java:20](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/plan/controller/AdminSubscriptionPlanController.java#L20); class_declaration. `@RestController`, `@RequestMapping("/api/v1/admin/subscription-plans")`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| planService | SubscriptionPlanService |  | [AdminSubscriptionPlanController.java:23](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/plan/controller/AdminSubscriptionPlanController.java#L23) |


## subscription-service · SubscriptionPlanController

[SubscriptionPlanController.java:15](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/plan/controller/SubscriptionPlanController.java#L15); class_declaration. `@RestController`, `@RequestMapping("/api/v1/subscription-plans")`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| planService | SubscriptionPlanService |  | [SubscriptionPlanController.java:18](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/plan/controller/SubscriptionPlanController.java#L18) |


## subscription-service · SubscriptionPlanDto

[SubscriptionPlanDto.java:13](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/plan/dto/SubscriptionPlanDto.java#L13); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| id | UUID |  | [SubscriptionPlanDto.java:14](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/plan/dto/SubscriptionPlanDto.java#L14) |
| code | String | @Size(max = 50) | [SubscriptionPlanDto.java:15](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/plan/dto/SubscriptionPlanDto.java#L15) |
| name | String | @Size(max = 120) | [SubscriptionPlanDto.java:16](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/plan/dto/SubscriptionPlanDto.java#L16) |
| description | String |  | [SubscriptionPlanDto.java:17](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/plan/dto/SubscriptionPlanDto.java#L17) |
| monthlyPrice | BigDecimal | @DecimalMin("0.00") | [SubscriptionPlanDto.java:18](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/plan/dto/SubscriptionPlanDto.java#L18) |
| currency | String | @Size(min = 3, max = 3) | [SubscriptionPlanDto.java:19](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/plan/dto/SubscriptionPlanDto.java#L19) |
| billingPeriodMonths | Integer | @Positive | [SubscriptionPlanDto.java:20](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/plan/dto/SubscriptionPlanDto.java#L20) |
| status | PlanStatus |  | [SubscriptionPlanDto.java:21](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/plan/dto/SubscriptionPlanDto.java#L21) |
| features | Map<String, String> |  | [SubscriptionPlanDto.java:22](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/plan/dto/SubscriptionPlanDto.java#L22) |


## subscription-service · PlanStatus

[PlanStatus.java:3](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/plan/entity/PlanStatus.java#L3); enum_declaration. 

Enum: `ACTIVE`, `INACTIVE`, `ARCHIVED`

## subscription-service · SubscriptionPlan

[SubscriptionPlan.java:26](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/plan/entity/SubscriptionPlan.java#L26); class_declaration. `@Entity`, `@Table(name = "subscription_plans")`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| id | UUID | @Id; @GeneratedValue(strategy = GenerationType.UUID); @Column(name = "id", nullable = false) | [SubscriptionPlan.java:29](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/plan/entity/SubscriptionPlan.java#L29) |
| code | String | @Column(name = "code", nullable = false, unique = true, length = 50) | [SubscriptionPlan.java:33](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/plan/entity/SubscriptionPlan.java#L33) |
| name | String | @Column(name = "name", nullable = false, length = 120) | [SubscriptionPlan.java:35](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/plan/entity/SubscriptionPlan.java#L35) |
| description | String | @Column(name = "description", columnDefinition = "text") | [SubscriptionPlan.java:37](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/plan/entity/SubscriptionPlan.java#L37) |
| monthlyPrice | BigDecimal | @Column(name = "monthly_price", nullable = false, precision = 12, scale = 2) | [SubscriptionPlan.java:39](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/plan/entity/SubscriptionPlan.java#L39) |
| currency | String | @Column(name = "currency", nullable = false, length = 3) | [SubscriptionPlan.java:41](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/plan/entity/SubscriptionPlan.java#L41) |
| billingPeriodMonths | int | @Column(name = "billing_period_months", nullable = false) | [SubscriptionPlan.java:43](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/plan/entity/SubscriptionPlan.java#L43) |
| status | PlanStatus | @Enumerated(EnumType.STRING); @Column(name = "status", nullable = false, length = 30) | [SubscriptionPlan.java:45](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/plan/entity/SubscriptionPlan.java#L45) |
| features | Map<String, String> | @ElementCollection(fetch = FetchType.LAZY); @CollectionTable(name = "plan_features", joinColumns = @JoinColumn(name = "plan_id")); @MapKeyColumn(name = "feature_code", length = 80); @Column(name = "feature_value", nullable = false, length = 255) | [SubscriptionPlan.java:48](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/plan/entity/SubscriptionPlan.java#L48) |
| createdAt | Instant | @CreationTimestamp; @Column(name = "created_at", nullable = false, updatable = false) | [SubscriptionPlan.java:53](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/plan/entity/SubscriptionPlan.java#L53) |
| updatedAt | Instant | @UpdateTimestamp; @Column(name = "updated_at", nullable = false) | [SubscriptionPlan.java:55](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/plan/entity/SubscriptionPlan.java#L55) |
| version | long | @Version; @Column(name = "version", nullable = false) | [SubscriptionPlan.java:57](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/plan/entity/SubscriptionPlan.java#L57) |


## subscription-service · SubscriptionPlanRepository

[SubscriptionPlanRepository.java:11](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/plan/repository/SubscriptionPlanRepository.java#L11); interface_declaration. 

## subscription-service · SubscriptionPlanServiceImpl

[SubscriptionPlanServiceImpl.java:20](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/plan/service/impl/SubscriptionPlanServiceImpl.java#L20); class_declaration. `@Service`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| planRepository | SubscriptionPlanRepository |  | [SubscriptionPlanServiceImpl.java:22](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/plan/service/impl/SubscriptionPlanServiceImpl.java#L22) |
| orderRepository | SubscriptionOrderRepository |  | [SubscriptionPlanServiceImpl.java:23](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/plan/service/impl/SubscriptionPlanServiceImpl.java#L23) |


## subscription-service · SubscriptionPlanService

[SubscriptionPlanService.java:8](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/plan/service/SubscriptionPlanService.java#L8); interface_declaration. 

## subscription-service · BakerySubscriptionController

[BakerySubscriptionController.java:16](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscription/controller/BakerySubscriptionController.java#L16); class_declaration. `@RestController`, `@RequestMapping("/api/v1/bakeries/{bakeryId}/subscription")`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| subscriptionService | BakerySubscriptionService |  | [BakerySubscriptionController.java:19](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscription/controller/BakerySubscriptionController.java#L19) |


## subscription-service · InternalSubscriptionController

[InternalSubscriptionController.java:13](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscription/controller/InternalSubscriptionController.java#L13); class_declaration. `@RestController`, `@RequestMapping("/internal/v1/subscriptions/bakeries")`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| service | BakerySubscriptionService |  | [InternalSubscriptionController.java:16](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscription/controller/InternalSubscriptionController.java#L16) |


## subscription-service · BakerySubscriptionDto

[BakerySubscriptionDto.java:10](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscription/dto/BakerySubscriptionDto.java#L10); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| bakeryId | UUID |  | [BakerySubscriptionDto.java:10](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscription/dto/BakerySubscriptionDto.java#L10) |
| currentSubscription | Period |  | [BakerySubscriptionDto.java:10](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscription/dto/BakerySubscriptionDto.java#L10) |
| scheduledSubscription | Period |  | [BakerySubscriptionDto.java:11](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscription/dto/BakerySubscriptionDto.java#L11) |
| features | Map<String, String> |  | [BakerySubscriptionDto.java:11](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscription/dto/BakerySubscriptionDto.java#L11) |


## subscription-service · Period

[BakerySubscriptionDto.java:12](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscription/dto/BakerySubscriptionDto.java#L12); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| id | UUID |  | [BakerySubscriptionDto.java:12](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscription/dto/BakerySubscriptionDto.java#L12) |
| planId | UUID |  | [BakerySubscriptionDto.java:12](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscription/dto/BakerySubscriptionDto.java#L12) |
| planCode | String |  | [BakerySubscriptionDto.java:12](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscription/dto/BakerySubscriptionDto.java#L12) |
| status | SubscriptionStatus |  | [BakerySubscriptionDto.java:12](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscription/dto/BakerySubscriptionDto.java#L12) |
| periodStart | Instant |  | [BakerySubscriptionDto.java:13](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscription/dto/BakerySubscriptionDto.java#L13) |
| periodEnd | Instant |  | [BakerySubscriptionDto.java:13](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscription/dto/BakerySubscriptionDto.java#L13) |


## subscription-service · EntitlementResponse

[EntitlementResponse.java:7](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscription/dto/EntitlementResponse.java#L7); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| bakeryId | UUID |  | [EntitlementResponse.java:7](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscription/dto/EntitlementResponse.java#L7) |
| active | boolean |  | [EntitlementResponse.java:7](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscription/dto/EntitlementResponse.java#L7) |
| planCode | String |  | [EntitlementResponse.java:7](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscription/dto/EntitlementResponse.java#L7) |
| periodEnd | Instant |  | [EntitlementResponse.java:8](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscription/dto/EntitlementResponse.java#L8) |
| features | Map<String, String> |  | [EntitlementResponse.java:8](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscription/dto/EntitlementResponse.java#L8) |


## subscription-service · BakerySubscription

[BakerySubscription.java:27](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscription/entity/BakerySubscription.java#L27); class_declaration. `@Entity`, `@Table(name = "bakery_subscriptions")`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| id | UUID | @Id; @GeneratedValue(strategy = GenerationType.UUID); @Column(name = "id", nullable = false) | [BakerySubscription.java:30](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscription/entity/BakerySubscription.java#L30) |
| bakeryId | UUID | @Column(name = "bakery_id", nullable = false) | [BakerySubscription.java:33](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscription/entity/BakerySubscription.java#L33) |
| plan | SubscriptionPlan | @ManyToOne(fetch = FetchType.LAZY, optional = false); @JoinColumn(name = "plan_id", nullable = false) | [BakerySubscription.java:35](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscription/entity/BakerySubscription.java#L35) |
| sourceOrder | SubscriptionOrder | @OneToOne(fetch = FetchType.LAZY, optional = false); @JoinColumn(name = "source_order_id", nullable = false, unique = true) | [BakerySubscription.java:38](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscription/entity/BakerySubscription.java#L38) |
| status | SubscriptionStatus | @Enumerated(EnumType.STRING); @Column(name = "status", nullable = false, length = 30) | [BakerySubscription.java:41](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscription/entity/BakerySubscription.java#L41) |
| periodStart | Instant | @Column(name = "period_start", nullable = false) | [BakerySubscription.java:44](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscription/entity/BakerySubscription.java#L44) |
| periodEnd | Instant | @Column(name = "period_end", nullable = false) | [BakerySubscription.java:46](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscription/entity/BakerySubscription.java#L46) |
| featuresSnapshot | Map<String, String> | @JdbcTypeCode(SqlTypes.JSON); @Column(name = "features_snapshot", nullable = false, columnDefinition = "jsonb") | [BakerySubscription.java:48](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscription/entity/BakerySubscription.java#L48) |
| activatedAt | Instant | @Column(name = "activated_at") | [BakerySubscription.java:51](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscription/entity/BakerySubscription.java#L51) |
| cancelledAt | Instant | @Column(name = "cancelled_at") | [BakerySubscription.java:53](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscription/entity/BakerySubscription.java#L53) |
| createdAt | Instant | @CreationTimestamp; @Column(name = "created_at", nullable = false, updatable = false) | [BakerySubscription.java:55](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscription/entity/BakerySubscription.java#L55) |
| updatedAt | Instant | @UpdateTimestamp; @Column(name = "updated_at", nullable = false) | [BakerySubscription.java:57](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscription/entity/BakerySubscription.java#L57) |
| version | long | @Version; @Column(name = "version", nullable = false) | [BakerySubscription.java:59](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscription/entity/BakerySubscription.java#L59) |


## subscription-service · SubscriptionStatus

[SubscriptionStatus.java:3](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscription/entity/SubscriptionStatus.java#L3); enum_declaration. 

Enum: `SCHEDULED`, `ACTIVE`, `EXPIRED`, `CANCELLED`

## subscription-service · BakerySubscriptionRepository

[BakerySubscriptionRepository.java:14](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscription/repository/BakerySubscriptionRepository.java#L14); interface_declaration. 

## subscription-service · BakerySubscriptionService

[BakerySubscriptionService.java:8](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscription/service/BakerySubscriptionService.java#L8); interface_declaration. 

## subscription-service · BakerySubscriptionServiceImpl

[BakerySubscriptionServiceImpl.java:18](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscription/service/impl/BakerySubscriptionServiceImpl.java#L18); class_declaration. `@Service`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| subscriptionRepository | BakerySubscriptionRepository |  | [BakerySubscriptionServiceImpl.java:20](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscription/service/impl/BakerySubscriptionServiceImpl.java#L20) |
| bakeryClient | BakeryAccessClient |  | [BakerySubscriptionServiceImpl.java:21](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscription/service/impl/BakerySubscriptionServiceImpl.java#L21) |


## subscription-service · SubscriptionOrderController

[SubscriptionOrderController.java:24](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscriptionorder/controller/SubscriptionOrderController.java#L24); class_declaration. `@RestController`, `@RequestMapping("/api/v1")`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| orderService | SubscriptionOrderService |  | [SubscriptionOrderController.java:27](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscriptionorder/controller/SubscriptionOrderController.java#L27) |


## subscription-service · SubscriptionOrderDto

[SubscriptionOrderDto.java:16](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscriptionorder/dto/SubscriptionOrderDto.java#L16); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| id | UUID |  | [SubscriptionOrderDto.java:17](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscriptionorder/dto/SubscriptionOrderDto.java#L17) |
| orderNumber | String |  | [SubscriptionOrderDto.java:18](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscriptionorder/dto/SubscriptionOrderDto.java#L18) |
| bakeryId | UUID |  | [SubscriptionOrderDto.java:19](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscriptionorder/dto/SubscriptionOrderDto.java#L19) |
| planId | UUID |  | [SubscriptionOrderDto.java:20](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscriptionorder/dto/SubscriptionOrderDto.java#L20) |
| requestedByUserId | UUID |  | [SubscriptionOrderDto.java:21](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscriptionorder/dto/SubscriptionOrderDto.java#L21) |
| planNameSnapshot | String |  | [SubscriptionOrderDto.java:22](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscriptionorder/dto/SubscriptionOrderDto.java#L22) |
| planCodeSnapshot | String |  | [SubscriptionOrderDto.java:23](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscriptionorder/dto/SubscriptionOrderDto.java#L23) |
| featuresSnapshot | Map<String, String> |  | [SubscriptionOrderDto.java:24](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscriptionorder/dto/SubscriptionOrderDto.java#L24) |
| billingPeriodMonths | Integer |  | [SubscriptionOrderDto.java:25](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscriptionorder/dto/SubscriptionOrderDto.java#L25) |
| totalAmount | BigDecimal |  | [SubscriptionOrderDto.java:26](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscriptionorder/dto/SubscriptionOrderDto.java#L26) |
| currency | String |  | [SubscriptionOrderDto.java:27](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscriptionorder/dto/SubscriptionOrderDto.java#L27) |
| status | SubscriptionOrderStatus |  | [SubscriptionOrderDto.java:28](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscriptionorder/dto/SubscriptionOrderDto.java#L28) |
| expiresAt | Instant |  | [SubscriptionOrderDto.java:29](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscriptionorder/dto/SubscriptionOrderDto.java#L29) |
| completedAt | Instant |  | [SubscriptionOrderDto.java:30](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscriptionorder/dto/SubscriptionOrderDto.java#L30) |
| createdAt | Instant |  | [SubscriptionOrderDto.java:31](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscriptionorder/dto/SubscriptionOrderDto.java#L31) |
| payments | List<PaymentSummary> |  | [SubscriptionOrderDto.java:32](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscriptionorder/dto/SubscriptionOrderDto.java#L32) |
| period | PeriodSummary |  | [SubscriptionOrderDto.java:33](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscriptionorder/dto/SubscriptionOrderDto.java#L33) |


## subscription-service · PaymentSummary

[SubscriptionOrderDto.java:45](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscriptionorder/dto/SubscriptionOrderDto.java#L45); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| id | UUID |  | [SubscriptionOrderDto.java:45](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscriptionorder/dto/SubscriptionOrderDto.java#L45) |
| paymentMethod | String |  | [SubscriptionOrderDto.java:45](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscriptionorder/dto/SubscriptionOrderDto.java#L45) |
| paymentReference | String |  | [SubscriptionOrderDto.java:45](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscriptionorder/dto/SubscriptionOrderDto.java#L45) |
| amount | BigDecimal |  | [SubscriptionOrderDto.java:46](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscriptionorder/dto/SubscriptionOrderDto.java#L46) |
| status | PaymentStatus |  | [SubscriptionOrderDto.java:46](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscriptionorder/dto/SubscriptionOrderDto.java#L46) |
| submittedAt | Instant |  | [SubscriptionOrderDto.java:46](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscriptionorder/dto/SubscriptionOrderDto.java#L46) |
| proofUrl | String |  | [SubscriptionOrderDto.java:46](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscriptionorder/dto/SubscriptionOrderDto.java#L46) |


## subscription-service · PeriodSummary

[SubscriptionOrderDto.java:54](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscriptionorder/dto/SubscriptionOrderDto.java#L54); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| id | UUID |  | [SubscriptionOrderDto.java:54](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscriptionorder/dto/SubscriptionOrderDto.java#L54) |
| status | SubscriptionStatus |  | [SubscriptionOrderDto.java:54](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscriptionorder/dto/SubscriptionOrderDto.java#L54) |
| periodStart | Instant |  | [SubscriptionOrderDto.java:54](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscriptionorder/dto/SubscriptionOrderDto.java#L54) |
| periodEnd | Instant |  | [SubscriptionOrderDto.java:55](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscriptionorder/dto/SubscriptionOrderDto.java#L55) |


## subscription-service · SubscriptionOrder

[SubscriptionOrder.java:26](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscriptionorder/entity/SubscriptionOrder.java#L26); class_declaration. `@Entity`, `@Table(name = "subscription_orders")`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| id | UUID | @Id; @GeneratedValue(strategy = GenerationType.UUID); @Column(name = "id", nullable = false) | [SubscriptionOrder.java:29](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscriptionorder/entity/SubscriptionOrder.java#L29) |
| orderNumber | String | @Column(name = "order_number", nullable = false, unique = true, length = 40) | [SubscriptionOrder.java:32](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscriptionorder/entity/SubscriptionOrder.java#L32) |
| bakeryId | UUID | @Column(name = "bakery_id", nullable = false) | [SubscriptionOrder.java:34](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscriptionorder/entity/SubscriptionOrder.java#L34) |
| plan | SubscriptionPlan | @ManyToOne(fetch = FetchType.LAZY, optional = false); @JoinColumn(name = "plan_id", nullable = false) | [SubscriptionOrder.java:36](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscriptionorder/entity/SubscriptionOrder.java#L36) |
| requestedByUserId | UUID | @Column(name = "requested_by_user_id", nullable = false) | [SubscriptionOrder.java:39](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscriptionorder/entity/SubscriptionOrder.java#L39) |
| planNameSnapshot | String | @Column(name = "plan_name_snapshot", nullable = false, length = 120) | [SubscriptionOrder.java:41](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscriptionorder/entity/SubscriptionOrder.java#L41) |
| planCodeSnapshot | String | @Column(name = "plan_code_snapshot", nullable = false, length = 50) | [SubscriptionOrder.java:43](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscriptionorder/entity/SubscriptionOrder.java#L43) |
| featuresSnapshot | Map<String, String> | @JdbcTypeCode(SqlTypes.JSON); @Column(name = "features_snapshot", nullable = false, columnDefinition = "jsonb") | [SubscriptionOrder.java:45](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscriptionorder/entity/SubscriptionOrder.java#L45) |
| billingPeriodMonths | int | @Column(name = "billing_period_months", nullable = false) | [SubscriptionOrder.java:48](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscriptionorder/entity/SubscriptionOrder.java#L48) |
| totalAmount | BigDecimal | @Column(name = "total_amount", nullable = false, precision = 12, scale = 2) | [SubscriptionOrder.java:50](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscriptionorder/entity/SubscriptionOrder.java#L50) |
| currency | String | @Column(name = "currency", nullable = false, length = 3) | [SubscriptionOrder.java:52](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscriptionorder/entity/SubscriptionOrder.java#L52) |
| status | SubscriptionOrderStatus | @Enumerated(EnumType.STRING); @Column(name = "status", nullable = false, length = 30) | [SubscriptionOrder.java:54](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscriptionorder/entity/SubscriptionOrder.java#L54) |
| expiresAt | Instant | @Column(name = "expires_at", nullable = false) | [SubscriptionOrder.java:57](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscriptionorder/entity/SubscriptionOrder.java#L57) |
| completedAt | Instant | @Column(name = "completed_at") | [SubscriptionOrder.java:59](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscriptionorder/entity/SubscriptionOrder.java#L59) |
| createdAt | Instant | @CreationTimestamp; @Column(name = "created_at", nullable = false, updatable = false) | [SubscriptionOrder.java:61](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscriptionorder/entity/SubscriptionOrder.java#L61) |
| updatedAt | Instant | @UpdateTimestamp; @Column(name = "updated_at", nullable = false) | [SubscriptionOrder.java:63](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscriptionorder/entity/SubscriptionOrder.java#L63) |
| version | long | @Version; @Column(name = "version", nullable = false) | [SubscriptionOrder.java:65](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscriptionorder/entity/SubscriptionOrder.java#L65) |


## subscription-service · SubscriptionOrderStatus

[SubscriptionOrderStatus.java:3](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscriptionorder/entity/SubscriptionOrderStatus.java#L3); enum_declaration. 

Enum: `PENDING_PAYMENT`, `PAYMENT_REVIEW`, `COMPLETED`, `REJECTED`, `CANCELLED`, `EXPIRED`

## subscription-service · SubscriptionOrderRepository

[SubscriptionOrderRepository.java:14](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscriptionorder/repository/SubscriptionOrderRepository.java#L14); interface_declaration. 

## subscription-service · SubscriptionOrderServiceImpl

[SubscriptionOrderServiceImpl.java:34](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscriptionorder/service/impl/SubscriptionOrderServiceImpl.java#L34); class_declaration. `@Service`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| orderRepository | SubscriptionOrderRepository |  | [SubscriptionOrderServiceImpl.java:36](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscriptionorder/service/impl/SubscriptionOrderServiceImpl.java#L36) |
| planRepository | SubscriptionPlanRepository |  | [SubscriptionOrderServiceImpl.java:37](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscriptionorder/service/impl/SubscriptionOrderServiceImpl.java#L37) |
| paymentRepository | BakeryPaymentRepository |  | [SubscriptionOrderServiceImpl.java:38](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscriptionorder/service/impl/SubscriptionOrderServiceImpl.java#L38) |
| subscriptionRepository | BakerySubscriptionRepository |  | [SubscriptionOrderServiceImpl.java:39](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscriptionorder/service/impl/SubscriptionOrderServiceImpl.java#L39) |
| bakeryClient | BakeryAccessClient |  | [SubscriptionOrderServiceImpl.java:40](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscriptionorder/service/impl/SubscriptionOrderServiceImpl.java#L40) |
| proofStorage | PaymentProofStorage |  | [SubscriptionOrderServiceImpl.java:41](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscriptionorder/service/impl/SubscriptionOrderServiceImpl.java#L41) |
| transactions | TransactionTemplate |  | [SubscriptionOrderServiceImpl.java:42](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscriptionorder/service/impl/SubscriptionOrderServiceImpl.java#L42) |
| expiryHours | long |  | [SubscriptionOrderServiceImpl.java:43](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscriptionorder/service/impl/SubscriptionOrderServiceImpl.java#L43) |


## subscription-service · SubscriptionOrderService

[SubscriptionOrderService.java:9](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscriptionorder/service/SubscriptionOrderService.java#L9); interface_declaration. 

## subscription-service · BakeryAccessClient

[BakeryAccessClient.java:19](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/infrastructure/client/BakeryAccessClient.java#L19); class_declaration. `@Component`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| log | Logger |  | [BakeryAccessClient.java:21](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/infrastructure/client/BakeryAccessClient.java#L21) |
| client | RestClient |  | [BakeryAccessClient.java:22](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/infrastructure/client/BakeryAccessClient.java#L22) |
| serviceToken | String |  | [BakeryAccessClient.java:23](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/infrastructure/client/BakeryAccessClient.java#L23) |
| tokenClient | ServiceHttpClient |  | [BakeryAccessClient.java:24](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/infrastructure/client/BakeryAccessClient.java#L24) |


## subscription-service · Profile

[BakeryAccessClient.java:98](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/infrastructure/client/BakeryAccessClient.java#L98); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| id | UUID |  | [BakeryAccessClient.java:98](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/infrastructure/client/BakeryAccessClient.java#L98) |
| name | String |  | [BakeryAccessClient.java:98](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/infrastructure/client/BakeryAccessClient.java#L98) |
| status | String |  | [BakeryAccessClient.java:98](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/infrastructure/client/BakeryAccessClient.java#L98) |


## subscription-service · Authorization

[BakeryAccessClient.java:99](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/infrastructure/client/BakeryAccessClient.java#L99); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| bakeryId | UUID |  | [BakeryAccessClient.java:99](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/infrastructure/client/BakeryAccessClient.java#L99) |
| userId | UUID |  | [BakeryAccessClient.java:99](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/infrastructure/client/BakeryAccessClient.java#L99) |
| active | boolean |  | [BakeryAccessClient.java:99](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/infrastructure/client/BakeryAccessClient.java#L99) |
| memberRole | String |  | [BakeryAccessClient.java:100](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/infrastructure/client/BakeryAccessClient.java#L100) |
| authorized | boolean |  | [BakeryAccessClient.java:100](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/infrastructure/client/BakeryAccessClient.java#L100) |


## subscription-service · SubscriptionLifecycleJob

[SubscriptionLifecycleJob.java:13](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/infrastructure/scheduler/SubscriptionLifecycleJob.java#L13); class_declaration. `@Component`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| subscriptions | BakerySubscriptionRepository |  | [SubscriptionLifecycleJob.java:15](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/infrastructure/scheduler/SubscriptionLifecycleJob.java#L15) |
| orders | SubscriptionOrderRepository |  | [SubscriptionLifecycleJob.java:16](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/infrastructure/scheduler/SubscriptionLifecycleJob.java#L16) |


## subscription-service · PaymentProofStorage

[PaymentProofStorage.java:25](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/infrastructure/storage/PaymentProofStorage.java#L25); class_declaration. `@Component`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| log | Logger |  | [PaymentProofStorage.java:27](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/infrastructure/storage/PaymentProofStorage.java#L27) |
| MAX_BYTES | long |  | [PaymentProofStorage.java:28](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/infrastructure/storage/PaymentProofStorage.java#L28) |
| endpoint | String |  | [PaymentProofStorage.java:29](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/infrastructure/storage/PaymentProofStorage.java#L29) |
| publicEndpoint | String |  | [PaymentProofStorage.java:30](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/infrastructure/storage/PaymentProofStorage.java#L30) |
| accessKey | String |  | [PaymentProofStorage.java:31](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/infrastructure/storage/PaymentProofStorage.java#L31) |
| secretKey | String |  | [PaymentProofStorage.java:32](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/infrastructure/storage/PaymentProofStorage.java#L32) |
| bucket | String |  | [PaymentProofStorage.java:33](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/infrastructure/storage/PaymentProofStorage.java#L33) |
| region | String |  | [PaymentProofStorage.java:34](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/infrastructure/storage/PaymentProofStorage.java#L34) |


## subscription-service · JwtDecoderConfig

[JwtDecoderConfig.java:19](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/security/JwtDecoderConfig.java#L19); class_declaration. `@Configuration`

## subscription-service · SecurityConfig

[SecurityConfig.java:29](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/security/SecurityConfig.java#L29); class_declaration. `@Configuration`, `@EnableWebSecurity`, `@EnableMethodSecurity`


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| serviceAudience | String |  | [SecurityConfig.java:33](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/security/SecurityConfig.java#L33) |


## subscription-service · ApiResponse

[ApiResponse.java:5](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/shared/dto/ApiResponse.java#L5); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| statusCode | int |  | [ApiResponse.java:6](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/shared/dto/ApiResponse.java#L6) |
| message | String |  | [ApiResponse.java:7](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/shared/dto/ApiResponse.java#L7) |
| data | T |  | [ApiResponse.java:8](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/shared/dto/ApiResponse.java#L8) |
| timestamp | Instant |  | [ApiResponse.java:9](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/shared/dto/ApiResponse.java#L9) |


## subscription-service · PageResult

[PageResult.java:7](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/shared/dto/PageResult.java#L7); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| meta | Meta |  | [PageResult.java:7](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/shared/dto/PageResult.java#L7) |
| result | List<T> |  | [PageResult.java:7](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/shared/dto/PageResult.java#L7) |


## subscription-service · Meta

[PageResult.java:9](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/shared/dto/PageResult.java#L9); record_declaration. 


| Field | Kiểu | Validation/mapping | Nguồn |
|---|---|---|---|
| page | int |  | [PageResult.java:9](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/shared/dto/PageResult.java#L9) |
| pageSize | int |  | [PageResult.java:9](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/shared/dto/PageResult.java#L9) |
| pages | int |  | [PageResult.java:9](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/shared/dto/PageResult.java#L9) |
| total | long |  | [PageResult.java:9](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/shared/dto/PageResult.java#L9) |


## subscription-service · SubscriptionServiceApplication

[SubscriptionServiceApplication.java:7](../../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/SubscriptionServiceApplication.java#L7); class_declaration. `@SpringBootApplication`, `@EnableScheduling`
