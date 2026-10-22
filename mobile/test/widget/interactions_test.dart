import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:sweetcake_mobile/app/app.dart';
import 'package:sweetcake_mobile/app/bootstrap/bootstrap.dart';
import 'package:sweetcake_mobile/app/router/destination.dart';
import 'package:sweetcake_mobile/mocks/fixture_bundle.dart';
import 'package:sweetcake_mobile/state/app_state.dart';

import '../helpers/fonts.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  late FixtureBundle fixtures;
  late AppState state;
  setUpAll(() async {
    fixtures = await FixtureBundle.load();
    await loadBrandFonts();
  });
  setUp(() => state = AppState(fixtures));
  tearDown(() => state.dispose());
  Future<void> open(WidgetTester tester, Destination route) async {
    await tester.binding.setSurfaceSize(const Size(390, 844));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    await tester.pumpWidget(
      SweetCakeApp(state: state, initialDestination: route),
    );
    await tester.pumpAndSettle();
  }

  Future<void> tapText(WidgetTester tester, String label) async {
    final finder = find.text(label).first;
    await tester.ensureVisible(finder);
    await tester.tap(finder);
    await tester.pumpAndSettle();
  }

  testWidgets('product_addPreservesChosenSizeInscriptionAndAddons', (
    tester,
  ) async {
    await open(tester, Destination.product);
    state.cart.clear();
    await tapText(tester, '16cm · 620.000 ₫');
    final message = find.byType(TextField).first;
    await tester.ensureVisible(message);
    await tester.enterText(message, 'Chúc mừng!');
    await tapText(tester, 'Nến số nhũ vàng +15.000₫');
    await tapText(tester, 'Thêm vào giỏ hàng');
    expect(state.cart.lines, hasLength(1));
    expect(state.cart.lines.single.size, '16cm');
    expect(state.cart.lines.single.price, 635000);
    expect(state.cart.lines.single.message, 'Chúc mừng!');
  });
  testWidgets('cart_noSelectedItemsDisablesCheckout', (tester) async {
    await open(tester, Destination.cart);
    await tapText(tester, 'Chọn tất cả (2 món)');
    final button = find.widgetWithText(FilledButton, 'Tiếp tục giao nhận');
    expect(tester.widget<FilledButton>(button).onPressed, isNull);
    expect(state.cart.total, 0);
  });
  testWidgets('bidding_acceptNavigatesToPaymentAndLinksOrder', (tester) async {
    await open(tester, Destination.bidding);
    await tapText(tester, 'Chọn tiệm này');
    expect(state.acceptedQuote?.bakery, 'Sweet Bakery');
    expect(state.activeOrder?.rfqId, '#RFQ-2025-8892');
    expect(find.text('Thanh toán an toàn'), findsOneWidget);
  });
  testWidgets('wallet_inlineMinimumValidationThenSuccessfulLocalWithdrawal', (
    tester,
  ) async {
    await open(tester, Destination.vendorRevenue);
    await tapText(tester, 'Rút tiền về ngân hàng');
    await tester.enterText(find.byKey(const ValueKey('field-amount')), '100');
    await tapText(tester, 'Xác nhận rút tiền mô phỏng');
    expect(find.text('Hạn mức tối thiểu 500.000đ.'), findsOneWidget);
    expect(state.balance, 32500000);
    await tester.enterText(
      find.byKey(const ValueKey('field-amount')),
      '500000',
    );
    await tapText(tester, 'Xác nhận rút tiền mô phỏng');
    expect(state.balance, 32000000);
    expect(state.repository.transactions.first.status, 'withdrawn');
  });
  testWidgets('vendorCatalog_editAndClonePreserveBusinessFields', (
    tester,
  ) async {
    await open(tester, Destination.vendorCatalog);
    final first = state.repository.cakes.first;
    await tapText(tester, 'Chỉnh sửa');
    await tester.enterText(
      find
          .descendant(
            of: find.byType(Dialog),
            matching: find.byType(TextFormField),
          )
          .first,
      'Mẫu bánh đã chỉnh sửa',
    );
    await tapText(tester, 'Lưu mẫu bánh mô phỏng');
    expect(state.repository.cakes.first.title, 'Mẫu bánh đã chỉnh sửa');
    expect(
      state.repository.cakes.first.sizes.first.cost,
      first.sizes.first.cost,
    );
    await tapText(tester, 'Nhân bản');
    expect(state.repository.cakes, hasLength(3));
    expect(
      state.repository.cakes.first.title,
      'Mẫu bánh đã chỉnh sửa (Bản sao)',
    );
  });
  testWidgets('chat_messageSurvivesClosingAndReopeningSheet', (tester) async {
    await open(tester, Destination.quote);
    await tapText(tester, 'Nhắn bếp trưởng');
    final input = find.widgetWithText(TextField, 'Tin nhắn');
    await tester.enterText(input, 'Cho mình ít ngọt nhé');
    await tester.tap(find.byTooltip('Gửi tin nhắn'));
    await tester.pumpAndSettle();
    expect(find.text('Cho mình ít ngọt nhé'), findsOneWidget);
    expect(
      state.chat('quote-${fixtures.quotes.first.id}').last.text,
      'Cho mình ít ngọt nhé',
    );
    Navigator.of(tester.element(input)).pop();
    await tester.pumpAndSettle();
    await tapText(tester, 'Nhắn bếp trưởng');
    expect(find.text('Cho mình ít ngọt nhé'), findsOneWidget);
  });
  testWidgets('bootstrap_loadingErrorAndRetry_recoversLocalFixtures', (
    tester,
  ) async {
    final pending = Completer<FixtureBundle>();
    var attempts = 0;
    await tester.pumpWidget(
      Bootstrap(
        loader: () => attempts++ == 0 ? pending.future : Future.value(fixtures),
      ),
    );
    expect(find.byType(CircularProgressIndicator), findsOneWidget);
    pending.completeError(StateError('Missing local fixture'));
    await tester.pumpAndSettle();
    expect(
      find.text('Không thể mở dữ liệu mẫu cục bộ. Vui lòng thử lại.'),
      findsOneWidget,
    );
    await tester.tap(find.text('Thử lại'));
    await tester.pumpAndSettle();
    expect(find.text('Một chiếc bánh,\nthật là bạn.'), findsOneWidget);
    await tester.pumpWidget(const SizedBox());
  });
}
