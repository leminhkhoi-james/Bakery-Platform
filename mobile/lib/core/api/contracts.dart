typedef Json = Map<String, dynamic>;

Json object(Object? value) {
  if (value is! Map<String, dynamic>) {
    throw const FormatException('Object API không hợp lệ.');
  }
  return value;
}

String requiredText(Json value, String key) {
  final result = value[key];
  if (result is! String || result.isEmpty) {
    throw FormatException('API thiếu $key.');
  }
  return result;
}

List<Json> objects(Object? value) {
  if (value is! List) {
    throw const FormatException('Danh sách API không hợp lệ.');
  }
  return value.map(object).toList();
}

/// Fixed decimal, never a binary floating point source for calculations.
class Money implements Comparable<Money> {
  const Money(this.minor);
  final BigInt minor;
  factory Money.parse(Object? input) {
    final text = '$input';
    if (!RegExp(r'^-?\d+(\.\d{1,2})?$').hasMatch(text)) {
      throw const FormatException('Số tiền cần tối đa hai chữ số thập phân.');
    }
    final parts = text.replaceFirst('-', '').split('.');
    var amount =
        BigInt.parse(parts[0]) * BigInt.from(100) +
        BigInt.parse(parts.length == 1 ? '0' : parts[1].padRight(2, '0'));
    if (text.startsWith('-')) amount = -amount;
    return Money(amount);
  }
  String get decimal {
    final absolute = minor.abs();
    return '${minor.isNegative ? '-' : ''}${absolute ~/ BigInt.from(100)}.${(absolute % BigInt.from(100)).toString().padLeft(2, '0')}';
  }

  String display([String currency = 'VND']) {
    final parts = decimal.split('.');
    final whole = parts[0].replaceAllMapped(
      RegExp(r'(\d)(?=(\d{3})+(?!\d))'),
      (m) => '${m[1]}.',
    );
    return '$whole${parts[1] == '00' ? '' : ',${parts[1]}'} $currency';
  }

  @override
  int compareTo(Money other) => minor.compareTo(other.minor);
}

class ApiPage {
  ApiPage.fromJson(Object? input) {
    final value = object(input), meta = object(value['meta']);
    items = objects(value['result']);
    page = (meta['page'] as num).toInt();
    pages = (meta['pages'] as num).toInt();
    total = (meta['total'] as num).toInt();
    if (page < 1 || pages < 0 || total < 0) {
      throw const FormatException('Phân trang API không hợp lệ.');
    }
  }
  late final List<Json> items;
  late final int page, pages, total;
  bool get hasNext => page < pages;
}

class PublicProduct {
  PublicProduct.fromJson(Object? input) {
    final value = object(input);
    product = object(value['product']);
    id = requiredText(product, 'id');
    name = requiredText(product, 'name');
    price = Money.parse(product['basePrice']);
    bakeryId = requiredText(value, 'bakeryId');
    bakeryName = requiredText(value, 'bakeryName');
    images = objects(value['images']);
    options = object(value['options']);
    addOns = objects(value['addOns']);
    category = value['category'] == null ? null : object(value['category']);
  }
  late final String id, name, bakeryId, bakeryName;
  late final Money price;
  late final Json product, options;
  late final Json? category;
  late final List<Json> images, addOns;
}

class SubscriptionPlan {
  SubscriptionPlan.fromJson(Object? input) : json = object(input) {
    id = requiredText(json, 'id');
    name = requiredText(json, 'name');
    code = requiredText(json, 'code');
    currency = requiredText(json, 'currency');
    price = Money.parse(json['monthlyPrice']);
    months = (json['billingPeriodMonths'] as num).toInt();
    features = object(json['features']);
    if (months < 1) throw const FormatException('Chu kỳ gói không hợp lệ.');
  }
  final Json json;
  late final String id, name, code, currency;
  late final Money price;
  late final int months;
  late final Json features;
}

enum ApiFailureKind {
  http,
  connection,
  timeout,
  invalidResponse,
  cancelled,
  configuration,
}

class ApiFailure implements Exception {
  const ApiFailure(
    this.status,
    this.message, {
    this.uncertain = false,
    this.kind = ApiFailureKind.http,
    this.responseStatus,
  });
  final int status;
  final String message;
  final bool uncertain;
  final ApiFailureKind kind;
  final int? responseStatus;
  bool get transient =>
      kind != ApiFailureKind.configuration &&
      (status == 0 || status >= 500 || status == 429);
  @override
  String toString() => message;
  static String forStatus(int status) => switch (status) {
    401 => 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.',
    403 => 'Tài khoản không có quyền thực hiện thao tác với tài nguyên này.',
    404 => 'Nội dung không còn tồn tại hoặc chưa được công khai.',
    409 =>
      'Trạng thái đã thay đổi hoặc yêu cầu bị trùng. Làm mới để đối chiếu.',
    400 ||
    422 => 'Dữ liệu chưa hợp lệ. Kiểm tra trường nhập và điều kiện nghiệp vụ.',
    429 => 'Có quá nhiều yêu cầu. Vui lòng thử lại sau.',
    _ => 'Dịch vụ chưa sẵn sàng. Kiểm tra kết nối và thử lại.',
  };
}
