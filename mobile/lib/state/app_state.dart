import 'package:flutter/widgets.dart';

import '../mocks/fixture_bundle.dart';
import '../models/accounts.dart';
import '../models/catalog.dart';
import '../models/workflow.dart';
import '../services/contracts/bakery_repository.dart';
import '../services/mock/mock_bakery_repository.dart';
import 'cart_state.dart';

class AppState extends ChangeNotifier {
  AppState(this.fixtures, {BakeryRepository? repository})
    : repository = repository ?? MockBakeryRepository(fixtures),
      profile = CustomerProfile.fromJson(
        fixtures.record('DEFAULT_CUSTOMER_PROFILE'),
      ),
      settings = VendorSettings.fromJson(
        fixtures.record('DEFAULT_VENDOR_SETTINGS'),
      ),
      addresses = fixtures
          .rows('DEFAULT_SAVED_ADDRESSES')
          .map(SavedAddress.fromJson)
          .toList(),
      cart = CartState(
        fixtures.rows('DEFAULT_CART_ITEMS').map(CartLine.fromJson).toList(),
        fixtures.vouchers,
        fixtures.choices('CHECKOUT_ACCESSORIES'),
      ) {
    cart.addListener(notifyListeners);
  }
  final FixtureBundle fixtures;
  final BakeryRepository repository;
  final CartState cart;
  List<Cake> get catalog => repository.catalog;
  List<Store> get stores => repository.stores;
  CustomerProfile profile;
  VendorSettings settings;
  final List<SavedAddress> addresses;
  final Set<String> favorites = {};
  final Set<String> rejectedRequests = {};
  final Map<String, List<ChatMessage>> _chats = {};
  String activeRequestId = '#RFQ-2025-8892';
  String activeOrderId = '#ORD-2025-9982';
  Quote? acceptedQuote;
  int balance = 32500000;
  bool receiving = true;
  bool notifySms = true, notifyZalo = true, autoSaveAddress = true;
  bool signedIn = true;
  CakeRequest? get activeRequest =>
      repository.requests.where((r) => r.id == activeRequestId).firstOrNull;
  CakeOrder? get activeOrder =>
      repository.orders.where((o) => o.id == activeOrderId).firstOrNull;
  List<CakeOrder> get allAdminOrders {
    final ids = repository.orders.map((o) => o.id.replaceAll('#', '')).toSet();
    return [
      ...repository.orders,
      ...fixtures.adminOrders.where(
        (o) => !ids.contains(o.id.replaceAll('#', '')),
      ),
    ];
  }

  void changed() => notifyListeners();
  void toggleFavorite(String id) {
    favorites.contains(id) ? favorites.remove(id) : favorites.add(id);
    notifyListeners();
  }

  void saveProfile(CustomerProfile value) {
    profile = value;
    notifyListeners();
  }

  void saveSettings(VendorSettings value) {
    settings = value;
    notifyListeners();
  }

  void addAddress(String title, String phone, String address) {
    addresses.add(
      SavedAddress(
        repository.nextId('addr'),
        title,
        phone,
        address,
        addresses.isEmpty,
      ),
    );
    notifyListeners();
  }

  void defaultAddress(String id) {
    for (var i = 0; i < addresses.length; i++) {
      addresses[i] = addresses[i].asDefault(addresses[i].id == id);
    }
    notifyListeners();
  }

  void saveRequest(CakeRequest request) {
    repository.saveRequest(request);
    activeRequestId = request.id;
    acceptedQuote = null;
    notifyListeners();
  }

  void requestStage(RfqStage stage) {
    final request = activeRequest;
    if (request == null) return;
    repository.saveRequest(request.withStage(stage));
    notifyListeners();
  }

  void submitQuote(Quote quote) {
    repository.saveQuote(quote);
    final request = repository.requests.where((r) => r.id == quote.rfqId).first;
    repository.saveRequest(
      request.withStage(RfqStage.quoted, quoteCount: request.quoteCount + 1),
    );
    notifyListeners();
  }

