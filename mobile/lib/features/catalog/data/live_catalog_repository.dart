import '../../../core/api/api_client.dart';
import '../../../core/api/contracts.dart';
import '../../../core/api/environment.dart';

class LiveCatalogRepository {
  LiveCatalogRepository(this.api);
  final ApiClient api;
  Future<ApiPage> products({Map<String, Object?> query = const {}}) async =>
      ApiPage.fromJson(
        await api.request(
          ApiService.bakery,
          'GET',
          '/api/v1/products',
          query: query,
          authenticated: false,
        ),
      );
  Future<PublicProduct> product(String id) async => PublicProduct.fromJson(
    await api.request(
      ApiService.bakery,
      'GET',
      '/api/v1/products/$id',
      authenticated: false,
    ),
  );
  Future<ApiPage> bakeries({Map<String, Object?> query = const {}}) async =>
      ApiPage.fromJson(
        await api.request(
          ApiService.bakery,
          'GET',
          '/api/v1/bakeries',
          query: query,
          authenticated: false,
        ),
      );
  Future<Json> bakery(String id) async {
    final value = object(
      await api.request(
        ApiService.bakery,
        'GET',
        '/api/v1/bakeries/$id',
        authenticated: false,
      ),
    );
    requiredText(value, 'id');
    requiredText(value, 'name');
    return value;
  }
}
