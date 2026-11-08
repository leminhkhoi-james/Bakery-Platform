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
  final mode = Platform.environment['FULL_WALK_MODE'] ?? 'dry';
  final tag = '$mode-${DateTime.now().millisecondsSinceEpoch}';
  final walk = <String, dynamic>{
    'tag': tag,
    'mode': mode,
    'productId': fixture['productId'],
    'bakeryId': fixture['bakeryId'],
    'startedAt': DateTime.now().toUtc().toIso8601String(),
  };
  final chapters = <Map<String, dynamic>>[];
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
    await File('${out.path}/screenshots/walk-$tag-$name.png')
        .writeAsBytes(await driver.screenshot());
  }

  void pass(String name) {
    cases.add({'case': name, 'result': 'PASS'});
    stdout.writeln('PASS: $name');
  }

  Future<void> login(String actor) async {
    await tap(find.byValueKey('account-nav'));
    await tap(find.byValueKey('login-nav'));
    await field('email', (private[actor] as Map)['email'] as String);
    await field('password', passwordFor(actor));
    await submit();
    for (var n = 0; n < 40; n++) {
      if ((await state())['userId'] == (private[actor] as Map)['id']) return;
      await Future<void>.delayed(const Duration(milliseconds: 250));
    }
    throw StateError('Synthetic login did not reconcile');
  }

  Future<void> tapText(String label) => tap(find.text(label));
  Future<String> created(String method, String path) async {
    for (var n = 0; n < 80; n++) {
      final rows = ((await state())['events'] as List)
          .where(
            (e) =>
                e['method'] == method &&
                e['path'] == path &&
                e['status'] >= 200 &&
                e['status'] < 300 &&
                (e['ids'] as List).isNotEmpty,
          )
          .toList();
      if (rows.isNotEmpty) return rows.last['ids'].first as String;
      await Future<void>.delayed(const Duration(milliseconds: 250));
    }
    throw StateError('Missing server resource evidence');
  }

  void persist() => fixtureFile.writeAsStringSync(
    const JsonEncoder.withIndent('  ').convert(fixture),
  );
  Future<void> logout() async {
    await tap(find.byValueKey('account-nav'));
    await tap(find.byValueKey('logout'));
    await wait(find.byValueKey('login-nav'));
  }

  void blocked(String name, String reason) {
    cases.add({'case': name, 'result': 'BLOCKED_BACKEND', 'reason': reason});
    stdout.writeln('BLOCKED: $name');
  }

  void cue(String id, String title, String actor) {
    final at = DateTime.now().toUtc().toIso8601String();
    if (chapters.isNotEmpty) chapters.last['endUtc'] = at;
    chapters.add({'id': id, 'title': title, 'actor': actor, 'startUtc': at});
    File('${out.path}/test-results/walk-$tag-chapters.json')
        .writeAsStringSync(jsonEncode(chapters));
  }

  Future<void> pause() => Future<void>.delayed(const Duration(seconds: 2));
  Future<void> profile() => tap(find.byValueKey('account-nav'));
  Future<void> selectProduct() async {
    await tap(find.byValueKey('nav-/explore'));
    await tap(find.byValueKey('catalog-search'));
    await driver.enterText('Mobile Cake ${fixture['stamp']}');
    await driver.sendTextInputAction(TextInputAction.done);
    await tap(find.byValueKey('product-${fixture['productId']}'));
    await pause();
  }

  Future<void> selectRequiredOptions() async {
    // Read the same public catalog contract used by the visible product UI.
    final runtime = jsonDecode(
      File('${out.path}/runtime-start.json').readAsStringSync(),
    ) as Map;
    final client = HttpClient();
    try {
      final response = await (await client.getUrl(
        Uri.parse(
          '${runtime['services']['bakery-service']['origin']}/api/v1/products/${fixture['productId']}',
        ),
      )).close();
      if (response.statusCode != 200) {
        throw StateError('Catalog prerequisite unavailable');
      }
      final product =
          (jsonDecode(await utf8.decoder.bind(response).join()) as Map)['data']
              as Map;
      for (final group in product['options']['groups'] as List) {
        final minimum = (group['minimumSelections'] as num).toInt();
        final needed = minimum > 0
            ? minimum
            : group['required'] == true
            ? 1
            : 0;
        for (final value
            in (group['values'] as List)
                .where((v) => v['active'] == true)
                .take(needed)) {
          await tap(find.byValueKey('option-value-${value['id']}'));
        }
      }
    } finally {
      client.close();
    }
  }

  void persistWalk() {
    final runs = (fixture['walkthroughRuns'] as List? ?? [])
        .where((r) => r['tag'] != tag)
        .toList();
    runs.add(walk);
    fixture['walkthroughRuns'] = runs;
    persist();
  }

  try {
    await driver.runUnsynchronized(() async {
      cue('V01', 'Khám phá công khai', 'Guest');
      await wait(find.byValueKey('catalog-search'));
      await shot('guest-home');
      await pause();
      await selectProduct();
      await shot('guest-product');
      pass('Guest opens actual published Journey A product from public search');
      cue('V02', 'Đăng nhập và checkout bị chặn', 'Customer');
      await login('customer');
      await pause();
      await selectProduct();
      await tap(find.byValueKey('product-select'));
      await selectRequiredOptions();
      await field('quantity', '1');
      await tap(find.byValueKey('cart-add'));
      await wait(find.text('Giỏ bánh'));
      await pause();
      await tap(find.byValueKey('checkout-open'));
      await wait(find.text('Chưa có nguồn địa chỉ đã xác minh'));
      await shot('checkout-blocked');
      await pause();
      blocked(
        'Direct checkout',
        'No public address contract; no Order mutation sent',
      );
      cue('V03', 'Yêu cầu tùy chỉnh từ sản phẩm thật', 'Customer');
      await selectProduct();
      await tapText('Yêu cầu tùy chỉnh bánh này');
      await selectRequiredOptions();
      await tap(find.byValueKey('cart-add'));
      await wait(find.text('Tạo yêu cầu bánh'));
      final title = 'Mobile targeted $tag';
      await field('title', title);
      await field(
        'description',
        'Synthetic local targeted request from the displayed product; no real delivery',
      );
      await field(
        'neededAt',
        DateTime.now().toUtc().add(const Duration(days: 20)).toIso8601String(),
      );
      await field('deliveryCity', 'Local Test City');
      await field('deliveryDistrict', 'District Test');
      await submit();
      await wait(find.text(title));
      final rid = await created('POST', '/api/v1/cake-requests');
      walk['requestId'] = rid;
      walk['requestTitle'] = title;
      persistWalk();
      await shot('targeted-draft');
      await pause();
      await tap(find.byValueKey('rfq-publish'));
      await tapText('Xác nhận');
      await wait(find.text('Đang nhận báo giá'));
      await shot('targeted-open');
      pass('Targeted RFQ created from actual product/options and published');
      await pause();
      if (mode == 'dry') {
        await logout();
        walk['terminal'] = 'TARGETED_PUBLISHED_VERIFIED';
        persistWalk();
        pass('Targeted pre-recording branch verified; no recording claim');
        return;
      }
      await logout();
      cue('V04', 'Owner gửi báo giá cho cùng yêu cầu', 'Owner + Customer');
      await login('owner');
      await profile();
      await tapText('Yêu cầu đang tìm tiệm');
      await tap(find.byValueKey('rfq-$rid'));
      await wait(find.text(title));
      await pause();
      await tap(find.byValueKey('offer-new'));
      await tap(find.byValueKey('offer-editor-open'));
      await field('cakePrice', '400000');
      await field('deliveryFee', '20000');
      await field(
        'message',
        'Synthetic walkthrough quote for the same targeted request',
      );
      await field(
        'estimatedCompletionAt',
        DateTime.now().toUtc().add(const Duration(days: 10)).toIso8601String(),
      );
      await field(
        'expiresAt',
        DateTime.now().toUtc().add(const Duration(days: 7)).toIso8601String(),
      );
      await submit();
      await wait(find.text('420.000 VND'));
      final oid = await created('POST', '/api/v1/cake-requests/$rid/offers');
      walk['offerId'] = oid;
      persistWalk();
      await shot('owner-offer');
      pass('Owner creates actual quote for video targeted RFQ');
      await pause();
      await logout();
      cue('V05', 'Customer đối chiếu báo giá và gửi tin', 'Customer');
      await login('customer');
      await profile();
      await tapText('Báo giá nhận được');
      await tap(find.byValueKey('offer-$oid'));
      await wait(find.text('420.000 VND'));
      await shot('accept-blocked');
      await pause();
      blocked(
        'Accepted-offer Order',
        'Address prerequisite unavailable; no direct fallback',
      );
      await tapText('Mở trò chuyện');
      await wait(
        find.text('Chưa tải được lịch sử trò chuyện. Bạn có thể thử lại sau.'),
      );
      final cid = await created('POST', '/api/v1/conversations');
      walk['conversationId'] = cid;
      persistWalk();
      await tap(find.byValueKey('chat-compose'));
      await driver.enterText(
        'Synthetic Customer: please confirm this targeted cake quote.',
      );
      await tap(find.byValueKey('chat-send'));
      await wait(
        find.text(
          'Synthetic Customer: please confirm this targeted cake quote.',
        ),
      );
      await shot('customer-send');
      await pause();
      pass('Backend confirms Customer send; history/read remains blocked');
      await logout();
      cue('V06', 'Owner cùng hội thoại và hồ sơ tiệm', 'Owner + Customer');
      await login('owner');
      await profile();
      await tapText('Trò chuyện của tiệm');
      await tap(find.byValueKey('conversation-$cid'));
      await wait(
        find.text('Chưa tải được lịch sử trò chuyện. Bạn có thể thử lại sau.'),
      );
      await shot('owner-history-blocked');
      await pause();
      await tap(find.byValueKey('chat-compose'));
      await driver.enterText(
        'Synthetic Owner: quote is recorded; order needs supported address selection.',
      );
      await tap(find.byValueKey('chat-send'));
      await wait(
        find.text(
          'Synthetic Owner: quote is recorded; order needs supported address selection.',
        ),
      );
      await shot('owner-send');
      await pause();
      await tapText('Đóng hội thoại');
      await field(
        'reason',
        'Synthetic partial walkthrough; no Order or actual delivery created',
      );
      await submit();
      await wait(find.text('Đã đóng'));
      await shot('conversation-closed');
      await pause();
      await profile();
      await tap(find.byValueKey('onboarding-nav'));
      await wait(find.byValueKey('owner-catalog-nav'));
      await shot('owner-bakery');
      await pause();
      await tap(find.byValueKey('owner-subscription-nav'));
      await wait(find.text('SCHEDULED'));
      await shot('owner-subscription');
      await pause();
      await profile();
      await tapText('Đơn bánh của tiệm');
      await wait(find.text('Đơn bánh của tiệm'));
      await shot('owner-orders-empty');
      await pause();
      await logout();
      cue('V07', 'Admin giám sát cùng chuỗi dữ liệu', 'Admin');
      await login('admin');
      await tap(find.byValueKey('admin-orders-nav'));
      await wait(find.text('Đơn bánh và đánh giá'));
      await shot('admin-orders-empty');
      await pause();
      await profile();
      await tap(find.byValueKey('admin-requests-nav'));
      await tap(find.byValueKey('rfq-$rid'));
      await wait(find.text(title));
      await shot('admin-same-rfq');
      await pause();
      await tapText('420.000 VND');
      await wait(find.text('Chi tiết báo giá'));
      await shot('admin-same-offer');
      await pause();
      await profile();
      await tap(find.byValueKey('admin-bakeries-nav'));
      await tap(find.byValueKey('admin-bakery-search'));
      await driver.enterText('SweetCake Mobile ${fixture['stamp']}');
      await driver.sendTextInputAction(TextInputAction.done);
      await tap(find.byValueKey('admin-bakery-${fixture['bakeryId']}'));
      await wait(find.text('ACTIVE'));
      await shot('admin-same-bakery');
      await pause();
      await logout();
      cue('V08', 'AI chưa khả dụng và kết thúc minh bạch', 'Customer → Guest');
      await login('customer');
      await profile();
      await tapText('Thiết kế bánh AI');
      await wait(find.text('Chưa tải được dữ liệu'));
      await shot('ai-unavailable');
      await pause();
      blocked(
        'AI, selected design, fulfilled Order and Review',
        'No AI runtime; no valid address or completed Mobile Order. Partial recording only.',
      );
      await logout();
      await tap(find.byValueKey('nav-/'));
      await wait(find.byValueKey('catalog-search'));
      await shot('final-guest-home');
      await pause();
      if ((await state())['userId'] != null) {
        throw StateError('Final logout did not clear actor');
      }
      walk['terminal'] = 'PARTIAL_BLOCKED_FINAL_GUEST';
      persistWalk();
      pass('Partial walkthrough ends as Guest; no full-system success claim');
    });
  } on Object catch (e) {
    cases.add({
      'case': step,
      'result': 'FAILED',
      'errorType': e.runtimeType.toString(),
    });
    stderr.writeln('FAIL: walkthrough stopped (${e.runtimeType})');
    walk['terminal'] = 'FAILED';
    persistWalk();
    try {
      await shot('failure');
    } on Object {
      /* no raw credentials */
    }
    exitCode = 1;
  } finally {
    if (chapters.isNotEmpty) {
      chapters.last['endUtc'] = DateTime.now().toUtc().toIso8601String();
    }
    await File('${out.path}/sanitized-events/walk-$tag.json')
        .writeAsString(jsonEncode((await state())['events']));
    await File('${out.path}/test-results/walk-$tag.json').writeAsString(
      jsonEncode({'cases': cases, 'resourceChain': walk, 'chapters': chapters}),
    );
    await File('${out.path}/test-results/walk-$tag-chapters.json')
        .writeAsString(jsonEncode(chapters));
    await driver.close();
  }
}
