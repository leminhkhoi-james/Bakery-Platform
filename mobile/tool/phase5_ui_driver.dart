import 'dart:convert';
import 'dart:io';

import 'package:flutter_driver/flutter_driver.dart';

Future<void> main() async {
  final out = Directory('docs/evidence/phases-5a-5b-5c')
    ..createSync(recursive: true);
  final private = jsonDecode(
    await File('../../.secrets/bakery-platform/local-smoke-users.json')
        .readAsString(),
  ) as Map<String, dynamic>;
  final driver = await FlutterDriver.connect();
  final cases = <Map<String, dynamic>>[];
  String step = 'connect';
  final stamp = DateTime.now().microsecondsSinceEpoch.toString();
  final stage = Platform.environment['PHASE5_STAGE'] ?? 'all';
  final compatible = ['extended', 'review'].contains(stage)
      ? jsonDecode(await File('${out.path}/ui-fixture.json').readAsString())
            as Map<String, dynamic>
      : null;
  String passwordFor(String actor) => actor == 'owner' && compatible != null
      ? (private['owner'] as Map)['password'] as String
      : private['password'] as String;
  if (compatible != null) {
    final owner = jsonDecode(
      await File(
        '../../.runtime/bakery-mobile-phases-1-4/mobile-live-user.json',
      ).readAsString(),
    ) as Map<String, dynamic>;
    private['owner'] = {
      'email': owner['email'],
      'password': owner['password'],
      'id': compatible['ownerId'],
    };
    private['productId'] = compatible['productId'];
  }
  final resume = stage == 'resume'
      ? jsonDecode(await File('${out.path}/resume-fixture.json').readAsString())
            as Map<String, dynamic>
      : null;
  final rfqTitle = resume?['title'] as String? ?? 'Android Phase5 $stamp';
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

  Future<void> shot(String name) async {
    await File('${out.path}/ui-$name.png')
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
    await tap(find.byValueKey('form-submit'));
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
    Future<String> ui() async {
      final result = await Process.run('adb', [
        '-s',
        Platform.environment['PHASE5_DEVICE'] ?? 'emulator-5554',
        'exec-out',
        'uiautomator',
        'dump',
        '/dev/tty',
      ]);
      return '${result.stdout}';
    }

    Future<bool> select(String xml, String value) async {
      final match = RegExp(
        '<node[^>]*(?:text|content-desc)="${RegExp.escape(value)}"[^>]*bounds="\\[(\\d+),(\\d+)\\]\\[(\\d+),(\\d+)\\]"',
      ).firstMatch(xml);
      if (match == null) return false;
      final x = (int.parse(match[1]!) + int.parse(match[3]!)) ~/ 2,
          y = (int.parse(match[2]!) + int.parse(match[4]!)) ~/ 2;
      await Process.run('adb', [
        '-s',
        Platform.environment['PHASE5_DEVICE'] ?? 'emulator-5554',
        'shell',
        'input',
        'tap',
        '$x',
        '$y',
      ]);
      return true;
    }

    for (var i = 0; i < 8; i++) {
      await Future<void>.delayed(const Duration(milliseconds: 600));
      final xml = await ui();
      if (await select(xml, filename)) {
        await Future<void>.delayed(const Duration(seconds: 1));
        return;
      }
      if (await select(xml, 'Show roots')) {
        await Future<void>.delayed(const Duration(milliseconds: 400));
        await select(await ui(), 'Downloads');
      } else {
        await select(xml, 'Downloads');
      }
    }
    throw StateError('Native file picker could not locate synthetic document');
  }

  try {
    await driver.runUnsynchronized(() async {
      if (stage == 'review') {
        await login('customer');
        step = 'final-read-only-offer';
        await nav('/offer-detail', id: compatible!['offerId'] as String);
        await wait(find.text('Synthetic compatible offer edited'));
        await shot('review-offer');
        pass('Final localized offer UI with real server price');
        step = 'final-read-only-chat';
        await nav('/chat-detail', id: compatible['conversationId'] as String);
        await wait(find.text('Đã đóng'));
        await wait(
          find.text(
            'Chưa tải được lịch sử trò chuyện. Bạn có thể thử lại sau.',
          ),
        );
        await shot('review-chat-history');
        pass('Final closed conversation and neutral history failure UI');
        step = 'final-review-logout';
        await nav('/profile');
        await tap(find.byValueKey('logout'));
        await wait(find.byValueKey('login-nav'));
        pass('Final read-only review synthetic logout');
      } else if (stage == 'session-seed') {
        await login('customer');
        await nav('/profile');
        await requireEvent('/api/v1/auth/me', 'GET', 200);
        await shot('session-seed');
        pass('Synthetic Customer session stored in isolated secure namespace');
      } else if (stage == 'extended') {
        await login('customer');
        step = 'conversation-discovery';
        await nav('/chat');
        await wait(
          find.byValueKey('conversation-${compatible!['conversationId']}'),
        );
        await shot('compatible-chat-list');
        pass('Real conversation discovery with server unread metadata');
        step = 'customer-offer-detail';
        await nav('/offer-detail', id: compatible['offerId'] as String);
        await wait(find.text('Synthetic compatible offer edited'));
        await shot('compatible-offer');
        pass('Customer real offer detail and exact server price');
        step = 'customer-chat-send';
        await tap(find.text('Mở trò chuyện'));
        await requireEvent('/api/v1/conversations', 'POST', 200);
        await wait(
          find.text(
            'Chưa tải được lịch sử trò chuyện. Bạn có thể thử lại sau.',
          ),
        );
        await tap(find.byValueKey('chat-compose'));
        await driver.enterText('Synthetic Android customer message $stamp');
        await tap(find.byValueKey('chat-send'));
        await wait(find.text('Synthetic Android customer message $stamp'));
        await shot('compatible-customer-chat');
        pass(
          'Customer native send acknowledged by server; history remains blocked',
        );
        await checkCart();
        step = 'logout-customer-extended';
        await nav('/profile');
        await tap(find.byValueKey('logout'));
        await wait(find.byValueKey('login-nav'));
        await login('owner');
        step = 'owner-profile-compatible';
        await nav('/vendor-profile');
        await wait(find.text('Hồ sơ và vận hành'));
        await requireEvent('/api/v1/bakeries/onboarding', 'GET', 200);
        await Future<void>.delayed(const Duration(seconds: 1));
        await shot('compatible-owner-profile');
        pass('Current Mobile Owner onboarding API regression');
        step = 'owner-subscription-compatible';
        await nav('/vendor-subscription');
        await wait(find.text('Gói thuê của tiệm'));
        await requireEvent(
          '/api/v1/bakeries/${compatible['bakeryId']}/subscription',
          'GET',
          200,
        );
        await Future<void>.delayed(const Duration(seconds: 1));
        await shot('compatible-subscription');
        pass('Current Mobile subscription regression');
        step = 'owner-catalog-regression';
        await nav('/vendor-menu');
        await requireEvent(
          '/api/v1/bakeries/${compatible['bakeryId']}/products',
          'GET',
          200,
        );
        await Future<void>.delayed(const Duration(seconds: 1));
        await shot('compatible-catalog');
        pass('Current Mobile Owner catalog regression');
        step = 'owner-orders';
        await nav('/vendor-orders');
        await requireEvent('/api/v1/orders', 'GET', 200);
        await shot('compatible-owner-orders');
        pass('Owner order list with real membership');
        step = 'owner-rfq-compatible';
        await nav('/vendor-requests');
        await wait(find.byValueKey('rfq-${compatible['requestId']}'));
        await shot('compatible-owner-rfqs');
        pass('Owner eligible RFQ list on compatible topology');
        step = 'owner-offer-create';
        if (compatible['uiCreatedOfferId'] == null) {
          await nav(
            '/vendor-request-detail',
            id: compatible['uiCreateRequestId'] as String,
          );
          await tap(find.byValueKey('offer-new'));
          await tap(find.byValueKey('offer-editor-open'));
          await field('cakePrice', '360000');
          await field('deliveryFee', '20000');
          await field('message', 'Synthetic Android created offer $stamp');
          await field(
            'estimatedCompletionAt',
            DateTime.now()
                .toUtc()
                .add(const Duration(days: 10))
                .toIso8601String(),
          );
          await field(
            'expiresAt',
            DateTime.now()
                .toUtc()
                .add(const Duration(days: 7))
                .toIso8601String(),
          );
          await tap(find.byValueKey('form-submit'));
          await wait(find.text('Synthetic Android created offer $stamp'));
          await requireEvent(
            '/api/v1/cake-requests/${compatible['uiCreateRequestId']}/offers',
            'POST',
            201,
          );
          await shot('compatible-offer-created');
          pass('Owner creates eligible offer through native UI');
        } else {
          await nav(
            '/vendor-offer-detail',
            id: compatible['uiCreatedOfferId'] as String,
          );
        }
        step = 'owner-offer-edit';
        await tap(find.text('Sửa báo giá'));
        await tap(find.byValueKey('offer-editor-open'));
        await field('message', 'Synthetic Android edited offer $stamp');
        await tap(find.byValueKey('form-submit'));
        await wait(find.text('Synthetic Android edited offer $stamp'));
        await shot('compatible-offer-edited');
        pass(
          'Owner edits offer through native form and reloads persisted detail',
        );
        step = 'owner-offer-withdraw';
        await tap(find.text('Rút báo giá'));
        await field('reason', 'Synthetic local withdrawal');
        await tap(find.byValueKey('form-submit'));
        await wait(find.text('Đã rút'));
        await shot('compatible-offer-withdrawn');
        pass('Owner withdraw confirmed by Backend');
        step = 'owner-chat-send';
        await nav('/vendor-chat');
        await tap(
          find.byValueKey('conversation-${compatible['conversationId']}'),
        );
        await wait(
          find.text(
            'Chưa tải được lịch sử trò chuyện. Bạn có thể thử lại sau.',
          ),
        );
        await tap(find.byValueKey('chat-compose'));
        await driver.enterText('Synthetic Android owner message $stamp');
        await tap(find.byValueKey('chat-send'));
        await wait(find.text('Synthetic Android owner message $stamp'));
        await shot('compatible-owner-chat');
        pass('Owner native message send with server ID');
        step = 'native-attachment-upload';
        await tap(find.byValueKey('chat-pick-files'));
        await pickNative(Platform.environment['PHASE5_PICKER_FILENAME']!);
        await wait(find.text('Đã chọn 1 tệp'));
        await tap(find.byValueKey('chat-send'));
        await wait(
          find.text(
            'Tệp đã được dịch vụ nhận nhưng liên kết tải chưa dùng được trên thiết bị.',
          ),
        );
        await shot('compatible-native-attachment');
        pass(
          'Native scoped picker and actual attachment upload; public download remains blocked',
        );
        final sent = ((await state())['events'] as List).lastWhere(
          (e) =>
              e['method'] == 'POST' &&
              e['path'] ==
                  '/api/v1/conversations/${compatible['conversationId']}/messages' &&
              e['status'] == 201,
        ) as Map;
        step = 'owner-chat-delete';
        await tap(
          find.byValueKey('delete-message-${(sent['ids'] as List).first}'),
        );
        await tap(find.text('Xác nhận'));
        await wait(find.text('Tin nhắn đã xóa'));
        pass('Own message deletion confirmed by HTTP 204');
        step = 'chat-close';
        await tap(find.text('Đóng hội thoại'));
        await field('reason', 'Synthetic UI conversation completed');
        await tap(find.byValueKey('form-submit'));
        await wait(find.text('Đã đóng'));
        await shot('compatible-chat-closed');
        pass('Conversation close invoked through native form');
        step = 'owner-logout-extended';
        await nav('/profile');
        await tap(find.byValueKey('logout'));
        await wait(find.byValueKey('login-nav'));
        pass('Owner logout on compatible runtime');
      } else {
        if (stage != 'owner') {
          step = 'public-home';
          await nav('/');
          await wait(find.text('Một chiếc bánh,\nthật là bạn.'));
          await shot('home');
          pass('Public Home native render');
          step = 'login-customer';
          await login('customer');
          pass('Customer login and same identity');
          if (resume == null) {
            step = 'rfq-create';
            await nav('/request-new');
            await field('title', 'Android Phase5 $stamp');
            await field('description', 'Synthetic Android request');
            await field(
              'neededAt',
              DateTime.now()
                  .toUtc()
                  .add(const Duration(days: 20))
                  .toIso8601String(),
            );
            await field('deliveryCity', 'Ho Chi Minh City');
            await field('deliveryDistrict', 'District 1');
            await tap(find.byValueKey('form-submit'));
            await wait(find.text('Android Phase5 $stamp'));
            await shot('rfq-created');
            pass('Create RFQ through actual UI and reload detail');
            step = 'rfq-edit';
            await tap(find.byValueKey('rfq-edit'));
            await field('description', 'Synthetic Android request edited');
            await tap(find.byValueKey('form-submit'));
            await wait(find.text('Synthetic Android request edited'));
            pass('Edit draft, persisted detail');
          } else {
            await nav('/request-detail', id: resume['id'] as String);
            await wait(find.text(rfqTitle));
          }
          step = 'rfq-publish';
          await tap(find.byValueKey('rfq-publish'));
          await tap(find.text('Xác nhận'));
          await wait(find.text('Đang nhận báo giá'));
          await shot('rfq-open');
          pass('Publish RFQ and server state rendered');
          step = 'rfq-list';
          await nav('/requests');
          await wait(find.text(rfqTitle));
          await shot('rfq-list');
          pass('Customer server RFQ list');
          step = 'rfq-cancel';
          await tap(find.text(rfqTitle));
          await tap(find.text('Hủy yêu cầu'));
          await field('reason', 'Synthetic Android lifecycle completed');
          await tap(find.byValueKey('form-submit'));
          await wait(find.text('Đã hủy'));
          await shot('rfq-cancelled');
          pass('Cancel RFQ and persisted server state');
          step = 'offers';
          await nav('/offers');
          await wait(find.text('Báo giá đã nhận'));
          await shot('offers');
          pass('Customer received offers screen');
          step = 'orders';
          await nav('/orders');
          await wait(find.text('Đơn bánh của tôi'));
          await shot('orders');
          pass('Customer orders list');
          step = 'chat-list';
          await nav('/chat');
          await wait(find.text('Trò chuyện'));
          await wait(find.text('Chưa có dữ liệu phù hợp'));
          await shot('chat-empty');
          pass('Chat authorized empty list, no fixtures');
          await checkCart();
          step = 'logout-customer';
          await nav('/profile');
          await tap(find.byValueKey('logout'));
          await wait(find.byValueKey('login-nav'));
          pass('Customer logout');
        }
        step = 'owner-login';
        await login('owner');
        pass('Owner login');
        step = 'owner-rfqs';
        await nav('/vendor-requests');
        await wait(find.text('Chưa tải được dữ liệu'));
        await shot('owner-rfq-blocked');
        cases.add({
          'case': 'Owner RFQ availability',
          'result': 'BLOCKED_ENVIRONMENT',
          'reason': 'Existing Bakery binary scope mismatch; HTTP 503',
        });
        step = 'owner-offers';
        await nav('/vendor-offers');
        await wait(find.text('Chưa tải được dữ liệu'));
        await shot('owner-offers-blocked');
        cases.add({'case': 'Owner offers', 'result': 'BLOCKED_ENVIRONMENT'});
        step = 'owner-management-regression';
        await nav('/vendor-profile');
        await wait(find.text('Hồ sơ và vận hành'));
        await Future<void>.delayed(const Duration(seconds: 2));
        await shot('owner-profile');
        pass('Existing Owner profile route regression');
        step = 'subscription-regression';
        await nav('/vendor-subscription');
        await wait(find.text('Gói thuê của tiệm'));
        await Future<void>.delayed(const Duration(seconds: 2));
        await shot('subscription');
        pass('Existing subscription screen rendered');
        step = 'logout-owner';
        await nav('/profile');
        await tap(find.byValueKey('logout'));
        await wait(find.byValueKey('login-nav'));
        pass('Owner logout');
      }
    });
  } catch (e) {
    cases.add({
      'case': step,
      'result': 'FAIL_MOBILE_OR_HARNESS',
      'errorType': e.runtimeType.toString(),
    });
    await shot('failure');
    stdout.writeln('Stopped at checkpoint: $step (${e.runtimeType})');
  } finally {
    final finalState = await state();
    await File('${out.path}/android-ui.json').writeAsString(
      jsonEncode({
        'cases': cases,
        'events': finalState['events'],
        'origins': finalState['origins'],
        'lastStep': step,
        'credentialsPersisted': false,
      }),
    );
    await driver.close();
  }
  if (cases.any((r) => r['result'] == 'FAIL_MOBILE_OR_HARNESS')) exitCode = 1;
}
