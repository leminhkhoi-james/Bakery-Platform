import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:bakery_mobile/main.dart';
import 'package:bakery_mobile/app/theme/app_theme.dart';
import 'package:bakery_mobile/core/api/contracts.dart';
import 'package:bakery_mobile/core/live/live_workspace.dart';
import 'package:bakery_mobile/core/widgets/structured_form.dart';
import 'package:bakery_mobile/core/widgets/live_form.dart';
import 'package:bakery_mobile/features/catalog/presentation/live_editor_schemas.dart';

import 'api_foundation_test.dart'
    show FakeTransport, MemorySessionStore, environment, ok;

void main() {
  for (final scale in [1.0, 1.8]) {
    testWidgets('live form is scrollable at 320px and text scale $scale', (
      t,
    ) async {
      t.view.physicalSize = const Size(320, 640);
      t.view.devicePixelRatio = 1;
      addTearDown(t.view.resetPhysicalSize);
      addTearDown(t.view.resetDevicePixelRatio);
      final transport = FakeTransport();
      transport.respond = (m, u, h) async => ok(null);
      final w = LiveWorkspace(
        environment: environment(),
        transport: transport,
        store: MemorySessionStore(),
      );
      await t.pumpWidget(
        LiveScope(
          workspace: w,
          child: MaterialApp(
            theme: SweetCakeTheme.light,
            builder: (context, child) => MediaQuery(
              data: MediaQuery.of(context)
                  .copyWith(textScaler: TextScaler.linear(scale)),
              child: child!,
            ),
            home: LiveFormPage<Json>(
              title: 'Hồ sơ tiệm',
              fields: const [
                FormFieldSpec('name', 'Tên tiệm', required: true),
                FormFieldSpec('description', 'Giới thiệu'),
                FormFieldSpec('email', 'Email liên hệ', kind: FieldKind.email),
              ],
              initial: const {},
              privateContext: false,
              save: (body) async => body,
              action: 'Lưu thay đổi',
            ),
          ),
        ),
      );
      await t.pumpAndSettle();
      await t.ensureVisible(find.byKey(const ValueKey('form-submit')));
      await t.pumpAndSettle();
      expect(t.takeException(), isNull);
      expect(find.text('Lưu thay đổi'), findsOneWidget);
      await t.pumpWidget(const SizedBox());
      w.dispose();
    });
  }
  testWidgets(
    'live home empty and errors never render fixture products or Demo menu',
    (t) async {
      final transport = FakeTransport();
      transport.respond = (m, u, h) async => ok({
        'meta': {'page': 1, 'pageSize': 12, 'pages': 0, 'total': 0},
        'result': [],
      });
      final w = LiveWorkspace(
        environment: environment(),
        transport: transport,
        store: MemorySessionStore(),
      );
      await t.pumpWidget(BakeryApp(liveWorkspace: w));
      await t.pumpAndSettle();
      expect(find.text('Demo'), findsNothing);
      expect(
        find.text(
          'Chưa có nội dung phù hợp. Thử từ khóa khác hoặc làm mới sau.',
        ),
        findsOneWidget,
      );
      expect(transport.calls.every((c) => (c['headers'] as Map).isEmpty), true);
      await t.pumpWidget(const SizedBox());
      w.dispose();
      final failing = FakeTransport();
      failing.respond = (m, u, h) async =>
          throw const ApiFailure(0, 'Offline test boundary');
      final other = LiveWorkspace(
        environment: environment(),
        transport: failing,
        store: MemorySessionStore(),
      );
      await t.pumpWidget(BakeryApp(liveWorkspace: other));
      await t.pumpAndSettle();
      expect(find.text('Chưa tải được dữ liệu'), findsOneWidget);
      expect(find.text('0 mẫu bánh'), findsNothing);
      expect(failing.calls.length, 2);
      failing.respond = (m, u, h) async => ok({
        'meta': {'page': 1, 'pageSize': 12, 'pages': 0, 'total': 0},
        'result': [],
      });
      await t.tap(find.text('Thử lại'));
      await t.pumpAndSettle();
      expect(t.takeException(), isNull);
      expect(find.text('Chưa tải được dữ liệu'), findsNothing);
      expect(failing.calls.length, 3);
      await t.pumpWidget(const SizedBox());
      other.dispose();
    },
  );
  testWidgets('private route uses actual roles, never demo personas', (
    t,
  ) async {
    final transport = FakeTransport();
    transport.respond = (m, u, h) async => ok(null);
    final w = LiveWorkspace(
      environment: environment(),
      transport: transport,
      store: MemorySessionStore(),
    );
    w.session.user = {
      'id': 'unit-customer',
      'roles': ['CUSTOMER'],
    };
    await t.pumpWidget(
      BakeryApp(liveWorkspace: w, initialRoute: '/vendor-menu'),
    );
    await t.pumpAndSettle();
    expect(find.text('Chưa có quyền chủ tiệm'), findsWidgets);
    expect(find.text('Demo'), findsNothing);
    expect(
      transport.calls.every(
        (call) =>
            (call['uri'] as Uri).path == '/api/v1/products' &&
            (call['headers'] as Map).isEmpty,
      ),
      true,
    );
    await t.pumpWidget(const SizedBox());
    w.dispose();
  });
  testWidgets(
    'operations replacement preserves every list and server identifiers',
    (t) async {
      final transport = FakeTransport(), store = MemorySessionStore();
      transport.respond = (m, u, h) async => ok(null);
      final w = LiveWorkspace(
        environment: environment(),
        transport: transport,
        store: store,
      );
      Json? captured;
      final initial = <String, dynamic>{
        'addresses': [
          {
            'id': 'address-real',
            'addressLine': 'Test Street',
            'ward': 'Test Ward',
            'district': 'Test District',
            'city': 'Test City',
            'latitude': '10.123456',
            'longitude': '106.123456',
            'isPrimary': true,
          },
        ],
        'serviceAreas': [
          {
            'id': 'area-real',
            'city': 'Test City',
            'district': 'Test District',
            'deliveryFee': '10000.50',
            'minimumOrder': '200000',
            'active': true,
          },
        ],
        'businessHours': [
          {
            'dayOfWeek': 1,
            'opensAt': '08:00',
            'closesAt': '18:00',
            'closed': false,
          },
        ],
      };
      await t.pumpWidget(
        LiveScope(
          workspace: w,
          child: MaterialApp(
            theme: SweetCakeTheme.light,
            home: StructuredFormPage(
              title: 'Operations test',
              initial: initial,
              fields: const [],
              collections: operationsSchema,
              validate: validateOperations,
              save: (body) async {
                captured = body;
                return body;
              },
            ),
          ),
        ),
      );
      await t.pumpAndSettle();
      final submit = find.byKey(const ValueKey('form-submit'));
      await t.ensureVisible(submit);
      await t.tap(submit);
      await t.pumpAndSettle();
      expect(captured, isNotNull);
      expect((captured!['addresses'] as List).single['id'], 'address-real');
      expect((captured!['addresses'] as List).single['latitude'], '10.123456');
      expect((captured!['serviceAreas'] as List).single['id'], 'area-real');
      expect(
        (captured!['serviceAreas'] as List).single['deliveryFee'],
        '10000.50',
      );
      expect((captured!['businessHours'] as List).single['dayOfWeek'], 1);
      await t.pumpWidget(const SizedBox());
      w.dispose();
    },
  );
  test('operations and option business constraints reject destructive invalid replacements', () {
    expect(
      () => validateOperations({
        'addresses': [
          {'isPrimary': true},
          {'isPrimary': true},
        ],
        'serviceAreas': [],
        'businessHours': [],
      }),
      throwsA(isA<ApiFailure>()),
    );
    expect(
      () => validateOperations({
        'addresses': [],
        'serviceAreas': [],
        'businessHours': [
          {'dayOfWeek': 8, 'closed': true},
        ],
      }),
      throwsA(isA<ApiFailure>()),
    );
    expect(
      () => validateOptions({
        'groups': [
          {
            'minimumSelections': 2,
            'maximumSelections': 1,
            'required': true,
            'selectionType': 'SINGLE',
          },
        ],
      }),
      throwsA(isA<ApiFailure>()),
    );
  });
}
