import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:bakery_mobile/core/api/contracts.dart';
import 'package:bakery_mobile/features/orders/presentation/live_order_pages.dart';
import 'package:bakery_mobile/features/marketplace/presentation/live_offer_pages.dart';
import 'package:bakery_mobile/features/reviews/presentation/live_review_section.dart';
import 'package:bakery_mobile/features/ai/presentation/live_ai_pages.dart';

import 'api_foundation_test.dart' show FakeTransport, ok;
import 'phase5_widget_test.dart' show workspace, app;
import 'phase5_contract_test.dart' show id, other;

void main() {
  testWidgets(
    'Admin offers use authorized discovery without Customer received scope',
    (tester) async {
      final t = FakeTransport();
      t.respond = (m, u, h) async => ok({
        'meta': {'page': 1, 'pages': 0, 'total': 0},
        'result': <Json>[],
      });
      final w = workspace(t);
      w.session.user = {
        'id': other,
        'roles': ['ADMIN'],
      };
      await tester.pumpWidget(app(w, const LiveOffersPage(admin: true)));
      await tester.pumpAndSettle();
      expect(
        (t.calls.single['uri'] as Uri).queryParameters.containsKey('scope'),
        false,
      );
      expect(find.text('Giám sát báo giá'), findsOneWidget);
      expect(tester.takeException(), isNull);
      await tester.pumpWidget(const SizedBox());
      w.dispose();
    },
  );
  for (final status in ['PENDING', 'COMPLETED']) {
    testWidgets(
      'Customer review action requires completed own order: $status',
      (tester) async {
        final t = FakeTransport();
        final w = workspace(t);
        await tester.pumpWidget(
          app(
            w,
            LiveReviewSection({
              'id': id,
              'customerId': other,
              'status': status,
            }, reload: () {}),
            scale: 1.8,
          ),
        );
        await tester.pumpAndSettle();
        expect(
          find.byKey(const ValueKey('review-edit')),
          status == 'COMPLETED' ? findsOneWidget : findsNothing,
        );
        expect(tester.takeException(), isNull);
        expect(t.calls, isEmpty);
        await tester.pumpWidget(const SizedBox());
        w.dispose();
      },
    );
  }
  testWidgets(
    'Hidden review cannot edit, can delete, Admin can publish; deleted cannot recreate',
    (tester) async {
      final w = workspace(FakeTransport());
      w.session.user = {
        'id': other,
        'roles': ['CUSTOMER', 'ADMIN'],
      };
      for (final status in ['HIDDEN', 'DELETED']) {
        await tester.pumpWidget(
          app(
            w,
            LiveReviewSection(
              {
                'id': id,
                'customerId': other,
                'status': 'COMPLETED',
                'review': {
                  'orderId': id,
                  'rating': 4,
                  'status': status,
                  'comment': 'Unit review',
                  'updatedAt': '2026-11-08T00:00:00Z',
                },
              },
              admin: true,
              reload: () {},
            ),
          ),
        );
        await tester.pumpAndSettle();
        expect(find.byKey(const ValueKey('review-edit')), findsNothing);
        expect(
          find.text('Công khai đánh giá'),
          status == 'HIDDEN' ? findsOneWidget : findsNothing,
        );
        expect(tester.takeException(), isNull);
      }
      await tester.pumpWidget(const SizedBox());
      w.dispose();
    },
  );
  testWidgets(
    'Admin Order discovery uses all scope and renders empty server result',
    (tester) async {
      final t = FakeTransport();
      t.respond = (m, u, h) async => ok({
        'meta': {'page': 1, 'pages': 0, 'total': 0},
        'result': <Json>[],
      });
      final w = workspace(t);
      w.session.user = {
        'id': other,
        'roles': ['ADMIN'],
      };
      await tester.pumpWidget(
        app(w, const LiveOrdersPage(admin: true), scale: 1.8),
      );
      await tester.pumpAndSettle();
      expect((t.calls.single['uri'] as Uri).queryParameters['scope'], 'all');
      expect(find.text('Chưa có dữ liệu phù hợp'), findsOneWidget);
      expect(tester.takeException(), isNull);
      await tester.pumpWidget(const SizedBox());
      w.dispose();
    },
  );
  testWidgets(
    'Missing AI configuration never replaces backend with mock results',
    (tester) async {
      final t = FakeTransport();
      final w = workspace(t);
      await tester.pumpWidget(app(w, const LiveAiJobsPage()));
      await tester.pumpAndSettle();
      expect(find.text('Chưa tải được dữ liệu'), findsOneWidget);
      expect(find.textContaining('SUCCEEDED'), findsNothing);
      expect(t.calls, isEmpty);
      expect(tester.takeException(), isNull);
      await tester.pumpWidget(const SizedBox());
      w.dispose();
    },
  );
}
