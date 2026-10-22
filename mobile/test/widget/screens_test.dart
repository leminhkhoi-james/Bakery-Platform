import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:sweetcake_mobile/app/app.dart';
import 'package:sweetcake_mobile/app/router/destination.dart';
import 'package:sweetcake_mobile/mocks/fixture_bundle.dart';
import 'package:sweetcake_mobile/state/app_state.dart';

import '../helpers/fonts.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  late FixtureBundle fixtures;
  setUpAll(() async {
    fixtures = await FixtureBundle.load();
    await loadBrandFonts();
  });
  for (final destination in Destination.values) {
    testWidgets('${destination.name}_rendersOfflineAtPhoneSize', (
      tester,
    ) async {
      await tester.binding.setSurfaceSize(const Size(390, 844));
      addTearDown(() => tester.binding.setSurfaceSize(null));
      final state = AppState(fixtures);
      addTearDown(state.dispose);
      await tester.pumpWidget(
        SweetCakeApp(state: state, initialDestination: destination),
      );
      await tester.pumpAndSettle();
      expect(find.textContaining('MÔ PHỎNG OFFLINE'), findsWidgets);
      expect(tester.takeException(), isNull);
      final scroll = find.byType(SingleChildScrollView).first;
      await tester.drag(scroll, const Offset(0, -10000));
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull);
      await tester.pumpWidget(const SizedBox());
    });
  }
  testWidgets('auth_requiredAndRegisterPasswordValidation', (tester) async {
    final state = AppState(fixtures);
    addTearDown(state.dispose);
    await tester.pumpWidget(
      SweetCakeApp(state: state, initialDestination: Destination.auth),
    );
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.byKey(const ValueKey('auth-submit')));
    await tester.tap(find.byKey(const ValueKey('auth-submit')));
    await tester.pumpAndSettle();
    expect(find.text('Vui lòng nhập thông tin này.'), findsNWidgets(2));
    await tester.tap(find.text('Đăng ký tài khoản'));
    await tester.pumpAndSettle();
    await tester.enterText(
      find.byKey(const ValueKey('auth-phone')),
      '0900000000',
    );
    await tester.enterText(find.byKey(const ValueKey('auth-password')), '123');
    await tester.ensureVisible(find.byKey(const ValueKey('auth-submit')));
    await tester.tap(find.byKey(const ValueKey('auth-submit')));
    await tester.pumpAndSettle();
    expect(find.text('Mật khẩu phải có ít nhất 6 ký tự.'), findsOneWidget);
  });
  testWidgets('catalog_searchShowsEmptyState', (tester) async {
    final state = AppState(fixtures);
    addTearDown(state.dispose);
    await tester.pumpWidget(
      SweetCakeApp(state: state, initialDestination: Destination.explore),
    );
    await tester.pumpAndSettle();
    await tester.enterText(find.byType(TextFormField).first, 'zzzz-no-cake');
    await tester.pumpAndSettle();
    expect(find.text('Không có kết quả phù hợp.'), findsOneWidget);
  });
  testWidgets('navigation_drawerAndBackPreserveCartState', (tester) async {
    final state = AppState(fixtures);
    addTearDown(state.dispose);
    final navigator = GlobalKey<NavigatorState>();
    await tester.pumpWidget(
      SweetCakeApp(state: state, navigatorKey: navigator),
    );
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const ValueKey('navigation-menu')));
    await tester.pumpAndSettle();
    await tester.tap(find.widgetWithText(ListTile, 'Khám phá mẫu bánh'));
    await tester.pumpAndSettle();
    expect(find.text('189 mẫu bánh  ·  Trang 1 / 21'), findsOneWidget);
    navigator.currentState!.pop();
    await tester.pumpAndSettle();
    expect(find.text('Một chiếc bánh,\nthật là bạn.'), findsOneWidget);
    expect(state.cart.count, 2);
  });
  for (final d in Destination.values) {
    testWidgets('${d.name}_smallPhoneAndLargeText_hasNoOverflow', (
      tester,
    ) async {
      await tester.binding.setSurfaceSize(const Size(320, 690));
      tester.platformDispatcher.textScaleFactorTestValue = 1.8;
      addTearDown(() => tester.binding.setSurfaceSize(null));
      addTearDown(tester.platformDispatcher.clearTextScaleFactorTestValue);
      final state = AppState(fixtures);
      addTearDown(state.dispose);
      await tester.pumpWidget(
        SweetCakeApp(state: state, initialDestination: d),
      );
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull);
      await tester.drag(
        find.byType(SingleChildScrollView).first,
        const Offset(0, -10000),
      );
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull);
      await tester.pumpWidget(const SizedBox());
    });
  }
}