  void simulateRequestStage(RfqStage stage) {
    requestStage(stage);
    final order = activeOrder;
    if (order == null || order.rfqId != activeRequestId) return;
    final phase = switch (stage) {
      RfqStage.baking => OrderPhase.baking,
      RfqStage.delivering => OrderPhase.delivering,
      RfqStage.completed => OrderPhase.completed,
      _ => null,
    };
    if (phase != null) saveOrder(order.copyWith(phase: phase));
  }

  void declineAcceptedQuote() {
    final order = activeOrder;
    if (order != null && order.rfqId == activeRequestId) {
      repository.saveOrder(order.copyWith(phase: OrderPhase.cancelled));
    }
    acceptedQuote = null;
    requestStage(RfqStage.open);
  }

  String acceptQuote(Quote quote) {
    final request = repository.requests.where((r) => r.id == quote.rfqId).first;
    if ([
      RfqStage.cancelled,
      RfqStage.closed,
      RfqStage.expired,
    ].contains(request.stage)) {
      throw StateError('Yêu cầu đã đóng. Hãy mở lại trước khi chọn báo giá.');
    }
    final existing = repository.orders
        .where((o) => o.rfqId == request.id && o.phase != OrderPhase.cancelled)
        .firstOrNull;
    if (existing != null) {
      activeOrderId = existing.id;
      return existing.id;
    }
    activeRequestId = request.id;
    acceptedQuote = quote;
    activeOrderId = repository.nextId('#ORD');
    repository.saveOrder(
      CakeOrder(
        id: activeOrderId,
        rfqId: request.id,
        title: request.title,
        price: quote.price,
        phase: OrderPhase.pending,
        orderType: 'bespoke',
        customer: profile.name,
        phone: profile.phone,
        bakery: quote.bakery,
        address: request.address,
        date: '${request.date} · ${request.time}',
        image: request.image,
        size: request.size,
        flavor: request.flavor,
        message: request.message,
        note: request.description,
        timeline: const ['Mô phỏng: Khách chọn báo giá • Chờ xác nhận'],
      ),
    );
    repository.saveRequest(request.withStage(RfqStage.confirmed));
    notifyListeners();
    return activeOrderId;
  }

  String checkout({
    required String name,
    required String phone,
    required String address,
    required String date,
    required String message,
    required String note,
  }) {
    if (cart.selected.isEmpty) {
      throw StateError('Hãy chọn ít nhất một món bánh.');
    }
    activeOrderId = repository.nextId('#ORD');
    final first = cart.selected.first;
    repository.saveOrder(
      CakeOrder(
        id: activeOrderId,
        title: first.title,
        price: cart.total,
        phase: OrderPhase.pending,
        customer: name,
        phone: phone,
        address: address,
        date: date,
        image: first.image,
        size: first.size,
        bakery: first.bakery,
        message: message,
        note: note,
        lines: List.unmodifiable(cart.selected),
        timeline: const ['Đã tạo đơn mô phỏng • Chờ thanh toán'],
      ),
    );
    acceptedQuote = null;
    notifyListeners();
    return activeOrderId;
  }

  void pay({bool cod = false}) {
    final order = activeOrder;
    if (order == null || order.phase == OrderPhase.cancelled) return;
    repository.saveOrder(
      order.copyWith(
        paid: !cod,
        timeline: [
          ...order.timeline,
          cod
              ? 'Mô phỏng: Thanh toán khi nhận bánh'
              : 'Mô phỏng: Xác nhận thanh toán',
        ],
      ),
    );
    notifyListeners();
  }

  void saveOrder(CakeOrder order) {
    repository.saveOrder(order);
    notifyListeners();
  }

