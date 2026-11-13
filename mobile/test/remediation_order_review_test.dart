import 'package:bakery_mobile/core/api/api_client.dart';
import 'package:bakery_mobile/core/api/environment.dart';
import 'package:bakery_mobile/core/api/phase5_contracts.dart';
import 'package:bakery_mobile/features/auth/data/live_session.dart';
import 'package:bakery_mobile/features/reviews/data/live_review_repository.dart';
import 'package:flutter_test/flutter_test.dart';

import 'remediation_test_support.dart'
    show FakeTransport, MemorySessionStore, ok, seed;

void main() {
  test(
    'owning customer completes delivering order; owner and stranger cannot',
    () {
      expect(orderActions('DELIVERING', owner: false, customer: true), [
        'COMPLETED',
      ]);
      expect(orderActions('DELIVERING', owner: true, customer: false), isEmpty);
      expect(
        orderActions('DELIVERING', owner: false, customer: false),
        isEmpty,
      );
      expect(orderActions('READY', owner: false, customer: true), isEmpty);
      expect(orderActions('COMPLETED', owner: false, customer: true), isEmpty);
    },
  );

  test('create and edit retain the authoritative PENDING review without resubmitting', () async {
    const orderId = '11111111-1111-4111-8111-111111111111';
    final transport = FakeTransport();
    final session = LiveSession(
      ApiEnvironment(
        identity: Uri.parse('http://127.0.0.1:1'),
        bakery: Uri.parse('http://127.0.0.1:2'),
        subscription: Uri.parse('http://127.0.0.1:3'),
        order: Uri.parse('http://127.0.0.1:4'),
      ),
      transport,
      MemorySessionStore(),
    );
    seed(session, expired: false);
    addTearDown(session.dispose);
    transport.respond = (method, uri, headers) async => ok({
      'orderId': orderId,
      'status': 'PENDING',
      'rating': 5,
      'comment': 'Bánh ngon',
    });
    final repository = LiveReviewRepository(ApiClient(session));
    expect(
      (await repository.create(orderId, 5, 'Bánh ngon'))['status'],
      'PENDING',
    );
    expect(
      (await repository.update(orderId, 5, 'Bánh ngon'))['status'],
      'PENDING',
    );
    expect(transport.calls.length, 2);
  });
}
