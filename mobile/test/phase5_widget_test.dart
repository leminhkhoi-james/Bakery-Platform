import 'package:bakery_mobile/features/chat/data/pending_chat_journal.dart';

import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:bakery_mobile/app/theme/app_theme.dart';
import 'package:bakery_mobile/core/api/contracts.dart';
import 'package:bakery_mobile/core/api/transport.dart';
import 'package:bakery_mobile/core/live/live_workspace.dart';
import 'package:bakery_mobile/core/widgets/live_form.dart';
import 'package:bakery_mobile/features/marketplace/presentation/live_request_pages.dart';
import 'package:bakery_mobile/features/chat/presentation/live_chat_page.dart';
import 'package:bakery_mobile/features/cart/presentation/live_cart_page.dart';

import 'api_foundation_test.dart'
    show FakeTransport, MemorySessionStore, ok, seed;
import 'phase5_contract_test.dart'
    show phase5Environment, id, other, productJson;

LiveWorkspace workspace(FakeTransport t) {
  final w = LiveWorkspace(
    chatJournal: MemoryPendingChatJournal(),
    environment: phase5Environment(),
    transport: t,
    store: MemorySessionStore(),
  );
  seed(w.session, expired: false);
  w.session.user = {
    'id': other,
    'roles': ['CUSTOMER'],
  };
  w.session.restoring = false;
  return w;
}

