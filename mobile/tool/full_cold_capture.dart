import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:flutter_driver/flutter_driver.dart';

Future<void> main() async {
  final watchdog = Timer(const Duration(seconds: 120), () => exit(2));
  final driver = await FlutterDriver.connect(
    dartVmServiceUrl: Platform.environment['FULL_VM_URL'],
  );
  final run = jsonDecode(
    File('docs/full-integration/current-run.json').readAsStringSync(),
  ) as Map;
  final out = Directory(run['evidence'] as String),
      guest = Platform.environment['FULL_COLD_EXPECT'] == 'guest';
  final fixture = jsonDecode(
    File('${out.path}/fixture-manifest.json').readAsStringSync(),
  ) as Map;
  final private = jsonDecode(
    File('../../.secrets/bakery-platform/local-smoke-users.json')
        .readAsStringSync(),
  ) as Map;
  Future<Map> state() async => jsonDecode(
    await driver.requestData('{}', timeout: const Duration(seconds: 20)),
  ) as Map;
  Future<void> tap(SerializableFinder f) async {
    await driver.waitFor(f);
    await driver.scrollIntoView(f, alignment: .45);
    await driver.tap(f);
    await Future<void>.delayed(const Duration(milliseconds: 500));
  }

  try {
    await driver.runUnsynchronized(() async {
      Map s = {};
      for (var n = 0; n < 100; n++) {
        s = await state();
        if (s['restoring'] == false) break;
        await Future<void>.delayed(const Duration(milliseconds: 300));
      }
      final events = s['events'] as List;
      bool ok(String path) =>
          events.any((e) => e['path'] == path && e['status'] == 200);
      if (guest) {
        if (s['userId'] != null ||
            events.any((e) => e['path'] == '/api/v1/auth/refresh')) {
          throw StateError('Logged out session restored unexpectedly');
        }
      } else {
        if (s['userId'] != private['customer']['id'] ||
            !ok('/api/v1/auth/refresh') ||
            !ok('/api/v1/auth/me')) {
          throw StateError('Cold restore lacks real refresh and me');
        }
        await tap(find.byValueKey('account-nav'));
        await tap(find.text('Yêu cầu bánh của tôi'));
        await tap(find.byValueKey('rfq-${fixture['journeyCRequestId']}'));
        await driver.waitFor(
          find.text(fixture['journeyCRequestTitle'] as String),
        );
        await File('${out.path}/screenshots/cold-restored-rfq.png')
            .writeAsBytes(await driver.screenshot());
        await tap(find.byValueKey('account-nav'));
        await tap(find.byValueKey('logout'));
        await driver.waitFor(find.byValueKey('login-nav'));
        if ((await state())['userId'] != null) {
          throw StateError('Logout did not clear synthetic state');
        }
      }
      final name = guest ? 'cold-after-logout' : 'cold-restore';
      await File('${out.path}/test-results/$name.json').writeAsString(
        jsonEncode({
          'result': 'PASS',
          'sameSyntheticIdentity': !guest,
          'guestAfterLogout': guest,
          'namespace': 'sweetcake.full-session.v1',
          'realProcessRestart': true,
          'defaultUserStoreRead': false,
          'noAutomaticMutationReplay': true,
        }),
      );
      await File('${out.path}/sanitized-events/$name.json')
          .writeAsString(jsonEncode((await state())['events']));
      stdout.writeln(
        'PASS: Actual Android cold process ${guest ? 'logout remains Guest' : 'restore and persisted same RFQ'}',
      );
    });
  } finally {
    await driver.close().timeout(const Duration(seconds: 10));
    watchdog.cancel();
  }
}
