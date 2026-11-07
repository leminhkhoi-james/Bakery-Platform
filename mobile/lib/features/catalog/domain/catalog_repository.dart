import 'package:flutter/foundation.dart';

class CakeProduct {
  CakeProduct({
    required this.id,
    required this.bakeryId,
    required this.name,
    required this.price,
    required this.image,
    this.category = 'Bánh sinh nhật',
    this.description = 'Cốt bánh mềm, kem nhẹ và nguyên liệu được kết hợp cho từng dịp đặc biệt.',
    this.status = 'PUBLISHED',
    this.customizable = true,
    this.noticeHours = 24,
    List<String>? flavors,
    List<int>? sizeExtras,
  }) : flavors = flavors ?? ['Vani dâu', 'Chocolate', 'Trà Earl Grey'],
       sizeExtras = sizeExtras ?? [0, 140000, 300000];
  final String id, bakeryId;
  String name, image, category, description, status;
  int price, noticeHours;
  bool customizable;
  List<String> flavors;
  List<int> sizeExtras;
}

class BakeryProfile {
  BakeryProfile({
    required this.id,
    required this.name,
    required this.district,
    this.status = 'ACTIVE',
    this.description =
        'Những chiếc bánh được chăm chút từ hương vị đến từng đường kem.',
    this.address = 'Đường Hoa Mai, TP. Hồ Chí Minh',
    this.hours = '08:00 – 20:00',
    this.minimumOrder = 0,
    this.deliveryFee = 30000,
    this.owner = false,
  });
  final String id;
  String name, district, status, description, address, hours;
  int minimumOrder, deliveryFee;
  bool owner;
}

class CatalogAddon {
  CatalogAddon(this.id, this.name, this.price, {this.active = true});
  final String id;
  String name;
  int price;
  bool active;
}

abstract interface class CatalogRepository {
  List<CakeProduct> get products;
  List<BakeryProfile> get bakeries;
  CakeProduct product(String id);
  BakeryProfile bakery(String id);
}

class LocalCatalogRepository extends ChangeNotifier
    implements CatalogRepository {
  @override
  final List<CakeProduct> products = [];
  @override
  final List<BakeryProfile> bakeries = [];
  final List<String> categories = ['Bánh sinh nhật', 'Bánh mousse', 'Bánh nhỏ'];
  final List<CatalogAddon> addons = [];
  int _sequence = 20;
  LocalCatalogRepository() {
    reset();
  }

  void reset() {
    categories
      ..clear()
      ..addAll(['Bánh sinh nhật', 'Bánh mousse', 'Bánh nhỏ']);
    bakeries
      ..clear()
      ..addAll([
        BakeryProfile(
          id: 'bakery-01',
          name: 'SweetCake Pâtisserie',
          district: 'Quận 3',
          owner: true,
          description: 'Một chút tinh tế kiểu Pháp, một chút ngọt ngào dành riêng cho bạn.',
        ),
        BakeryProfile(
          id: 'bakery-02',
          name: 'Mây & Bơ',
          district: 'Bình Thạnh',
          address: 'Đường Nắng Mai, Bình Thạnh, TP. Hồ Chí Minh',
        ),
        BakeryProfile(
          id: 'bakery-03',
          name: 'SweetCake Thảo Điền',
          district: 'Thảo Điền',
          status: 'DRAFT',
          owner: true,
        ),
        BakeryProfile(
          id: 'bakery-04',
          name: 'Bếp bánh An Nhiên',
          district: 'Quận 7',
          status: 'PENDING_APPROVAL',
        ),
      ]);
    const names = [
      'Nhung đỏ mâm xôi',
      'Mousse trà Bá Tước',
      'Xoài & chanh leo',
      'Hộp 6 macarons',
      'Dâu tây kem sữa',
      'Chocolate truffle',
      'Bánh mây vani',
      'Bánh hoa mùa hạ',
    ];
    const prices = [
      480000,
      520000,
      490000,
      210000,
      450000,
      560000,
      390000,
      620000,
    ];
    products.clear();
    for (var i = 0; i < names.length; i++) {
      products.add(
        CakeProduct(
          id: 'product-${i + 1}',
          bakeryId: i < 4 ? 'bakery-01' : 'bakery-02',
          name: names[i],
          price: prices[i],
          image: 'assets/demo/cake_${(i + 1).toString().padLeft(2, '0')}.jpg',
          category: i == 3
              ? 'Bánh nhỏ'
              : (i == 1 || i == 2 ? 'Bánh mousse' : 'Bánh sinh nhật'),
          status: i == 7 ? 'HIDDEN' : 'PUBLISHED',
        ),
      );
    }
    addons
      ..clear()
      ..addAll([
        CatalogAddon('addon-01', 'Nến sinh nhật', 15000),
        CatalogAddon('addon-02', 'Thiệp viết tay', 25000),
      ]);
    notifyListeners();
  }

  @override
  CakeProduct product(String id) => products.firstWhere((p) => p.id == id);
  @override
  BakeryProfile bakery(String id) => bakeries.firstWhere((b) => b.id == id);
  List<CakeProduct> get published => products
      .where(
        (p) => p.status == 'PUBLISHED' && bakery(p.bakeryId).status == 'ACTIVE',
      )
      .toList();
  List<BakeryProfile> get owned => bakeries.where((b) => b.owner).toList();

  void saveProduct(CakeProduct value) {
    if (value.name.trim().isEmpty ||
        value.price < 0 ||
        value.noticeHours < 0 ||
        value.flavors.isEmpty) {
      throw StateError('Thông tin bánh chưa hợp lệ.');
    }
    if (!bakery(value.bakeryId).owner) {
      throw StateError('Bạn không có membership OWNER của tiệm này.');
    }
    if (!products.any((p) => p.id == value.id)) products.add(value);
    notifyListeners();
  }

  String nextId(String prefix) => '$prefix-${_sequence++}';
  void changePublication(CakeProduct value, String status) {
    if (!bakery(value.bakeryId).owner) {
      throw StateError('Không có quyền chỉnh catalog tiệm này.');
    }
    if (status == 'PUBLISHED' &&
        (bakery(value.bakeryId).status != 'ACTIVE' || value.image.isEmpty)) {
      throw StateError(
        'Cần tiệm ACTIVE và ảnh sản phẩm trước khi xuất bản demo.',
      );
    }
    value.status = status;
    notifyListeners();
  }

  void saveCategory(String name, {String? previous}) {
    final clean = name.trim();
    if (clean.isEmpty || (clean != previous && categories.contains(clean))) {
      throw StateError('Tên danh mục rỗng hoặc đã tồn tại.');
    }
    if (previous == null) {
      categories.add(clean);
    } else {
      categories[categories.indexOf(previous)] = clean;
      for (final p in products.where((p) => p.category == previous)) {
        p.category = clean;
      }
    }
    notifyListeners();
  }

  void removeCategory(String name) {
    categories.remove(name);
    for (final p in products.where((p) => p.category == name)) {
      p.category = 'Chưa phân loại';
    }
    notifyListeners();
  }

  void changed() => notifyListeners();
}
