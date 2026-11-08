import 'package:bakery_mobile/app/router/screen_id.dart';
import 'package:bakery_mobile/core/demo/demo_workspace.dart';
import 'package:bakery_mobile/features/auth/domain/demo_session.dart';
import 'package:bakery_mobile/main.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';

void main() {
  final binding = IntegrationTestWidgetsFlutterBinding.ensureInitialized();
  testWidgets(
    '35 route và hành trình thật trên Android, toàn bộ dữ liệu local',
    (tester) async {
      bool converted = false;
      Future<void> shot(String name) async {
        FocusManager.instance.primaryFocus?.unfocus();
        ScaffoldMessenger.of(tester.element(find.byType(Scaffold).last))
            .clearSnackBars();
        if (!converted) {
          await binding.convertFlutterSurfaceToImage();
          converted = true;
        }
        await tester.pumpAndSettle();
        await tester.pump(const Duration(milliseconds: 600));
        await binding.takeScreenshot(name);
      }

      for (final screen in ScreenId.values) {
        final w = DemoWorkspace();
        w.session.switchPersona(screen.previewPersona);
        await tester.pumpWidget(
          BakeryApp(key: UniqueKey(), workspace: w, initialRoute: screen.path),
        );
        await tester.pumpAndSettle();
        expect(tester.takeException(), isNull, reason: screen.path);
        await shot('${screen.index.toString().padLeft(2, '0')}-${screen.name}');
        await tester.pumpWidget(const SizedBox());
        w.dispose();
      }
      final w = DemoWorkspace(), nav = GlobalKey<NavigatorState>();
      w.session.switchPersona(Persona.customer);
      await tester.pumpWidget(
        BakeryApp(
          key: UniqueKey(),
          workspace: w,
          navigatorKey: nav,
          initialRoute: '/product-detail',
        ),
      );
      await tester.pumpAndSettle();
      await tester.pump(const Duration(milliseconds: 600));
      await tester.tap(find.text('Thêm vào giỏ demo'));
      await tester.pumpAndSettle();
      expect(w.cart.count, 1);
      nav.currentState!.pushNamed('/cart');
      await tester.pumpAndSettle();
      await tester.tap(find.byTooltip('Tăng số lượng'));
      await tester.pumpAndSettle();
      expect(w.cart.count, 2);
      await tester.tap(find.text('Xem trước đơn bánh'));
      await tester.pumpAndSettle();
      await shot('35-cart-preview');
      await tester.ensureVisible(find.text('Lưu bản xem trước local'));
      await tester.tap(find.text('Lưu bản xem trước local'));
      await tester.pumpAndSettle();
      expect(w.cart.previews.length, 1);
      nav.currentState!.pushNamed(
        '/chat',
        arguments: const ScreenArguments(id: 'chat-01'),
      );
      await tester.pumpAndSettle();
      await tester.enterText(
        find.byType(TextField).last,
        'Mình muốn bánh ít ngọt nhé.',
      );
      await tester.tap(find.byTooltip('Gửi local'));
      await tester.pumpAndSettle();
      expect(
        w.chat.get('chat-01').messages.last.text,
        'Mình muốn bánh ít ngọt nhé.',
      );
      await shot('36-chat-thread');
      nav.currentState!.pushNamed('/rfq-new');
      await tester.pumpAndSettle();
      await tester.enterText(
        find.widgetWithText(TextFormField, 'Tên yêu cầu'),
        'Sinh nhật mùa đông',
      );
      await tester.enterText(
        find.widgetWithText(TextFormField, 'Mô tả ý tưởng'),
        'Bánh kem hồng nhạt, vị dâu, ít ngọt cho tám người.',
      );
      FocusManager.instance.primaryFocus?.unfocus();
      await tester.pumpAndSettle();
      await tester.ensureVisible(find.text('Lưu bản nháp local'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Lưu bản nháp local'));
      await tester.pumpAndSettle();
      expect(w.marketplace.requests.first.title, 'Sinh nhật mùa đông');
      await shot('37-request-saved');
      w.session.switchPersona(Persona.owner);
      nav.currentState!.pushNamedAndRemoveUntil(
        '/vendor-orders',
        (_) => false,
        arguments: const ScreenArguments(id: 'SC-260703'),
      );
      await tester.pumpAndSettle();
      await shot('38-owner-order-detail');
      w.session.switchPersona(Persona.admin);
      nav.currentState!.pushNamedAndRemoveUntil(
        '/admin-payments',
        (_) => false,
      );
      await tester.pumpAndSettle();
      await tester.ensureVisible(find.text('Duyệt trong bản demo'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Duyệt trong bản demo'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Xác nhận trong demo'));
      await tester.pumpAndSettle();
      expect(w.subscriptions.orders[1].status, 'PAID');
      await shot('39-admin-reviewed');
      w.session.switchPersona(Persona.customer);
      w.session.setScenario('/rfqs', DemoScenario.error);
      nav.currentState!.pushNamedAndRemoveUntil('/rfqs', (_) => false);
      await tester.pumpAndSettle();
      await shot('40-error-retry');
      await tester.tap(find.text('Thử lại'));
      await tester.pumpAndSettle();
      expect(find.text('Tạo yêu cầu mới'), findsOneWidget);
      expect(tester.takeException(), isNull);
      await tester.pumpWidget(const SizedBox());
      w.dispose();
    },
  );
}
