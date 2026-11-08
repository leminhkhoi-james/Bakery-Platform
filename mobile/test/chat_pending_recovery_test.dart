import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';

import 'package:bakery_mobile/core/api/api_client.dart';
import 'package:bakery_mobile/core/api/contracts.dart';
import 'package:bakery_mobile/core/api/phase5_contracts.dart';
import 'package:bakery_mobile/core/api/transport.dart';
import 'package:bakery_mobile/features/auth/data/live_session.dart';
import 'package:bakery_mobile/features/chat/data/live_chat_repository.dart';
import 'package:bakery_mobile/features/chat/data/pending_chat_journal.dart';
import 'package:flutter_test/flutter_test.dart';

import 'api_foundation_test.dart'
    show FakeTransport, MemorySessionStore, ok, seed;
import 'phase5_contract_test.dart' show id, other, third, phase5Environment;

class DelayedJournal extends MemoryPendingChatJournal {
  final written = Completer<void>();
  final allow = Completer<void>();
  @override
  Future<void> put(
    String scope,
    String conversation,
    PendingChatMessage message,
  ) async {
    if (!written.isCompleted) written.complete();
    await allow.future;
    await super.put(scope, conversation, message);
  }
}

class DelayedKeyStore extends MemorySessionStore {
  final started = Completer<void>(), allow = Completer<void>();
  @override
  Future<void> write(String? value) async {
    if (!started.isCompleted) started.complete();
    await allow.future;
    await super.write(value);
  }
}

