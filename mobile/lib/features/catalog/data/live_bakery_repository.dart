import '../../../core/api/api_client.dart';
import '../../../core/api/contracts.dart';
import '../../../core/api/environment.dart';
import '../../../core/api/transport.dart';

class LiveBakeryRepository {
  LiveBakeryRepository(this.api);
  final ApiClient api;
  static const service = ApiService.bakery;
  Future<Json?> onboarding() async {
    final value = await api.request(
      service,
      'GET',
      '/api/v1/bakeries/onboarding',
    );
    return value == null ? null : object(value);
  }

  Future<Json> submitOnboarding(Json body) async => object(
    await api.request(
      service,
      'POST',
      '/api/v1/bakeries/onboarding',
      body: body,
    ),
  );
  Future<void> complete(String id) async {
    await api.request(
      service,
      'POST',
      '/api/v1/bakeries/$id/onboarding/complete',
    );
  }

  Future<Json> create(Json body) async => object(
    await api.request(service, 'POST', '/api/v1/bakeries', body: body),
  );
  Future<Json> update(String id, Json body) async => object(
    await api.request(service, 'PATCH', '/api/v1/bakeries/$id', body: body),
  );
  Future<Json> operations(String id, Json body) async => object(
    await api.request(
      service,
      'PUT',
      '/api/v1/bakeries/$id/operations',
      body: body,
    ),
  );
  Future<Json> submit(String id) async => object(
    await api.request(
      service,
      'POST',
      '/api/v1/bakeries/$id/submit-for-approval',
    ),
  );
  Future<List<Json>> members(String id) async => objects(
    await api.request(service, 'GET', '/api/v1/bakeries/$id/members'),
  );
  Future<List<Json>> categories(String id) async => objects(
    await api.request(service, 'GET', '/api/v1/bakeries/$id/categories'),
  );
  Future<List<Json>> addOns(String id) async => objects(
    await api.request(service, 'GET', '/api/v1/bakeries/$id/add-ons'),
  );
  Future<ApiPage> products(
    String id, {
    Map<String, Object?> query = const {},
  }) async => ApiPage.fromJson(
    await api.request(
      service,
      'GET',
      '/api/v1/bakeries/$id/products',
      query: query,
    ),
  );
  Future<Json> saveCategory(
    String id,
    Json body, {
    String? categoryId,
  }) async => object(
    await api.request(
      service,
      categoryId == null ? 'POST' : 'PATCH',
      '/api/v1/bakeries/$id/categories${categoryId == null ? '' : '/$categoryId'}',
      body: body,
    ),
  );
  Future<void> deleteCategory(String id, String categoryId) async {
    await api.request(
      service,
      'DELETE',
      '/api/v1/bakeries/$id/categories/$categoryId',
    );
  }

  Future<Json> saveAddOn(String id, Json body, {String? addOnId}) async =>
      object(
        await api.request(
          service,
          addOnId == null ? 'POST' : 'PATCH',
          '/api/v1/bakeries/$id/add-ons${addOnId == null ? '' : '/$addOnId'}',
          body: body,
        ),
      );
  Future<void> deleteAddOn(String id, String addOnId) async {
    await api.request(
      service,
      'DELETE',
      '/api/v1/bakeries/$id/add-ons/$addOnId',
    );
  }

  Future<Json> saveProduct(
    String id,
    Json body, {
    String? productId,
  }) async => object(
    await api.request(
      service,
      productId == null ? 'POST' : 'PATCH',
      '/api/v1/bakeries/$id/products${productId == null ? '' : '/$productId'}',
      body: body,
    ),
  );
  Future<Json> productAction(String id, String productId, String action) async {
    if (!['publish', 'hide', 'archive'].contains(action)) {
      throw ArgumentError('Trạng thái không hợp lệ');
    }
    return object(
      await api.request(
        service,
        'POST',
        '/api/v1/bakeries/$id/products/$productId/$action',
      ),
    );
  }

  Future<Json> options(String id, String productId, Json body) async => object(
    await api.request(
      service,
      'PUT',
      '/api/v1/bakeries/$id/products/$productId/options',
      body: body,
    ),
  );
  Future<Object?> upload(
    String id,
    String suffix,
    List<UploadPart> files, {
    Map<String, String> fields = const {},
  }) => api.request(
    service,
    'POST',
    '/api/v1/bakeries/$id/$suffix',
    files: files,
    fields: fields,
  );
  Future<void> deleteImage(String id, String productId, String imageId) async {
    await api.request(
      service,
      'DELETE',
      '/api/v1/bakeries/$id/products/$productId/images/$imageId',
    );
  }

  Future<ApiPage> adminList({Map<String, Object?> query = const {}}) async =>
      ApiPage.fromJson(
        await api.request(
          service,
          'GET',
          '/api/v1/admin/bakeries',
          query: query,
        ),
      );
  Future<Json> adminDetail(String id) async =>
      object(await api.request(service, 'GET', '/api/v1/admin/bakeries/$id'));
  Future<Json> adminStatus(String id, String status) async => object(
    await api.request(
      service,
      'PATCH',
      '/api/v1/admin/bakeries/$id/status',
      body: {'status': status},
    ),
  );
}
