String vnd(int amount) {
  final digits = amount.abs().toString();
  final result = digits.replaceAllMapped(
    RegExp(r'(\d)(?=(\d{3})+(?!\d))'),
    (m) => '${m[1]}.',
  );
  return '${amount < 0 ? '-' : ''}$result ₫';
}

int parseMoney(String value) =>
    int.tryParse(value.replaceAll(RegExp(r'[^0-9]'), '')) ?? 0;
String? requiredValue(String? value) => value == null || value.trim().isEmpty
    ? 'Vui lòng nhập thông tin này.'
    : null;
String? emailValue(String? value) =>
    value != null &&
        value.isNotEmpty &&
        !RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$').hasMatch(value)
    ? 'Email không hợp lệ.'
    : null;
