import '../../../core/api/api_client.dart';
import '../../../core/api/contracts.dart';
import '../../../core/api/environment.dart';
import '../../../core/api/phase5_contracts.dart';

class LiveOrderRepository {
  LiveOrderRepository(this.api);
  final ApiClient api;
  Future<ApiPage> list(Map<String, Object?> query) async => ApiPage.fromJson(
    await api.request(ApiService.order, 'GET', '/api/v1/orders', query: query),
  );
  Future<Json> detail(String id) async => identified(
    await api.request(ApiService.order, 'GET', '/api/v1/orders/${apiId(id)}'),
    expected: id,
  );
  Future<Json> create(Json body, String logicalKey) async => mutationResult(
    api.request(
      ApiService.order,
      'POST',
      '/api/v1/orders/direct',
      body: body,
      idempotencyKey: logicalKey,
    ),
  );
  Future<Json> transition(String id, String target, String reason) async =>
      mutationResult(
        api.request(
          ApiService.order,
          'POST',
          '/api/v1/orders/${apiId(id)}/status-transitions',
          body: {'targetStatus': target, 'reason': reason},
        ),
        expected: id,
      );
}
