import 'package:bakery_mobile/features/chat/data/pending_chat_journal.dart';

import 'dart:convert';
import 'dart:typed_data';

import 'package:bakery_mobile/core/api/api_client.dart';
import 'package:bakery_mobile/core/api/contracts.dart';
import 'package:bakery_mobile/core/api/environment.dart';
import 'package:bakery_mobile/core/api/phase5_contracts.dart';
import 'package:bakery_mobile/core/api/transport.dart';
import 'package:bakery_mobile/features/auth/data/live_session.dart';
import 'package:bakery_mobile/features/cart/data/live_cart.dart';
import 'package:bakery_mobile/features/catalog/data/live_catalog_repository.dart';
import 'package:bakery_mobile/features/chat/data/live_chat_repository.dart';
import 'package:bakery_mobile/features/chat/presentation/live_chat_attachment.dart';
import 'package:bakery_mobile/features/marketplace/data/live_marketplace_repository.dart';
import 'package:bakery_mobile/features/orders/data/live_order_repository.dart';
import 'package:flutter_test/flutter_test.dart';

import 'api_foundation_test.dart'
    show FakeTransport, MemorySessionStore, ok, seed;

const id = '11111111-1111-4111-8111-111111111111',
    other = '22222222-2222-4222-8222-222222222222',
    third = '33333333-3333-4333-8333-333333333333';
ApiEnvironment phase5Environment() => ApiEnvironment(
  identity: Uri.parse('http://127.0.0.1:1'),
  bakery: Uri.parse('http://127.0.0.1:2'),
  subscription: Uri.parse('http://127.0.0.1:3'),
  marketplace: Uri.parse('http://127.0.0.1:4'),
  order: Uri.parse('http://127.0.0.1:5'),
  chat: Uri.parse('http://127.0.0.1:6'),
);
Json productJson({String price = '0.10', String bakery = other}) => {
  'bakeryId': bakery,
  'bakeryName': 'Unit bakery',
  'product': {
    'id': id,
    'name': 'Unit cake',
    'basePrice': price,
    'status': 'PUBLISHED',
  },
  'images': <Json>[],
  'addOns': <Json>[],
  'options': {'groups': <Json>[]},
};

class MultipartRecorder extends FakeTransport {
  List<UploadPart> uploaded = [];
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
    uploaded = files;
    return super.send(
      method,
      uri,
      headers: headers,
      body: body,
      files: files,
      fields: fields,
      multipart: multipart,
      scope: scope,
    );
  }
}

LiveChatRepository chatRepo(ApiClient api) {
  api.session.user ??= {
    'id': other,
    'roles': ['CUSTOMER'],
  };
  return LiveChatRepository(api, journal: MemoryPendingChatJournal());
}