void main() {
  late Directory directory;
  late MemorySessionStore keys;
  late EncryptedPendingChatJournal journal;
  late FakeTransport transport;
  late LiveSession session;
  late ApiClient api;
  setUp(() async {
    directory = await Directory.systemTemp.createTemp(
      'sweetcake-pending-test-',
    );
    keys = MemorySessionStore();
    journal = EncryptedPendingChatJournal(
      keys: keys,
      directory: () async => directory,
    );
    transport = FakeTransport();
    session = LiveSession(phase5Environment(), transport, MemorySessionStore());
    seed(session, expired: false);
    session.user = {
      'id': other,
      'roles': ['CUSTOMER'],
    };
    api = ApiClient(session);
  });
  tearDown(() async {
    assert(
      directory.absolute.path.startsWith(Directory.systemTemp.absolute.path),
    );
    await directory.delete(recursive: true);
  });

  test('encrypted journal survives fresh instances with exact private attachment bytes', () async {
    final bytes = Uint8List.fromList(utf8.encode('%PDF-private-payload'));
    final command = PendingChatMessage(third, 'private message text', [
      UploadPart('files', 'private.pdf', 'application/pdf', bytes),
    ]);
    await journal.put('account A', id, command);
    bytes[0] = 0;
    final file =
        (await directory
                    .list(recursive: true)
                    .where((e) => e.path.endsWith('.pending'))
                    .toList())
                .single
            as File;
    final ciphertext = await file.readAsBytes();
    expect(latin1.decode(ciphertext).contains('private message text'), false);
    final fresh = EncryptedPendingChatJournal(
      keys: keys,
      directory: () async => directory,
    );
    final loaded = (await fresh.load('account A'))[id]!;
    expect(loaded.signature, command.signature);
    expect(loaded.attachments.single.bytes.first, 37);
    expect(await fresh.load('account B'), isEmpty);
    expect(loaded.toJson().keys, isNot(contains('accessToken')));
  });

  test(
    'tampered ciphertext fails closed and keeps the evidence file',
    () async {
      await journal.put('account', id, PendingChatMessage(third, 'test', []));
      final file =
          (await directory
                      .list(recursive: true)
                      .where((e) => e.path.endsWith('.pending'))
                      .toList())
                  .single
              as File;
      final bytes = await file.readAsBytes();
      bytes[bytes.length - 1] ^= 1;
      await file.writeAsBytes(bytes, flush: true);
      await expectLater(journal.load('account'), throwsA(isA<Exception>()));
      expect(await file.exists(), true);
    },
  );

  test(
    'lost encryption key never silently regenerates over existing data',
    () async {
      await journal.put('account', id, PendingChatMessage(third, 'test', []));
      keys.value = null;
      final fresh = EncryptedPendingChatJournal(
        keys: keys,
        directory: () async => directory,
      );
      await expectLater(fresh.load('account'), throwsFormatException);
      expect(keys.value, isNull);
    },
  );

  test(
    'write-before-send and duplicate tap fence hold until durable commit',
    () async {
      final store = DelayedJournal();
      final repo = LiveChatRepository(api, journal: store);
      transport.respond = (m, u, h) async =>
          ok({'id': id, 'clientMessageId': third});
      final first = repo.send(id, third, 'same');
      await store.written.future;
      expect(transport.calls, isEmpty);
      await expectLater(
        repo.send(id, third, 'same'),
        throwsA(isA<ApiFailure>()),
      );
      store.allow.complete();
      await first;
      expect(transport.calls.length, 1);
      expect(repo.pending, isEmpty);
    },
  );

  test('disk failure prevents HTTP transmission', () async {
    keys.value = 'not-a-valid-key';
    final repo = LiveChatRepository(api, journal: journal);
    await expectLater(repo.send(id, third, 'same'), throwsA(isA<ApiFailure>()));
    expect(transport.calls, isEmpty);
  });

  test(
    'logout during journal persistence leaves no late private record or POST',
    () async {
      final gated = DelayedKeyStore();
      final disk = EncryptedPendingChatJournal(
        keys: gated,
        directory: () async => directory,
      );
      final repo = LiveChatRepository(api, journal: disk);
      final scope = repo.recovery.accountScope();
      final send = expectLater(
        repo.send(id, third, 'same'),
        throwsA(isA<ApiFailure>()),
      );
      await gated.started.future;
      final logout = repo.discardAccountPending();
      gated.allow.complete();
      await send;
      await logout;
      expect(await disk.load(scope), isEmpty);
      expect(transport.calls, isEmpty);
    },
  );

  test('journal quota rejects a new conversation without discarding previous commands', () async {
    for (var i = 0; i < 20; i++) {
      await journal.put(
        'account',
        commandId(),
        PendingChatMessage(commandId(), 'same', []),
      );
    }
    await expectLater(
      journal.put(
        'account',
        commandId(),
        PendingChatMessage(commandId(), 'overflow', []),
      ),
      throwsFormatException,
    );
    expect((await journal.load('account')).length, 20);
  });

  for (final uncertain in [false, true]) {
    test(
      'transport failure uncertain=$uncertain survives new repository',
      () async {
        transport.respond = (m, u, h) async =>
            throw ApiFailure(0, 'offline', uncertain: uncertain);
        final repo = LiveChatRepository(api, journal: journal);
        await expectLater(
          repo.send(id, third, 'same'),
          throwsA(isA<ApiFailure>()),
        );
        final fresh = LiveChatRepository(
          api,
          journal: EncryptedPendingChatJournal(
            keys: keys,
            directory: () async => directory,
          ),
        );
        await fresh.restorePending();
        expect(fresh.pending[id]!.id, third);
        expect(fresh.pending[id]!.state, uncertain ? 'uncertain' : 'not_sent');
        await expectLater(
          fresh.send(id, other, 'changed'),
          throwsA(isA<ApiFailure>()),
        );
        expect(transport.calls.length, 1);
      },
    );
  }

  test('history scans older cursor pages and removes only confirmed logical message', () async {
    transport.respond = (m, u, h) async =>
        throw const ApiFailure(0, 'lost', uncertain: true);
    final repo = LiveChatRepository(api, journal: journal);
    await expectLater(repo.send(id, third, 'same'), throwsA(isA<ApiFailure>()));
    final first = MessagePage.fromJson({
      'items': <Json>[],
      'hasMore': true,
      'nextCursor': 'older',
    });
    transport.respond = (m, u, h) async => ok({
      'items': [
        {
          'id': id,
          'clientMessageId': third,
          'senderId': other,
          'content': 'same',
          'createdAt': '2026-11-08T00:00:00Z',
          'attachments': <Json>[],
          'deleted': false,
        },
      ],
      'hasMore': false,
      'nextCursor': null,
    });
    expect((await repo.reconcile(id, first))?['id'], id);
    expect(repo.pending, isEmpty);
    final fresh = LiveChatRepository(api, journal: journal);
    await fresh.restorePending();
    expect(fresh.pending, isEmpty);
    expect(
      (transport.calls.last['uri'] as Uri).queryParameters['before'],
      'older',
    );
  });

  test('bounded or unavailable history preserves uncertain; account and conversation isolation', () async {
    transport.respond = (m, u, h) async =>
        throw const ApiFailure(0, 'lost', uncertain: true);
    final repo = LiveChatRepository(api, journal: journal);
    for (final conv in [id, other]) {
      await expectLater(
        repo.send(conv, conv, 'same'),
        throwsA(isA<ApiFailure>()),
      );
    }
    repo.clearPending();
    await repo.restorePending();
    expect(repo.pending.length, 2);
    final page = MessagePage.fromJson({
      'items': <Json>[],
      'hasMore': false,
      'nextCursor': null,
    });
    expect(await repo.reconcile(id, page), isNull);
    session.user = {'id': third};
    repo.clearPending();
    await repo.restorePending();
    expect(repo.pending, isEmpty);
    session.user = {'id': other};
    repo.clearPending();
    await repo.restorePending();
    expect(repo.pending.length, 2);
    await repo.discardAccountPending();
    await repo.restorePending();
    expect(repo.pending, isEmpty);
  });
}
