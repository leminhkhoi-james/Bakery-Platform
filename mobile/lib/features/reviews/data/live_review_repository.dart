import '../../../core/api/api_client.dart';
import '../../../core/api/contracts.dart';
import '../../../core/api/environment.dart';
import '../../../core/api/phase5_contracts.dart';

class LiveReviewRepository {
  LiveReviewRepository(this.api);
  final ApiClient api;
  static Json payload(int rating, String comment) {
    if (rating < 1 || rating > 5 || comment.length > 5000) {
      throw const FormatException(
        'Chọn từ 1 đến 5 sao; nhận xét tối đa 5000 ký tự.',
      );
    }
    return {'rating': rating, 'comment': comment};
  }

  Future<Json> _write(String method, String path, String id, Json body) async {
    final response = await api.request(
      ApiService.order,
      method,
      path,
      body: body,
    );
    Json value;
    try {
      value = object(response);
    } on FormatException {
      throw const ApiFailure(
        502,
        'Chưa đọc được kết quả đánh giá. Làm mới đơn trước khi thử lại.',
        uncertain: true,
        kind: ApiFailureKind.invalidResponse,
      );
    }
    if (value['orderId'] != id ||
        ![
          'PENDING',
          'PUBLISHED',
          'HIDDEN',
          'DELETED',
        ].contains(value['status'])) {
      throw const ApiFailure(
        502,
        'Chưa xác nhận đánh giá. Làm mới đơn để đối chiếu.',
        uncertain: true,
        kind: ApiFailureKind.invalidResponse,
      );
    }
    return value;
  }

  Future<Json> create(String id, int rating, String comment) => _write(
    'POST',
    '/api/v1/orders/${apiId(id)}/review',
    id,
    payload(rating, comment),
  );
  Future<Json> update(String id, int rating, String comment) => _write(
    'PATCH',
    '/api/v1/orders/${apiId(id)}/review',
    id,
    payload(rating, comment),
  );
  Future<void> delete(String id) async {
    await api.request(
      ApiService.order,
      'DELETE',
      '/api/v1/orders/${apiId(id)}/review',
    );
  }

  Future<Json> moderate(String id, String status) {
    if (!['PUBLISHED', 'HIDDEN'].contains(status)) {
      throw const FormatException('Trạng thái duyệt không hợp lệ.');
    }
    return _write('PATCH', '/api/v1/admin/reviews/${apiId(id)}/status', id, {
      'status': status,
    });
  }
}