void main() {
  late FakeTransport transport;
  late LiveSession session;
  late ApiClient api;
  setUp(() {
    transport = FakeTransport();
    session = LiveSession(phase5Environment(), transport, MemorySessionStore());
    seed(session, expired: false);
    api = ApiClient(session);
  });
  test('new domains resolve distinct configured origins and reject internal routes', () {
    expect(phase5Environment().origin(ApiService.marketplace).port, 4);
    expect(
      () => phase5Environment().endpoint(
        ApiService.chat,
        '/internal/v1/test',
        {},
      ),
      throwsArgumentError,
    );
    expect(() => apiId('../users'), throwsFormatException);
  });
  test('detail rejects wrong returned resource ID', () async {
    transport.respond = (m, u, h) async => ok({'id': other});
    await expectLater(
      LiveMarketplaceRepository(api).request(id),
      throwsFormatException,
    );
  });
  test('RFQ pagination preserves requested scope, size and page', () async {
    transport.respond = (m, u, h) async => ok({
      'meta': {'page': 2, 'pages': 3, 'total': 21},
      'result': <Json>[],
    });
    final page = await LiveMarketplaceRepository(api)
        .requests({'scope': 'available', 'page': 2, 'size': 10});
    expect(page.hasNext, isTrue);
    expect((transport.calls.single['uri'] as Uri).queryParameters, {
      'scope': 'available',
      'page': '2',
      'size': '10',
    });
  });
  for (final status in [400, 403, 409, 422]) {
    test(
      'offer rejection $status is definitive and never auto retries',
      () async {
        transport.respond = (m, u, h) async =>
            WireResponse(status, {'statusCode': status, 'data': null}, []);
        await expectLater(
          LiveMarketplaceRepository(api).createOffer(id, {'bakeryId': other}),
          throwsA(
            isA<ApiFailure>().having((e) => e.uncertain, 'uncertain', false),
          ),
        );
        expect(transport.calls.length, 1);
      },
    );
  }
  test('ambiguous accept preserves explicit key across manual replay and never auto posts', () async {
    transport.respond = (m, u, h) async =>
        WireResponse(503, {'statusCode': 503, 'data': null}, []);
    final repo = LiveMarketplaceRepository(api);
    for (var i = 0; i < 2; i++) {
      await expectLater(
        repo.accept(id, {'deliveryAddressId': other}, third),
        throwsA(
          isA<ApiFailure>().having((e) => e.uncertain, 'uncertain', true),
        ),
      );
    }
    expect(transport.calls.length, 2);
    expect(
      transport.calls
          .map((c) => (c['headers'] as Map)['Idempotency-Key'])
          .toSet(),
      {third},
    );
  });
  test('accept does not claim success without order result', () async {
    transport.respond = (m, u, h) async =>
        ok({'offerId': id, 'offerStatus': 'PENDING'});
    await expectLater(
      LiveMarketplaceRepository(api)
          .accept(id, {'deliveryAddressId': other}, third),
      throwsA(isA<ApiFailure>().having((e) => e.uncertain, 'uncertain', true)),
    );
  });
  test(
    'direct order uses stable key and real product selections payload',
    () async {
      transport.respond = (m, u, h) async => ok({
        'id': id,
        'createdAt': '2026-11-08T00:00:00Z',
        'attachments': <Json>[],
      });
      final body = {
        'bakeryId': other,
        'productId': third,
        'quantity': 2,
        'deliveryAddressId': id,
      };
      await LiveOrderRepository(api).create(body, third);
      expect(transport.calls.single['body'], body);
      expect(
        (transport.calls.single['headers'] as Map)['Idempotency-Key'],
        third,
      );
    },
  );
  test(
    'customer cannot complete orders; owner follows exact server state machine',
    () {
      expect(orderActions('PENDING', owner: false, customer: true), [
        'CANCELLED',
      ]);
      expect(orderActions('BAKING', owner: false, customer: true), isEmpty);
      expect(orderActions('READY', owner: true, customer: false), [
        'DELIVERING',
      ]);
      expect(orderActions('COMPLETED', owner: true, customer: true), isEmpty);
      expect(orderActions('PENDING', owner: true, customer: true), [
        'CANCELLED',
      ]);
    },
  );
  test('money uses decimal cents for cart quantity', () {
    final cart = LiveCart()
      ..set(PublicProduct.fromJson(productJson()), 3, {}, {});
    expect(cart.estimate.decimal, '0.30');
    expect(cart.payload['productId'], id);
    expect(cart.payload['quantity'], 3);
  });
  test('cart rejects cross bakery replacement without erasing original', () {
    final cart = LiveCart()
      ..set(PublicProduct.fromJson(productJson()), 1, {}, {});
    expect(
      () => cart.set(
        PublicProduct.fromJson(productJson(bakery: third)),
        1,
        {},
        {},
      ),
      throwsA(isA<ApiFailure>()),
    );
    expect(cart.product!.bakeryId, other);
  });
  test('required or inactive product options prevent checkout', () {
    final product = productJson();
    product['options'] = {
      'groups': [
        {
          'id': other,
          'name': 'Size',
          'required': true,
          'minimumSelections': 1,
          'maximumSelections': 1,
          'values': [
            {'id': third, 'active': false, 'priceAdjustment': '10.00'},
          ],
        },
      ],
    };
    final p = PublicProduct.fromJson(product);
    expect(() => LiveCart.validate(p, 1, {}, {}), throwsA(isA<ApiFailure>()));
    expect(
      () => LiveCart.validate(p, 1, {
        other: [third],
      }, {}),
      throwsA(isA<ApiFailure>()),
    );
  });
  test(
    'stale prices keep original cart until explicit user selection',
    () async {
      final cart = LiveCart()
        ..set(PublicProduct.fromJson(productJson()), 2, {}, {});
      transport.respond = (m, u, h) async => ok(productJson(price: '9.00'));
      await expectLater(
        cart.revalidate(LiveCatalogRepository(api)),
        throwsA(isA<ApiFailure>()),
      );
      expect(cart.product!.price.decimal, '0.10');
    },
  );
  test('cursor is required when message page promises more', () {
    expect(
      () => MessagePage.fromJson({
        'items': <Json>[],
        'hasMore': true,
        'nextCursor': null,
      }),
      throwsFormatException,
    );
    final page = MessagePage.fromJson({
      'items': [
        {
          'id': id,
          'createdAt': '2026-11-08T00:00:00Z',
          'attachments': <Json>[],
        },
      ],
      'hasMore': true,
      'nextCursor': 'opaque-server-cursor',
    });
    expect(page.nextCursor, 'opaque-server-cursor');
  });
  test(
    'message submission uses JSON metadata multipart and stable client ID',
    () async {
      final t = MultipartRecorder();
      final s = LiveSession(phase5Environment(), t, MemorySessionStore());
      seed(s, expired: false);
      t.respond = (m, u, h) async =>
          ok({'id': other, 'clientMessageId': third});
      await chatRepo(ApiClient(s)).send(id, third, ' hello ');
      expect(t.uploaded.single.field, 'metadata');
      expect(t.uploaded.single.mime, 'application/json');
      expect(jsonDecode(utf8.decode(t.uploaded.single.bytes)), {
        'clientMessageId': third,
        'messageType': 'TEXT',
        'content': 'hello',
      });
    },
  );
  test('mismatched message client ID stays uncertain', () async {
    transport.respond = (m, u, h) async =>
        ok({'id': other, 'clientMessageId': id});
    await expectLater(
      chatRepo(api).send(id, third, 'hello'),
      throwsA(isA<ApiFailure>().having((e) => e.uncertain, 'uncertain', true)),
    );
  });
  test('chat read validates returned conversation identity', () async {
    transport.respond = (m, u, h) async => ok({'conversationId': other});
    await expectLater(chatRepo(api).read(id, third), throwsFormatException);
  });
  test('new forms reject past or malformed delivery instants', () {
    expect(() => futureInstant('yesterday'), throwsA(isA<ApiFailure>()));
    expect(
      () => futureInstant('2000-01-01T00:00:00Z'),
      throwsA(isA<ApiFailure>()),
    );
  });
  test('malformed successful create stays uncertain instead of permitting duplicate create', () async {
    transport.respond = (m, u, h) async => ok({'unexpected': 'record'});
    await expectLater(
      LiveMarketplaceRepository(api).create({'title': 'Unit'}),
      throwsA(isA<ApiFailure>().having((e) => e.uncertain, 'uncertain', true)),
    );
    expect(transport.calls.length, 1);
  });
  test(
    'ambiguous chat command refuses a new logical id or changed content',
    () async {
      transport.respond = (m, u, h) async =>
          WireResponse(503, {'statusCode': 503, 'data': null}, []);
      final repo = chatRepo(api);
      await expectLater(
        repo.send(id, other, 'same'),
        throwsA(isA<ApiFailure>()),
      );
      await expectLater(
        repo.send(id, third, 'different'),
        throwsA(isA<ApiFailure>().having((e) => e.status, 'status', 409)),
      );
      expect(transport.calls.length, 1);
      expect(repo.pending[id]!.id, other);
    },
  );
  test('chat masked 403 preserves command until reconciliation', () async {
    transport.respond = (m, u, h) async =>
        WireResponse(403, {'statusCode': 403, 'data': null}, []);
    final repo = chatRepo(api);
    await expectLater(
      repo.send(id, other, 'same'),
      throwsA(isA<ApiFailure>().having((e) => e.uncertain, 'uncertain', true)),
    );
    expect(repo.pending[id]!.id, other);
  });
  test(
    'chat supports up to five mixed attachments with FILE metadata',
    () async {
      final t = MultipartRecorder();
      final s = LiveSession(phase5Environment(), t, MemorySessionStore());
      seed(s, expired: false);
      t.respond = (m, u, h) async =>
          ok({'id': other, 'clientMessageId': third});
      final files = List.generate(
        5,
        (i) => UploadPart(
          'files',
          'file-$i.pdf',
          'application/pdf',
          Uint8List.fromList(utf8.encode('%PDF-1.4')),
        ),
      );
      await chatRepo(ApiClient(s)).send(id, third, '', attachments: files);
      expect(t.uploaded.length, 6);
      expect(
        jsonDecode(utf8.decode(t.uploaded.first.bytes))['messageType'],
        'FILE',
      );
    },
  );
  test(
    'six attachments and blank text are rejected before network send',
    () async {
      final repo = chatRepo(api);
      await expectLater(repo.send(id, other, ''), throwsA(isA<ApiFailure>()));
      final f = UploadPart(
        'files',
        'x.pdf',
        'application/pdf',
        Uint8List.fromList(utf8.encode('%PDF-1.4')),
      );
      await expectLater(
        repo.send(id, other, '', attachments: List.filled(6, f)),
        throwsA(isA<ApiFailure>()),
      );
      expect(transport.calls, isEmpty);
    },
  );
  test('owner opens existing context via authorized pagination and never posts create', () async {
    transport.respond = (m, u, h) async => ok({
      'meta': {
        'page': int.parse(u.queryParameters['page']!),
        'pages': 2,
        'total': 2,
      },
      'result': u.queryParameters['page'] == '1'
          ? <Json>[]
          : [
              {'id': third, 'cakeRequestId': id, 'bakeryId': other},
            ],
    });
    final result = await chatRepo(api).existingForRequest(id, other);
    expect(result!['id'], third);
    expect(transport.calls.length, 2);
    expect(transport.calls.every((c) => c['method'] == 'GET'), isTrue);
  });
  test(
    'internal signed attachment hosts are rejected without rewriting URL',
    () {
      expect(
        usableChatAttachmentUrl('http://chat-storage:9000/file?signature=unit'),
        isFalse,
      );
      expect(
        usableChatAttachmentUrl('https://storage.example/file?signature=unit'),
        isTrue,
      );
      expect(
        usableChatAttachmentUrl('https://user:pass@storage.example/file'),
        isFalse,
      );
    },
  );
}
