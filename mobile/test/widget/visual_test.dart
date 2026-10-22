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
  for (final destination in [
    Destination.home,
    Destination.explore,
    Destination.studio,
    Destination.bidding,
    Destination.cart,
    Destination.vendorOrders,
    Destination.adminDashboard,
  ]) {
    testWidgets('${destination.name}_brandVisual', (tester) async {
      await tester.binding.setSurfaceSize(const Size(390, 844));
      addTearDown(() => tester.binding.setSurfaceSize(null));
      final state = AppState(fixtures);
      addTearDown(state.dispose);
      await tester.pumpWidget(
        RepaintBoundary(
          key: const ValueKey('golden'),
          child: SweetCakeApp(state: state, initialDestination: destination),
        ),
      );
      await tester.pumpAndSettle();
      await tester.runAsync(
        () => Future<void>.delayed(const Duration(milliseconds: 300)),
      );
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull);
      await expectLater(
        find.byKey(const ValueKey('golden')),
        matchesGoldenFile('../goldens/${destination.name}.png'),
      );
      await tester.pumpWidget(const SizedBox());
    });
  }
}
