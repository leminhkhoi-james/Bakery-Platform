import 'dart:typed_data';

import 'package:flutter_test/flutter_test.dart';
import 'package:bakery_mobile/core/api/api_client.dart';
import 'package:bakery_mobile/core/api/contracts.dart';
import 'package:bakery_mobile/core/api/environment.dart';
import 'package:bakery_mobile/core/api/transport.dart';
import 'package:bakery_mobile/core/widgets/live_data.dart';
import 'package:bakery_mobile/features/auth/data/live_session.dart';
import 'package:bakery_mobile/features/reviews/data/live_review_repository.dart';
import 'package:bakery_mobile/features/ai/data/live_ai_repository.dart';
import 'package:bakery_mobile/features/marketplace/data/live_marketplace_repository.dart';

import 'api_foundation_test.dart'
    show FakeTransport, MemorySessionStore, seed, ok;

const id = '11111111-1111-4111-8111-111111111111',
    other = '22222222-2222-4222-8222-222222222222';
void main() {
  late FakeTransport t;
  late ApiClient api;
  late LiveSession session;
  setUp(() {
    t = FakeTransport();
    session = LiveSession(
      ApiEnvironment(
        identity: Uri.parse('http://127.0.0.1:1'),
        bakery: Uri.parse('http://127.0.0.1:2'),
        subscription: Uri.parse('http://127.0.0.1:3'),
        order: Uri.parse('http://127.0.0.1:4'),
        marketplace: Uri.parse('http://127.0.0.1:5'),
        cakeAi: Uri.parse('http://127.0.0.1:6'),
      ),
      t,
      MemorySessionStore(),
    );
    seed(session, expired: false);
    api = ApiClient(session);
  });
  tearDown(() => session.dispose());
  test(
    'local configuration failure is not an HTTP response or retryable outage',
    () {
      const failure = ApiFailure(
        503,
        'Configuration unavailable',
        kind: ApiFailureKind.configuration,
      );
      expect(failure.transient, false);
      expect(safeError(failure), isNot(contains('HTTP')));
    },
  );
  test(
    'malformed successful review is uncertain and never auto repeats',
    () async {
      t.respond = (m, u, h) async => ok(null);
      await expectLater(
        LiveReviewRepository(api).create(id, 5, ''),
        throwsA(
          isA<ApiFailure>().having((e) => e.uncertain, 'uncertain', true),
        ),
      );
      expect(t.calls.length, 1);
    },
  );
  test(
    'review uses orderId response key and validates returned ownership',
    () async {
      t.respond = (m, u, h) async => ok({'orderId': id, 'status': 'PUBLISHED'});
      final r = LiveReviewRepository(api);
      expect((await r.create(id, 5, 'Good'))['orderId'], id);
      t.respond = (m, u, h) async =>
          ok({'orderId': other, 'status': 'PUBLISHED'});
      await expectLater(
        r.update(id, 4, 'Changed'),
        throwsA(
          isA<ApiFailure>().having((e) => e.uncertain, 'uncertain', true),
        ),
      );
    },
  );
  test(
    'review rejects out of range rating and oversized comment without HTTP',
    () {
      for (final rating in [0, 6]) {
        expect(
          () => LiveReviewRepository.payload(rating, ''),
          throwsFormatException,
        );
      }
      expect(
        () => LiveReviewRepository.payload(3, 'x' * 5001),
        throwsFormatException,
      );
      expect(t.calls, isEmpty);
    },
  );
  test('review delete accepts 204, moderation sends status field', () async {
    t.respond = (m, u, h) async => m == 'DELETE'
        ? WireResponse(204, null, [])
        : ok({'orderId': id, 'status': 'HIDDEN'});
    final r = LiveReviewRepository(api);
    await r.delete(id);
    await r.moderate(id, 'HIDDEN');
    expect(t.calls.last['body'], {'status': 'HIDDEN'});
    expect(() => r.moderate(id, 'DELETED'), throwsFormatException);
  });
  test('review definitive 409 does not auto retry', () async {
    t.respond = (m, u, h) async => WireResponse(409, null, []);
    await expectLater(
      LiveReviewRepository(api).create(id, 5, ''),
      throwsA(isA<ApiFailure>().having((e) => e.uncertain, 'uncertain', false)),
    );
    expect(t.calls.length, 1);
  });
  test(
    'AI normalizes zero based page without using common backend page shape',
    () async {
      t.respond = (m, u, h) async => ok({
        'content': <Json>[],
        'page': 1,
        'size': 20,
        'totalElements': 42,
        'totalPages': 3,
      });
      final p = await LiveAiRepository(api).list(2, 'FAILED', requestId: id);
      expect(p.page, 2);
      expect(p.hasNext, true);
      expect((t.calls.single['uri'] as Uri).queryParameters, {
        'page': '1',
        'size': '20',
        'status': 'FAILED',
        'cakeRequestId': id,
      });
    },
  );
  test('AI detail validates nested job id and design list', () async {
    t.respond = (m, u, h) async => ok({
      'job': {'id': id},
      'promptRevisions': <Json>[],
      'sourceImages': <Json>[],
      'generatedDesigns': <Json>[],
    });
    expect((await LiveAiRepository(api).detail(id))['job'], {'id': id});
    t.respond = (m, u, h) async => ok({
      'job': {'id': other},
    });
    await expectLater(LiveAiRepository(api).detail(id), throwsFormatException);
  });
  test('AI limits match validated generation parameters', () {
    for (final count in [0, 5]) {
      expect(
        () => LiveAiRepository.prompt('Cake', '', '1:1', count),
        throwsFormatException,
      );
    }
    expect(
      () => LiveAiRepository.prompt('Cake', '', '16:9', 1),
      throwsFormatException,
    );
    expect(
      () => LiveAiRepository.prompt('', '', '1:1', 1),
      throwsFormatException,
    );
    expect(
      LiveAiRepository.prompt('Cake', '', '3:4', 4)['generationParameters'],
      {'aspectRatio': '3:4', 'numberOfDesigns': 4},
    );
  });
  test('AI create and revision retain caller logical keys and never auto retry 503', () async {
    t.respond = (m, u, h) async => WireResponse(503, null, []);
    final r = LiveAiRepository(api),
        body = LiveAiRepository.prompt('Cake', '', '1:1', 1);
    await expectLater(
      r.create(id, body, [], other),
      throwsA(isA<ApiFailure>().having((e) => e.uncertain, 'uncertain', true)),
    );
    await expectLater(r.revise(id, body, other), throwsA(isA<ApiFailure>()));
    expect(t.calls.length, 2);
    expect(
      t.calls.map((c) => (c['headers'] as Map)['Idempotency-Key']).toSet(),
      {other},
    );
  });
  test('AI refuses invalid image field, mime, and count before HTTP', () async {
    final r = LiveAiRepository(api),
        body = LiveAiRepository.prompt('Cake', '', '1:1', 1);
    await expectLater(
      r.create(id, body, [
        UploadPart('file', 'x.txt', 'text/plain', Uint8List(1)),
      ], other),
      throwsFormatException,
    );
    await expectLater(
      r.create(
        id,
        body,
        List.generate(
          6,
          (_) => UploadPart('sourceImages', 'x.png', 'image/png', Uint8List(1)),
        ),
        other,
      ),
      throwsFormatException,
    );
    expect(t.calls, isEmpty);
  });
  test(
    'AI cancel and moderate use exact public paths and moderationStatus',
    () async {
      t.respond = (m, u, h) async => ok({'id': id});
      final r = LiveAiRepository(api);
      await r.cancel(id);
      await r.moderate(id, 'APPROVED');
      await r.design(id);
      expect(
        (t.calls.first['uri'] as Uri).path,
        '/api/v1/generation-jobs/$id/cancel',
      );
      expect(t.calls[1]['body'], {'moderationStatus': 'APPROVED'});
      expect(() => r.moderate(id, 'PENDING'), throwsFormatException);
    },
  );
  test(
    'selected design uses generatedDesignId and rejects mismatched RFQ',
    () async {
      t.respond = (m, u, h) async => ok({'id': id});
      await LiveMarketplaceRepository(api).selectDesign(id, other);
      expect(t.calls.single['method'], 'PUT');
      expect(t.calls.single['body'], {'generatedDesignId': other});
      t.respond = (m, u, h) async => ok({'id': other});
      await expectLater(
        LiveMarketplaceRepository(api).selectDesign(id, other),
        throwsA(isA<ApiFailure>()),
      );
    },
  );
  test(
    'missing AI origin remains explicit 503 and cannot send to another service',
    () async {
      final e = ApiEnvironment(
        identity: Uri.parse('http://127.0.0.1:1'),
        bakery: Uri.parse('http://127.0.0.1:2'),
        subscription: Uri.parse('http://127.0.0.1:3'),
      );
      expect(
        () => e.origin(ApiService.cakeAi),
        throwsA(isA<ApiFailure>().having((e) => e.status, 'status', 503)),
      );
    },
  );
}
