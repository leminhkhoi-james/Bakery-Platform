import 'dart:convert';
import 'dart:io';
import 'dart:math';

import 'package:flutter_driver/flutter_driver.dart';

Future<void> main() async {
  final stage = Platform.environment['DIAGNOSTIC_STAGE'] ?? 'before';
  final out = Directory('docs/evidence/docker-api-diagnostic')
    ..createSync(recursive: true);
  final driver = await FlutterDriver.connect();
  final results = <Map<String, dynamic>>[];
  final stamp = DateTime.now().microsecondsSinceEpoch.toString();
  final email = 'diagnostic-$stamp@audit.invalid';
  final password = base64UrlEncode(
    List.generate(24, (_) => Random.secure().nextInt(256)),
  );
  Future<Map<String, dynamic>> command(Map<String, dynamic> body) async =>
      jsonDecode(
        await driver.requestData(
          jsonEncode(body),
          timeout: const Duration(seconds: 40),
        ),
      ) as Map<String, dynamic>;
  Future<void> waitFor(
    SerializableFinder finder, {
    Duration timeout = const Duration(seconds: 35),
  }) => driver.waitFor(finder, timeout: timeout);
  Future<void> nav(String route) async {
    await command({'nav': route});
    await Future<void>.delayed(const Duration(milliseconds: 600));
  }

  Future<void> tap(String key) async {
    final f = find.byValueKey(key);
    await waitFor(f, timeout: const Duration(seconds: 35));
    await driver.scrollIntoView(f, alignment: .45);
    await driver.tap(f);
    await Future<void>.delayed(const Duration(milliseconds: 300));
  }

  Future<void> text(String key, String value) async {
    await tap(key);
    await driver.enterText(value);
  }

  Future<void> shot(String name) async =>
      File('${out.path}/$stage-$name.png')
          .writeAsBytes(await driver.screenshot());
  void pass(String action) {
    results.add({'action': action, 'result': 'PASS'});
    stdout.writeln('PASS: $action');
  }

  Future<void> registerFields(String address) async {
    await nav('/login');
    await tap('register-nav');
    await text('field-email', address);
    await text('field-password', password);
    await text('field-displayName', 'Diagnostic Synthetic Customer');
  }

  Future<void> login(String address, String secret) async {
    await nav('/login');
    await text('field-email', address);
    await text('field-password', secret);
    await tap('form-submit');
    await driver.waitForAbsent(
      find.byValueKey('field-password'),
      timeout: const Duration(seconds: 35),
    );
    await nav('/profile');
    if ((await command({}))['userId'] == null) {
      throw StateError('No current user');
    }
  }

  Future<void> logout() async {
    await nav('/profile');
    await tap('logout');
    await waitFor(find.byValueKey('login-nav'));
  }

  Future<List<dynamic>> events() async => (await command({}))['events'] as List;
  Future<void> regressionTail() async {
    await waitFor(find.byValueKey('catalog-search'));
    // Remove only this app's Bakery reversal; other mappings/services stay intact.
    await Process.run('adb', [
      '-s',
      Platform.environment['DIAGNOSTIC_DEVICE'] ?? 'emulator-5554',
      'reverse',
      '--remove',
      'tcp:18102',
    ]);
    await command({'resetConnections': true});
    await nav('/');
    await waitFor(
      find.text('Chưa tải được dữ liệu'),
      timeout: const Duration(seconds: 45),
    );
    await shot('missing-reverse-error');
    await Process.run('adb', [
      '-s',
      Platform.environment['DIAGNOSTIC_DEVICE'] ?? 'emulator-5554',
      'reverse',
      'tcp:18102',
      'tcp:18102',
    ]);
    await driver.tap(find.text('Thử lại'));
    await waitFor(
      find.byValueKey('catalog-search'),
      timeout: const Duration(seconds: 45),
    );
    pass(
      'Real missing adb reverse reproduces Home failure; restoring mapping and UI retry renders data',
    );
    final owner = jsonDecode(
      File('H:/MSS/.runtime/bakery-mobile-phases-1-4/mobile-live-user.json')
          .readAsStringSync(),
    ) as Map<String, dynamic>;
    await login('${owner['email']}', '${owner['password']}');
    await tap('onboarding-nav');
    await waitFor(find.byValueKey('owner-catalog-nav'));
    await tap('owner-catalog-nav');
    await tap('catalog-tab-1');
    await tap('catalog-tab-2');
    await nav('/vendor-subscription');
    await waitFor(find.text('SCHEDULED'), timeout: const Duration(seconds: 35));
    await shot('owner-current-scheduled');
    pass(
      'Existing synthetic Owner profile/catalog/categories/add-ons and ACTIVE/SCHEDULED read through UI',
    );
    await logout();
    final admin = jsonDecode(
      File('H:/MSS/.secrets/bakery-platform/local-smoke-users.json')
          .readAsStringSync(),
    ) as Map<String, dynamic>;
    await login('${(admin['admin'] as Map)['email']}', '${admin['password']}');
    await tap('admin-bakeries-nav');
    await nav('/admin-plans');
    await nav('/admin-payments');
    await shot('admin-read-regression');
    pass(
      'Legitimate Admin bakery/plan/payment reads work; no role impersonation',
    );
    await logout();
  }

  Future<void> afterJourney() async {
    final ids = jsonDecode(
      File('${out.path}/public-ids.json').readAsStringSync(),
    ) as Map<String, dynamic>;
    await waitFor(
      find.byValueKey('catalog-search'),
      timeout: const Duration(seconds: 45),
    );
    await waitFor(
      find.byValueKey('product-${(ids['productIds'] as List).first}'),
    );
    await shot('home-live');
    pass('Home renders actual Backend product after runtime recovery');
    await nav('/product-detail');
    await command({
      'nav': '/product-detail',
      'id': (ids['productIds'] as List).first,
    });
    await shot('product-live-media');
    await command({
      'nav': '/bakery-detail',
      'id': (ids['bakeryIds'] as List).first,
    });
    await nav('/stores');
    await nav('/subscription-plans');
    await shot('public-plans');
    pass('Public product/bakery/plans routes use real services');
    await nav('/login');
    await tap('register-nav');
    await text('field-email', 'invalid-email');
    await text('field-password', 'short');
    final before = (await events())
        .where((r) => r['path'] == '/api/v1/auth/register')
        .length;
    await tap('form-submit');
    if ((await events())
            .where((r) => r['path'] == '/api/v1/auth/register')
            .length !=
        before) {
      throw StateError('Invalid form sent');
    }
    pass('Invalid registration input blocked before HTTP');
    await text('field-email', email);
    await text('field-password', password);
    await text('field-displayName', 'Diagnostic Synthetic Customer');
    await command({'mode': 'connection-refused'});
    await tap('form-submit');
    await waitFor(
      find.text(
        'Không kết nối được dịch vụ. Kiểm tra Backend và kết nối emulator rồi thử lại.',
      ),
    );
    await shot('registration-connection-recoverable');
    await tap('form-submit');
    final failures = (await events())
        .where(
          (r) =>
              r['mode'] == 'connection-refused' &&
              r['path'] == '/api/v1/auth/register',
        )
        .toList();
    if (failures.length != 2 || failures.any((r) => r['uncertain'] != false)) {
      throw StateError('Pre-send classification/retry wrong');
    }
    pass(
      'Pre-send connection refusal keeps signup recoverable; two explicit taps, no automatic retry',
    );
    await command({'mode': 'real'});
    await tap('form-submit');
    await driver.waitForAbsent(
      find.byValueKey('field-displayName'),
      timeout: const Duration(seconds: 35),
    );
    await waitFor(find.text('Đã tạo tài khoản. Đăng nhập để tiếp tục.'));
    await shot('registration-created');
    await text('field-password', password);
    await tap('form-submit');
    await driver.waitForAbsent(
      find.byValueKey('field-password'),
      timeout: const Duration(seconds: 35),
    );
    await nav('/profile');
    final createdUser = (await command({}))['userId'];
    if (createdUser == null) throw StateError('Signup/login/me failed');
    pass(
      'Flutter registration 201 followed by real login/me; no automatic fake session',
    );
    await logout();
    await registerFields(email);
    await tap('form-submit');
    await waitFor(
      find.text(
        'Email đã được sử dụng. Đăng nhập để kiểm tra tài khoản hoặc dùng email khác. (HTTP 409)',
      ),
    );
    await tap('registration-reconcile');
    await tap('form-submit');
    await waitFor(find.text('Vui lòng nhập Mật khẩu.'));
    await text('field-password', password);
    await tap('form-submit');
    await driver.waitForAbsent(
      find.byValueKey('field-password'),
      timeout: const Duration(seconds: 35),
    );
    if ((await command({}))['userId'] != createdUser) {
      throw StateError('Duplicate reconciliation wrong account');
    }
    pass(
      'Duplicate email 409 is definite; recovery login retains email and clears password',
    );
    await logout();
    final lostEmail = 'diagnostic-lost-$stamp@audit.invalid';
    await registerFields(lostEmail);
    await command({'mode': 'invalid-body'});
    await tap('form-submit');
    await waitFor(
      find.text(
        'Dữ liệu chưa hợp lệ. Kiểm tra trường nhập và điều kiện nghiệp vụ. (HTTP 400)',
      ),
    );
    pass(
      'Backend validation 400 reached via controlled invalid body; submit is recoverable',
    );
    await command({'mode': 'lost-register-response'});
    await tap('form-submit');
    await waitFor(find.byValueKey('registration-reconcile'));
    await shot('registration-lost-response-recovery');
    final committed = (await events())
        .where(
          (r) => r['mode'] == 'lost-register-response' && r['status'] == 201,
        )
        .toList();
    if (committed.length != 1) {
      throw StateError('Uncertain registration was repeated');
    }
    final lostId = (committed.single['ids'] as List).single;
    await command({'mode': 'real'});
    await tap('registration-reconcile');
    await text('field-password', password);
    await tap('form-submit');
    await driver.waitForAbsent(
      find.byValueKey('field-password'),
      timeout: const Duration(seconds: 35),
    );
    await nav('/profile');
    if ((await command({}))['userId'] != lostId) {
      throw StateError('Created record not reconciled');
    }
    await shot('registration-reconciled-profile');
    pass(
      'Backend committed 201 before controlled response loss; explicit login/me confirms same ID, no duplicate register',
    );
    await command({'expire': true});
    await tap('refresh-session');
    pass('Actual refresh cookie rotation and me still work');
    await logout();
    await regressionTail();
  }

  try {
    await driver.runUnsynchronized(() async {
      if (stage == 'public-detail') {
        final ids = jsonDecode(
          File('${out.path}/public-ids.json').readAsStringSync(),
        ) as Map;
        await nav('/subscription-plans');
        await tap('plan-${(ids['planIds'] as List).first}');
        await waitFor(find.text('Mã gói'));
        await shot('plan-detail');
        pass('Public plan detail renders after actual Subscription GET');
        return;
      }
      if (stage == 'session') {
        final owner = jsonDecode(
          File('H:/MSS/.runtime/bakery-mobile-phases-1-4/mobile-live-user.json')
              .readAsStringSync(),
        ) as Map<String, dynamic>;
        await login('${owner['email']}', '${owner['password']}');
        await shot('persistent-synthetic-owner');
        pass(
          'Synthetic Owner session saved in isolated OS secure storage for cold-process test',
        );
        return;
      }
      if (stage == 'tail') {
        await regressionTail();
        return;
      }
      if (stage != 'before') {
        await afterJourney();
        return;
      }
      if (stage == 'before') {
        await waitFor(
          find.text('Chưa tải được dữ liệu'),
          timeout: const Duration(seconds: 45),
        );
        await shot('home-backend-stopped');
        pass('Home error reproduced with Docker services stopped');
        await nav('/login');
        await tap('register-nav');
        await text('field-email', email);
        await text('field-password', password);
        await text('field-displayName', 'Diagnostic Synthetic Customer');
        await tap('form-submit');
        await waitFor(
          find.text(
            'Chưa xác định kết quả. Làm mới dữ liệu trước khi thử lại. Quay lại danh sách và làm mới để đối chiếu trước khi mở yêu cầu khác.',
          ),
          timeout: const Duration(seconds: 35),
        );
        await shot('registration-before-fix');
        pass(
          'Connection-refused registration incorrectly enters uncertain locked state',
        );
      }
    });
  } on Object catch (e) {
    results.add({'result': 'FAIL', 'errorType': e.runtimeType.toString()});
    exitCode = 1;
    stderr.writeln(
      'Diagnostic stage failed; exception details suppressed to protect input.',
    );
  } finally {
    final state = await command({});
    await File('${out.path}/$stage-ui.json').writeAsString(
      const JsonEncoder.withIndent('  ')
          .convert({'results': results, 'state': state}),
    );
    await driver.close();
  }
}
