import 'package:flutter/foundation.dart';

import '../../catalog/domain/catalog_repository.dart';

class CartLine {
  CartLine({
    required this.productId,
    required this.bakeryId,
    required this.name,
    required this.image,
    required this.size,
    required this.flavor,
    required this.unitPrice,
    required this.addons,
    this.quantity = 1,
  });
  final String productId, bakeryId, name, image, size, flavor;
  final int unitPrice;
  final List<String> addons;
  int quantity;
  int get total => unitPrice * quantity;
  String get signature => '$productId/$size/$flavor/${addons.join(',')}';
}

class LocalCartRepository extends ChangeNotifier {
  final List<CartLine> lines = [];
  final List<({String label, int total})> previews = [];
  void savePreview() {
    if (lines.isEmpty) throw StateError('Giỏ chưa có bánh.');
    previews.insert(0, (
      label: lines.map((l) => '${l.name} × ${l.quantity}').join(', '),
      total: total,
    ));
    notifyListeners();
  }

  void reset() {
    lines.clear();
    previews.clear();
    notifyListeners();
  }

  int get count => lines.fold(0, (sum, l) => sum + l.quantity);
  int get subtotal => lines.fold(0, (sum, l) => sum + l.total);
  int get delivery => lines.isEmpty ? 0 : 30000;
  int get total => subtotal + delivery;
  void add(
    CakeProduct product, {
    required String size,
    required String flavor,
    required int extras,
    required List<String> addons,
    int quantity = 1,
  }) {
    if (quantity < 1 || product.status != 'PUBLISHED') {
      throw StateError('Bánh chưa được mở bán.');
    }
    if (lines.isNotEmpty && lines.first.bakeryId != product.bakeryId) {
      throw StateError(
        'Mỗi bản xem trước đơn chỉ thuộc một tiệm. Hãy lưu hoặc xóa giỏ hiện tại trước.',
      );
    }
    final line = CartLine(
      productId: product.id,
      bakeryId: product.bakeryId,
      name: product.name,
      image: product.image,
      size: size,
      flavor: flavor,
      unitPrice: product.price + extras,
      addons: List.of(addons),
      quantity: quantity,
    );
    final matches = lines.where((l) => l.signature == line.signature);
    if (matches.isEmpty) {
      lines.add(line);
    } else {
      if (matches.first.quantity + quantity > 99) {
        throw StateError('Mỗi lựa chọn bánh tối đa 99 chiếc trong giỏ demo.');
      }
      matches.first.quantity += quantity;
    }
    notifyListeners();
  }

  void quantity(CartLine line, int amount) {
    if (amount <= 0) {
      lines.remove(line);
    } else {
      line.quantity = amount.clamp(1, 99);
    }
    notifyListeners();
  }

  void remove(CartLine line) {
    lines.remove(line);
    notifyListeners();
  }

  void clear() {
    lines.clear();
    notifyListeners();
  }
}
