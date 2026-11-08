import 'dart:async';

import 'package:bakery_mobile/core/api/api_client.dart';
import 'package:bakery_mobile/core/api/contracts.dart';
import 'package:bakery_mobile/core/api/environment.dart';
import 'package:bakery_mobile/core/api/transport.dart';
import 'package:bakery_mobile/features/auth/data/live_session.dart';
import 'package:bakery_mobile/features/auth/data/session_store.dart';
import 'package:flutter_test/flutter_test.dart';

class MemorySessionStore implements SessionStore {
  String? value;
  @override
  Future<String?> read() async => value;
  @override
  Future<void> write(String? value) async {
    this.value = value;
  }
}

class FakeTransport implements ApiTransport {
  final List<Map<String, Object?>> calls = [];
  final List<int> cancelled = [];
  late Future<WireResponse> Function(String, Uri, Map<String, String>) respond;
  @override
  Future<WireResponse> send(
    String method,
    Uri uri, {
    Map<String, String> headers = const {},
    Object? body,
    List<UploadPart> files = const [],
    Map<String, String> fields = const {},
    bool multipart = false,
    int? scope,
  }) {
    calls.add({
      'method': method,
      'uri': uri,
      'headers': headers,
      'body': body,
      'scope': scope,
    });
    return respond(method, uri, headers);
  }

  @override
  void cancel(int scope) => cancelled.add(scope);
  @override
  void close() {}
}

ApiEnvironment environment() => ApiEnvironment(
  identity: Uri.parse('http://127.0.0.1:18091'),
  bakery: Uri.parse('http://127.0.0.1:18092'),
  subscription: Uri.parse('http://127.0.0.1:18094'),
);
WireResponse ok(Object? data, {List<String> cookies = const []}) =>
    WireResponse(200, {'statusCode': 200, 'data': data}, cookies);
String cookie(String value) =>
    'refresh_token=$value; Path=/api/v1/auth; Max-Age=3600; HttpOnly; SameSite=Lax';
void seed(LiveSession s, {bool expired = true}) {
  s.accessToken = 'unit-access';
  s.expiresAt = DateTime.now().add(Duration(minutes: expired ? -1 : 15));
  s.cookie = RefreshCookie.receive(
    cookie('unit-refresh'),
    s.environment.identity,
    DateTime.now(),
  );
}

