import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:crypto/crypto.dart';
import 'package:cryptography/cryptography.dart' as cipher;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:path_provider/path_provider.dart';

import '../../../core/api/contracts.dart';
import '../../auth/data/session_store.dart';
import 'pending_chat_message.dart';

abstract interface class PendingChatJournal {
  Future<Map<String, PendingChatMessage>> load(String scope);
  Future<void> put(
    String scope,
    String conversation,
    PendingChatMessage message,
  );
  Future<void> remove(String scope, String conversation);
  Future<void> clear(String scope);
}

class ChatJournalKeyStore implements SessionStore {
  final _storage = const FlutterSecureStorage(
    aOptions: AndroidOptions(
      storageNamespace: 'sweetcake.chat.keys.v1',
      resetOnError: false,
      migrateWithBackup: true,
    ),
  );
  @override
  Future<String?> read() => _storage.read(key: 'aes256.v1');
  @override
  Future<void> write(String? value) => value == null
      ? _storage.delete(key: 'aes256.v1')
      : _storage.write(key: 'aes256.v1', value: value);
}

/// Ciphertext only on disk; one atomic record per conversation. Keys and auth
/// tokens never enter these files. Unknown/corrupt records fail closed.
class EncryptedPendingChatJournal implements PendingChatJournal {
  EncryptedPendingChatJournal({
    SessionStore? keys,
    Future<Directory> Function()? directory,
  }) : _keys = keys ?? ChatJournalKeyStore(),
       _directory = directory ?? getApplicationSupportDirectory;
  final SessionStore _keys;
  final Future<Directory> Function() _directory;
  final _cipher = cipher.AesGcm.with256bits();
  Future<void> _queue = Future.value();
  cipher.SecretKey? _cachedKey;
  static const _maxRecord = 72 * 1024 * 1024, _maxTotal = 200 * 1024 * 1024;

  String _hash(String text) => sha256.convert(utf8.encode(text)).toString();
  Future<T> _serial<T>(Future<T> Function() action) {
    final next = _queue.then((_) => action());
    _queue = next.then<void>((_) {}, onError: (Object _, StackTrace _) {});
    return next;
  }

  Future<Directory> _root() async => Directory(
    '${(await _directory()).path}${Platform.pathSeparator}chat-pending-v1',
  );
  Future<Directory> _folder(String scope) async => Directory(
    '${(await _root()).path}${Platform.pathSeparator}${_hash(scope)}',
  );
  Future<cipher.SecretKey> _key() async {
    if (_cachedKey != null) return _cachedKey!;
    var encoded = await _keys.read();
    if (encoded == null) {
      final root = await _root();
      if (await root.exists() &&
          await root
              .list(recursive: true)
              .any((f) => f.path.endsWith('.pending'))) {
        throw const FormatException(
          'Journal key unavailable; records preserved',
        );
      }
      final generated = await _cipher.newSecretKey();
      encoded = base64Encode(await generated.extractBytes());
      await _keys.write(encoded);
      if (await _keys.read() != encoded) {
        throw const FormatException('Journal key persistence failed');
      }
    }
    final bytes = base64Decode(encoded);
    if (bytes.length != 32) throw const FormatException('Journal key format');
    return _cachedKey = cipher.SecretKey(bytes);
  }

  @override
  Future<Map<String, PendingChatMessage>> load(String scope) =>
      _serial(() async {
        final folder = await _folder(scope),
            result = <String, PendingChatMessage>{};
        if (!await folder.exists()) return result;
        await for (final entity in folder.list(followLinks: false)) {
          if (entity is! File || !entity.path.endsWith('.pending')) continue;
          if (await entity.length() > _maxRecord) {
            throw const FormatException('Journal record limit');
          }
          final filename = entity.uri.pathSegments.last;
          final box = cipher.SecretBox.fromConcatenation(
            await entity.readAsBytes(),
            nonceLength: 12,
            macLength: 16,
          );
          final plain = await _cipher.decrypt(
            box,
            secretKey: await _key(),
            aad: utf8.encode('$scope|$filename'),
          );
          final j = object(jsonDecode(utf8.decode(plain)));
          final conversation = j['conversationId'] as String;
          if (filename != '${_hash(conversation)}.pending') {
            throw const FormatException('Journal scope mismatch');
          }
          result[conversation] = PendingChatMessage.decode(j);
        }
        return result;
      });

  @override
  Future<void> put(
    String scope,
    String conversation,
    PendingChatMessage message,
  ) => _serial(() async {
    final folder = await _folder(scope);
    final key = await _key();
    await folder.create(recursive: true);
    final filename = '${_hash(conversation)}.pending';
    final target = File('${folder.path}${Platform.pathSeparator}$filename');
    final plain = utf8.encode(
      jsonEncode({...message.toJson(), 'conversationId': conversation}),
    );
    if (plain.length > _maxRecord - 28) {
      throw const FormatException('Journal record limit');
    }
    var total = plain.length, count = 1;
    await for (final f in folder.list(followLinks: false)) {
      if (f is File && f.path.endsWith('.pending') && f.path != target.path) {
        total += await f.length();
        count++;
      }
    }
    if (total > _maxTotal || count > 20) {
      throw const FormatException(
        'Journal capacity; resolve older pending first',
      );
    }
    final box = await _cipher.encrypt(
      plain,
      secretKey: key,
      nonce: _cipher.newNonce(),
      aad: utf8.encode('$scope|$filename'),
    );
    final temporary = File('${target.path}.tmp');
    await temporary.writeAsBytes(box.concatenation(), flush: true);
    await temporary.rename(target.path);
  });

  @override
  Future<void> remove(String scope, String conversation) => _serial(() async {
    final file = File(
      '${(await _folder(scope)).path}${Platform.pathSeparator}'
      '${_hash(conversation)}.pending',
    );
    if (await file.exists()) await file.delete();
  });

  @override
  Future<void> clear(String scope) => _serial(() async {
    final folder = await _folder(scope);
    if (!await folder.exists()) return;
    // The path consists only of the private app directory and SHA-256(scope).
    await for (final file in folder.list(followLinks: false)) {
      if (file is File &&
          (file.path.endsWith('.pending') ||
              file.path.endsWith('.pending.tmp'))) {
        await file.delete();
      }
    }
    await folder.delete();
  });
}

/// Explicit dependency for tests; production always uses encrypted file storage.
class MemoryPendingChatJournal implements PendingChatJournal {
  final Map<String, Map<String, PendingChatMessage>> _accounts = {};
  @override
  Future<Map<String, PendingChatMessage>> load(String scope) async =>
      Map.of(_accounts[scope] ?? {});
  @override
  Future<void> put(
    String scope,
    String conversation,
    PendingChatMessage message,
  ) async => (_accounts[scope] ??= {})[conversation] = message;
  @override
  Future<void> remove(String scope, String conversation) async =>
      _accounts[scope]?.remove(conversation);
  @override
  Future<void> clear(String scope) async => _accounts.remove(scope);
}
