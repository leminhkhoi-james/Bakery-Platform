import '../../../core/api/api_client.dart';
import '../../../core/api/contracts.dart';
import '../../../core/api/environment.dart';
import '../../../core/api/phase5_contracts.dart';

Json addressResult(Object? value) {
  final address = identified(value);
  for (final field in [
    'label',
    'recipientName',
    'recipientPhone',
    'addressLine',
    'district',
    'city',
  ]) {
    requiredText(address, field);
  }
  if (address['isDefault'] is! bool) {
    throw const FormatException('Địa chỉ thiếu trạng thái mặc định.');
  }
  return address;
}

/// No address cache: account fencing is inherited from ApiClient.
class LiveAddressRepository {
  LiveAddressRepository(this.api);
  final ApiClient api;
  static const path = '/api/v1/users/me/addresses';
  Future<List<Json>> list() async {
    final result = objects(await api.request(ApiService.identity, 'GET', path))
        .map(addressResult)
        .toList();
    if (result.map((a) => a['id']).toSet().length != result.length) {
      throw const FormatException('Danh sách địa chỉ chứa ID trùng.');
    }
    return result;
  }

  Future<Json> get(String id) async {
    final result = addressResult(
      await api.request(ApiService.identity, 'GET', '$path/${apiId(id)}'),
    );
    if (result['id'] != id) {
      throw const FormatException('Dịch vụ trả sai địa chỉ.');
    }
    return result;
  }

  Future<Json> save(Json body, {String? id}) async {
    final value = await mutationResult(
      api.request(
        ApiService.identity,
        id == null ? 'POST' : 'PATCH',
        id == null ? path : '$path/${apiId(id)}',
        body: body,
      ),
      expected: id,
    );
    return addressResult(value);
  }

  Future<void> delete(String id) async {
    await api.request(ApiService.identity, 'DELETE', '$path/${apiId(id)}');
  }

  Future<Json> setDefault(String id) async => addressResult(
    await mutationResult(
      api.request(ApiService.identity, 'PUT', '$path/${apiId(id)}/default'),
      expected: id,
    ),
  );
}
