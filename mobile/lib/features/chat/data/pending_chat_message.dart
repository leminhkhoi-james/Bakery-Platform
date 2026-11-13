import 'dart:convert';
import 'dart:typed_data';

import 'package:crypto/crypto.dart';

import '../../../core/api/contracts.dart';
import '../../../core/api/phase5_contracts.dart';
import '../../../core/api/transport.dart';

/// Immutable logical payload; retry metadata never changes its identity.
class PendingChatMessage {
  PendingChatMessage(
    this.id,
    this.content,
    List<UploadPart> files, {
    DateTime? createdAt,
    this.state = 'prepared',
    this.attempts = 0,
    this.lastAttemptAt,
  }) : createdAt = createdAt ?? DateTime.now().toUtc(),
       attachments = List.unmodifiable([
         for (final f in files)
           UploadPart(
             f.field,
             f.name,
             f.mime,
             Uint8List.fromList(f.bytes).asUnmodifiableView(),
           ),
       ]);

  final String id, content, state;
  final List<UploadPart> attachments;
  final DateTime createdAt;
  final DateTime? lastAttemptAt;
  final int attempts;
  UploadPart? get attachment => attachments.isEmpty ? null : attachments.first;
  String get signature => sha256
      .convert(
        utf8.encode(
          jsonEncode([
            content,
            for (final f in attachments)
              [f.name, f.mime, sha256.convert(f.bytes).toString()],
          ]),
        ),
      )
      .toString();

  PendingChatMessage withState(String value, {bool attempt = false}) =>
      PendingChatMessage(
        id,
        content,
        attachments,
        createdAt: createdAt,
        state: value,
        attempts: attempts + (attempt ? 1 : 0),
        lastAttemptAt: attempt ? DateTime.now().toUtc() : lastAttemptAt,
      );

  Json toJson() => {
    'version': 1,
    'id': id,
    'content': content,
    'fingerprint': signature,
    'createdAt': createdAt.toIso8601String(),
    'state': state,
    'attempts': attempts,
    'lastAttemptAt': lastAttemptAt?.toIso8601String(),
    'attachments': [
      for (final f in attachments)
        {
          'field': f.field,
          'name': f.name,
          'mime': f.mime,
          'bytes': base64Encode(f.bytes),
        },
    ],
  };

  factory PendingChatMessage.decode(Json j) {
    if (j['version'] != 1) throw const FormatException('Journal version');
    final message = PendingChatMessage(
      apiId(j['id']),
      j['content'] as String,
      [
        for (final f in objects(j['attachments']))
          UploadPart(
            f['field'] as String,
            f['name'] as String,
            f['mime'] as String,
            base64Decode(f['bytes'] as String),
          ),
      ],
      createdAt: DateTime.parse(j['createdAt'] as String),
      state: j['state'] as String,
      attempts: j['attempts'] as int,
      lastAttemptAt: j['lastAttemptAt'] == null
          ? null
          : DateTime.parse(j['lastAttemptAt'] as String),
    );
    if (message.signature != j['fingerprint'] ||
        message.content.length > 10000 ||
        message.attachments.length > 5 ||
        message.attachments.any((f) => f.bytes.length > 10 * 1024 * 1024)) {
      throw const FormatException('Journal payload integrity');
    }
    return message;
  }
}