void main() {
  test('fresh session instances restore serialized cookies and persist each rotation', () async {
    final store = MemorySessionStore(), t = FakeTransport();
    final initial = LiveSession(environment(), t, store);
    seed(initial, expired: false);
    store.value = encodeSession(
      initial.accessToken!,
      initial.expiresAt!,
      initial.cookie,
      initial.environment.identity,
    );
    var rotations = 0;
    t.respond = (m, u, h) async {
      if (u.path.endsWith('/refresh')) {
        rotations++;
        return ok(
          {
            'accessToken': 'rotation-$rotations',
            'tokenType': 'Bearer',
            'expiresIn': 900,
          },
          cookies: [cookie('rotation-$rotations')],
        );
      }
      return ok({
        'id': 'restored-user',
        'roles': ['CUSTOMER', 'BAKERY_OWNER'],
      });
    };
    for (var n = 1; n <= 2; n++) {
      final next = LiveSession(environment(), t, store);
      await next.restore();
      expect(next.hasRole('BAKERY_OWNER'), true);
      expect(next.accessToken, 'rotation-$n');
      expect(store.value, contains('rotation-$n'));
      expect(next.restoring, false);
      next.dispose();
    }
    expect(rotations, 2);
    initial.dispose();
  });
  test('bakery invalidation cancels private work without cancelling Identity rotation', () async {
    final t = FakeTransport(),
        s = LiveSession(environment(), FakeTransport(), MemorySessionStore());
    s.dispose();
    final session = LiveSession(environment(), t, MemorySessionStore());
    seed(session);
    final gate = Completer<WireResponse>();
    t.respond = (m, u, h) async =>
        u.path.endsWith('/refresh') ? gate.future : ok(null);
    final api = ApiClient(session), refresh = session.refresh();
    await Future<void>.delayed(Duration.zero);
    final rotationScope = t.calls.single['scope'];
    api.invalidate();
    expect(t.cancelled, contains(-1));
    expect(t.cancelled, isNot(contains(rotationScope)));
    gate.complete(
      ok(
        {'accessToken': 'rotated', 'tokenType': 'Bearer', 'expiresIn': 900},
        cookies: [cookie('next')],
      ),
    );
    await refresh;
    expect(session.accessToken, 'rotated');
    session.dispose();
  });
  test('malformed successful mutation is uncertain and is never repeated automatically', () async {
    final t = FakeTransport();
    final s = LiveSession(environment(), t, MemorySessionStore());
    seed(s, expired: false);
    t.respond = (m, u, h) async => WireResponse(201, [], []);
    await expectLater(
      ApiClient(s).request(
        ApiService.bakery,
        'POST',
        '/api/v1/bakeries',
        body: {'name': 'local'},
      ),
      throwsA(isA<ApiFailure>().having((e) => e.uncertain, 'uncertain', true)),
    );
    expect(t.calls.length, 1);
    s.dispose();
  });
  test('invalid cookie cannot partially replace a valid rotation', () async {
    final t = FakeTransport(),
        s = LiveSession(environment(), FakeTransport(), MemorySessionStore());
    s.dispose();
    final session = LiveSession(environment(), t, MemorySessionStore());
    seed(session);
    t.respond = (m, u, h) async => ok({
      'accessToken': 'incomplete',
      'tokenType': 'Bearer',
      'expiresIn': 900,
    });
    await expectLater(session.refresh(), throwsFormatException);
    expect(session.accessToken, 'unit-access');
    expect(session.cookie!.raw, contains('unit-refresh'));
    session.dispose();
  });
  test('logout sends both legitimate JWT and scoped cookie then clears local session', () async {
    final t = FakeTransport(), store = MemorySessionStore();
    final s = LiveSession(environment(), t, store);
    seed(s, expired: false);
    t.respond = (m, u, h) async => ok(null);
    await s.logout();
    final headers = t.calls.single['headers'] as Map;
    expect(headers['Authorization'], 'Bearer unit-access');
    expect(headers['Cookie'], 'refresh_token=unit-refresh');
    expect(s.accessToken, isNull);
    expect(store.value, isNull);
    expect(s.notice, contains('server'));
    s.dispose();
  });
  test('decimal money retains precision and rejects invalid values', () {
    expect(Money.parse('9999999999.99').decimal, '9999999999.99');
    expect(Money.parse('-0.01').minor, BigInt.from(-1));
    expect(Money.parse('123456.70').display(), '123.456,70 VND');
    for (final s in ['NaN', '1e3', '1.234', 'null']) {
      expect(() => Money.parse(s), throwsFormatException);
    }
  });
  test(
    'page and public DTO reject fixture shapes and use server identifiers',
    () {
      final p = ApiPage.fromJson({
        'meta': {'page': 2, 'pageSize': 1, 'pages': 3, 'total': 3},
        'result': [
          {'id': 'server-id'},
        ],
      });
      expect(p.page, 2);
      expect(p.hasNext, true);
      expect(p.items.single['id'], 'server-id');
      expect(() => ApiPage.fromJson({'items': []}), throwsFormatException);
      expect(WireResponse(204, null, []).data, isNull);
      expect(() => WireResponse(200, [], []).data, throwsFormatException);
    },
  );
  test('refresh cookie enforces port, path boundary, expiry and Secure without stripping attributes', () {
    final now = DateTime.now(), identity = environment().identity;
    final c = RefreshCookie.receive(cookie('opaque'), identity, now);
    expect(
      c.header(identity.resolve('/api/v1/auth/refresh'), now),
      'refresh_token=opaque',
    );
    expect(
      c.header(Uri.parse('http://127.0.0.1:18092/api/v1/auth/refresh'), now),
      isNull,
    );
    expect(c.header(identity.resolve('/api/v1/auth-other'), now), isNull);
    expect(
      c.header(
        identity.resolve('/api/v1/auth/refresh'),
        now.add(const Duration(hours: 2)),
      ),
      isNull,
    );
    final secure = RefreshCookie.receive(
      '${cookie('secure')}; Secure',
      identity,
      now,
    );
    expect(
      secure.header(identity.resolve('/api/v1/auth/refresh'), now),
      isNull,
    );
    expect(RefreshCookie.decode(secure.toJson()).raw, contains('Secure'));
  });
  test('concurrent expired requests share exactly one rotation and cookies never reach Bakery', () async {
    final t = FakeTransport(),
        s = LiveSession(environment(), FakeTransport(), MemorySessionStore());
    s.dispose();
    final session = LiveSession(environment(), t, MemorySessionStore());
    seed(session);
    final gate = Completer<WireResponse>();
    t.respond = (m, u, h) async {
      if (u.path.endsWith('/refresh')) return gate.future;
      return ok({'id': 'server-record'});
    };
    final api = ApiClient(session);
    final tasks = List.generate(
      8,
      (_) => api.request(
        ApiService.bakery,
        'GET',
        '/api/v1/bakeries/id/categories',
      ),
    );
    await Future<void>.delayed(Duration.zero);
    expect(
      t.calls.where((c) => (c['uri'] as Uri).path.endsWith('/refresh')).length,
      1,
    );
    gate.complete(
      ok(
        {'accessToken': 'rotated', 'tokenType': 'Bearer', 'expiresIn': 900},
        cookies: [cookie('rotated-refresh')],
      ),
    );
    await Future.wait(tasks);
    for (final call in t.calls.where((c) => (c['uri'] as Uri).port == 18092)) {
      expect((call['headers'] as Map)['Authorization'], 'Bearer rotated');
      expect((call['headers'] as Map).containsKey('Cookie'), false);
    }
    expect(session.cookie!.raw, contains('rotated-refresh'));
    session.dispose();
  });
  test(
    'late refresh cannot restore access or secure storage after logout',
    () async {
      final t = FakeTransport(),
          store = MemorySessionStore(),
          s = LiveSession(environment(), FakeTransport(), MemorySessionStore());
      s.dispose();
      final session = LiveSession(environment(), t, store);
      seed(session);
      final gate = Completer<WireResponse>();
      t.respond = (m, u, h) async =>
          u.path.endsWith('/refresh') ? gate.future : ok(null);
      final refresh = session.refresh();
      final rejected = expectLater(refresh, throwsA(isA<ApiFailure>()));
      await session.logout();
      gate.complete(
        ok(
          {'accessToken': 'late', 'tokenType': 'Bearer', 'expiresIn': 900},
          cookies: [cookie('late')],
        ),
      );
      await rejected;
      expect(session.accessToken, isNull);
      expect(session.cookie, isNull);
      expect(store.value, isNull);
      session.dispose();
    },
  );
  test('transient refresh preserves recoverable session; invalid rotation clears it', () async {
    final t = FakeTransport(),
        store = MemorySessionStore(),
        s = LiveSession(environment(), t, MemorySessionStore());
    seed(s);
    t.respond = (m, u, h) async => throw const ApiFailure(0, 'offline');
    await expectLater(s.refresh(), throwsA(isA<ApiFailure>()));
    expect(s.cookie, isNotNull);
    expect(s.accessToken, 'unit-access');
    t.respond = (m, u, h) async =>
        WireResponse(401, {'statusCode': 401, 'data': null}, []);
    await expectLater(s.refresh(), throwsA(isA<ApiFailure>()));
    expect(s.accessToken, isNull);
    expect(store.value, isNull);
    s.dispose();
  });
  test('anonymous GET has no credentials; bounded GET retry; no mutation retry or 403 refresh', () async {
    final t = FakeTransport(),
        s = LiveSession(environment(), FakeTransport(), MemorySessionStore());
    s.dispose();
    final session = LiveSession(environment(), t, MemorySessionStore());
    seed(session, expired: false);
    final api = ApiClient(session);
    t.respond = (m, u, h) async => throw const ApiFailure(0, 'offline');
    await expectLater(
      api.request(
        ApiService.bakery,
        'GET',
        '/api/v1/products',
        authenticated: false,
      ),
      throwsA(isA<ApiFailure>()),
    );
    expect(t.calls.length, 2);
    expect(t.calls.first['headers'], isEmpty);
    t.calls.clear();
    await expectLater(
      api.request(
        ApiService.bakery,
        'POST',
        '/api/v1/bakeries',
        body: {'name': 'x'},
      ),
      throwsA(isA<ApiFailure>()),
    );
    expect(t.calls.length, 1);
    t.calls.clear();
    t.respond = (m, u, h) async =>
        WireResponse(403, {'statusCode': 403, 'data': null}, []);
    await expectLater(
      api.request(ApiService.bakery, 'GET', '/api/v1/bakeries/id/members'),
      throwsA(isA<ApiFailure>()),
    );
    expect(t.calls.length, 1);
    session.dispose();
  });
  test('idempotency keeps UUID across uncertain retry and changes with payload/context', () async {
    final t = FakeTransport(),
        s = LiveSession(environment(), t, MemorySessionStore());
    seed(s, expired: false);
    final api = ApiClient(s);
    t.respond = (m, u, h) async =>
        throw const ApiFailure(0, 'uncertain', uncertain: true);
    Future<void> submit(String plan) async {
      await expectLater(
        api.request(
          ApiService.subscription,
          'POST',
          '/api/v1/bakeries/id/subscription-orders',
          body: {'planId': plan},
          idempotent: true,
        ),
        throwsA(isA<ApiFailure>()),
      );
    }

    await submit('a');
    await submit('a');
    await submit('b');
    String key(int n) =>
        (t.calls[n]['headers'] as Map)['Idempotency-Key'] as String;
    expect(key(0), key(1));
    expect(key(2), isNot(key(0)));
    expect(key(0), matches(RegExp(r'^[0-9a-f-]{36}$')));
    api.invalidate();
    await submit('a');
    expect(key(3), isNot(key(0)));
    s.dispose();
  });
  test('account/bakery fence rejects a late private response', () async {
    final t = FakeTransport(),
        s = LiveSession(environment(), t, MemorySessionStore());
    seed(s, expired: false);
    final api = ApiClient(s), gate = Completer<WireResponse>();
    t.respond = (m, u, h) => gate.future;
    final request = api.request(
      ApiService.bakery,
      'GET',
      '/api/v1/bakeries/id/products',
    );
    final assertion = expectLater(request, throwsA(isA<ApiFailure>()));
    await Future<void>.delayed(Duration.zero);
    api.invalidate();
    gate.complete(ok({'id': 'old-private'}));
    await assertion;
    s.dispose();
  });
}
