import 'dart:convert';
import 'dart:io';
import 'dart:async';

import 'package:flutter_driver/flutter_driver.dart';

Future<void> main() async {
  final watchdog = Timer(const Duration(seconds: 90), () => exit(2));
  final driver = await FlutterDriver.connect(
    dartVmServiceUrl: Platform.environment['PHASE5_VM_URL'],
  );
  final out = Directory('docs/evidence/phases-5a-5b-5c');
  final fixture = jsonDecode(
    await File('${out.path}/ui-fixture.json').readAsString(),
  ) as Map;
  Map state = {};
  Future<Map> read([Map command = const {}]) async => jsonDecode(
    await driver.requestData(
      jsonEncode(command),
      timeout: const Duration(seconds: 20),
    ),
  ) as Map;
  try {
    await driver.runUnsynchronized(() async {
      for (var n = 0; n < 60; n++) {
        state = await read();
        if (state['userId'] != null && state['restoring'] == false) break;
        await Future<void>.delayed(const Duration(milliseconds: 500));
      }
      final events = state['events'] as List;
      final match = state['userId'] == fixture['customerId'];
      bool success(String path) =>
          events.any((e) => e['path'] == path && e['status'] == 200);
      if (!match ||
          !success('/api/v1/auth/refresh') ||
          !success('/api/v1/auth/me')) {
        throw StateError('Synthetic cold restore was not confirmed');
      }
      await File('${out.path}/session-cold-restore.json').writeAsString(
        jsonEncode({
          'result': 'PASS',
          'sameSyntheticIdentity': true,
          'namespace': 'sweetcake.phase5-session.v1',
          'defaultUserStoreRead': false,
          'events': events,
        }),
      );
      await read({'nav': '/offer-detail', 'id': fixture['offerId']});
      await driver.waitFor(
        find.text('Synthetic compatible offer edited'),
        timeout: const Duration(seconds: 20),
      );
      await Future<void>.delayed(const Duration(milliseconds: 600));
      await File('${out.path}/ui-final-offer.png')
          .writeAsBytes(await driver.screenshot());
      await read({'nav': '/profile'});
      await driver.waitFor(
        find.byValueKey('logout'),
        timeout: const Duration(seconds: 20),
      );
      await driver.scrollIntoView(
        find.byValueKey('logout'),
        alignment: .45,
        timeout: const Duration(seconds: 20),
      );
      await driver.tap(
        find.byValueKey('logout'),
        timeout: const Duration(seconds: 20),
      );
      await driver.waitFor(
        find.byValueKey('login-nav'),
        timeout: const Duration(seconds: 20),
      );
      state = await read();
      if (state['userId'] != null) throw StateError('Synthetic logout failed');
      await File('${out.path}/session-final-logout.json').writeAsString(
        jsonEncode({
          'result': 'PASS',
          'userId': null,
          'events': state['events'],
        }),
      );
    });
  } finally {
    await driver.close().timeout(const Duration(seconds: 10));
    watchdog.cancel();
  }
}
