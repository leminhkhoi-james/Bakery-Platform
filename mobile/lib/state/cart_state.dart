import 'package:flutter/foundation.dart';

import '../models/catalog.dart';

class CartState extends ChangeNotifier {
  CartState(List<CartLine> seed, this.vouchers, this.accessories)
    : _lines = [...seed] {
    for (final choice in accessories) {
      if (choice.selected) accessoryQuantities[choice.id] = 1;
    }
    voucher = vouchers.firstOrNull;
  }
  final List<CartLine> _lines;
  final List<Voucher> vouchers;
  final List<Choice> accessories;
  final Set<String> unselected = {};
  final Map<String, int> accessoryQuantities = {};
  Voucher? voucher;
  List<CartLine> get lines => List.unmodifiable(_lines);
  List<CartLine> get selected =>
      _lines.where((x) => !unselected.contains(x.id)).toList();
  int get count => _lines.fold(0, (sum, line) => sum + line.quantity);
  int get subtotal =>
      selected.fold(0, (sum, line) => sum + line.price * line.quantity);
  int get extra => selected.isEmpty
      ? 0
      : accessories.fold(
          0,
          (sum, choice) =>
              sum + choice.price * (accessoryQuantities[choice.id] ?? 0),
        );
  int get discount => voucher?.discount(subtotal) ?? 0;
  int get total => (subtotal + extra - discount).clamp(0, 1 << 53);
  void add(CartLine line) {
    final index = _lines.indexWhere(
      (x) =>
          x.title == line.title &&
          x.size == line.size &&
          x.price == line.price &&
          x.message == line.message &&
          x.sweetness == line.sweetness,
    );
    if (index < 0) {
      _lines.insert(0, line);
    } else {
      _lines[index] = _lines[index].withQuantity(
        _lines[index].quantity + line.quantity,
      );
    }
    notifyListeners();
  }

  void quantity(String id, int delta) {
    final index = _lines.indexWhere((x) => x.id == id);
    if (index < 0) return;
    final qty = _lines[index].quantity + delta;
    if (qty <= 0) {
      remove(id);
      return;
    }
    _lines[index] = _lines[index].withQuantity(qty);
    notifyListeners();
  }

  void remove(String id) {
    _lines.removeWhere((x) => x.id == id);
    unselected.remove(id);
    notifyListeners();
  }

  void clear() {
    _lines.clear();
    unselected.clear();
    notifyListeners();
  }

  void select(String id, bool value) {
    value ? unselected.remove(id) : unselected.add(id);
    notifyListeners();
  }

  void selectAll(bool value) {
    unselected.clear();
    if (!value) unselected.addAll(_lines.map((x) => x.id));
    notifyListeners();
  }

  void accessory(String id, int quantity) {
    if (quantity <= 0) {
      accessoryQuantities.remove(id);
    } else {
      accessoryQuantities[id] = quantity;
    }
    notifyListeners();
  }

  String? applyVoucher(String code) {
    final match = vouchers
        .where((v) => v.code == code.trim().toUpperCase())
        .firstOrNull;
    if (match == null) return 'Mã giảm giá không tồn tại hoặc đã hết hạn!';
    if (subtotal < match.minimum) {
      return 'Đơn hàng chưa đạt giá trị tối thiểu của mã ${match.code}.';
    }
    voucher = match;
    notifyListeners();
    return null;
  }

  void removeVoucher() {
    voucher = null;
    notifyListeners();
  }
}
