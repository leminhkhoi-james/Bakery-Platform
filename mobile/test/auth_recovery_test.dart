import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:bakery_mobile/app/theme/app_theme.dart';
import 'package:bakery_mobile/core/api/contracts.dart';
import 'package:bakery_mobile/core/api/transport.dart';
import 'package:bakery_mobile/core/live/live_workspace.dart';
import 'package:bakery_mobile/features/auth/presentation/live_auth_pages.dart';

import 'api_foundation_test.dart'
    show FakeTransport, MemorySessionStore, environment;

void main() {
  testWidgets(
    'recovered login removes every credential form from navigation stack',
    (t) async {
      final transport = FakeTransport();
      transport.respond = (m, u, h) async {
        if (u.path.endsWith('/login')) {
          return WireResponse(
            200,
            {
              'statusCode': 200,
              'data': {
                'accessToken': 'unit-login',
                'tokenType': 'Bearer',
                'expiresIn': 900,
              },
            },
            [
              'refresh_token=unit-cookie; Path=/api/v1/auth; Max-Age=3600; HttpOnly; SameSite=Lax',
            ],
          );
        }
        return WireResponse(200, {
          'statusCode': 200,
          'data': {
            'id': 'unit-customer',
            'roles': ['CUSTOMER'],
          },
        }, []);
      };
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
            home: const Scaffold(body: Text('Public home')),
            initialRoute: '/login',
            onGenerateRoute: (settings) => MaterialPageRoute<void>(
              settings: settings,
              builder: (_) => settings.name == '/login'
                  ? const LiveAuthPage(
                      initialEmail: 'synthetic@audit.invalid',
                      reconcileRegistration: true,
                    )
                  : const Scaffold(body: Text('Signed-in profile')),
            ),
          ),
        ),
      );
      await t.pumpAndSettle();
      await t.enterText(
        find.byKey(const ValueKey('field-password')),
        'Synthetic-unit-only',
      );
      await t.ensureVisible(find.byKey(const ValueKey('form-submit')));
      await t.tap(find.byKey(const ValueKey('form-submit')));
      await t.pumpAndSettle();
      expect(find.text('Signed-in profile'), findsOneWidget);
      expect(
        find.byKey(const ValueKey('field-password'), skipOffstage: false),
        findsNothing,
      );
      expect(w.session.user?['id'], 'unit-customer');
      await t.pumpWidget(const SizedBox());
      w.dispose();
    },
  );
  for (final uncertain in [false, true]) {
    testWidgets(
      'signup ${uncertain ? 'uncertain recovery' : 'pre-send retry'} does not trap the user or replay',
      (t) async {
        final transport = FakeTransport();
        transport.respond = (m, u, h) async => throw ApiFailure(
          0,
          uncertain ? 'Response lost' : 'Connection refused',
          uncertain: uncertain,
          kind: ApiFailureKind.connection,
        );
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
              home: const LiveAuthPage(register: true),
            ),
          ),
        );
        await t.pumpAndSettle();
        Future<void> enter(String key, String text) async {
          await t.ensureVisible(find.byKey(ValueKey(key)));
          await t.enterText(find.byKey(ValueKey(key)), text);
        }

        await enter('field-email', 'synthetic@audit.invalid');
        await enter('field-password', 'Synthetic-unit-only');
        await enter('field-displayName', 'Synthetic Unit');
        final submit = find.byKey(const ValueKey('form-submit'));
        await t.ensureVisible(submit);
        await t.tap(submit);
        await t.pumpAndSettle();
        expect(transport.calls.length, 1);
        if (uncertain) {
          final recovery = find.byKey(const ValueKey('registration-reconcile'));
          await t.ensureVisible(recovery);
          await t.tap(recovery);
          await t.pumpAndSettle();
          expect(find.text('Đăng nhập SweetCake'), findsOneWidget);
          expect(
            t
                .widget<TextFormField>(
                  find.byKey(const ValueKey('field-email')),
                )
                .initialValue,
            'synthetic@audit.invalid',
          );
          expect(
            t
                .widget<TextFormField>(
                  find.byKey(const ValueKey('field-password')),
                )
                .initialValue,
            '',
          );
          expect(transport.calls.length, 1);
        } else {
          await t.ensureVisible(submit);
          await t.tap(submit);
          await t.pumpAndSettle();
          expect(transport.calls.length, 2);
          expect(
            find.byKey(const ValueKey('registration-reconcile')),
            findsNothing,
          );
        }
        expect(
          find.text('Chưa hỗ trợ đặt lại mật khẩu hoặc sửa địa chỉ tài khoản.'),
          uncertain ? findsOneWidget : findsNothing,
        );
        expect(t.takeException(), isNull);
        await t.pumpWidget(const SizedBox());
        w.dispose();
      },
    );
  }
}
