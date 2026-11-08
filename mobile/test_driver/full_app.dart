// Actual screens and repositories; only session persistence is isolated in RAM.
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_driver/driver_extension.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:bakery_mobile/main.dart';
import 'package:bakery_mobile/core/api/contracts.dart';
import 'package:bakery_mobile/core/api/transport.dart';
import 'package:bakery_mobile/core/live/live_workspace.dart';
import 'package:bakery_mobile/features/auth/data/session_store.dart';
import 'package:bakery_mobile/app/router/screen_id.dart';

class FullMemoryStore implements SessionStore {
  String? value;
  @override
  Future<String?> read() async => value;
  @override
  Future<void> write(String? next) async {
    value = next;
  }
}

// Separate namespace: never read or clear the user's normal secure session.
class FullSecureStore implements SessionStore {
  final FlutterSecureStorage storage = const FlutterSecureStorage(
    aOptions: AndroidOptions(
      storageNamespace: 'sweetcake.full-session.v1',
      migrateWithBackup: true,
      resetOnError: false,
    ),
  );
  @override
  Future<String?> read() => storage.read(key: 'synthetic-session');
  @override
  Future<void> write(String? value) => value == null
      ? storage.delete(key: 'synthetic-session')
      : storage.write(key: 'synthetic-session', value: value);
}

void main() {
  final native = NativeTransport(), events = <Json>[];
  native.onEvidence = (event) => events.add({
    ...event,
    'layer': 'ANDROID_UI',
    'at': DateTime.now().toUtc().toIso8601String(),
  });
  final workspace = LiveWorkspace(
    transport: native,
    store: const bool.fromEnvironment('FULL_PERSISTENT')
        ? FullSecureStore()
        : FullMemoryStore(),
  );
  final navigator = GlobalKey<NavigatorState>();
  enableFlutterDriverExtension(
    handler: (message) async {
      final j = jsonDecode(message ?? '{}') as Json;
      if (j['nav'] is String) {
        navigator.currentState!.pushNamed(
          j['nav'] as String,
          arguments: ScreenArguments(id: j['id'] as String?),
        );
        await Future<void>.delayed(const Duration(milliseconds: 500));
      }
      return jsonEncode({
        'events': events,
        'evidence': events,
        'userId': workspace.session.user?['id'],
        'restoring': workspace.session.restoring,
        'roles': workspace.session.user?['roles'],
        'bakeryId': workspace.bakery?['id'],
        'cartProductId': workspace.cart.product?.id,
      });
    },
  );
  WidgetsFlutterBinding.ensureInitialized();
  runApp(BakeryApp(liveWorkspace: workspace, navigatorKey: navigator));
}
