import 'package:bakery_mobile/features/chat/data/pending_chat_journal.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:bakery_mobile/core/api/environment.dart';
import 'package:bakery_mobile/core/live/live_workspace.dart';
import 'package:bakery_mobile/features/ai/presentation/live_ai_pages.dart';

import 'api_foundation_test.dart'
    show FakeTransport, MemorySessionStore, ok, seed;
import 'phase5_widget_test.dart' show app;
import 'phase5_contract_test.dart' show id, other;

void main() {
  for (final status in ['PENDING', 'APPROVED']) {
    testWidgets(
      'Admin decisions require PENDING; mode remains explicit: $status',
      (tester) async {
        final t = FakeTransport();
        t.respond = (method, uri, headers) async => ok({
          'id': id,
          'generationJobId': other,
          'moderationStatus': status,
        });
        final w = LiveWorkspace(
          chatJournal: MemoryPendingChatJournal(),
          environment: ApiEnvironment(
            identity: Uri.parse('http://127.0.0.1:1'),
            bakery: Uri.parse('http://127.0.0.1:2'),
            subscription: Uri.parse('http://127.0.0.1:3'),
            cakeAi: Uri.parse('http://127.0.0.1:5'),
            cakeAiMode: CakeAiMode.localFallback,
          ),
          transport: t,
          store: MemorySessionStore(),
        );
        seed(w.session, expired: false);
        w.session.user = {
          'id': other,
          'roles': ['ADMIN'],
        };
        w.session.restoring = false;
        tester.view.physicalSize = const Size(640, 1280);
        tester.view.devicePixelRatio = 2;
        addTearDown(tester.view.resetPhysicalSize);
        addTearDown(tester.view.resetDevicePixelRatio);
        await tester.pumpWidget(
          app(w, const LiveAiDesignPage(id, admin: true), scale: 1.8),
        );
        await tester.pumpAndSettle();
        expect(
          find.textContaining('không gọi nhà cung cấp AI'),
          findsOneWidget,
        );
        expect(
          find.text('Duyệt thiết kế'),
          status == 'PENDING' ? findsOneWidget : findsNothing,
        );
        expect(
          find.text('Từ chối thiết kế'),
          status == 'PENDING' ? findsOneWidget : findsNothing,
        );
        expect(t.calls.every((c) => c['method'] == 'GET'), true);
        expect(tester.takeException(), isNull);
        await tester.pumpWidget(const SizedBox());
        w.dispose();
      },
    );
  }
}
