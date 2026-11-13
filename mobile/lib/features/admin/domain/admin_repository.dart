import 'package:flutter/foundation.dart';

class AdminDemoUser {
  AdminDemoUser(
    this.id,
    this.name,
    this.email,
    this.role, {
    this.status = 'ACTIVE',
  });
  final String id;
  String name, email, role, status;
}

class LocalAdminRepository extends ChangeNotifier {
  LocalAdminRepository() {
    reset();
  }
  final List<AdminDemoUser> users = [];
  void reset() {
    users
      ..clear()
      ..addAll([
        AdminDemoUser(
          'user-01',
          'Minh An',
          'minhan@example.invalid',
          'CUSTOMER',
        ),
        AdminDemoUser(
          'user-02',
          'Bảo Ngọc',
          'baongoc@example.invalid',
          'BAKERY_OWNER',
        ),
        AdminDemoUser(
          'user-03',
          'Quản trị demo',
          'admin@example.invalid',
          'ADMIN',
        ),
      ]);
    notifyListeners();
  }

  void save(AdminDemoUser user) {
    if (user.name.trim().isEmpty || !user.email.contains('@')) {
      throw StateError('Tên và email chưa hợp lệ.');
    }
    if (!users.contains(user)) users.add(user);
    notifyListeners();
  }

  void remove(AdminDemoUser user) {
    if (user.role == 'ADMIN') {
      throw StateError('Không xóa tài khoản quản trị của bản demo.');
    }
    users.remove(user);
    notifyListeners();
  }

  void changed() => notifyListeners();
}
