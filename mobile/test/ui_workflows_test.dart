import 'package:bakery_mobile/core/demo/demo_workspace.dart';
import 'package:bakery_mobile/features/auth/domain/demo_session.dart';
import 'package:bakery_mobile/main.dart';
import 'package:bakery_mobile/app/router/screen_id.dart';
import 'package:bakery_mobile/features/orders/domain/order_repository.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('Không có gói ACTIVE vẫn render và chặn tạo đơn', (t) async {
    final w = DemoWorkspace();
    w.session.switchPersona(Persona.owner);
    for (final plan in w.subscriptions.plans) {
      plan.status = 'INACTIVE';
    }
    await t.pumpWidget(
      BakeryApp(workspace: w, initialRoute: '/vendor-subscription'),
    );
    await t.pumpAndSettle();
    expect(find.textContaining('Chưa có gói đang cung cấp'), findsOneWidget);
    expect(t.takeException(), isNull);
    await t.ensureVisible(find.text('Tạo đơn gói local'));
    await t.pumpAndSettle();
    await t.tap(find.text('Tạo đơn gói local'));
    await t.pumpAndSettle();
    expect(w.subscriptions.orders.length, 2);
    await t.pumpWidget(const SizedBox());
    w.catalog.bakery('bakery-01').status = 'SUSPENDED';
    await t.pumpWidget(
      BakeryApp(
        key: UniqueKey(),
        workspace: w,
        initialRoute: '/product-detail',
      ),
    );
    await t.pumpAndSettle();
    expect(find.text('Không tìm thấy nội dung'), findsOneWidget);
    await t.pumpWidget(const SizedBox());
    w.dispose();
  });
  testWidgets('Form sản phẩm đã sửa được bảo vệ khi back', (t) async {
    final w = DemoWorkspace();
    w.session.switchPersona(Persona.owner);
    await t.pumpWidget(BakeryApp(workspace: w, initialRoute: '/vendor-menu'));
    await t.pumpAndSettle();
    await t.tap(find.text('Thêm sản phẩm'));
    await t.pumpAndSettle();
    await t.enterText(
      find.widgetWithText(TextFormField, 'Tên bánh'),
      'Bản nháp chưa lưu',
    );
    FocusManager.instance.primaryFocus?.unfocus();
    await t.pumpAndSettle();
    Navigator.of(t.element(find.byType(Scaffold).last)).maybePop();
    await t.pumpAndSettle();
    expect(find.byType(AlertDialog), findsOneWidget);
    await t.tap(find.text('Quay lại'));
    await t.pumpAndSettle();
    expect(find.widgetWithText(TextFormField, 'Tên bánh'), findsOneWidget);
    await t.pumpWidget(const SizedBox());
    w.dispose();
  });
  Future<void> tap(WidgetTester t, String text) async {
    FocusManager.instance.primaryFocus?.unfocus();
    await t.pumpAndSettle();
    final f = find.text(text).last;
    await t.ensureVisible(f);
    await t.pumpAndSettle();
    await t.tap(f);
    await t.pumpAndSettle();
  }

  Future<DemoWorkspace> start(WidgetTester t, String path, Persona p) async {
    final w = DemoWorkspace();
    w.session.switchPersona(p);
    t.view.physicalSize = const Size(390, 900);
    t.view.devicePixelRatio = 1;
    addTearDown(t.view.resetPhysicalSize);
    addTearDown(t.view.resetDevicePixelRatio);
    await t.pumpWidget(BakeryApp(workspace: w, initialRoute: path));
    await t.pumpAndSettle();
    addTearDown(() async {
      await t.pumpWidget(const SizedBox());
      w.dispose();
    });
    return w;
  }

  testWidgets(
    'Bottom navigation tìm sản phẩm và đổi persona qua bộ chọn demo',
    (t) async {
      final w = await start(t, '/', Persona.guest);
      await tap(t, 'Khám phá');
      await t.enterText(find.byType(TextField).first, 'không có bánh này');
      await t.pumpAndSettle();
      expect(find.text('Chưa tìm thấy mẫu phù hợp'), findsOneWidget);
      await t.tap(find.byTooltip('Xóa tìm kiếm'));
      await t.pumpAndSettle();
      expect(find.text('Nhung đỏ mâm xôi'), findsOneWidget);
      await t.tap(find.byKey(const ValueKey('demo-menu')));
      await t.pumpAndSettle();
      await tap(t, 'Chủ tiệm');
      expect(w.session.persona, Persona.owner);
      expect(find.text('Tổng quan tiệm'), findsOneWidget);
    },
  );
  testWidgets(
    'Chi tiết bánh thay size, thêm giỏ và giữ tổng sau tăng số lượng',
    (t) async {
      final w = await start(t, '/product-detail', Persona.customer);
      await tap(t, '16 cm · 4–6 người');
      await tap(t, 'Thêm vào giỏ demo');
      expect(w.cart.lines.single.size, '16 cm');
      expect(w.cart.lines.single.unitPrice, 620000);
      await t.tap(find.byTooltip('Giỏ bánh'));
      await t.pumpAndSettle();
      await t.tap(find.byTooltip('Tăng số lượng'));
      await t.pumpAndSettle();
      expect(w.cart.total, 1270000);
    },
  );
  testWidgets('RFQ báo lỗi bắt buộc rồi lưu bản nháp qua form', (t) async {
    final w = await start(t, '/rfq-new', Persona.customer);
    await tap(t, 'Lưu bản nháp local');
    expect(w.marketplace.requests.length, 3);
    expect(find.textContaining('Vui lòng nhập tên yêu cầu'), findsOneWidget);
    await t.ensureVisible(find.widgetWithText(TextFormField, 'Tên yêu cầu'));
    await t.enterText(
      find.widgetWithText(TextFormField, 'Tên yêu cầu'),
      'Bánh ngày vui',
    );
    await t.enterText(
      find.widgetWithText(TextFormField, 'Mô tả ý tưởng'),
      'Kem vani, dâu đỏ, tám người.',
    );
    await tap(t, 'Lưu bản nháp local');
    expect(w.marketplace.requests.length, 4);
    expect(w.marketplace.requests.first.status, 'DRAFT');
    expect(find.text('Mở nhận báo giá · demo'), findsOneWidget);
  });
  testWidgets('So sánh chọn preview không chấp nhận giao dịch', (t) async {
    final w = await start(t, '/bidding', Persona.customer);
    await t.ensureVisible(find.text('Chọn xem trước').first);
    await t.tap(find.text('Chọn xem trước').first);
    await t.pumpAndSettle();
    expect(w.marketplace.previewOfferId, 'offer-01');
    expect(w.marketplace.offer('offer-01').status, 'PENDING');
  });
  testWidgets('Chủ tiệm tạo sản phẩm DRAFT và đổi trạng thái catalog local', (
    t,
  ) async {
    final w = await start(t, '/vendor-menu', Persona.owner);
    await tap(t, 'Thêm sản phẩm');
    await t.enterText(
      find.widgetWithText(TextFormField, 'Tên bánh'),
      'Bánh thử UI',
    );
    await t.enterText(
      find.widgetWithText(TextFormField, 'Mô tả'),
      'Bánh kem dâu cho ngày vui.',
    );
    await tap(t, 'Lưu bản nháp local');
    expect(w.catalog.products.last.name, 'Bánh thử UI');
    expect(w.catalog.products.last.status, 'DRAFT');
    expect(t.takeException(), isNull);
  });
  testWidgets('Đơn gói dùng snapshot, gửi chứng từ local vào hàng chờ', (
    t,
  ) async {
    final w = await start(t, '/vendor-subscription', Persona.owner);
    await tap(t, 'Tạo đơn gói local');
    expect(w.subscriptions.orders.first.status, 'PENDING');
    await tap(t, 'Gửi tham chiếu minh họa');
    await t.enterText(
      find.widgetWithText(TextFormField, 'Mã tham chiếu demo'),
      'DEMO-UI-001',
    );
    await tap(t, 'Gửi vào hàng chờ local');
    expect(w.subscriptions.orders.first.status, 'PAYMENT_REVIEW');
    expect(w.subscriptions.orders.first.reference, 'DEMO-UI-001');
  });
  testWidgets('Admin điều hướng quản lý người dùng và tạo người dùng local', (
    t,
  ) async {
    final w = await start(t, '/admin-dashboard', Persona.admin);
    await tap(t, 'Người dùng');
    await tap(t, 'Thêm người dùng local');
    await t.enterText(
      find.widgetWithText(TextFormField, 'Họ tên'),
      'Người thử UI',
    );
    await t.enterText(
      find.widgetWithText(TextFormField, 'Email minh họa'),
      'ui@example.invalid',
    );
    await tap(t, 'Lưu người dùng demo');
    expect(w.admin.users.last.email, 'ui@example.invalid');
    expect(w.admin.users.last.role, 'CUSTOMER');
  });
  testWidgets(
    'Chủ tiệm cập nhật đơn theo state machine bằng dialog rồi xem timeline',
    (t) async {
      final w = await start(t, '/vendor-orders', Persona.owner);
      Navigator.of(t.element(find.byType(Scaffold).first)).pushNamed(
        '/vendor-orders',
        arguments: const ScreenArguments(id: 'SC-260703'),
      );
      await t.pumpAndSettle();
      await tap(t, 'Mô phỏng: Đã xác nhận');
      await tap(t, 'Xác nhận trong demo');
      expect(w.orders.get('SC-260703').status, OrderStatus.confirmed);
      expect(find.text('Mô phỏng: Đang làm bánh'), findsOneWidget);
    },
  );
  testWidgets('Sửa hồ sơ local đóng sheet không dùng controller đã dispose', (
    t,
  ) async {
    final w = await start(t, '/profile', Persona.customer);
    await tap(t, 'Sửa hồ sơ local');
    await t.enterText(
      find.widgetWithText(TextFormField, 'Tên hiển thị'),
      'An thử giao diện',
    );
    await tap(t, 'Lưu hồ sơ trong demo');
    expect(w.session.displayName, 'An thử giao diện');
    expect(t.takeException(), isNull);
  });
}
