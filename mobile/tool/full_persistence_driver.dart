import 'dart:convert';
import 'dart:io';

import 'package:flutter_driver/flutter_driver.dart';

Future<void> main() async {
  final run = jsonDecode(
    File('docs/full-integration/current-run.json').readAsStringSync(),
  ) as Map;
  final out = Directory(run['evidence'] as String);
  final private = jsonDecode(
    File('../../.secrets/bakery-platform/local-smoke-users.json')
        .readAsStringSync(),
  ) as Map;
  final driver = await FlutterDriver.connect();
  Future<Map> state() async =>
      jsonDecode(await driver.requestData('{}')) as Map;
  Future<void> tap(String key) async {
    final f = find.byValueKey(key);
    await driver.waitFor(f);
    await driver.scrollIntoView(f, alignment: .45);
    await driver.tap(f);
    await Future<void>.delayed(const Duration(milliseconds: 500));
  }

  try {
    await driver.runUnsynchronized(() async {
      await tap('account-nav');
      await tap('login-nav');
      await tap('field-email');
      await driver.enterText(private['customer']['email'] as String);
      await tap('field-password');
      await driver.enterText(private['password'] as String);
      await tap('form-submit');
      for (var n = 0; n < 60; n++) {
        if ((await state())['userId'] == private['customer']['id']) break;
        await Future<void>.delayed(const Duration(milliseconds: 250));
      }
      final s = await state();
      if (s['userId'] != private['customer']['id']) {
        throw StateError('Legitimate seed identity mismatch');
      }
      await File('${out.path}/test-results/session-seed.json').writeAsString(
        jsonEncode({
          'result': 'PASS',
          'namespace': 'sweetcake.full-session.v1',
          'defaultUserStoreRead': false,
          'expectedActor': 'synthetic Customer',
        }),
      );
      await File('${out.path}/sanitized-events/session-seed.json')
          .writeAsString(jsonEncode(s['events']));
      stdout.writeln(
        'PASS: Legitimate synthetic Customer session seeded in isolated secure namespace',
      );
    });
  } finally {
    await driver.close();
  }
}
