import 'package:flutter/foundation.dart';

class SubscriptionPlan {
  SubscriptionPlan(
    this.id,
    this.name,
    this.price,
    this.products,
    this.offers, {
    this.status = 'ACTIVE',
  });
  final String id;
  String name, status;
  int price, products, offers;
}

class SubscriptionOrder {
  SubscriptionOrder(
    this.id,
    this.bakeryId,
    this.planName,
    this.amount, {
    this.status = 'PENDING',
    this.reference = '',
    this.proof,
    this.note = '',
  });
  final String id, bakeryId, planName;
  final int amount;
  String status, reference, note;
  String? proof;
}

class LocalSubscriptionRepository extends ChangeNotifier {
  LocalSubscriptionRepository() {
    reset();
  }
  final List<SubscriptionPlan> plans = [];
  final List<SubscriptionOrder> orders = [];
  int _sequence = 20;
  void reset() {
    plans
      ..clear()
      ..addAll([
        SubscriptionPlan('BASIC', 'Cơ bản', 199000, 20, 30),
        SubscriptionPlan('PRO', 'Chuyên nghiệp', 499000, 100, 150),
        SubscriptionPlan('PREMIUM', 'Cao cấp', 999000, -1, -1),
      ]);
    orders
      ..clear()
      ..addAll([
        SubscriptionOrder(
          'SUB-260701',
          'bakery-01',
          'Chuyên nghiệp',
          499000,
          status: 'PAID',
          reference: 'DEMO-THANG11',
        ),
        SubscriptionOrder(
          'SUB-260702',
          'bakery-04',
          'Cơ bản',
          199000,
          status: 'PAYMENT_REVIEW',
          reference: 'DEMO-THAMCHIEU',
          proof: 'assets/demo/cake_01.jpg',
        ),
      ]);
    notifyListeners();
  }

  SubscriptionOrder create(String bakeryId, SubscriptionPlan plan) {
    final pending = orders.where(
      (o) =>
          o.bakeryId == bakeryId &&
          ['PENDING', 'PAYMENT_REVIEW'].contains(o.status),
    );
    if (pending.isNotEmpty) {
      throw StateError('Tiệm đang có một đơn gói chưa hoàn tất.');
    }
    if (plan.status != 'ACTIVE') {
      throw StateError('Gói không còn được cung cấp.');
    }
    final order = SubscriptionOrder(
      'SUB-DEMO-${_sequence++}',
      bakeryId,
      plan.name,
      plan.price,
    );
    orders.insert(0, order);
    notifyListeners();
    return order;
  }

  void submit(SubscriptionOrder order, String reference, String? proof) {
    if (order.status != 'PENDING') {
      throw StateError('Đơn không ở trạng thái chờ gửi chứng từ.');
    }
    if (reference.trim().isEmpty && proof == null) {
      throw StateError('Cần tham chiếu hoặc ảnh minh họa chứng từ.');
    }
    order.reference = reference.trim();
    order.proof = proof;
    order.status = 'PAYMENT_REVIEW';
    notifyListeners();
  }

  void review(
    SubscriptionOrder order, {
    required bool approve,
    required String note,
  }) {
    if (order.status != 'PAYMENT_REVIEW') {
      throw StateError('Chứng từ không còn chờ duyệt.');
    }
    if (!approve && note.trim().isEmpty) {
      throw StateError('Cần nêu lý do từ chối.');
    }
    order.status = approve ? 'PAID' : 'PENDING';
    order.note = note.trim();
    notifyListeners();
  }

  int get approvedTotal => orders
      .where((o) => o.status == 'PAID')
      .fold(0, (sum, o) => sum + o.amount);
  void savePlan(SubscriptionPlan plan) {
    if (plan.name.trim().isEmpty || plan.price < 0) {
      throw StateError('Tên và giá gói chưa hợp lệ.');
    }
    if (!plans.any((p) => p.id == plan.id)) plans.add(plan);
    notifyListeners();
  }

  void changed() => notifyListeners();
}
