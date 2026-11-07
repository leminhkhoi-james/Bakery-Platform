import 'package:flutter/foundation.dart';

enum OrderStatus {
  pending('Chờ xác nhận'),
  confirmed('Đã xác nhận'),
  baking('Đang làm bánh'),
  ready('Sẵn sàng giao'),
  delivering('Đang giao'),
  completed('Hoàn tất'),
  cancelled('Đã hủy');

  const OrderStatus(this.label);
  final String label;
  String get code => name.toUpperCase();
}

class DemoOrder {
  DemoOrder({
    required this.id,
    required this.bakeryId,
    required this.productName,
    required this.image,
    required this.total,
    required this.date,
    this.status = OrderStatus.pending,
    this.quantity = 1,
    this.size = '16 cm',
    this.flavor = 'Vani dâu',
    this.review,
    this.rating = 0,
    this.reviewStatus = 'PUBLISHED',
    List<OrderStatus>? history,
  }) : history = history ?? [OrderStatus.pending];
  final String id, bakeryId, productName, image, date;
  final int total, quantity;
  final String size, flavor;
  OrderStatus status;
  final List<OrderStatus> history;
  String? review;
  int rating;
  String reviewStatus;
}

class LocalOrderRepository extends ChangeNotifier {
  LocalOrderRepository() {
    reset();
  }
  final List<DemoOrder> orders = [];
  void reset() {
    orders
      ..clear()
      ..addAll([
        DemoOrder(
          id: 'SC-260701',
          bakeryId: 'bakery-01',
          productName: 'Nhung đỏ mâm xôi',
          image: 'assets/demo/cake_01.jpg',
          total: 650000,
          date: '10/11/2026 · 15:00',
          status: OrderStatus.baking,
          history: [
            OrderStatus.pending,
            OrderStatus.confirmed,
            OrderStatus.baking,
          ],
        ),
        DemoOrder(
          id: 'SC-260702',
          bakeryId: 'bakery-02',
          productName: 'Dâu tây kem sữa',
          image: 'assets/demo/cake_05.jpg',
          total: 480000,
          date: '05/11/2026 · 10:00',
          status: OrderStatus.completed,
          history: OrderStatus.values.take(6).toList(),
        ),
        DemoOrder(
          id: 'SC-260703',
          bakeryId: 'bakery-01',
          productName: 'Mousse trà Bá Tước',
          image: 'assets/demo/cake_02.jpg',
          total: 550000,
          date: '12/11/2026 · 09:00',
        ),
      ]);
    notifyListeners();
  }

  DemoOrder get(String id) => orders.firstWhere((o) => o.id == id);
  void transition(
    DemoOrder order,
    OrderStatus target, {
    required bool customer,
  }) {
    final allowed = customer
        ? (target == OrderStatus.cancelled &&
                  order.status == OrderStatus.pending) ||
              (target == OrderStatus.completed &&
                  order.status == OrderStatus.delivering)
        : order.status.index < OrderStatus.completed.index &&
              target.index == order.status.index + 1 &&
              target != OrderStatus.completed;
    if (!allowed) {
      throw StateError(
        'Không thể chuyển trạng thái này theo vai trò hiện tại.',
      );
    }
    order.status = target;
    order.history.add(target);
    notifyListeners();
  }

  void review(DemoOrder order, int rating, String text) {
    if (order.status != OrderStatus.completed ||
        rating < 1 ||
        rating > 5 ||
        text.trim().isEmpty) {
      throw StateError(
        'Chỉ đánh giá đơn đã hoàn tất, với số sao và nội dung hợp lệ.',
      );
    }
    order.rating = rating;
    order.review = text.trim();
    order.reviewStatus = 'PUBLISHED';
    notifyListeners();
  }

  void moderate(DemoOrder order, String status) {
    if (order.review == null || !['PUBLISHED', 'HIDDEN'].contains(status)) {
      throw StateError('Không có đánh giá phù hợp để kiểm duyệt.');
    }
    order.reviewStatus = status;
    notifyListeners();
  }

  void changed() => notifyListeners();
}
