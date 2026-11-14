import 'package:bakery_mobile/app/theme/app_theme.dart';
import 'package:bakery_mobile/core/api/environment.dart';
import 'package:bakery_mobile/core/api/transport.dart';
import 'package:bakery_mobile/core/live/live_workspace.dart';
import 'package:bakery_mobile/features/auth/data/live_session.dart';
import 'package:bakery_mobile/features/auth/data/session_store.dart';
import 'package:bakery_mobile/features/chat/data/pending_chat_journal.dart';
import 'package:flutter/material.dart';

const id = '11111111-1111-4111-8111-111111111111';
const other = '22222222-2222-4222-8222-222222222222';

class MemorySessionStore implements SessionStore {
  String? value;
  @override
  Future<String?> read() async => value;
  @override
  Future<void> write(String? value) async {
    this.value = value;
  }
}

class FakeTransport implements ApiTransport {
  final List<Map<String, Object?>> calls = [];
  late Future<WireResponse> Function(String, Uri, Map<String, String>) respond;
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
  }) {
    calls.add({
      'method': method,
      'uri': uri,
      'headers': headers,
      'body': body,
      'scope': scope,
    });
    return respond(method, uri, headers);
  }

  @override
  void cancel(int scope) {}
  @override
  void close() {}
}

WireResponse ok(Object? data) =>
    WireResponse(200, {'statusCode': 200, 'data': data}, []);

void seed(LiveSession s, {bool expired = true}) {
  s.accessToken = 'unit-access';
  s.expiresAt = DateTime.now().add(Duration(minutes: expired ? -1 : 15));
  s.cookie = RefreshCookie.receive(
    'refresh_token=unit-refresh; Path=/api/v1/auth; Max-Age=3600; HttpOnly; SameSite=Lax',
    s.environment.identity,
    DateTime.now(),
  );
}

LiveWorkspace workspace(FakeTransport transport) {
  final w = LiveWorkspace(
    chatJournal: MemoryPendingChatJournal(),
    environment: ApiEnvironment(
      identity: Uri.parse('http://127.0.0.1:1'),
      bakery: Uri.parse('http://127.0.0.1:2'),
      subscription: Uri.parse('http://127.0.0.1:3'),
      marketplace: Uri.parse('http://127.0.0.1:4'),
      order: Uri.parse('http://127.0.0.1:5'),
      chat: Uri.parse('http://127.0.0.1:6'),
      cakeAi: Uri.parse('http://127.0.0.1:7'),
    ),
    transport: transport,
    store: MemorySessionStore(),
  );
  seed(w.session, expired: false);
  w.session.user = {
    'id': other,
    'roles': ['CUSTOMER'],
  };
  w.session.restoring = false;
  return w;
}

Widget app(LiveWorkspace w, Widget child) => LiveScope(
  workspace: w,
  child: MaterialApp(theme: SweetCakeTheme.light, home: child),
);
