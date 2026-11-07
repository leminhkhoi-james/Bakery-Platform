import 'package:flutter/foundation.dart';

class CakeRequest {
  CakeRequest({
    required this.id,
    required this.title,
    required this.description,
    required this.neededAt,
    this.status = 'DRAFT',
    this.type = 'OPEN_CUSTOM',
    this.district = 'Quận 3',
    this.budgetMin = 400000,
    this.budgetMax = 900000,
    this.servings = 8,
    this.productId,
    this.note = '',
  });
  final String id;
  String title, description, status, type, district, note;
  int budgetMin, budgetMax, servings;
  DateTime neededAt;
  String? productId;
}

class CakeOffer {
  CakeOffer({
    required this.id,
    required this.requestId,
    required this.bakeryId,
    required this.cakePrice,
    required this.message,
    this.deliveryFee = 30000,
    this.status = 'PENDING',
    this.expiry = '13/11/2026',
    this.completion = '15/11/2026',
  });
  final String id, requestId, bakeryId;
  int cakePrice, deliveryFee;
  String message, status, expiry, completion;
  int get total => cakePrice + deliveryFee;
}

class LocalMarketplaceRepository extends ChangeNotifier {
  LocalMarketplaceRepository() {
    reset();
  }
  final List<CakeRequest> requests = [];
  final List<CakeOffer> offers = [];
  String? previewOfferId;
  int _sequence = 10;
  static final now = DateTime(2026, 11, 7, 9);

  void reset() {
    requests
      ..clear()
      ..addAll([
        CakeRequest(
          id: 'request-01',
          title: 'Sinh nhật nhỏ, niềm vui lớn',
          description: 'Bánh tông hồng kem, trang trí dâu tươi và dòng chữ Chúc mừng sinh nhật An. Vị nhẹ, ít ngọt.',
          neededAt: DateTime(2026, 11, 15, 15),
          status: 'OPEN',
        ),
        CakeRequest(
          id: 'request-02',
          title: 'Chiếc bánh cho ngày của mẹ',
          description: 'Hoa kem dịu dàng, màu hồng pastel, vị vani dâu.',
          neededAt: DateTime(2026, 11, 20),
          budgetMax: 1200000,
        ),
        CakeRequest(
          id: 'request-03',
          title: 'Tiệc trà cùng đồng nghiệp',
          description: 'Bánh mousse xoài cho 12 người, phong cách tối giản, có thiệp viết tay.',
          neededAt: DateTime(2026, 11, 18),
          status: 'OPEN',
          servings: 12,
          district: 'Bình Thạnh',
          budgetMax: 1500000,
        ),
      ]);
    offers
      ..clear()
      ..addAll([
        CakeOffer(
          id: 'offer-01',
          requestId: 'request-01',
          bakeryId: 'bakery-01',
          cakePrice: 580000,
          message: 'Cốt vani dâu, kem sữa ít ngọt, trang trí dâu tươi. Có thể điều chỉnh dòng chữ theo mong muốn.',
        ),
        CakeOffer(
          id: 'offer-02',
          requestId: 'request-01',
          bakeryId: 'bakery-02',
          cakePrice: 620000,
          deliveryFee: 20000,
          message: 'Bánh mousse dâu hai lớp, hoa kem tông hồng và thiệp. Chuẩn bị trước thời gian nhận 2 giờ.',
        ),
      ]);
    previewOfferId = null;
    notifyListeners();
  }

  CakeRequest request(String id) => requests.firstWhere((r) => r.id == id);
  CakeOffer offer(String id) => offers.firstWhere((o) => o.id == id);
  List<CakeOffer> forRequest(String id) =>
      offers.where((o) => o.requestId == id).toList();
  String nextRequestId() => 'request-${_sequence++}';
  void save(CakeRequest value) {
    if (value.status != 'DRAFT') {
      throw StateError('Chỉ chỉnh sửa yêu cầu DRAFT.');
    }
    if (value.title.trim().isEmpty ||
        value.description.trim().isEmpty ||
        !value.neededAt.isAfter(now) ||
        value.budgetMin < 0 ||
        value.budgetMax < value.budgetMin) {
      throw StateError(
        'Cần tên, mô tả, thời gian tương lai và khoảng ngân sách hợp lệ.',
      );
    }
    if (value.type == 'TARGETED_PRODUCT_CUSTOM' && value.productId == null) {
      throw StateError('Cần chọn sản phẩm cho yêu cầu có tiệm đích.');
    }
    if (!requests.any((r) => r.id == value.id)) requests.insert(0, value);
    notifyListeners();
  }

  void publish(CakeRequest value) {
    save(value);
    value.status = 'OPEN';
    notifyListeners();
  }

  void cancel(CakeRequest value) {
    if (!['DRAFT', 'OPEN'].contains(value.status)) {
      throw StateError('Không thể hủy ở trạng thái này.');
    }
    value.status = 'CANCELLED';
    for (final offer in forRequest(
      value.id,
    ).where((o) => o.status == 'PENDING')) {
      offer.status = 'REJECTED';
    }
    notifyListeners();
  }

  void saveOffer(CakeOffer value) {
    if (request(value.requestId).status != 'OPEN') {
      throw StateError('Yêu cầu đã đóng nhận báo giá.');
    }
    if (value.cakePrice < 0 ||
        value.deliveryFee < 0 ||
        value.message.trim().isEmpty) {
      throw StateError('Giá và nội dung báo giá chưa hợp lệ.');
    }
    final existing = offers.where(
      (o) => o.requestId == value.requestId && o.bakeryId == value.bakeryId,
    );
    if (existing.isNotEmpty && existing.first.id != value.id) {
      throw StateError(
        'Mỗi tiệm chỉ có một báo giá cho yêu cầu, kể cả báo giá đã rút.',
      );
    }
    if (value.status != 'PENDING') {
      throw StateError('Chỉ chỉnh sửa báo giá đang chờ.');
    }
    if (!offers.any((o) => o.id == value.id)) offers.add(value);
    notifyListeners();
  }

  void withdraw(CakeOffer offer) {
    if (offer.status != 'PENDING') {
      throw StateError('Chỉ rút báo giá đang chờ.');
    }
    offer.status = 'WITHDRAWN';
    notifyListeners();
  }

  void choosePreview(CakeOffer offer) {
    if (offer.status != 'PENDING') {
      throw StateError('Báo giá không còn khả dụng.');
    }
    previewOfferId = offer.id;
    notifyListeners();
  }
}
