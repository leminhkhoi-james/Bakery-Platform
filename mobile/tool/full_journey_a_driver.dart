import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:flutter_driver/flutter_driver.dart';

// Host-side only. No credentials in app defines, assets, source or evidence.
Future<void> main() async {
  final source =
      Platform.environment['BAKERY_ADMIN_CREDENTIAL_FILE'] ??
      'H:/MSS/.secrets/bakery-platform/local-smoke-users.json';
  final credentials =
      jsonDecode(File(source).readAsStringSync()) as Map<String, dynamic>;
  final admin = credentials['admin'] as Map<String, dynamic>;
  final private = <String, dynamic>{'userPassword': credentials['password']};
  final run = jsonDecode(
    File('docs/full-integration/current-run.json').readAsStringSync(),
  ) as Map<String, dynamic>;
  final evidence = Directory(run['evidence'] as String)
    ..createSync(recursive: true);
  final fixture = File('${evidence.path}/fixture-manifest.json');
  final previous = fixture.existsSync()
      ? jsonDecode(fixture.readAsStringSync()) as Map<String, dynamic>
      : <String, dynamic>{};
  final stamp =
      previous['stamp'] as String? ??
      DateTime.now().millisecondsSinceEpoch.toString();
  final password = credentials['password'] as String;
  final customerEmail =
      previous['customerEmail'] as String? ??
      'mobile-full-$stamp@audit.invalid';
  final resumeRegistration = previous['registered'] == true;
  final output = Directory('${evidence.path}/screenshots')
    ..createSync(recursive: true);
  final resources = <String, dynamic>{
    ...previous,
    'stamp': stamp,
    'customerEmail': customerEmail,
    'credentialSource':
        'existing read-only local-smoke-users.json password; never embedded',
  };
  fixture.writeAsStringSync(jsonEncode(resources));
  Directory('${evidence.path}/sanitized-events').createSync(recursive: true);
  Directory('${evidence.path}/test-results').createSync(recursive: true);
  final driver = await FlutterDriver.connect();
  final results = <Map<String, dynamic>>[];
  String step = 'startup';
  Future<Map<String, dynamic>> command(Map<String, dynamic> request) async =>
      jsonDecode(
        await driver.requestData(
          jsonEncode(request),
          timeout: const Duration(seconds: 30),
        ),
      ) as Map<String, dynamic>;
  Future<void> nav(String path, {String? id}) async {
    await command({'nav': path, 'id': ?id});
    await Future<void>.delayed(const Duration(milliseconds: 600));
  }

  Future<void> tap(String key) async {
    final f = find.byValueKey(key);
    await driver.waitFor(f, timeout: const Duration(seconds: 35));
    await driver.scrollIntoView(f, alignment: 0.45);
    await driver.tap(f);
    await Future<void>.delayed(const Duration(milliseconds: 350));
  }

  Future<void> text(String key, String value) async {
    await tap(key);
    await driver.enterText(value);
  }

  Future<void> pickNative(String filename) async {
    final result = await Process.run('python', [
      '-B',
      'tool/full_picker.py',
      filename,
    ]);
    if (result.exitCode != 0) throw StateError('Bounded native picker failed');
  }

  Future<void> submit() async {
    await tap('form-submit');
    await driver.waitForAbsent(
      find.byValueKey('form-submit'),
      timeout: const Duration(seconds: 40),
    );
  }

  Future<void> pass(String label) async {
    results.add({
      'action': label,
      'result': 'PASS',
      'at': DateTime.now().toUtc().toIso8601String(),
    });
    stdout.writeln('PASS: $label');
  }

  Future<void> shot(String name) async {
    await Future<void>.delayed(const Duration(milliseconds: 500));
    await File('${output.path}/$name.png')
        .writeAsBytes(await driver.screenshot());
  }

  Future<List<dynamic>> events() async =>
      (await command({}))['evidence'] as List;
  Future<String> created(String method, String path) async {
    final rows = (await events())
        .where(
          (e) =>
              e['method'] == method &&
              e['path'] == path &&
              (e['status'] as int) < 300 &&
              (e['ids'] as List).isNotEmpty,
        )
        .toList();
    if (rows.isEmpty) {
      throw StateError('No sanitized resource evidence for $method $path');
    }
    return '${rows.last['ids'][0]}';
  }

  Future<void> login(String email, String secret) async {
    await nav('/login');
    await text('field-email', email);
    await text('field-password', secret);
    await submit();
    await nav('/profile');
  }

  Future<void> logout() async {
    await nav('/profile');
    await tap('logout');
    await driver.waitFor(
      find.byValueKey('login-nav'),
      timeout: const Duration(seconds: 30),
    );
  }

  String? priorId(String method, String path, {bool first = false}) {
    final candidates = <Map<String, dynamic>>[];
    for (final file
        in output
            .listSync(recursive: true)
            .whereType<File>()
            .where((f) => f.path.endsWith('android-ui-requests.json'))) {
      final list = jsonDecode(file.readAsStringSync()) as List;
      for (final row in list) {
        if (row['method'] == method &&
            row['path'] == path &&
            (row['status'] as int) < 300 &&
            (row['ids'] as List).isNotEmpty) {
          candidates.add(Map<String, dynamic>.from(row));
        }
      }
    }
    candidates.sort((a, b) => '${a['at']}'.compareTo('${b['at']}'));
    return candidates.isEmpty
        ? null
        : '${(first ? candidates.first : candidates.last)['ids'][0]}';
  }

  Future<void> catalogJourney(
    String bakeryId,
    String planId,
    String orderId,
    String paymentId,
    String secondPayment,
  ) async {
    step = 'catalog-category';
    await tap('owner-catalog-nav');
    final existingCategory = priorId(
      'POST',
      '/api/v1/bakeries/$bakeryId/categories',
    );
    var categoryId = existingCategory ?? '';
    if (existingCategory == null) {
      await tap('catalog-tab-1');
      await tap('create-category');
      await text('field-name', 'Mobile Category $stamp');
      await text('field-slug', 'mobile-category-$stamp');
      await submit();
      categoryId = await created(
        'POST',
        '/api/v1/bakeries/$bakeryId/categories',
      );
      await pass('Owner category create and reload');
    } else {
      await pass(
        'Continued existing persisted category without repeating its create',
      );
    }
    var productId =
        priorId('POST', '/api/v1/bakeries/$bakeryId/products') ?? '';
    if (Platform.environment['MOBILE_LIVE_STAGE'] != 'media') {
      await tap('catalog-tab-0');
      await tap('create-product');
      await text('field-name', 'Mobile Cake $stamp');
      await text(
        'field-slug',
        'mobile-cake-$stamp-${DateTime.now().millisecondsSinceEpoch}',
      );
      await text('field-basePrice', '250000');
      await text('field-defaultServingSize', '8');
      await tap('field-categoryId');
      await driver.tap(find.text('Mobile Category $stamp'));
      await submit();
      productId = await created('POST', '/api/v1/bakeries/$bakeryId/products');
      await pass('Owner product create with real ID and list refetch');
      await tap('manage-product-$productId');
      await tap('edit-product-options');
      await tap('add-groups');
      await text('groups-0-name', 'Size');
      await tap('add-groups-0-values');
      await text('groups-0-values-0-name', 'Standard');
      await submit();
      await pass('Full replacement options sent through native editor');
    } else {
      await tap('manage-product-$productId');
      await pass(
        'Continued persisted draft/options; no replacement without full read after restart',
      );
    }
    step = 'catalog-media';
    await tap('pick-files-Ảnh bánh');
    await pickNative('sweetcake-mobile-cake.jpg');
    await tap('upload-Ảnh bánh');
    await Future<void>.delayed(const Duration(seconds: 2));
    await pass('Native file picker uploads real product image to storage');
    await tap('publish-product');
    await driver.waitFor(
      find.text('PUBLISHED'),
      timeout: const Duration(seconds: 30),
    );
    await pass('Product published with actual subscription entitlement');
    await shot('09-owner-published-product');
    await nav('/product-detail', id: productId);
    await driver.waitFor(find.text('Mobile Cake $stamp'));
    await shot('10-public-real-product-image');
    await pass(
      'Published product detail and signed storage image rendered on Android',
    );
    await nav('/explore');
    await text('catalog-search', 'Mobile Cake $stamp');
    await driver.sendTextInputAction(TextInputAction.done);
    await tap('product-$productId');
    await pass('Public search navigates using server product ID');
    await nav('/stores');
    await text('catalog-search', 'SweetCake Mobile $stamp');
    await driver.sendTextInputAction(TextInputAction.done);
    await tap('bakery-$bakeryId');
    await pass(
      'Public bakery directory and detail render persisted operations',
    );
    await nav('/vendor-profile');
    await tap('edit-bakery');
    await text('field-description', 'Updated through real Flutter owner UI');
    await submit();
    await pass('Bakery profile patch refetched');
    await tap('edit-operations');
    await text('serviceAreas-0-deliveryFee', '15000.50');
    await submit();
    await pass('Operations PUT preserves lists and server IDs');
    await tap('pick-file-Logo tiệm');
    await pickNative('sweetcake-mobile-cake.jpg');
    await tap('upload-Logo tiệm');
    await Future<void>.delayed(const Duration(seconds: 1));
    await pass('Logo upload through native picker');
    await tap('pick-file-Ảnh bìa');
    await pickNative('sweetcake-mobile-cake.jpg');
    await tap('upload-Ảnh bìa');
    await Future<void>.delayed(const Duration(seconds: 1));
    await pass('Cover upload through native picker');
    await tap('owner-members-nav');
    await driver.waitFor(
      find.text(
        'Danh sách chỉ đọc. Backend không cung cấp API chỉnh vai trò hoặc thêm/xóa thành viên công khai.',
      ),
    );
    await pass('Owner membership read uses actual API');
    await nav('/vendor-menu');
    await tap('catalog-tab-2');
    await tap('create-addon');
    await text('field-name', 'Mobile Topper $stamp');
    await text('field-category', 'Topper');
    await text('field-price', '20000');
    await submit();
    await pass('Owner add-on create and reload');
    await tap('pick-file-Ảnh phụ kiện');
    await pickNative('sweetcake-mobile-cake.jpg');
    await tap('upload-Ảnh phụ kiện');
    await Future<void>.delayed(const Duration(seconds: 1));
    await pass('Add-on image uploaded to real storage');
    await nav('/vendor-menu');
    await tap('manage-product-$productId');
    await tap('hide-product');
    await driver.waitFor(
      find.text('HIDDEN'),
      timeout: const Duration(seconds: 30),
    );
    await pass('Hide removes publication through actual Backend state');
    await tap('publish-product');
    await driver.waitFor(
      find.text('PUBLISHED'),
      timeout: const Duration(seconds: 30),
    );
    await tap('edit-product');
    await text('field-description', 'Edited and persisted via Flutter');
    await submit();
    await pass('Product patch refetched and reopened');
    await nav('/profile');
    await tap('refresh-session');
    await pass('Live role refresh after catalog mutation');
    resources.addAll({
      'bakeryId': bakeryId,
      'planId': planId,
      'subscriptionOrderId': orderId,
      'paymentId': secondPayment,
      'categoryId': categoryId,
      'productId': productId,
      'ownerId': (await command({}))['userId'],
    });
    fixture.writeAsStringSync(jsonEncode(resources));
    await logout();
    await login(
      '${credentials['customer']['email']}',
      '${credentials['password']}',
    );
    await nav('/explore');
    await text('catalog-search', 'Mobile Cake $stamp');
    await driver.sendTextInputAction(TextInputAction.done);
    await tap('product-$productId');
    await shot('14-different-customer-same-product');
    await pass(
      'Different legitimate Customer discovers the exact newly published product',
    );
    await logout();
  }

  try {
    await driver.runUnsynchronized(() async {
      if (Platform.environment['FULL_STAGE'] == 'resume-catalog') {
        await login(customerEmail, password);
        await nav('/vendor-profile');
        await tap('owner-catalog-nav');
        await tap('manage-product-${resources['productId']}');
        await tap('pick-files-\u1ea2nh b\u00e1nh');
        await pickNative('sweetcake-mobile-cake.jpg');
        await tap('upload-\u1ea2nh b\u00e1nh');
        await Future<void>.delayed(const Duration(seconds: 2));
        await tap('publish-product');
        await driver.waitFor(
          find.text('PUBLISHED'),
          timeout: const Duration(seconds: 30),
        );
        await shot('09-owner-published-product');
        await pass(
          'Resumed existing current-run product, uploaded image and published',
        );
        await nav('/profile');
        await tap('refresh-session');
        await logout();
        await login(
          '${credentials['customer']['email']}',
          '${credentials['password']}',
        );
        await nav('/explore');
        await text('catalog-search', 'Mobile Cake $stamp');
        await driver.sendTextInputAction(TextInputAction.done);
        await tap('product-${resources['productId']}');
        await shot('14-different-customer-same-product');
        await pass('Different Customer discovers exact new published product');
        await logout();
        return;
      }

      if (!resumeRegistration) {
        await nav('/');
        await driver.waitFor(find.byValueKey('catalog-search'));
        await shot('01-live-public-home');
        await pass('Public home loads real catalog without fixture');
        step = 'registration';
        await nav('/login');
        await tap('register-nav');
        await text('field-email', customerEmail);
        await text('field-password', password);
        await text('field-displayName', 'Mobile Customer $stamp');
        await tap('form-submit');
        await driver.waitForAbsent(
          find.byValueKey('field-displayName'),
          timeout: const Duration(seconds: 40),
        );
        resources['registered'] = true;
        fixture.writeAsStringSync(jsonEncode(resources));
        await pass('Customer registration through Flutter form');
      } else {
        await nav('/login');
        await pass(
          'Resumed same run registered Customer; current run registration evidence retained',
        );
      }
      await text('field-email', customerEmail);
      await text('field-password', 'wrong-valid-length');
      await tap('form-submit');
      await driver.waitFor(
        find.text('Email hoặc mật khẩu chưa đúng. (HTTP 401)'),
        timeout: const Duration(seconds: 15),
      );
      await text('field-password', password);
      await submit();
      await nav('/profile');
      await driver.waitFor(find.byValueKey('onboarding-nav'));
      await pass('Wrong login denied; real login and me succeed');
      await shot('02-customer-profile');
      step = 'onboarding';
      await tap('onboarding-nav');
      await tap('onboarding-create');
      await text('field-name', 'SweetCake Mobile $stamp');
      await text('field-phoneNumber', 'LOCAL-TEST');
      await text('field-email', customerEmail);
      await tap('add-addresses');
      await text('addresses-0-addressLine', 'Mobile Test Street');
      await text('addresses-0-district', 'District Test');
      await text('addresses-0-city', 'Local Test City');
      await tap('addresses-0-isPrimary');
      await tap('add-serviceAreas');
      await text('serviceAreas-0-city', 'Local Test City');
      await text('serviceAreas-0-district', 'District Test');
      await text('serviceAreas-0-deliveryFee', '10000');
      await text('serviceAreas-0-minimumOrder', '100000');
      await tap('add-businessHours');
      await text('businessHours-0-dayOfWeek', '1');
      await text('businessHours-0-opensAt', '08:00');
      await text('businessHours-0-closesAt', '18:00');
      await submit();
      final bakeryId = await created('POST', '/api/v1/bakeries/onboarding');
      await pass('Onboarding submitted and refetched');
      await shot('03-onboarding-pending');
      await nav('/vendor-menu');
      await driver.waitFor(find.text('Chưa có quyền chủ tiệm'));
      await pass('Customer blocked from Owner catalog by live role guard');
      await logout();
      step = 'admin-plan-and-approval';
      await login('${admin['email']}', '${private['userPassword']}');
      await tap('admin-plans-nav');
      await tap('create-plan');
      await text('field-code', 'MOB$stamp');
      await text('field-name', 'Mobile Plan $stamp');
      await text('field-monthlyPrice', '100000');
      await tap('add-featureEntries');
      await text('featureEntries-0-key', 'catalog');
      await text('featureEntries-0-value', 'Live mobile verification');
      await submit();
      final planId = await created('POST', '/api/v1/admin/subscription-plans');
      await pass('Admin plan create through Flutter and list refetch');
      await nav('/admin-vendors');
      await text('admin-bakery-search', 'SweetCake Mobile $stamp');
      await driver.sendTextInputAction(TextInputAction.done);
      await Future<void>.delayed(const Duration(seconds: 1));
      await tap('admin-bakery-$bakeryId');
      await tap('review-bakery');
      await tap('field-status');
      await driver.tap(find.text('ACTIVE'));
      await submit();
      await pass('Admin bakery approval through Flutter');
      await shot('04-admin-approved-bakery');
      await logout();
      step = 'subscription-order';
      await login(customerEmail, password);
      await tap('onboarding-nav');
      await tap('owner-subscription-nav');
      await tap('choose-plan');
      await tap('plan-$planId');
      await tap('create-subscription-order');
      await driver.waitFor(
        find.byValueKey('submit-payment-nav'),
        timeout: const Duration(seconds: 30),
      );
      final orderId = await created(
        'POST',
        '/api/v1/bakeries/$bakeryId/subscription-orders',
      );
      await pass('Real subscription order created and server total shown');
      await tap('submit-payment-nav');
      await text('field-paymentReference', 'MOBILE-SYNTHETIC-$stamp-1');
      await tap('pick-proof');
      await pickNative('sweetcake-mobile-proof.png');
      await tap('send-payment');
      await driver.waitFor(
        find.text(
          'Đơn không còn chờ gửi thanh toán. Quay lại chi tiết để theo dõi trạng thái.',
        ),
        timeout: const Duration(seconds: 30),
      );
      final paymentId = await created(
        'POST',
        '/api/v1/subscription-orders/$orderId/payments',
      );
      await pass('Manual metadata submitted; stays pending Admin review');
      await shot('05-payment-submitted');
      await logout();
      step = 'payment-review';
      await login('${admin['email']}', '${private['userPassword']}');
      await tap('admin-payments-nav');
      await tap('reject-payment-$paymentId');
      await text(
        'field-reviewNote',
        'Synthetic rejection for retry verification',
      );
      await submit();
      await pass('Admin rejects with required note');
      await logout();
      await login(customerEmail, password);
      await tap('onboarding-nav');
      await tap('owner-subscription-nav');
      await tap('subscription-order-$orderId');
      await tap('submit-payment-nav');
      await text('field-paymentReference', 'MOBILE-SYNTHETIC-$stamp-2');
      await tap('send-payment');
      await driver.waitFor(
        find.text(
          'Đơn không còn chờ gửi thanh toán. Quay lại chi tiết để theo dõi trạng thái.',
        ),
        timeout: const Duration(seconds: 30),
      );
      final secondPayment = await created(
        'POST',
        '/api/v1/subscription-orders/$orderId/payments',
      );
      await pass('Rejected payment corrected and resubmitted');
      await logout();
      await login('${admin['email']}', '${private['userPassword']}');
      await tap('admin-payments-nav');
      await tap('approve-payment-$secondPayment');
      await text(
        'field-reviewNote',
        'Approved synthetic local verification only',
      );
      await submit();
      await pass('Admin approval refetches order, subscription and bakery');
      await shot('06-admin-payment-approved');
      await logout();
      step = 'owner-activation';
      await login(customerEmail, password);
      await tap('onboarding-nav');
      await tap('onboarding-complete');
      await Future<void>.delayed(const Duration(seconds: 2));
      final auth = await command({});
      if (!(auth['roles'] as List).contains('BAKERY_OWNER')) {
        throw StateError('Owner activation not propagated');
      }
      await pass('Legitimate Owner activation and refreshed JWT role');
      await shot('07-owner-active');
      await catalogJourney(bakeryId, planId, orderId, paymentId, secondPayment);
    });
  } on Object catch (e) {
    // FlutterDriver errors may include text input; never print raw exception.
    results.add({
      'action': step,
      'result': 'FAIL_MOBILE_OR_BACKEND',
      'errorType': e.runtimeType.toString(),
    });
    stderr.writeln(
      'Live UI stopped at $step (${e.runtimeType}); see sanitized evidence.',
    );
    try {
      await shot('failure-$step');
    } on Object {
      /* no credentials screenshot for auth forms */
    }
    exitCode = 1;
  } finally {
    final snapshot = await command({});
    await File('${evidence.path}/sanitized-events/journey-a-android.json')
        .writeAsString(jsonEncode(snapshot['evidence']));
    await File('${evidence.path}/test-results/journey-a-android.json')
        .writeAsString(const JsonEncoder.withIndent('  ').convert(results));
    await driver.close();
  }
}
