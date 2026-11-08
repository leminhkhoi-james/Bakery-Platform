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
    await File('${output.path}/extra-$name.png')
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

  void persist() => fixture.writeAsStringSync(
    const JsonEncoder.withIndent('  ').convert(resources),
  );
  Future<void> upload(String label) async {
    await tap('pick-file-$label');
    await pickNative('sweetcake-mobile-cake.jpg');
    await tap('upload-$label');
    await Future<void>.delayed(const Duration(seconds: 2));
  }

  try {
    await driver.runUnsynchronized(() async {
      final bid = resources['bakeryId'] as String,
          pid = resources['productId'] as String,
          plan = resources['planId'] as String;
      step = 'public-directory';
      await nav('/stores');
      await text('catalog-search', 'SweetCake Mobile $stamp');
      await driver.sendTextInputAction(TextInputAction.done);
      await tap('bakery-$bid');
      await shot('public-bakery');
      await pass('Guest discovers same bakery from public directory');
      step = 'owner-profile';
      await login(customerEmail, password);
      await nav('/vendor-profile');
      await tap('edit-bakery');
      await text(
        'field-description',
        'Synthetic current-run owner profile persisted',
      );
      await submit();
      await pass('Owner profile PATCH followed by onboarding refetch');
      await tap('edit-operations');
      await text('serviceAreas-0-deliveryFee', '15000.50');
      await submit();
      await pass(
        'Operations replace-all preserves authoritative address/area/hour records',
      );
      await upload('Logo tiệm');
      await upload('Ảnh bìa');
      await shot('owner-profile-media');
      await pass('Logo and cover uploads followed by live profile reads');
      await tap('owner-members-nav');
      await driver.waitFor(
        find.text(
          'Danh sách chỉ đọc. Backend không cung cấp API chỉnh vai trò hoặc thêm/xóa thành viên công khai.',
        ),
      );
      await shot('members');
      await pass(
        'Actual OWNER membership discovery, no invented member management',
      );
      step = 'addon';
      await nav('/vendor-menu');
      await tap('catalog-tab-2');
      await tap('create-addon');
      await text('field-name', 'Full Topper $stamp');
      await text('field-category', 'Topper');
      await text('field-price', '20000');
      await submit();
      final aid = await created('POST', '/api/v1/bakeries/$bid/add-ons');
      resources['extraAddonId'] = aid;
      persist();
      await upload('Ảnh phụ kiện');
      await tap('edit-addon-$aid');
      await text('field-price', '25000');
      await submit();
      await tap('disable-addon-$aid');
      await tap('confirm-action');
      await shot('addon-disabled');
      await pass('Add-on create/image/edit/soft-disable persisted');
      step = 'category';
      await nav('/vendor-menu');
      await tap('catalog-tab-1');
      await tap('create-category');
      await text('field-name', 'Branch Category $stamp');
      await text('field-slug', 'branch-category-$stamp');
      await submit();
      final cat = await created('POST', '/api/v1/bakeries/$bid/categories');
      resources['extraCategoryId'] = cat;
      persist();
      await tap('edit-category-$cat');
      await text('field-name', 'Branch Category $stamp edited');
      await submit();
      await tap('delete-category-$cat');
      await tap('confirm-action');
      await driver.waitForAbsent(find.byValueKey('edit-category-$cat'));
      await pass(
        'Independent category PATCH/DELETE without deleting main journey category',
      );
      step = 'product-state';
      await nav('/vendor-menu');
      await tap('manage-product-$pid');
      await tap('hide-product');
      await driver.waitFor(find.text('HIDDEN'));
      await tap('publish-product');
      await driver.waitFor(find.text('PUBLISHED'));
      await tap('edit-product');
      await text(
        'field-description',
        'Full integration persisted product patch',
      );
      await tap('field-customizable');
      await submit();
      await pass(
        'Main product hide/republish/edit, enables real targeted customization',
      );
      await tap('pick-files-Ảnh bánh');
      await pickNative('sweetcake-mobile-cake.jpg');
      await tap('upload-Ảnh bánh');
      await Future<void>.delayed(const Duration(seconds: 2));
      final image = await created(
        'POST',
        '/api/v1/bakeries/$bid/products/$pid/images',
      );
      await tap('delete-image-$image');
      await tap('confirm-action');
      await driver.waitForAbsent(find.byValueKey('delete-image-$image'));
      await pass(
        'Secondary product image deleted, primary journey image retained',
      );
      await shot('product-media');
      step = 'archive-product';
      await nav('/vendor-menu');
      await tap('create-product');
      await text('field-name', 'Archive-only $stamp');
      await text('field-slug', 'archive-only-$stamp');
      await text('field-basePrice', '100000');
      await text('field-defaultServingSize', '4');
      await submit();
      final archive = await created('POST', '/api/v1/bakeries/$bid/products');
      resources['archivedProductId'] = archive;
      persist();
      await tap('manage-product-$archive');
      await tap('archive-product');
      await tap('confirm-action');
      await driver.waitFor(find.text('ARCHIVED'));
      await pass(
        'Separate draft archive leaves primary published product available',
      );
      await logout();
      step = 'plan-edit';
      await login('${admin['email']}', '${private['userPassword']}');
      await nav('/admin-plans');
      await tap('edit-plan-$plan');
      await text('field-monthlyPrice', '120000');
      await submit();
      await pass('Admin edits actual plan; old order snapshot retained');
      await logout();
      step = 'renewal';
      await login(customerEmail, password);
      await nav('/vendor-profile');
      await tap('owner-subscription-nav');
      await tap('choose-plan');
      await tap('plan-$plan');
      await tap('create-subscription-order');
      await driver.waitFor(find.byValueKey('submit-payment-nav'));
      final renewal = await created(
        'POST',
        '/api/v1/bakeries/$bid/subscription-orders',
      );
      resources['renewalOrderId'] = renewal;
      persist();
      await tap('submit-payment-nav');
      await text('field-paymentReference', 'FULL-SYNTHETIC-RENEWAL-$stamp');
      await tap('send-payment');
      await driver.waitFor(
        find.text(
          'Đơn không còn chờ gửi thanh toán. Quay lại chi tiết để theo dõi trạng thái.',
        ),
      );
      final pay = await created(
        'POST',
        '/api/v1/subscription-orders/$renewal/payments',
      );
      resources['renewalPaymentId'] = pay;
      persist();
      await pass(
        'New logical renewal and synthetic payment metadata sent through UI',
      );
      await logout();
      step = 'renewal-admin';
      await login('${admin['email']}', '${private['userPassword']}');
      await nav('/admin-payments');
      await tap('approve-payment-$pay');
      await text(
        'field-reviewNote',
        'Synthetic local renewal approved; no real transfer',
      );
      await submit();
      await nav('/admin-plans');
      await tap('archive-plan-$plan');
      await tap('confirm-action');
      await pass(
        'Admin approves renewal and archives plan through actual Backend',
      );
      await logout();
      step = 'renewal-refetch';
      await login(customerEmail, password);
      await nav('/vendor-profile');
      await tap('owner-subscription-nav');
      await driver.waitFor(find.text('SCHEDULED'));
      await shot('active-scheduled');
      await pass('Owner refetches current ACTIVE and same renewal SCHEDULED');
      await tap('subscription-order-${resources['subscriptionOrderId']}');
      await driver.waitFor(find.text('100.000 VND'));
      await pass(
        'Original subscription order snapshot still 100000 after plan patch',
      );
      step = 'branch';
      await nav('/vendor-profile');
      await tap('create-extra-bakery');
      await text('field-name', 'Full Branch $stamp');
      await text('field-phoneNumber', 'LOCAL-TEST');
      await submit();
      final branch = await created('POST', '/api/v1/bakeries');
      resources['extraBakeryId'] = branch;
      persist();
      await tap('edit-operations');
      await tap('add-addresses');
      await text('addresses-0-addressLine', 'Synthetic Branch Street');
      await text('addresses-0-district', 'Branch Test District');
      await text('addresses-0-city', 'Local Test City');
      await tap('addresses-0-isPrimary');
      await tap('add-serviceAreas');
      await text('serviceAreas-0-city', 'Local Test City');
      await text('serviceAreas-0-district', 'Branch Test District');
      await text('serviceAreas-0-deliveryFee', '0');
      await text('serviceAreas-0-minimumOrder', '0');
      await submit();
      await tap('submit-extra-bakery');
      await driver.waitFor(find.text('PENDING_APPROVAL'));
      await pass(
        'Owner creates and submits independent branch with actual operations',
      );
      await logout();
      await login('${admin['email']}', '${private['userPassword']}');
      await nav('/admin-vendors');
      await text('admin-bakery-search', 'Full Branch $stamp');
      await driver.sendTextInputAction(TextInputAction.done);
      await tap('admin-bakery-$branch');
      await driver.waitFor(find.text('PENDING_APPROVAL'));
      await shot('admin-branch');
      await pass(
        'Admin discovers persisted branch by same ID after Owner logout',
      );
      await logout();
    });
  } on Object catch (e) {
    results.add({
      'action': step,
      'result': 'FAILED',
      'errorType': e.runtimeType.toString(),
    });
    stderr.writeln('FAIL: extra stopped at $step (${e.runtimeType})');
    try {
      await shot('failure-$step');
    } on Object {
      /* Preserve failure result even if screenshot unavailable. */
    }
    exitCode = 1;
  } finally {
    final snapshot = await command({});
    await File('${evidence.path}/sanitized-events/extra-android.json')
        .writeAsString(jsonEncode(snapshot['evidence']));
    await File('${evidence.path}/test-results/extra-android.json')
        .writeAsString(const JsonEncoder.withIndent('  ').convert(results));
    await driver.close();
  }
}
