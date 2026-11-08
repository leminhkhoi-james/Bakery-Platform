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
import 'package:bakery_mobile/core/api/environment.dart';

class Phase5MemoryStore implements SessionStore {
  String? value;
  @override
  Future<String?> read() async => value;
  @override
  Future<void> write(String? next) async {
    value = next;
  }
}

// Separate namespace: never read or clear the user's normal secure session.
class Phase5SecureStore implements SessionStore {
  final FlutterSecureStorage storage = const FlutterSecureStorage(
    aOptions: AndroidOptions(
      storageNamespace: 'sweetcake.phase5-session.v1',
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
  native.onEvidence = (event) => events.add({...event, 'layer': 'ANDROID_UI'});
  final workspace = LiveWorkspace(
    transport: native,
    store: const bool.fromEnvironment('PHASE5_PERSISTENT')
        ? Phase5SecureStore()
        : Phase5MemoryStore(),
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
        'origins': {
          for (final service in ApiService.values)
            if (service != ApiService.cakeAi ||
                workspace.session.environment.cakeAi != null)
              service.name: workspace.session.environment
                  .origin(service)
                  .origin,
        },
        'events': events,
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
