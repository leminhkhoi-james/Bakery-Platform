import 'package:flutter_test/flutter_test.dart';
import 'package:sweetcake_mobile/mocks/fixture_bundle.dart';
import 'package:sweetcake_mobile/models/catalog.dart';
import 'package:sweetcake_mobile/models/workflow.dart';
import 'package:sweetcake_mobile/state/app_state.dart';
import 'package:sweetcake_mobile/features/catalog/catalog_filter.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  late FixtureBundle fixtures;
  late AppState state;
  setUpAll(() async {
    fixtures = await FixtureBundle.load();
  });
  setUp(() => state = AppState(fixtures));
  tearDown(() => state.dispose());

  test('fixtures_preserveAllWebCatalogAndRelationships', () {
    expect(fixtures.cakes, hasLength(189));
    expect(fixtures.cakes.map((c) => c.id).toSet(), hasLength(189));
    expect(fixtures.stores, hasLength(5));
    expect(fixtures.requests, hasLength(4));
    expect(fixtures.quotes, hasLength(3));
    for (final q in fixtures.quotes) {
      expect(fixtures.requests.any((r) => r.id == q.rfqId), isTrue);
    }
    for (final c in fixtures.cakes) {
      expect(c.price, greaterThan(0));
      expect(c.sizes, isNotEmpty);
    }
  });
  test('cart_quantityAndSelection_recalculateTotal', () {
    final cart = state.cart, first = state.cart.lines.first;
    final oldSubtotal = cart.subtotal;
    cart.quantity(first.id, 1);
    expect(cart.subtotal, oldSubtotal + first.price);
    cart.select(first.id, false);
    expect(cart.subtotal, oldSubtotal - first.price);
    cart.selectAll(false);
    expect(cart.total, 0);
    expect(cart.extra, 0);
    expect(cart.discount, 0);
    cart.clear();
    expect(cart.count, 0);
  });
  test('cart_configurationVariants_doNotLoseMessageOrPrice', () {
    state.cart.clear();
    const a = CartLine(
      id: 'a',
      title: 'Test',
      price: 100000,
      size: '14cm',
      message: 'A',
    );
    const b = CartLine(
      id: 'b',
      title: 'Test',
      price: 120000,
      size: '14cm',
      message: 'B',
    );
    state.cart.add(a);
    state.cart.add(b);
    state.cart.add(a);
    expect(state.cart.lines, hasLength(2));
    expect(state.cart.count, 3);
    expect(state.cart.lines.firstWhere((l) => l.id == 'a').quantity, 2);
  });
  test('voucher_unknownAndMinimumAndPercentCap_areApplied', () {
    expect(state.cart.applyVoucher('UNKNOWN'), isNotNull);
    state.cart.clear();
    state.cart.add(
      const CartLine(id: 'small', title: 'Small', price: 1, size: '14'),
    );
    expect(state.cart.applyVoucher(fixtures.vouchers.first.code), isNotNull);
    final percent = Voucher.fromJson({
      'code': 'P',
      'minOrderValue': 100,
      'discountType': 'percent',
      'discountValue': 10,
      'maxDiscount': 50000,
    });
    expect(percent.discount(99), 0);
    expect(percent.discount(100000), 10000);
    expect(percent.discount(1000000), 50000);
  });
  test('checkout_snapshotsSelectedItemsAndTotal', () {
    state.cart.select(state.cart.lines.last.id, false);
    final total = state.cart.total;
    final id = state.checkout(
      name: 'Khách demo',
      phone: '0900000000',
      address: 'TP.HCM',
      date: '22/10/2026',
      message: 'Hello',
      note: 'Note',
    );
    final snapshot = state.activeOrder!;
    state.cart.clear();
    expect(snapshot.id, id);
    expect(snapshot.price, total);
    expect(snapshot.lines, hasLength(1));
    expect(snapshot.customer, 'Khách demo');
    expect(snapshot.message, 'Hello');
    expect(snapshot.paid, isFalse);
    state.pay();
    expect(state.activeOrder!.paid, isTrue);
  });
  test('rfq_vendorQuote_acceptance_createsOneLinkedOrder', () {
    final request = CakeRequest(
      id: state.repository.nextId('#RFQ'),
      title: 'Bánh demo',
      budget: 800000,
      size: '18cm',
      flavor: 'Vanilla',
      message: 'Happy',
      address: 'TP.HCM',
    );
    state.saveRequest(request);
    expect(state.repository.quotesFor(request.id), isEmpty);
    final quote = Quote(
      id: state.repository.nextId('bid'),
      rfqId: request.id,
      bakery: 'Tiệm demo',
      price: 750000,
    );
    state.submitQuote(quote);
    expect(state.activeRequest!.stage, RfqStage.quoted);
    expect(state.repository.quotesFor(request.id), hasLength(1));
    final id = state.acceptQuote(quote);
    expect(state.activeOrder!.rfqId, request.id);
    expect(state.activeOrder!.price, 750000);
    expect(state.activeOrder!.message, 'Happy');
    expect(state.acceptQuote(quote), id);
    expect(
      state.repository.orders.where((o) => o.rfqId == request.id),
      hasLength(1),
    );
  });
  test('rfq_cancelledRequest_rejectsAcceptance', () {
    state.requestStage(RfqStage.cancelled);
    expect(() => state.acceptQuote(fixtures.quotes.first), throwsStateError);
  });
  test('vendorOrder_completeLifecycle_recordsChecklistAndTimeline', () {
    var order = state.activeOrder!;
    expect(
      () => state.moveOrder(order, OrderPhase.completed),
      throwsStateError,
    );
    state.moveOrder(order, OrderPhase.scheduled);
    order = state.activeOrder!;
    state.moveOrder(order, OrderPhase.baking);
    order = state.activeOrder!;
    expect(order.steps, hasLength(5));
    state.toggleStep(order, 1);
    expect(state.activeOrder!.steps[1].done, isTrue);
    state.moveOrder(state.activeOrder!, OrderPhase.delivering);
    expect(() => state.cancelOrder(state.activeOrder!), throwsStateError);
    state.moveOrder(state.activeOrder!, OrderPhase.pending);
    expect(state.activeOrder!.phase, OrderPhase.pending);
    expect(state.activeOrder!.timeline.last, contains('Chờ xử lý'));
  });
  test('review_isIdempotentAndVisibleInHistory', () {
    state.reviewOrder(state.activeOrder!, 'Rất ngon', 5);
    final reviewed = state.activeOrder!;
    expect(reviewed.phase, OrderPhase.completed);
    expect(reviewed.reviewed, isTrue);
    state.reviewOrder(reviewed, 'Second review', 1);
    expect(state.activeOrder!.review, 'Rất ngon');
    expect(state.activeOrder!.rating, 5);
  });
  test('wallet_invalidWithdrawal_neverMutatesBalance', () {
    final balance = state.balance, count = state.repository.transactions.length;
    expect(state.withdraw(499999), isNotNull);
    expect(state.withdraw(balance + 1), isNotNull);
    expect(state.balance, balance);
    expect(state.repository.transactions.length, count);
    expect(state.withdraw(500000), isNull);
    expect(state.balance, balance - 500000);
    expect(state.repository.transactions.first.net, -500000);
  });
  test('catalog_searchFilterAndSorting_useAll189Records', () {
    final filter = CatalogFilter()
      ..query = 'Mousse'
      ..sort = 'price_asc';
    final result = filter.apply(fixtures.cakes);
    expect(result, isNotEmpty);
    expect(
      result.every(
        (c) => '${c.title} ${c.vendor}'.toLowerCase().contains('mousse'),
      ),
      isTrue,
    );
    expect(
      result.map((c) => c.price).toList(),
      orderedEquals(result.map((c) => c.price).toList()..sort()),
    );
    filter.maximum = 1;
    expect(filter.apply(fixtures.cakes), isEmpty);
  });
  test('chat_separatesConversationsAndIgnoresWhitespace', () {
    state.sendChat('a', 'Hello');
    state.sendChat('a', '  ');
    expect(state.chat('a').last.text, 'Hello');
    expect(state.chat('a'), hasLength(2));
    expect(state.chat('b'), hasLength(1));
  });
  test('address_exactlyOneDefault_isPreserved', () {
    state.addAddress('Tiệc', '0900000000', 'TP.HCM');
    state.defaultAddress(state.addresses.last.id);
    expect(state.addresses.where((a) => a.isDefault), hasLength(1));
    expect(state.addresses.last.isDefault, isTrue);
  });
  test('sessions_areIsolatedAndIdsAreDeterministic', () {
    final other = AppState(fixtures);
    addTearDown(other.dispose);
    expect(state.repository.nextId('x'), other.repository.nextId('x'));
    state.cart.clear();
    expect(other.cart.lines, hasLength(2));
    final user = state.repository.users.first;
    state.repository.saveUser(user.toggle());
    expect(state.repository.users.first.status, 'suspended');
    expect(other.repository.users.first.status, 'active');
  });
  test('catalog_multipleThemesUseOrAndOccasionUsesAnd', () {
    const cakes = [
      Cake(
        id: 'a',
        title: 'Minimal',
        price: 100,
        theme: 'korean',
        occasion: 'kids',
      ),
      Cake(
        id: 'b',
        title: 'Character',
        price: 100,
        theme: 'cartoon',
        occasion: 'kids',
      ),
      Cake(
        id: 'c',
        title: 'Minimal for family',
        price: 100,
        theme: 'korean',
        occasion: 'family',
      ),
    ];
    final filter = CatalogFilter()
      ..themes.addAll(['korean', 'cartoon'])
      ..occasions.add('kids');
    expect(filter.apply(cakes).map((c) => c.id), ['a', 'b']);
  });
  test(
    'rfq_vendorDeclineAllowsSelectingAnotherQuoteWithoutDuplicateActiveOrder',
    () {
      final first = fixtures.quotes.first, second = fixtures.quotes[1];
      final original = state.acceptQuote(first);
      state.declineAcceptedQuote();
      expect(state.activeRequest!.stage, RfqStage.open);
      final replacement = state.acceptQuote(second);
      expect(replacement, isNot(original));
      expect(state.activeOrder!.bakery, second.bakery);
      expect(
        state.repository.orders.where(
          (o) => o.rfqId == first.rfqId && o.phase != OrderPhase.cancelled,
        ),
        hasLength(1),
      );
    },
  );
}
