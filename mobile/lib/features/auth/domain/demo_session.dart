import 'package:flutter/foundation.dart';

enum Persona {
  guest('Khách', 'Guest'),
  customer('Khách hàng', 'CUSTOMER'),
  owner('Chủ tiệm', 'BAKERY_OWNER'),
  admin('Quản trị', 'ADMIN');

  const Persona(this.label, this.code);
  final String label;
  final String code;
}

enum DemoScenario {
  normal('Dữ liệu bình thường'),
  loading('Đang tải'),
  empty('Chưa có dữ liệu'),
  error('Lỗi và thử lại'),
  partial('Thiếu một phần dữ liệu'),
  forbidden('Không có quyền'),
  notFound('Không tìm thấy'),
  conflict('Dữ liệu đã thay đổi'),
  timeout('Chờ quá lâu');

  const DemoScenario(this.label);
  final String label;
}

class DemoSession extends ChangeNotifier {
  Persona _persona = Persona.guest;
  Persona get persona => _persona;
  final Map<String, DemoScenario> _scenarios = {};
  String displayName = 'Minh An';
  String email = 'minhan@example.invalid';
  String address = 'Đường Hoa Mai, Quận 3, TP. Hồ Chí Minh';
  String selectedBakeryId = 'bakery-01';

  void switchPersona(Persona value) {
    _persona = value;
    _scenarios.clear();
    notifyListeners();
  }

  DemoScenario scenario(String path) => _scenarios[path] ?? DemoScenario.normal;
  void setScenario(String path, DemoScenario scenario) {
    _scenarios[path] = scenario;
    notifyListeners();
  }

  void selectBakery(String id) {
    selectedBakeryId = id;
    notifyListeners();
  }

  void updateProfile(String name, String contact, String deliveryAddress) {
    displayName = name;
    email = contact;
    address = deliveryAddress;
    notifyListeners();
  }
}
