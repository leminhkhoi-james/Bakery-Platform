import 'package:bakery_mobile/app/router/screen_id.dart';
import 'package:bakery_mobile/core/demo/demo_workspace.dart';
import 'package:bakery_mobile/features/auth/domain/demo_session.dart';
import 'package:bakery_mobile/main.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('35 màn hình đều có loading, empty, error và retry local', (
    tester,
  ) async {
    tester.view.devicePixelRatio = 1;
    tester.view.physicalSize = const Size(390, 900);
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    for (final screen in ScreenId.values) {
      final w = DemoWorkspace();
      w.session.switchPersona(screen.previewPersona);
      for (final scenario in [
        DemoScenario.loading,
        DemoScenario.empty,
        DemoScenario.error,
      ]) {
        w.session.setScenario(screen.path, scenario);
        await tester.pumpWidget(
          BakeryApp(key: UniqueKey(), workspace: w, initialRoute: screen.path),
        );
        await tester.pump(const Duration(milliseconds: 500));
        if (scenario == DemoScenario.loading) {
          expect(find.byType(CircularProgressIndicator), findsOneWidget);
        }
        if (scenario == DemoScenario.error) {
          await tester.tap(find.text('Thử lại'));
          await tester.pumpAndSettle();
          expect(w.session.scenario(screen.path), DemoScenario.normal);
        }
        expect(
          tester.takeException(),
          isNull,
          reason: '${screen.name}/${scenario.name}',
        );
        await tester.pumpWidget(const SizedBox());
      }
      w.dispose();
    }
  });
  for (final width in [320.0, 360.0, 390.0, 430.0, 768.0]) {
    testWidgets('35 màn hình: rộng $width, không lỗi bố cục', (tester) async {
      tester.view.devicePixelRatio = 1;
      tester.view.physicalSize = Size(width, 900);
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);
      for (final screen in ScreenId.values) {
        final w = DemoWorkspace();
        w.session.switchPersona(screen.previewPersona);
        await tester.pumpWidget(
          BakeryApp(key: UniqueKey(), workspace: w, initialRoute: screen.path),
        );
        await tester.pumpAndSettle();
        expect(
          tester.takeException(),
          isNull,
          reason: '${screen.name} width=$width',
        );
        final scrollable = find.byKey(ValueKey('content-${screen.name}'));
        if (scrollable.evaluate().isNotEmpty) {
          await tester.drag(scrollable, const Offset(0, -650));
          await tester.pumpAndSettle();
          expect(
            tester.takeException(),
            isNull,
            reason: '${screen.name} scrolled width=$width',
          );
        }
        await tester.pumpWidget(const SizedBox());
        w.dispose();
      }
    });
  }
  testWidgets('35 màn hình với chữ lớn 1.8 và landscape 768×430', (
    tester,
  ) async {
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    for (final size in [const Size(360, 900), const Size(768, 430)]) {
      tester.view.physicalSize = size;
      for (final s in ScreenId.values) {
        final w = DemoWorkspace();
        w.session.switchPersona(s.previewPersona);
        await tester.pumpWidget(
          BakeryApp(key: UniqueKey(), workspace: w, initialRoute: s.path),
        );
        // Thay thông số tiếp cận của nền tảng, không sửa theme ứng dụng.
        tester.platformDispatcher.textScaleFactorTestValue = size.width == 360
            ? 1.8
            : 1;
        await tester.pumpAndSettle();
        expect(tester.takeException(), isNull, reason: '${s.name} size=$size');
        await tester.pumpWidget(const SizedBox());
        w.dispose();
      }
    }
    tester.platformDispatcher.clearTextScaleFactorTestValue();
  });
  testWidgets(
    'Tình huống local và retry khôi phục nội dung, route chặn sai vai',
    (tester) async {
      final w = DemoWorkspace();
      await tester.pumpWidget(
        BakeryApp(workspace: w, initialRoute: '/admin-users'),
      );
      await tester.pumpAndSettle();
      expect(find.text('Vai demo chưa có quyền mở màn hình'), findsOneWidget);
      await tester.pumpWidget(const SizedBox());
      w.session.switchPersona(Persona.customer);
      for (final scenario in DemoScenario.values) {
        w.session.setScenario('/rfqs', scenario);
        await tester.pumpWidget(
          BakeryApp(key: UniqueKey(), workspace: w, initialRoute: '/rfqs'),
        );
        await tester.pump(const Duration(milliseconds: 500));
        expect(tester.takeException(), isNull, reason: scenario.name);
        if (scenario == DemoScenario.error) {
          await tester.tap(find.text('Thử lại'));
          await tester.pumpAndSettle();
          expect(find.text('Tạo yêu cầu mới'), findsOneWidget);
        }
        await tester.pumpWidget(const SizedBox());
      }
      w.dispose();
    },
  );
}
