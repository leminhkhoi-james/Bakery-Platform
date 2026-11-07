import '../../../core/api/api_client.dart';
import '../../../core/api/contracts.dart';
import '../../../core/api/environment.dart';
import '../../../core/api/transport.dart';

class LiveSubscriptionRepository {
  LiveSubscriptionRepository(this.api);
  final ApiClient api;
  static const service = ApiService.subscription;
  Future<List<SubscriptionPlan>> plans({bool admin = false}) async => objects(
    await api.request(
      service,
      'GET',
      '/api/v1/${admin ? 'admin/' : ''}subscription-plans',
      authenticated: admin,
    ),
  ).map(SubscriptionPlan.fromJson).toList();
  Future<SubscriptionPlan> plan(String id) async => SubscriptionPlan.fromJson(
    await api.request(
      service,
      'GET',
      '/api/v1/subscription-plans/$id',
      authenticated: false,
    ),
  );
  Future<Json> capabilities() async => object(
    await api.request(
      service,
      'GET',
      '/api/v1/subscription-plans/payment-options',
      authenticated: false,
    ),
  );
  Future<Json> subscription(String bakeryId) async => object(
    await api.request(
      service,
      'GET',
      '/api/v1/bakeries/$bakeryId/subscription',
    ),
  );
  Future<ApiPage> orders(
    String bakeryId, {
    Map<String, Object?> query = const {},
  }) async => ApiPage.fromJson(
    await api.request(
      service,
      'GET',
      '/api/v1/bakeries/$bakeryId/subscription-orders',
      query: query,
    ),
  );
  Future<Json> order(String id) async => object(
    await api.request(service, 'GET', '/api/v1/subscription-orders/$id'),
  );
  Future<Json> createOrder(String bakeryId, String planId) async => object(
    await api.request(
      service,
      'POST',
      '/api/v1/bakeries/$bakeryId/subscription-orders',
      body: {'planId': planId},
      idempotent: true,
    ),
  );
  Future<Json> payment(
    String orderId,
    Json metadata, {
    UploadPart? proof,
  }) async => object(
    await api.request(
      service,
      'POST',
      '/api/v1/subscription-orders/$orderId/payments',
      body: metadata,
      files: proof == null ? const [] : [proof],
      multipart: true,
      idempotent: true,
    ),
  );
  Future<ApiPage> payments({Map<String, Object?> query = const {}}) async =>
      ApiPage.fromJson(
        await api.request(
          service,
          'GET',
          '/api/v1/admin/bakery-payments',
          query: query,
        ),
      );
  Future<Json> review(
    String id, {
    required bool approve,
    required String note,
  }) async => object(
    await api.request(
      service,
      'POST',
      '/api/v1/admin/bakery-payments/$id/${approve ? 'approve' : 'reject'}',
      body: {'reviewNote': note},
      idempotent: approve,
    ),
  );
  Future<SubscriptionPlan> savePlan(Json body, {String? id}) async =>
      SubscriptionPlan.fromJson(
        await api.request(
          service,
          id == null ? 'POST' : 'PATCH',
          '/api/v1/admin/subscription-plans${id == null ? '' : '/$id'}',
          body: body,
        ),
      );
  Future<SubscriptionPlan> archive(String id) async =>
      SubscriptionPlan.fromJson(
        await api.request(
          service,
          'POST',
          '/api/v1/admin/subscription-plans/$id/archive',
        ),
      );
}