Widget app(LiveWorkspace w, Widget child, {double scale = 1}) => LiveScope(
  workspace: w,
  child: MaterialApp(
    theme: SweetCakeTheme.light,
    builder: (context, child) => MediaQuery(
      data: MediaQuery.of(context)
          .copyWith(textScaler: TextScaler.linear(scale)),
      child: child!,
    ),
    home: child,
  ),
);
void main() {
  for (final state in ['DRAFT', 'OPEN']) {
    testWidgets('RFQ $state allows draft editing only', (tester) async {
      final t = FakeTransport();
      t.respond = (m, u, h) async => ok({
        'id': id,
        'customerId': other,
        'status': state,
        'title': 'Unit RFQ',
        'description': 'Unit description',
        'requestType': 'OPEN_CUSTOM',
        'neededAt': '2030-01-01T00:00:00Z',
        'deliveryDistrict': 'Unit district',
        'deliveryCity': 'Unit city',
        'images': <Json>[],
        'offers': <Json>[],
        'statusHistory': <Json>[],
        'preference': <String, dynamic>{},
      });
      final w = workspace(t);
      await tester.pumpWidget(app(w, const LiveRequestDetail(id)));
      await tester.pumpAndSettle();
      expect(
        find.byKey(const ValueKey('rfq-edit')),
        state == 'DRAFT' ? findsOneWidget : findsNothing,
      );
      expect(tester.takeException(), isNull);
      expect(find.text('Thiết kế AI cho yêu cầu'), findsOneWidget);
      await tester.pumpWidget(const SizedBox());
      w.dispose();
    });
  }
  testWidgets('invalid RFQ form does not send a POST', (tester) async {
    final t = FakeTransport();
    t.respond = (m, u, h) async => ok(null);
    final w = workspace(t);
    await tester.pumpWidget(app(w, const LiveRequestEditor()));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.byKey(const ValueKey('form-submit')));
    await tester.tap(find.byKey(const ValueKey('form-submit')));
    await tester.pumpAndSettle();
    expect(t.calls.where((e) => e['method'] == 'POST'), isEmpty);
    expect(tester.takeException(), isNull);
    await tester.pumpWidget(const SizedBox());
    w.dispose();
  });
  testWidgets(
    'checkout exposes address blocker and never creates fictional order',
    (tester) async {
      final t = FakeTransport();
      t.respond = (m, u, h) async => ok(null);
      final w = workspace(t);
      w.cart.set(PublicProduct.fromJson(productJson()), 1, {}, {});
      await tester.pumpWidget(app(w, const LiveCheckoutPage(), scale: 1.8));
      await tester.pumpAndSettle();
      expect(
        find.textContaining('tính năng chọn địa chỉ giao hàng'),
        findsOneWidget,
      );
      expect(
        t.calls.where((e) => (e['uri'] as Uri).path.endsWith('/direct')),
        isEmpty,
      );
      expect(tester.takeException(), isNull);
      await tester.pumpWidget(const SizedBox());
      w.dispose();
    },
  );
  testWidgets(
    'chat 403 history failure is not interpreted as proven permission denial',
    (tester) async {
      final t = FakeTransport();
      t.respond = (m, u, h) async => u.path.endsWith('/messages')
          ? WireResponse(403, {'statusCode': 403, 'data': null}, [])
          : ok({
              'id': id,
              'status': 'OPEN',
              'cakeRequestId': id,
              'participants': <Json>[],
            });
      final w = workspace(t);
      await tester.pumpWidget(app(w, const LiveChatThread(id)));
      await tester.pumpAndSettle();
      expect(
        find.textContaining('Chưa tải được lịch sử trò chuyện'),
        findsOneWidget,
      );
      expect(find.textContaining('Tin nhắn demo'), findsNothing);
      expect(tester.takeException(), isNull);
      await tester.pumpWidget(const SizedBox());
      w.dispose();
    },
  );
  testWidgets(
    'double send is gated and ambiguous message survives navigation in same session',
    (tester) async {
      final t = FakeTransport(), pending = Completer<WireResponse>();
      t.respond = (m, u, h) async {
        if (m == 'POST') return pending.future;
        if (u.path.endsWith('/messages')) {
          return ok({'items': <Json>[], 'hasMore': false, 'nextCursor': null});
        }
        return ok({
          'id': id,
          'status': 'OPEN',
          'cakeRequestId': id,
          'participants': <Json>[],
        });
      };
      final w = workspace(t);
      await tester.pumpWidget(app(w, const LiveChatThread(id)));
      await tester.pumpAndSettle();
      await tester.enterText(
        find.byKey(const ValueKey('chat-compose')),
        'Unit pending message',
      );
      await tester.ensureVisible(find.byKey(const ValueKey('chat-send')));
      await tester.tap(find.byKey(const ValueKey('chat-send')));
      await tester.pump();
      await tester.tap(find.byKey(const ValueKey('chat-send')));
      await tester.pump();
      expect(t.calls.where((e) => e['method'] == 'POST').length, 1);
      pending.complete(
        WireResponse(503, {'statusCode': 503, 'data': null}, []),
      );
      await tester.pumpAndSettle();
      final key = w.chat.pending[id]!.id;
      await tester.pumpWidget(const SizedBox());
      await tester.pumpWidget(app(w, const LiveChatThread(id)));
      await tester.pumpAndSettle();
      expect(w.chat.pending[id]!.id, key);
      expect(find.text('Gửi lại cùng mã tin nhắn'), findsOneWidget);
      expect(tester.takeException(), isNull);
      await tester.pumpWidget(const SizedBox());
      w.dispose();
    },
  );
  testWidgets('RFQ form scrolls at 320px with large text', (tester) async {
    tester.view.physicalSize = const Size(320, 720);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    final t = FakeTransport();
    t.respond = (m, u, h) async => ok(null);
    final w = workspace(t);
    await tester.pumpWidget(app(w, const LiveRequestEditor(), scale: 1.8));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.byKey(const ValueKey('form-submit')));
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);
    await tester.pumpWidget(const SizedBox());
    w.dispose();
  });
  test('new native date fields validate explicit timezone and future', () {
    const field = FormFieldSpec(
      'neededAt',
      'Ngày cần bánh',
      kind: FieldKind.instant,
      required: true,
    );
    expect(field.validate(''), isNotNull);
    expect(field.validate('2030-01-01T09:00:00'), isNotNull);
    expect(field.validate('2030-01-01T09:00:00+07:00'), isNull);
  });
}
