import 'contracts.dart';

String apiId(Object? value) {
  if (value is! String ||
      !RegExp(r'^[0-9a-fA-F]{8}(-[0-9a-fA-F]{4}){3}-[0-9a-fA-F]{12}$')
          .hasMatch(value)) {
    throw const FormatException('ID dịch vụ không hợp lệ.');
  }
  return value;
}

Json identified(Object? value, {String? expected}) {
  final result = object(value);
  if (apiId(result['id']) != (expected ?? result['id'])) {
    throw const FormatException('Dịch vụ trả về sai tài nguyên.');
  }
  return result;
}

Future<Json> mutationResult(
  Future<Object?> response, {
  String? expected,
}) async {
  final value = await response;
  try {
    return identified(value, expected: expected);
  } on FormatException {
    throw const ApiFailure(
      502,
      'Phản hồi chưa xác nhận được tài nguyên. Đọc lại trạng thái trước khi gửi lại thao tác.',
      uncertain: true,
      kind: ApiFailureKind.invalidResponse,
    );
  }
}

DateTime futureInstant(Object? value) {
  final parsed = DateTime.tryParse('$value');
  if (parsed == null ||
      !RegExp(
        r'(Z|[+-]\d{2}:\d{2})$',
        caseSensitive: false,
      ).hasMatch('$value') ||
      !parsed.isAfter(DateTime.now())) {
    throw const ApiFailure(400, 'Chọn ngày giờ trong tương lai, kèm múi giờ.');
  }
  return parsed.toUtc();
}

class MessagePage {
  MessagePage.fromJson(Object? input) {
    final j = object(input);
    items = objects(j['items']).map(identified).toList();
    if (items.map((m) => m['id']).toSet().length != items.length) {
      throw const FormatException('Trang tin nhắn chứa ID trùng lặp.');
    }
    for (final message in items) {
      if (DateTime.tryParse('${message['createdAt']}') == null ||
          message['attachments'] is! List) {
        throw const FormatException(
          'Tin nhắn thiếu timestamp hoặc attachment contract.',
        );
      }
    }
    hasMore = j['hasMore'] as bool;
    nextCursor = j['nextCursor'] as String?;
    if (hasMore && (nextCursor == null || nextCursor!.isEmpty)) {
      throw const FormatException('Trang tin nhắn thiếu cursor.');
    }
  }
  late final List<Json> items;
  late final bool hasMore;
  late final String? nextCursor;
}

const requestStatuses = [
  'DRAFT',
  'OPEN',
  'OFFER_SELECTED',
  'CLOSED',
  'CANCELLED',
];
const orderStatuses = [
  'PENDING',
  'CONFIRMED',
  'BAKING',
  'READY',
  'DELIVERING',
  'COMPLETED',
  'CANCELLED',
];

List<String> orderActions(
  String state, {
  required bool owner,
  required bool customer,
}) {
  final next = switch (state) {
    'PENDING' => ['CONFIRMED', 'CANCELLED'],
    'CONFIRMED' => ['BAKING', 'CANCELLED'],
    'BAKING' => ['READY'],
    'READY' => ['DELIVERING'],
    'DELIVERING' => ['COMPLETED'],
    _ => <String>[],
  };
  return customer
      ? next.where((v) => v == 'CANCELLED').toList()
      : owner
      ? next
      : [];
}

/// Customer Identity currently has no public address discovery or management API.
/// Never accept typed UUIDs as a substitute for an authorized address selection.
const addressContractBlocker =
    'Chưa thể đặt bánh vì tính năng chọn địa chỉ giao hàng chưa sẵn sàng. Giỏ và yêu cầu vẫn được giữ; chưa có đơn hoặc giao dịch thanh toán nào được tạo.';
