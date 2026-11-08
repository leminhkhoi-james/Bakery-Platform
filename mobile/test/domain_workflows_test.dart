import 'package:flutter_test/flutter_test.dart';
import 'package:bakery_mobile/core/demo/demo_workspace.dart';
import 'package:bakery_mobile/features/marketplace/domain/marketplace_repository.dart';
import 'package:bakery_mobile/features/orders/domain/order_repository.dart';

void main() {
  late DemoWorkspace w;
  setUp(() => w = DemoWorkspace());
  tearDown(() => w.dispose());
  test(
    'Reset khôi phục danh mục, chặn thiếu hương vị và số lượng quá giới hạn',
    () {
      w.catalog.categories.clear();
      w.reset();
      expect(w.catalog.categories.length, 3);
      final p = w.catalog.product('product-1');
      p.flavors.clear();
      expect(() => w.catalog.saveProduct(p), throwsStateError);
      w.catalog.reset();
      final product = w.catalog.product('product-1');
      w.cart.add(
        product,
        size: '14 cm',
        flavor: 'Vani dâu',
        extras: 0,
        addons: [],
        quantity: 99,
      );
      expect(
        () => w.cart.add(
          product,
          size: '14 cm',
          flavor: 'Vani dâu',
          extras: 0,
          addons: [],
        ),
        throwsStateError,
      );
      expect(w.cart.count, 99);
    },
  );
  test('Giỏ giữ snapshot giá, gộp option giống nhau và chặn khác tiệm', () {
    final p = w.catalog.product('product-1');
    void add() => w.cart.add(
      p,
      size: '14 cm',
      flavor: 'Vani dâu',
      extras: 15000,
      addons: ['Nến'],
    );
    add();
    add();
    expect(w.cart.count, 2);
    expect(w.cart.total, 1020000);
    p.price = 1;
    expect(w.cart.subtotal, 990000);
    expect(
      () => w.cart.add(
        w.catalog.product('product-5'),
        size: '14 cm',
        flavor: 'Vani dâu',
        extras: 0,
        addons: [],
      ),
      throwsStateError,
    );
    w.cart.savePreview();
    w.cart.clear();
    expect(w.cart.previews.single.total, 1020000);
  });
  test(
    'RFQ chỉ sửa DRAFT, khoảng giá hợp lệ và không nhân đôi báo giá đã rút',
    () {
      final r = CakeRequest(
        id: 'new',
        title: 'Bánh thử nghiệm',
        description: 'Mô tả local',
        neededAt: DateTime(2026, 12, 1),
        budgetMin: 900000,
        budgetMax: 400000,
      );
      expect(() => w.marketplace.save(r), throwsStateError);
      r.budgetMax = 1000000;
      w.marketplace.save(r);
      w.marketplace.publish(r);
      expect(() => w.marketplace.save(r), throwsStateError);
      final o = w.marketplace.offer('offer-01');
      w.marketplace.choosePreview(o);
      expect(o.status, 'PENDING');
      w.marketplace.withdraw(o);
      expect(
        () => w.marketplace.saveOffer(
          CakeOffer(
            id: 'duplicate',
            requestId: o.requestId,
            bakeryId: o.bakeryId,
            cakePrice: 1,
            message: 'Trùng',
          ),
        ),
        throwsStateError,
      );
    },
  );
  test('Đơn theo state machine, khách xác nhận hoàn tất rồi mới đánh giá', () {
    final order = w.orders.get('SC-260703');
    expect(
      () => w.orders.transition(order, OrderStatus.baking, customer: false),
      throwsStateError,
    );
    expect(() => w.orders.review(order, 5, 'Tốt'), throwsStateError);
    for (final next in [
      OrderStatus.confirmed,
      OrderStatus.baking,
      OrderStatus.ready,
      OrderStatus.delivering,
    ]) {
      w.orders.transition(order, next, customer: false);
    }
    expect(
      () => w.orders.transition(order, OrderStatus.completed, customer: false),
      throwsStateError,
    );
    w.orders.transition(order, OrderStatus.completed, customer: true);
    w.orders.review(order, 5, 'Bánh rất ngon');
    expect(order.rating, 5);
  });
  test('Chứng từ local cần tham chiếu, admin từ chối phải có lý do; giá đơn không đổi', () {
    final plan = w.subscriptions.plans.first;
    final o = w.subscriptions.create('bakery-03', plan);
    plan.price = 1;
    expect(o.amount, 199000);
    expect(() => w.subscriptions.create('bakery-03', plan), throwsStateError);
    expect(() => w.subscriptions.submit(o, '', null), throwsStateError);
    w.subscriptions.submit(o, 'DEMO-01', null);
    expect(
      () => w.subscriptions.review(o, approve: false, note: ''),
      throwsStateError,
    );
    w.subscriptions.review(o, approve: false, note: 'Cần ảnh minh họa');
    expect(o.status, 'PENDING');
    w.subscriptions.submit(o, 'DEMO-02', null);
    w.subscriptions.review(o, approve: true, note: 'Demo');
    expect(o.status, 'PAID');
  });
  test('Chat chặn tin rỗng, xóa tin người khác và gửi sau đóng', () {
    final c = w.chat.get('chat-01');
    expect(() => w.chat.send(c, ''), throwsStateError);
    expect(() => w.chat.delete(c.messages[1]), throwsStateError);
    w.chat.send(c, 'Tin local');
    w.chat.delete(c.messages.last);
    expect(c.messages.last.deleted, true);
    w.chat.close(c);
    expect(() => w.chat.send(c, 'Muộn'), throwsStateError);
  });
}
