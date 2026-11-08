// Debug test entrypoint only. Credentials enter through native UI at runtime.
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_driver/driver_extension.dart';
import 'package:bakery_mobile/main.dart';
import 'package:bakery_mobile/core/api/contracts.dart';
import 'package:bakery_mobile/core/api/transport.dart';
import 'package:bakery_mobile/core/live/live_workspace.dart';
import 'package:bakery_mobile/app/router/screen_id.dart';

class BoundaryTransport implements ApiTransport {
  final NativeTransport native = NativeTransport();
  bool offline = false;
  String layer = 'ANDROID_UI';
  Uri? lastUri;
  Map<String, String>? lastHeaders;
  Object? lastBody;
  int? lastScope;
  @override
  Future<WireResponse> send(
    String method,
    Uri uri, {
    Map<String, String> headers = const {},
    Object? body,
    List<UploadPart> files = const [],
    Map<String, String> fields = const {},
    bool multipart = false,
    int? scope,
  }) async {
    if (offline) {
      throw ApiFailure(
        0,
        'Mất kết nối tại test boundary.',
        uncertain: method != 'GET',
      );
    }
    final result = await native.send(
      method,
      uri,
      headers: headers,
      body: body,
      files: files,
      fields: fields,
      multipart: multipart,
      scope: scope,
    );
    if (method == 'POST' &&
        headers.containsKey('Idempotency-Key') &&
        uri.path.endsWith('/subscription-orders') &&
        result.status < 300) {
      lastUri = uri;
      lastHeaders = Map.from(headers);
      lastBody = body;
      lastScope = scope;
    }
    return result;
  }

  @override
  void cancel(int scope) {
    if (scope == lastScope) {
      lastUri = null;
      lastHeaders = null;
      lastBody = null;
    }
    native.cancel(scope);
  }

  @override
  void close() => native.close();
  Future<Json> probe(int scope, {bool conflict = false}) async {
    if (lastUri == null || lastScope != scope) return {'status': 0};
    layer = 'ADAPTER_PROBE';
    try {
      final body = conflict
          ? {...object(lastBody), 'planId': commandId()}
          : lastBody;
      final response = await native.send(
        'POST',
        lastUri!,
        headers: lastHeaders!,
        body: body,
        scope: scope,
      );
      final data = response.status < 300
          ? object(response.data)
          : <String, dynamic>{};
      return {'status': response.status, 'id': data['id']};
    } finally {
      layer = 'ANDROID_UI';
    }
  }
}

void main() {
  final evidence = <Json>[];
  var transport = BoundaryTransport();
  transport.native.onEvidence = (item) => evidence.add({
    ...item,
    'layer': transport.layer,
    'at': DateTime.now().toUtc().toIso8601String(),
  });
  var workspace = LiveWorkspace(transport: transport);
  var navigator = GlobalKey<NavigatorState>();
  enableFlutterDriverExtension(
    handler: (message) async {
      final request = message == null
          ? <String, dynamic>{}
          : object(jsonDecode(message));
      if (request['probeReplay'] == true) {
        return jsonEncode(
          await transport.probe(
            workspace.api.requestScope,
            conflict: request['conflict'] == true,
          ),
        );
      }
      if (request['nav'] != null) {
        navigator.currentState!.pushNamed(
          '${request['nav']}',
          arguments: ScreenArguments(id: request['id'] as String?),
        );
      }
      if (request['offline'] is bool) {
        transport.offline = request['offline'] as bool;
      }
      if (request['expireClientClock'] == true) {
        workspace.session.expiresAt = DateTime.now().subtract(
          const Duration(seconds: 1),
        );
      }
      if (request['recreate'] == true) {
        final old = workspace;
        transport = BoundaryTransport();
        transport.native.onEvidence = (item) => evidence.add({
          ...item,
          'layer': transport.layer,
          'at': DateTime.now().toUtc().toIso8601String(),
        });
        workspace = LiveWorkspace(transport: transport);
        navigator = GlobalKey<NavigatorState>();
        runApp(
          BakeryApp(
            key: UniqueKey(),
            liveWorkspace: workspace,
            navigatorKey: navigator,
          ),
        );
        await WidgetsBinding.instance.endOfFrame;
        old.dispose();
      }
      return jsonEncode({
        'evidence': evidence,
        'roles': workspace.session.user?['roles'] ?? [],
        'userId': workspace.session.user?['id'],
        'bakeryId': workspace.bakery?['id'],
      });
    },
  );
  runApp(BakeryApp(liveWorkspace: workspace, navigatorKey: navigator));
}
