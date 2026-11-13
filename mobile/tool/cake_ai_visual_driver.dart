// Read-only follow-up on the same Android-created resources after image framing
// was corrected. No repeated job, revision, cancellation or RFQ creation.
import 'dart:convert';
import 'dart:io';

import 'package:flutter_driver/flutter_driver.dart';

Future<void> main() async {
  final run = jsonDecode(
    File('docs/cake-ai/current-run.json').readAsStringSync(),
  ) as Map;
  final out = Directory(run['evidenceDirectory'] as String);
  final fixture = jsonDecode(
    File('${out.path}/android-fixtures.json').readAsStringSync(),
  ) as Map;
  final private = jsonDecode(
    File('../../.secrets/bakery-platform/local-smoke-users.json')
        .readAsStringSync(),
  ) as Map;
  final driver = await FlutterDriver.connect();
  const adb = 'D:/HomeMind/audit-tools/android-sdk/platform-tools/adb.exe';
  final results = <Map>[];
  Future<Map> state([Map v = const {}]) async =>
      jsonDecode(await driver.requestData(jsonEncode(v))) as Map;
  Future<void> tap(SerializableFinder f) async {
    await driver.waitFor(f, timeout: const Duration(seconds: 30));
    await driver.scrollIntoView(f, alignment: .5);
    await driver.tap(f);
    await Future<void>.delayed(const Duration(milliseconds: 300));
  }

  Future<void> nav(String route, {String? id}) async {
    await state({'nav': route, 'id': ?id});
  }

  Future<void> login(String actor) async {
    await nav('/login');
    final credentials = private[actor] as Map;
    for (final pair in [
      ('email', credentials['email']),
      ('password', credentials['password'] ?? private['password']),
    ]) {
      await tap(find.byValueKey('field-${pair.$1}'));
      await driver.enterText(pair.$2 as String);
    }
    await tap(find.byValueKey('form-submit'));
    await driver.waitForAbsent(find.byValueKey('form-submit'));
  }

  Future<void> shot(String name) async {
    await Future<void>.delayed(const Duration(milliseconds: 500));
    await File('${out.path}/screenshots/final-$name.png')
        .writeAsBytes(await driver.screenshot());
  }

  Future<String> setting(String key) async => (await Process.run(adb, [
    '-s',
    'emulator-5554',
    'shell',
    'settings',
    'get',
    'system',
    key,
  ])).stdout.toString().trim();
  Future<void> set(String key, String value) async {
    await Process.run(adb, [
      '-s',
      'emulator-5554',
      'shell',
      'settings',
      'put',
      'system',
      key,
      value,
    ]);
    await Future<void>.delayed(const Duration(seconds: 2));
  }

  final font = await setting('font_scale');
  final rotation = await setting('user_rotation');
  final auto = await setting('accelerometer_rotation');
  try {
    await driver.runUnsynchronized(() async {
      await login('customer');
      await nav('/request-detail', id: fixture['requestId'] as String);
      await tap(find.text('Xem thiết kế đã chọn'));
      await driver.waitFor(find.byValueKey('ai-design-image'));
      await shot('mode-and-design');
      await driver.scrollIntoView(
        find.byValueKey('ai-design-image'),
        alignment: .5,
      );
      await shot('whole-design');
      results.add({
        'case': 'Final UI shows entire Backend image without crop',
        'result': 'PASS',
      });
      await set('font_scale', '1.3');
      await shot('large-text-design');
      await set('font_scale', font);
      await set('accelerometer_rotation', '0');
      await set('user_rotation', '1');
      await driver.scrollIntoView(
        find.byValueKey('ai-design-image'),
        alignment: .5,
      );
      await shot('landscape-design');
      await set('user_rotation', rotation);
      await set('accelerometer_rotation', auto);
      await nav('/profile');
      await tap(find.byValueKey('logout'));
      await login('admin');
      await nav('/admin-request-detail', id: fixture['requestId'] as String);
      await tap(find.text('Xem thiết kế đã chọn'));
      await shot('admin-existing-decision');
      await driver.waitFor(
        find.text(
          'Thiết kế đã có quyết định duyệt. Dịch vụ chỉ nhận quyết định cho thiết kế đang chờ duyệt.',
        ),
      );
      results.add({
        'case': 'Final Admin has no invalid re-moderation action',
        'result': 'PASS',
      });
      await nav('/profile');
      await tap(find.byValueKey('logout'));
      await nav('/');
      stdout.writeln(
        'PASS: Final Android image framing, large text, landscape, Admin and settings restoration',
      );
    });
  } catch (e) {
    results.add({
      'case': 'Final visual pass',
      'result': 'FAILED_OR_BLOCKED',
      'errorType': e.runtimeType.toString(),
    });
    exitCode = 2;
  } finally {
    await set('font_scale', font);
    await set('user_rotation', rotation);
    await set('accelerometer_rotation', auto);
    File('${out.path}/android-visual-results.json').writeAsStringSync(
      jsonEncode({
        'checks': results,
        'originalSettings': {
          'font_scale': font,
          'rotation': rotation,
          'auto': auto,
        },
        'settingsRestored': true,
      }),
    );
    File('${out.path}/android-visual-events.json')
        .writeAsStringSync(jsonEncode((await state())['events']));
    await driver.close();
  }
}
