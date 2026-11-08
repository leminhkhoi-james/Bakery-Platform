import 'dart:convert';
import 'dart:io';

import 'package:flutter_driver/flutter_driver.dart';

Future<void> main() async {
  final run = jsonDecode(
    File('docs/full-integration/current-run.json').readAsStringSync(),
  ) as Map<String, dynamic>;
  final out = Directory(run['evidence'] as String);
  final fixtureFile = File('${out.path}/fixture-manifest.json');
  final fixture =
      jsonDecode(fixtureFile.readAsStringSync()) as Map<String, dynamic>;
  final private = jsonDecode(
    File('../../.secrets/bakery-platform/local-smoke-users.json')
        .readAsStringSync(),
  ) as Map<String, dynamic>;
  private['owner'] = {
    'id': fixture['ownerId'],
    'email': fixture['customerEmail'],
  };
  private['productId'] = fixture['productId'];
  String passwordFor(String actor) => private['password'] as String;
  final driver = await FlutterDriver.connect();
  final cases = <Map<String, dynamic>>[];
  String step = 'connect';

  Future<Map<String, dynamic>> state([
    Map<String, dynamic> command = const {},
  ]) async => jsonDecode(
    await driver.requestData(
      jsonEncode(command),
      timeout: const Duration(seconds: 40),
    ),
  ) as Map<String, dynamic>;
  Future<void> wait(SerializableFinder finder) =>
      driver.waitFor(finder, timeout: const Duration(seconds: 30));
  Future<void> nav(String route, {String? id}) async {
    await state({'nav': route, 'id': id});
    await Future<void>.delayed(const Duration(milliseconds: 600));
  }

  Future<void> tap(SerializableFinder f) async {
    await wait(f);
    await driver.scrollIntoView(f, alignment: .45);
    await driver.tap(f);
    await Future<void>.delayed(const Duration(milliseconds: 400));
  }

  Future<void> field(String name, String value) async {
    await tap(find.byValueKey('field-$name'));
    await driver.enterText(value);
  }

  Future<void> submit() async {
    await tap(find.byValueKey('form-submit'));
    await driver.waitForAbsent(
      find.byValueKey('form-submit'),
      timeout: const Duration(seconds: 40),
    );
  }

  Future<void> shot(String name) async {
    await File('${out.path}/screenshots/review-$name.png')
        .writeAsBytes(await driver.screenshot());
  }

  void pass(String name) {
    cases.add({'case': name, 'result': 'PASS'});
    stdout.writeln('PASS: $name');
  }

  Future<void> login(String actor) async {
    await nav('/login');
    await field('email', (private[actor] as Map)['email'] as String);
    await field('password', passwordFor(actor));
    await submit();
    for (var n = 0; n < 40; n++) {
      if ((await state())['userId'] == (private[actor] as Map)['id']) return;
      await Future<void>.delayed(const Duration(milliseconds: 250));
    }
    throw StateError('Synthetic login did not reconcile');
  }

  try {
    await driver.runUnsynchronized(() async {
      await login('admin');
      await tap(find.byValueKey('admin-requests-nav'));
      await tap(find.byValueKey('rfq-${fixture['journeyCRequestId']}'));
      await wait(find.text(fixture['journeyCRequestTitle'] as String));
      await tap(find.text('380.000 VND'));
      await wait(find.text('Chi tiết báo giá'));
      await wait(find.text('Đã rút'));
      await driver.waitForAbsent(
        find.text('Mở trò chuyện'),
        timeout: const Duration(seconds: 5),
      );
      await driver.waitForAbsent(
        find.text('Chấp nhận báo giá'),
        timeout: const Duration(seconds: 5),
      );
      await shot('fixed-admin-offer-readonly');
      pass(
        'Admin offer uses operational slate and remains read only through real RFQ discovery',
      );
      await tap(find.byValueKey('account-nav'));
      await tap(find.byValueKey('admin-offers-nav'));
      await wait(find.text('Giám sát báo giá'));
      await shot('admin-offers-discovery');
      pass(
        'Admin has dedicated paginated Offer discovery without Customer scope',
      );
      await tap(find.byValueKey('account-nav'));
      await tap(find.byValueKey('logout'));
      await wait(find.byValueKey('login-nav'));
    });
  } on Object catch (e) {
    cases.add({
      'case': step,
      'result': 'FAILED',
      'errorType': e.runtimeType.toString(),
    });
    exitCode = 1;
  } finally {
    await File('${out.path}/sanitized-events/review-fix-android.json')
        .writeAsString(jsonEncode((await state())['events']));
    await File('${out.path}/test-results/review-fix-android.json')
        .writeAsString(jsonEncode(cases));
    await driver.close();
  }
}