  void moveOrder(CakeOrder order, OrderPhase next) {
    const transitions = {
      OrderPhase.pending: [OrderPhase.scheduled, OrderPhase.cancelled],
      OrderPhase.scheduled: [OrderPhase.baking],
      OrderPhase.baking: [OrderPhase.delivering],
      OrderPhase.delivering: [OrderPhase.completed, OrderPhase.pending],
    };
    if (!(transitions[order.phase]?.contains(next) ?? false)) {
      throw StateError('Chuyển trạng thái không hợp lệ.');
    }
    final steps = next == OrderPhase.baking && order.steps.isEmpty
        ? [
            'Chuẩn bị nguyên liệu',
            'Nướng cốt bánh',
            'Đánh kem',
            'Tạo hình nghệ thuật',
            'Đóng hộp bảo quản',
          ].indexed.map((e) => WorkStep(e.$2, e.$1 == 0)).toList()
        : order.steps;
    saveOrder(
      order.copyWith(
        phase: next,
        steps: steps,
        released: next == OrderPhase.completed || order.released,
        timeline: [...order.timeline, 'Mô phỏng: ${next.label}'],
      ),
    );
  }

  void toggleStep(CakeOrder order, int index) {
    saveOrder(
      order.copyWith(
        steps: [
          for (var i = 0; i < order.steps.length; i++)
            WorkStep(
              order.steps[i].name,
              i == index ? !order.steps[i].done : order.steps[i].done,
            ),
        ],
      ),
    );
  }

  void reviewOrder(CakeOrder order, String review, int rating) {
    if (order.reviewed) return;
    saveOrder(
      order.copyWith(
        phase: OrderPhase.completed,
        reviewed: true,
        released: true,
        review: review,
        rating: rating,
        timeline: [...order.timeline, 'Mô phỏng: Đã nhận bánh và đánh giá'],
      ),
    );
  }

  void cancelOrder(CakeOrder order) {
    if ([
      OrderPhase.delivering,
      OrderPhase.completed,
      OrderPhase.cancelled,
    ].contains(order.phase)) {
      throw StateError('Đơn hàng ở giai đoạn này không thể hủy trực tiếp.');
    }
    saveOrder(
      order.copyWith(
        phase: OrderPhase.cancelled,
        timeline: [
          ...order.timeline,
          'Mô phỏng: Hoàn cọc ${order.phase == OrderPhase.baking ? 20 : 70}%',
        ],
      ),
    );
  }

  void release(CakeOrder order) {
    if (order.released) return;
    saveOrder(order.copyWith(released: true, phase: OrderPhase.completed));
  }

  String? withdraw(int amount) {
    if (amount < 500000) return 'Hạn mức rút tối thiểu là 500.000đ mỗi lần!';
    if (amount > balance) return 'Số tiền rút vượt quá số dư khả dụng!';
    balance -= amount;
    repository.addTransaction(
      WalletTransaction(
        id: repository.nextId('TX'),
        orderId: repository.nextId('#WD'),
        title: 'Rút tiền mô phỏng về ngân hàng',
        gross: -amount,
        net: -amount,
        status: 'withdrawn',
        date: 'Mô phỏng · Vừa xong',
      ),
    );
    notifyListeners();
    return null;
  }

  List<ChatMessage> chat(String key) => List.unmodifiable(
    _chats[key] ??
        const [
          ChatMessage(
            'Chào bạn, tiệm có thể hỗ trợ cấu hình và thời gian nhận bánh.',
            mine: false,
          ),
        ],
  );
  void sendChat(String key, String text) {
    if (text.trim().isEmpty) return;
    _chats[key] = [...chat(key), ChatMessage(text.trim())];
    notifyListeners();
  }

  @override
  void dispose() {
    cart.removeListener(notifyListeners);
    cart.dispose();
    super.dispose();
  }
}

class AppScope extends InheritedNotifier<AppState> {
  const AppScope({super.key, required AppState state, required super.child})
    : super(notifier: state);
  static AppState of(BuildContext context) =>
      context.dependOnInheritedWidgetOfExactType<AppScope>()!.notifier!;
}
