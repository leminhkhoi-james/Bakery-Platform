import 'package:flutter/foundation.dart';

import '../../../core/api/contracts.dart';
import '../../catalog/data/live_catalog_repository.dart';

class LiveCart extends ChangeNotifier {
  PublicProduct? product;
  int quantity = 1;
  Map<String, List<String>> selections = {};
  Map<String, int> addOns = {};
  bool get empty => product == null;
  void clear() {
    product = null;
    selections = {};
    addOns = {};
    quantity = 1;
    notifyListeners();
  }

  void set(
    PublicProduct p,
    int count,
    Map<String, List<String>> options,
    Map<String, int> extras,
  ) {
    validate(p, count, options, extras);
    if (product != null && product!.bakeryId != p.bakeryId) {
      throw const ApiFailure(
        409,
        'Giỏ đang thuộc tiệm khác. Xóa giỏ hiện tại trước khi chọn tiệm mới.',
      );
    }
    product = p;
    quantity = count;
    selections = options.map((k, v) => MapEntry(k, List.of(v)));
    addOns = Map.of(extras);
    notifyListeners();
  }

  static Money validate(
    PublicProduct p,
    int count,
    Map<String, List<String>> selected,
    Map<String, int> extras,
  ) {
    if (count < 1) throw const ApiFailure(400, 'Số lượng phải từ 1.');
    if (p.product['status'] != 'PUBLISHED') {
      throw const ApiFailure(409, 'Sản phẩm không còn mở bán.');
    }
    var unit = p.price.minor;
    final unseen = selected.keys.toSet();
    for (final group in objects(p.options['groups'])) {
      final id = requiredText(group, 'id'), values = selected[id] ?? [];
      unseen.remove(id);
      final minimum = ((group['minimumSelections'] ?? 0) as num).toInt(),
          maximum = ((group['maximumSelections'] ?? 1) as num).toInt();
      if (values.toSet().length != values.length ||
          values.length < minimum ||
          values.length > maximum ||
          group['required'] == true && values.isEmpty) {
        throw ApiFailure(422, 'Chọn đủ tùy chọn ${group['name']}.');
      }
      for (final valueId in values) {
        final matches = objects(group['values'])
            .where((v) => v['id'] == valueId && v['active'] == true);
        if (matches.length != 1) {
          throw const ApiFailure(
            409,
            'Tùy chọn đã thay đổi. Chọn lại cấu hình bánh.',
          );
        }
        unit += Money.parse(matches.single['priceAdjustment']).minor;
      }
    }
    if (unseen.isNotEmpty || unit.isNegative) {
      throw const ApiFailure(409, 'Cấu hình bánh không còn hợp lệ.');
    }
    var total = unit * BigInt.from(count);
    for (final entry in extras.entries) {
      final matches = p.addOns.where(
        (a) => a['id'] == entry.key && a['active'] == true,
      );
      if (matches.length != 1 || entry.value < 1) {
        throw const ApiFailure(
          409,
          'Phụ kiện đã thay đổi. Chọn lại cấu hình bánh.',
        );
      }
      total +=
          Money.parse(matches.single['price']).minor * BigInt.from(entry.value);
    }
    return Money(total);
  }

  Money get estimate => validate(product!, quantity, selections, addOns);
  Json get payload => {
    'bakeryId': product!.bakeryId,
    'productId': product!.id,
    'quantity': quantity,
    'optionSelections': [
      for (final e in selections.entries)
        if (e.value.isNotEmpty)
          {'optionGroupId': e.key, 'optionValueIds': e.value},
    ],
    'addOns': [
      for (final e in addOns.entries) {'addOnId': e.key, 'quantity': e.value},
    ],
  };
  Future<PublicProduct> revalidate(LiveCatalogRepository catalog) async {
    if (product == null) throw const ApiFailure(422, 'Giỏ đang trống.');
    final fresh = await catalog.product(product!.id);
    if (fresh.bakeryId != product!.bakeryId || fresh.id != product!.id) {
      throw const ApiFailure(409, 'Sản phẩm trả về không khớp giỏ.');
    }
    final amount = validate(fresh, quantity, selections, addOns);
    if (amount.compareTo(estimate) != 0) {
      throw const ApiFailure(
        409,
        'Giá đã thay đổi. Mở lại sản phẩm và xác nhận cấu hình mới; giỏ cũ vẫn được giữ.',
      );
    }
    return fresh;
  }
}
