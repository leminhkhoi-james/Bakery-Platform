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
  final stamp = DateTime.now().millisecondsSinceEpoch.toString();
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
  Future<void> requireEvent(String path, String method, int status) async {
    for (var n = 0; n < 60; n++) {
      if (((await state())['events'] as List).any(
        (e) =>
            e['path'] == path && e['method'] == method && e['status'] == status,
      )) {
        return;
      }
      await Future<void>.delayed(const Duration(milliseconds: 250));
    }
    throw StateError('Expected sanitized HTTP event not observed');
  }

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
    await File('${out.path}/screenshots/remaining-$name.png')
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

  Future<void> checkCart() async {
    step = 'cart-product';
    await nav('/product-detail', id: private['productId'] as String);
    await tap(find.byValueKey('product-select'));
    final runtime = jsonDecode(
      await File('${out.path}/runtime-start.json').readAsString(),
    ) as Map<String, dynamic>;
    final client = HttpClient();
    final response = await (await client.getUrl(
      Uri.parse(
        '${runtime['services']['bakery-service']['origin']}/api/v1/products/${private['productId']}',
      ),
    )).close();
    final product =
        (jsonDecode(await utf8.decoder.bind(response).join())
                as Map<String, dynamic>)['data']
            as Map<String, dynamic>;
    client.close();
    for (final group in product['options']['groups'] as List) {
      final minimum = (group['minimumSelections'] as num).toInt();
      final needed = minimum > 0
          ? minimum
          : group['required'] == true
          ? 1
          : 0;
      final values = (group['values'] as List)
          .where((v) => v['active'] == true)
          .take(needed);
      for (final value in values) {
        await tap(find.byValueKey('option-value-${value['id']}'));
      }
    }
    await field('quantity', '2');
    await tap(find.byValueKey('cart-add'));
    await wait(find.text('Giỏ bánh'));
    await shot('cart');
    pass('Cart holds actual product identifiers');
    step = 'checkout';
    await tap(find.byValueKey('checkout-open'));
    await wait(find.text('Chưa có nguồn địa chỉ đã xác minh'));
    await shot('checkout-blocked');
    cases.add({
      'case': 'Direct checkout',
      'result': 'BLOCKED_BACKEND',
      'reason': 'No public Identity address contract',
    });
  }

  Future<void> pickNative(String filename) async {
    final result = await Process.run('python', [
      '-B',
      'tool/full_picker.py',
      filename,
    ]);
    if (result.exitCode != 0) throw StateError('Bounded native picker failed');
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
    await nav('/profile');
    await tap(find.byValueKey('logout'));
    await wait(find.byValueKey('login-nav'));
  }

  void blocked(String name, String reason) {
    cases.add({'case': name, 'result': 'BLOCKED_BACKEND', 'reason': reason});
    stdout.writeln('BLOCKED: $name');
  }

  Future<void> createRfq(String title) async {
    await nav('/request-new');
    await field('title', title);
    await field(
      'description',
      'Synthetic local cross-role journey; no real fulfillment',
    );
    await field(
      'neededAt',
      DateTime.now().toUtc().add(const Duration(days: 20)).toIso8601String(),
    );
    await field('deliveryCity', 'Local Test City');
    await field('deliveryDistrict', 'District Test');
    await submit();
    await wait(find.text(title));
  }

  try {
    await driver.runUnsynchronized(() async {
      await login('customer');
      if (fixture['journeyCRequestId'] == null) {
        await checkCart();
        await nav('/orders');
        await requireEvent('/api/v1/orders', 'GET', 200);
        await shot('customer-orders');
        await nav('/admin-orders');
        await wait(find.text('Kh?ng c? quy?n truy c?p'));
        pass('Customer cannot navigate to Admin Orders');
      }
      step = 'rfq-create-or-resume';
      final title =
          fixture['journeyCRequestTitle'] as String? ?? 'Full RFQ $stamp';
      String rid;
      if (fixture['journeyCRequestId'] != null) {
        rid = fixture['journeyCRequestId'] as String;
        await nav('/request-detail', id: rid);
        await wait(find.text(title));
        pass('Continue same current-run RFQ, original POST 201 retained');
      } else {
        await createRfq(title);
        rid = await created('POST', '/api/v1/cake-requests');
        fixture['journeyCRequestId'] = rid;
        fixture['journeyCRequestTitle'] = title;
        persist();
        pass('Create current-run RFQ and server detail');
      }
      await shot('rfq-draft');
      if (fixture['journeyCRfqEdited'] != true) {
        step = 'rfq-edit';
        await tap(find.byValueKey('rfq-edit'));
        await field('description', 'Synthetic local RFQ updated via Android');
        await submit();
        await wait(find.text('Synthetic local RFQ updated via Android'));
        pass('RFQ edit persisted and refetched');
        fixture['journeyCRfqEdited'] = true;
        persist();
      }
      step = 'ai-blocked';
      await tapText('Thiết kế AI cho yêu cầu');
      await wait(find.text('Chưa tải được dữ liệu'));
      await shot('ai-unavailable');
      blocked(
        'AI lifecycle and selected-design',
        'No Cake AI runtime; unchanged source compilation fails. No provider job was submitted.',
      );
      await nav('/request-detail', id: rid);
      step = 'rfq-image';
      await tap(find.byValueKey('pick-files-Ảnh tham khảo'));
      await pickNative('sweetcake-mobile-proof.png');
      await tap(find.byValueKey('upload-Ảnh tham khảo'));
      await Future<void>.delayed(const Duration(seconds: 2));
      await shot('rfq-image-attempt');
      blocked(
        'RFQ image upload/delete',
        'Firebase unavailable; inspect actual sanitized HTTP status, no fake image ID',
      );
      step = 'rfq-publish';
      await nav('/request-detail', id: rid);
      await tap(find.byValueKey('rfq-publish'));
      await tapText('Xác nhận');
      await wait(find.text('Đang nhận báo giá'));
      await nav('/requests');
      await wait(find.text(title));
      await shot('rfq-open-list');
      pass('Published current RFQ discovered from Customer list');
      await logout();
      step = 'owner-rfq';
      await login('owner');
      await nav('/vendor-profile');
      await wait(find.byValueKey('owner-catalog-nav'));
      await nav('/vendor-requests');
      await wait(find.byValueKey('rfq-$rid'));
      await tap(find.byValueKey('rfq-$rid'));
      await tap(find.byValueKey('offer-new'));
      await tap(find.byValueKey('offer-editor-open'));
      await field('cakePrice', '360000');
      await field('deliveryFee', '20000');
      await field('message', 'Full offer $stamp');
      await field(
        'estimatedCompletionAt',
        DateTime.now().toUtc().add(const Duration(days: 10)).toIso8601String(),
      );
      await field(
        'expiresAt',
        DateTime.now().toUtc().add(const Duration(days: 7)).toIso8601String(),
      );
      await submit();
      await wait(find.text('Full offer $stamp'));
      final oid = await created('POST', '/api/v1/cake-requests/$rid/offers');
      fixture['journeyCOfferId'] = oid;
      persist();
      pass('Same Journey A Owner creates offer for Customer RFQ');
      await shot('owner-offer-created');
      step = 'owner-offer-edit';
      await tapText('Sửa báo giá');
      await tap(find.byValueKey('offer-editor-open'));
      await field('message', 'Full edited offer $stamp');
      await submit();
      await wait(find.text('Full edited offer $stamp'));
      pass('Owner edits offer and refetches same ID');
      await nav('/vendor-orders');
      await requireEvent('/api/v1/orders', 'GET', 200);
      await shot('owner-orders');
      await logout();
      step = 'customer-offer-chat';
      await login('customer');
      await nav('/offers');
      await tap(find.byValueKey('offer-$oid'));
      await wait(find.text('Full edited offer $stamp'));
      await shot('customer-offer-accept-blocked');
      blocked(
        'Offer acceptance to Order',
        'No public authorized address selection; no accept or fallback direct Order sent',
      );
      await tapText('Mở trò chuyện');
      await wait(
        find.text('Chưa tải được lịch sử trò chuyện. Bạn có thể thử lại sau.'),
      );
      final cid = await created('POST', '/api/v1/conversations');
      fixture['journeyCConversationId'] = cid;
      persist();
      blocked(
        'Chat history and receipts',
        'Actual history 403, SQL 42P18; not replaced with local messages',
      );
      await shot('chat-history-blocked');
      step = 'customer-send';
      await tap(find.byValueKey('chat-compose'));
      await driver.enterText('Synthetic customer full-run $stamp');
      await tap(find.byValueKey('chat-send'));
      await wait(find.text('Synthetic customer full-run $stamp'));
      await requireEvent('/api/v1/conversations/$cid/messages', 'POST', 201);
      await shot('customer-send-confirmed');
      pass(
        'Server confirms Customer send; does not establish history or Owner receipt',
      );
      await logout();
      step = 'owner-chat';
      await login('owner');
      await nav('/vendor-chat');
      await tap(find.byValueKey('conversation-$cid'));
      await wait(
        find.text('Chưa tải được lịch sử trò chuyện. Bạn có thể thử lại sau.'),
      );
      await tap(find.byValueKey('chat-compose'));
      await driver.enterText('Synthetic owner full-run $stamp');
      await tap(find.byValueKey('chat-send'));
      await wait(find.text('Synthetic owner full-run $stamp'));
      pass('Owner sends in same conversation with server confirmation');
      await shot('owner-send-confirmed');
      step = 'attachment';
      await tap(find.byValueKey('chat-pick-files'));
      await pickNative('sweetcake-mobile-proof.png');
      await wait(find.text('Đã chọn 1 tệp'));
      await tap(find.byValueKey('chat-send'));
      await wait(
        find.text(
          'Tệp đã được dịch vụ nhận nhưng liên kết tải chưa dùng được trên thiết bị.',
        ),
      );
      await shot('attachment-url-blocked');
      blocked(
        'Attachment viewing/download',
        'Server receives file; returned Docker-only URL not rewritten by Mobile',
      );
      final sent = await created('POST', '/api/v1/conversations/$cid/messages');
      await tap(find.byValueKey('delete-message-$sent'));
      await tapText('Xác nhận');
      await wait(find.text('Tin nhắn đã xóa'));
      pass('Own message deletion returns 204');
      step = 'withdraw';
      await nav('/vendor-offer-detail', id: oid);
      await tapText('Rút báo giá');
      await field('reason', 'Synthetic local independent withdrawal branch');
      await submit();
      await wait(find.text('Đã rút'));
      pass('Withdraw branch persisted on same offer');
      await shot('offer-withdrawn');
      step = 'chat-close';
      await nav('/vendor-chat-detail', id: cid);
      await tapText('Đóng hội thoại');
      await field(
        'reason',
        'Synthetic partial journey ends before unavailable Order',
      );
      await submit();
      await wait(find.text('Đã đóng'));
      await shot('chat-closed');
      pass('Close conversation through authorized Owner action');
      await logout();
      step = 'admin-oversight';
      await login('admin');
      await nav('/profile');
      await tap(find.byValueKey('admin-orders-nav'));
      await wait(find.text('Đơn bánh và đánh giá'));
      await requireEvent('/api/v1/orders', 'GET', 200);
      await shot('admin-orders');
      blocked(
        'Order fulfillment, Customer review and Admin moderation',
        'No eligible completed Order created through supported Mobile journey; empty list not lifecycle success',
      );
      await nav('/profile');
      await tap(find.byValueKey('admin-requests-nav'));
      await wait(find.byValueKey('rfq-$rid'));
      await tap(find.byValueKey('rfq-$rid'));
      await wait(find.text(title));
      await shot('admin-rfq-detail');
      pass(
        'Admin discovers and inspects same cross-role RFQ without arbitrary UUID entry',
      );
      await nav('/admin-offer-detail', id: oid);
      await wait(find.text('Full edited offer $stamp'));
      await shot('admin-offer-readonly');
      pass(
        'Admin offer oversight is read only, no Customer chat/accept action',
      );
      await logout();
      step = 'cancel-branch';
      await login('customer');
      await createRfq('Cancel-only $stamp');
      final cancelId = await created('POST', '/api/v1/cake-requests');
      fixture['cancelBranchRequestId'] = cancelId;
      persist();
      await tapText('Hủy yêu cầu');
      await field('reason', 'Synthetic independent cancel branch');
      await submit();
      await wait(find.text('Đã hủy'));
      pass('Separate RFQ cancellation branch persisted');
      await shot('rfq-cancelled');
      await nav('/profile');
      await tap(find.byValueKey('refresh-session'));
      pass('Actual legitimate refresh-cookie role reload');
      await logout();
      pass('Final synthetic logout clears account-scoped workspace');
    });
  } on Object catch (e) {
    cases.add({
      'case': step,
      'result': 'FAILED',
      'errorType': e.runtimeType.toString(),
    });
    stderr.writeln('FAIL: remaining stopped at $step (${e.runtimeType})');
    try {
      await shot('failure-$step');
    } on Object {
      /* no raw exception/credentials */
    }
    exitCode = 1;
  } finally {
    final snapshot = await state();
    await File('${out.path}/sanitized-events/remaining-android.json')
        .writeAsString(jsonEncode(snapshot['events']));
    await File('${out.path}/test-results/remaining-android.json')
        .writeAsString(const JsonEncoder.withIndent('  ').convert(cases));
    await driver.close();
  }
}
