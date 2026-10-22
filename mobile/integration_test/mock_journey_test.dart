import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:sweetcake_mobile/app/app.dart';
import 'package:sweetcake_mobile/app/router/destination.dart';
import 'package:sweetcake_mobile/mocks/fixture_bundle.dart';
import 'package:sweetcake_mobile/models/workflow.dart';
import 'package:sweetcake_mobile/state/app_state.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();
  testWidgets('offline_crossPortalJourney', (tester) async {
    final fixtures = await FixtureBundle.load();
    final state = AppState(fixtures);
    final navigator = GlobalKey<NavigatorState>();
    await tester.pumpWidget(
      SweetCakeApp(state: state, navigatorKey: navigator),
    );
    await tester.pumpAndSettle();
    expect(find.text('Một chiếc bánh,\nthật là bạn.'), findsOneWidget);
    await tester.tap(find.byKey(const ValueKey('navigation-menu')));
    await tester.pumpAndSettle();
    await tester.tap(find.widgetWithText(ListTile, 'Khám phá mẫu bánh'));
    await tester.pumpAndSettle();
    expect(find.textContaining('189 mẫu bánh'), findsOneWidget);
    await tester.enterText(find.byType(TextFormField).first, 'zzzz-not-found');
    await tester.pumpAndSettle();
    expect(find.text('Không có kết quả phù hợp.'), findsOneWidget);
    final request = CakeRequest(
      id: state.repository.nextId('#RFQ'),
      title: 'Bánh kiểm thử offline',
      budget: 800000,
      size: '18cm',
      address: 'TP.HCM',
    );
    state.saveRequest(request);
    final quote = Quote(
      id: state.repository.nextId('bid'),
      rfqId: request.id,
      bakery: 'Tiệm demo',
      price: 750000,
    );
    state.submitQuote(quote);
    state.acceptQuote(quote);
    navigator.currentState!.pushNamed('/${Destination.payment.name}');
    await tester.pumpAndSettle();
    final pay = find.text('Xác nhận thanh toán mô phỏng');
    await tester.ensureVisible(pay);
    await tester.tap(pay);
    await tester.pumpAndSettle();
    expect(find.text('Xác nhận mô phỏng thành công!'), findsOneWidget);
    expect(state.activeOrder!.paid, isTrue);
    navigator.currentState!.pushNamed('/${Destination.vendorOrders.name}');
    await tester.pumpAndSettle();
    expect(find.text('Bánh kiểm thử offline'), findsOneWidget);
    await tester.pumpWidget(const SizedBox());
    state.dispose();
  });
}
