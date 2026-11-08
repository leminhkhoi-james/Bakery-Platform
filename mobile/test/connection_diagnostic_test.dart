import 'dart:async';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:bakery_mobile/core/api/contracts.dart';
import 'package:bakery_mobile/core/api/transport.dart';
import 'package:bakery_mobile/features/auth/data/live_session.dart';

import 'api_foundation_test.dart'
    show FakeTransport, MemorySessionStore, environment;

class LocalHttpOverrides extends HttpOverrides {}

void main() {
  test(
    'refused connection before HTTP send is recoverable, not uncertain',
    () async {
      await HttpOverrides.runWithHttpOverrides(() async {
        final socket = await ServerSocket.bind(InternetAddress.loopbackIPv4, 0);
        final port = socket.port;
        await socket.close();
        final t = NativeTransport();
        await expectLater(
          t.send(
            'POST',
            Uri.parse('http://127.0.0.1:$port/api/v1/auth/register'),
            body: {'synthetic': true},
          ),
          throwsA(
            isA<ApiFailure>()
                .having((e) => e.uncertain, 'uncertain', false)
                .having((e) => e.kind, 'kind', ApiFailureKind.connection),
          ),
        );
        t.close();
      }, LocalHttpOverrides());
    },
  );
  test('response timeout after HTTP body reached server remains uncertain, no replay', () async {
    await HttpOverrides.runWithHttpOverrides(() async {
      final server = await HttpServer.bind(InternetAddress.loopbackIPv4, 0);
      final reached = Completer<void>();
      var requests = 0;
      server.listen((r) async {
        await r.drain<void>();
        requests++;
        reached.complete();
      });
      final t = NativeTransport(timeout: const Duration(milliseconds: 250));
      await expectLater(
        t.send(
          'POST',
          Uri.parse('http://127.0.0.1:${server.port}/api/v1/auth/register'),
          body: {'synthetic': true},
        ),
        throwsA(
          isA<ApiFailure>()
              .having((e) => e.uncertain, 'uncertain', true)
              .having((e) => e.kind, 'kind', ApiFailureKind.timeout),
        ),
      );
      await reached.future;
      expect(requests, 1);
      t.close();
      await server.close(force: true);
    }, LocalHttpOverrides());
  });
  for (final status in [400, 201]) {
    test(
      'malformed HTTP $status preserves known status and classifies mutation outcome',
      () async {
        await HttpOverrides.runWithHttpOverrides(() async {
          final server = await HttpServer.bind(InternetAddress.loopbackIPv4, 0);
          server.listen((r) async {
            await r.drain<void>();
            r.response.statusCode = status;
            r.response.write('not-json');
            await r.response.close();
          });
          final t = NativeTransport();
          await expectLater(
            t.send(
              'POST',
              Uri.parse('http://127.0.0.1:${server.port}/api/v1/auth/register'),
              body: {'synthetic': true},
            ),
            throwsA(
              isA<ApiFailure>()
                  .having((e) => e.responseStatus, 'HTTP received', status)
                  .having((e) => e.uncertain, 'uncertain', status == 201)
                  .having(
                    (e) => e.kind,
                    'kind',
                    ApiFailureKind.invalidResponse,
                  ),
            ),
          );
          t.close();
          await server.close(force: true);
        }, LocalHttpOverrides());
      },
    );
  }
  test('registration HTTP conflict is definite while server 5xx may have committed', () async {
    final t = FakeTransport(),
        s = LiveSession(environment(), FakeTransport(), MemorySessionStore());
    s.dispose();
    final session = LiveSession(environment(), t, MemorySessionStore());
    for (final status in [409, 500]) {
      t.respond = (m, u, h) async =>
          WireResponse(status, {'statusCode': status, 'data': null}, []);
      await expectLater(
        session.register({'synthetic': true}),
        throwsA(
          isA<ApiFailure>()
              .having((e) => e.status, 'HTTP', status)
              .having((e) => e.uncertain, 'uncertain', status == 500),
        ),
      );
    }
    expect(t.calls.length, 2);
    session.dispose();
  });
}
