import 'dart:async';

import 'package:bakery_mobile/core/api/contracts.dart';
import 'package:bakery_mobile/core/api/transport.dart';
import 'package:bakery_mobile/features/orders/presentation/live_order_pages.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'remediation_test_support.dart'
    show FakeTransport, ok, id, other, app, workspace;

Json order(String status, {Json? review}) => {
  'id': id,
  'customerId': other,
  'status': status,
  'orderNumber': 'LOCAL-TEST',
  'bakeryName': 'Tiệm kiểm thử',
  'totalAmount': 300000,
  'deliveryFee': 20000,
  'neededAt': '2030-01-01T00:00:00Z',
  'orderSource': 'DIRECT_CATALOG',
  'items': <Json>[],
  'statusHistory': <Json>[],
  'review': review,
};

void main() {
  testWidgets(
    'customer confirms once, pending request disables duplicate taps, then review is available',
    (tester) async {
      final t = FakeTransport(), pending = Completer<WireResponse>();
      var current = order('DELIVERING');
      t.respond = (m, u, h) async => m == 'POST' ? pending.future : ok(current);
      final w = workspace(t);
      await tester.pumpWidget(app(w, const LiveOrderDetail(id)));
      await tester.pumpAndSettle();
      final action = find.byKey(const ValueKey('order-transition-COMPLETED'));
      await tester.ensureVisible(action);
      await tester.tap(find.text('Xác nhận đã nhận bánh'));
      // The command spinner intentionally stays active while confirmation is open.
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));
      expect(t.calls.where((c) => c['method'] == 'POST'), isEmpty);
      await tester.tap(find.text('Xác nhận', skipOffstage: false).last);
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));
      await tester.tap(find.text('Xác nhận đã nhận bánh'));
      await tester.pump();
      expect(t.calls.where((c) => c['method'] == 'POST').length, 1);
      current = order('COMPLETED');
      pending.complete(ok(current));
      await tester.pumpAndSettle();
      expect(action, findsNothing);
      expect(find.byKey(const ValueKey('review-edit')), findsOneWidget);
      expect(tester.takeException(), isNull);
      await tester.pumpWidget(const SizedBox());
      w.dispose();
    },
  );

  for (final lost in [false, true]) {
    testWidgets(
      'review create/edit PENDING and ${lost ? 'lost response readback' : 'normal response'} never duplicate POST',
      (tester) async {
        final t = FakeTransport();
        var current = order('COMPLETED');
        t.respond = (m, u, h) async {
          if (m == 'POST' || m == 'PATCH') {
            final body = t.calls.last['body'] as Json;
            current = order(
              'COMPLETED',
              review: {
                ...body,
                'orderId': id,
                'customerId': other,
                'status': 'PENDING',
                'updatedAt': '2026-11-14T00:00:00Z',
              },
            );
            // A malformed successful response is unknown; the server state above persists.
            return lost ? WireResponse(201, null, []) : ok(current['review']);
          }
          return ok(current);
        };
        final w = workspace(t);
        await tester.pumpWidget(app(w, const LiveOrderDetail(id)));
        await tester.pumpAndSettle();
        for (final comment in ['Bánh ngon', 'Bánh mềm, ít ngọt']) {
          final edit = find.byKey(const ValueKey('review-edit'));
          await tester.ensureVisible(edit);
          await tester.tap(edit);
          await tester.pumpAndSettle();
          await tester.enterText(
            find.byKey(const ValueKey('field-comment')),
            comment,
          );
          await tester.ensureVisible(find.byKey(const ValueKey('form-submit')));
          await tester.tap(find.byKey(const ValueKey('form-submit')));
          await tester.pumpAndSettle();
          if (lost) {
            expect(find.textContaining('HTTP 502'), findsNothing);
            await tester.ensureVisible(find.text('Đọc lại đánh giá'));
            await tester.tap(find.text('Đọc lại đánh giá'));
            await tester.pumpAndSettle();
            expect(find.text('Bỏ thay đổi chưa lưu?'), findsNothing);
          }
          expect(
            find.text(
              'Đánh giá đã được lưu và đang chờ duyệt. Nội dung chưa được công khai.',
            ),
            findsOneWidget,
          );
          expect(find.text(comment), findsOneWidget);
        }
        expect(t.calls.where((c) => c['method'] == 'POST').length, 1);
        expect(t.calls.where((c) => c['method'] == 'PATCH').length, 1);
        expect(tester.takeException(), isNull);
        await tester.pumpWidget(const SizedBox());
        w.dispose();
      },
    );
  }
}
