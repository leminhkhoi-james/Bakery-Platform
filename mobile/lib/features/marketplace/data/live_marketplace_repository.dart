import '../../../core/api/api_client.dart';
import '../../../core/api/contracts.dart';
import '../../../core/api/environment.dart';
import '../../../core/api/phase5_contracts.dart';
import '../../../core/api/transport.dart';

class LiveMarketplaceRepository {
  LiveMarketplaceRepository(this.api);
  final ApiClient api;
  static const service = ApiService.marketplace;
  Future<ApiPage> requests(Map<String, Object?> query) async =>
      ApiPage.fromJson(
        await api.request(
          service,
          'GET',
          '/api/v1/cake-requests',
          query: query,
        ),
      );
  Future<Json> request(String id) async => identified(
    await api.request(service, 'GET', '/api/v1/cake-requests/${apiId(id)}'),
    expected: id,
  );
  Future<Json> create(Json body) async => mutationResult(
    api.request(service, 'POST', '/api/v1/cake-requests', body: body),
  );
  Future<Json> edit(String id, Json body) async => mutationResult(
    api.request(
      service,
      'PATCH',
      '/api/v1/cake-requests/${apiId(id)}',
      body: body,
    ),
    expected: id,
  );
  Future<Json> publish(String id) async => mutationResult(
    api.request(service, 'POST', '/api/v1/cake-requests/${apiId(id)}/publish'),
    expected: id,
  );
  Future<Json> selectDesign(String id, String designId) => mutationResult(
    api.request(
      service,
      'PUT',
      '/api/v1/cake-requests/${apiId(id)}/selected-design',
      body: {'generatedDesignId': apiId(designId)},
    ),
    expected: id,
  );
  Future<Json> cancel(String id, String reason) async => mutationResult(
    api.request(
      service,
      'POST',
      '/api/v1/cake-requests/${apiId(id)}/cancel',
      body: {'reason': reason},
    ),
    expected: id,
  );
  Future<List<Json>> upload(String id, UploadPart part) async => objects(
    await api.request(
      service,
      'POST',
      '/api/v1/cake-requests/${apiId(id)}/images',
      files: [part],
      multipart: true,
    ),
  );
  Future<void> deleteImage(String id, String imageId) async {
    await api.request(
      service,
      'DELETE',
      '/api/v1/cake-requests/${apiId(id)}/images/${apiId(imageId)}',
    );
  }

  Future<ApiPage> offers(Map<String, Object?> query) async => ApiPage.fromJson(
    await api.request(service, 'GET', '/api/v1/offers', query: query),
  );
  Future<Json> offer(String id) async => identified(
    await api.request(service, 'GET', '/api/v1/offers/${apiId(id)}'),
    expected: id,
  );
  Future<Json> createOffer(String id, Json body) async => mutationResult(
    api.request(
      service,
      'POST',
      '/api/v1/cake-requests/${apiId(id)}/offers',
      body: body,
    ),
  );
  Future<Json> editOffer(String id, Json body) async => mutationResult(
    api.request(service, 'PATCH', '/api/v1/offers/${apiId(id)}', body: body),
    expected: id,
  );
  Future<Json> withdraw(String id, String reason) async => mutationResult(
    api.request(
      service,
      'POST',
      '/api/v1/offers/${apiId(id)}/withdraw',
      body: {'reason': reason},
    ),
    expected: id,
  );
  Future<Json> accept(String id, Json body, String logicalKey) async {
    final result = object(
      await api.request(
        service,
        'POST',
        '/api/v1/offers/${apiId(id)}/accept',
        body: body,
        idempotencyKey: logicalKey,
      ),
    );
    if (result['offerId'] != id || result['offerStatus'] != 'ACCEPTED') {
      throw const ApiFailure(
        502,
        'Chưa xác nhận kết quả chấp nhận. Kiểm tra báo giá và danh sách đơn.',
        uncertain: true,
      );
    }
    apiId(result['orderId']);
    return result;
  }
}
