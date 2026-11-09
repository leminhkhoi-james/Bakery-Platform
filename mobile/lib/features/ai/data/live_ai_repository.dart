import '../../../core/api/api_client.dart';
import '../../../core/api/contracts.dart';
import '../../../core/api/environment.dart';
import '../../../core/api/phase5_contracts.dart';
import '../../../core/api/transport.dart';

const aiStatuses = ['QUEUED', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'CANCELLED'];

class LiveAiRepository {
  LiveAiRepository(this.api);
  final ApiClient api;
  static Json prompt(String text, String negative, String ratio, int count) {
    if (text.trim().isEmpty ||
        text.length > 4000 ||
        negative.length > 2000 ||
        !['1:1', '4:3', '3:4'].contains(ratio) ||
        count < 1 ||
        count > 4) {
      throw const FormatException('Thông số tạo thiết kế không hợp lệ.');
    }
    return {
      'prompt': text.trim(),
      'negativePrompt': negative,
      'generationParameters': {'aspectRatio': ratio, 'numberOfDesigns': count},
    };
  }

  Future<ApiPage> list(int page, String? status, {String? requestId}) async {
    final v = object(
      await api.request(
        ApiService.cakeAi,
        'GET',
        '/api/v1/generation-jobs',
        query: {
          'page': page - 1,
          'size': 20,
          'status': status,
          'cakeRequestId': requestId,
        },
      ),
    );
    if (v['page'] is! int ||
        v['page'] < 0 ||
        v['totalPages'] is! int ||
        v['totalElements'] is! int) {
      throw const FormatException('Phân trang AI không hợp lệ.');
    }
    return ApiPage.fromJson({
      'result': objects(v['content']),
      'meta': {
        'page': v['page'] + 1,
        'pages': v['totalPages'],
        'total': v['totalElements'],
      },
    });
  }

  Future<Json> detail(String id) async {
    final v = object(
      await api.request(
        ApiService.cakeAi,
        'GET',
        '/api/v1/generation-jobs/${apiId(id)}',
      ),
    );
    identified(v['job'], expected: id);
    objects(v['promptRevisions']);
    objects(v['generatedDesigns']);
    objects(v['sourceImages']);
    return v;
  }

  Future<Json> create(
    String requestId,
    Json body,
    List<UploadPart> images,
    String key,
  ) async {
    if (images.length > 5 ||
        images.any(
          (p) =>
              p.field != 'sourceImages' ||
              p.bytes.length > 10 * 1024 * 1024 ||
              !['image/jpeg', 'image/png', 'image/webp'].contains(p.mime),
        )) {
      throw const FormatException(
        'Tối đa 5 ảnh JPEG/PNG/WebP, mỗi ảnh 10 MiB.',
      );
    }
    return mutationResult(
      api.request(
        ApiService.cakeAi,
        'POST',
        '/api/v1/generation-jobs',
        body: {...body, 'cakeRequestId': apiId(requestId)},
        files: images,
        multipart: true,
        idempotencyKey: key,
      ),
    );
  }

  Future<Json> revise(String id, Json body, String key) => mutationResult(
    api.request(
      ApiService.cakeAi,
      'POST',
      '/api/v1/generation-jobs/${apiId(id)}/prompt-revisions',
      body: body,
      idempotencyKey: key,
    ),
    expected: id,
  );
  Future<Json> cancel(String id) => mutationResult(
    api.request(
      ApiService.cakeAi,
      'POST',
      '/api/v1/generation-jobs/${apiId(id)}/cancel',
    ),
    expected: id,
  );
  Future<Json> design(String id) async => identified(
    await api.request(
      ApiService.cakeAi,
      'GET',
      '/api/v1/generated-designs/${apiId(id)}',
    ),
    expected: id,
  );
  Future<ApiPage> moderationQueue(int page, String? status) async {
    final v = object(
      await api.request(
        ApiService.cakeAi,
        'GET',
        '/api/v1/admin/generated-designs',
        query: {'page': page - 1, 'size': 20, 'status': status ?? 'ALL'},
      ),
    );
    return ApiPage.fromJson({
      'result': objects(v['content']),
      'meta': {
        'page': (v['page'] as int) + 1,
        'pages': v['totalPages'],
        'total': v['totalElements'],
      },
    });
  }

  Future<Json> moderate(String id, String status, {String? reason}) {
    if (!['APPROVED', 'REJECTED'].contains(status)) {
      throw const FormatException('Trạng thái duyệt không hợp lệ.');
    }
    return mutationResult(
      api.request(
        ApiService.cakeAi,
        'PATCH',
        '/api/v1/admin/generated-designs/${apiId(id)}/moderation',
        body: {'moderationStatus': status, 'reason': ?reason},
      ),
      expected: id,
    );
  }
}
