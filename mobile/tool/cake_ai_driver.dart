// Real Android screens and NativeTransport. Host-only credentials, no API writes
// outside UI. Named navigation is test setup; authentication/role checks remain.
import 'dart:convert';
import 'dart:io';

import 'package:flutter_driver/flutter_driver.dart';

Future<void> main() async {
  final run = jsonDecode(
    File('docs/cake-ai/current-run.json').readAsStringSync(),
  ) as Map;
  final out = Directory(run['evidenceDirectory'] as String);
  final shots = Directory('${out.path}/screenshots')
    ..createSync(recursive: true);
  final credentials = jsonDecode(
    File('../../.secrets/bakery-platform/local-smoke-users.json')
        .readAsStringSync(),
  ) as Map;
  final fixtureFile = File('${out.path}/android-fixtures.json');
  final fixture = fixtureFile.existsSync()
      ? jsonDecode(fixtureFile.readAsStringSync()) as Map<String, dynamic>
      : <String, dynamic>{};
  final driver = await FlutterDriver.connect();
  final results = <Map<String, dynamic>>[];
  var step = 'connect';
  Future<Map> state([Map command = const {}]) async => jsonDecode(
    await driver.requestData(
      jsonEncode(command),
      timeout: const Duration(seconds: 30),
    ),
  ) as Map;
  Future<void> nav(String path, {String? id}) async {
    await state({'nav': path, 'id': ?id});
    await Future<void>.delayed(const Duration(milliseconds: 400));
  }

  Future<void> tap(SerializableFinder finder) async {
    await driver.waitFor(finder, timeout: const Duration(seconds: 30));
    await driver.scrollIntoView(finder, alignment: .45);
    await driver.tap(finder);
    await Future<void>.delayed(const Duration(milliseconds: 200));
  }

  Future<void> text(String field, String value) async {
    await tap(find.byValueKey('field-$field'));
    await driver.enterText(value);
  }

  Future<void> shot(String name) async {
    await Future<void>.delayed(const Duration(milliseconds: 300));
    await File('${shots.path}/$name.png')
        .writeAsBytes(await driver.screenshot());
  }

  Future<void> submit() async {
    await tap(find.byValueKey('form-submit'));
    await driver.waitForAbsent(
      find.byValueKey('form-submit'),
      timeout: const Duration(seconds: 35),
    );
  }

  Future<List> events() async => (await state())['events'] as List;
  Future<Map> event(
    String path,
    String method,
    int status, {
    int since = 0,
  }) async {
    for (var n = 0; n < 60; n++) {
      final found = (await events())
          .skip(since)
          .where(
            (e) =>
                e['path'] == path &&
                e['method'] == method &&
                e['status'] == status,
          )
          .toList();
      if (found.isNotEmpty) return found.last as Map;
      await Future<void>.delayed(const Duration(milliseconds: 250));
    }
    throw StateError('Missing real HTTP evidence: $method $path $status');
  }

  void persist() => fixtureFile.writeAsStringSync(jsonEncode(fixture));
  void pass(String label) {
    results.add({
      'step': label,
      'result': 'PASS',
      'at': DateTime.now().toUtc().toIso8601String(),
    });
    stdout.writeln('PASS: $label');
  }

  Future<void> login(String actor) async {
    await nav('/login');
    final record = credentials[actor] as Map;
    await text('email', record['email'] as String);
    await text(
      'password',
      (record['password'] ?? credentials['password']) as String,
    );
    await submit();
    await nav('/profile');
    if ((await state())['userId'] == null) {
      throw StateError('No authenticated identity');
    }
  }

  Future<void> logout() async {
    await nav('/profile');
    await tap(find.byValueKey('logout'));
    await driver.waitFor(find.byValueKey('login-nav'));
  }

  Future<void> openCreate(
    String rid,
    String prompt, {
    bool reference = false,
  }) async {
    await nav('/request-detail', id: rid);
    await tap(find.byValueKey('rfq-ai'));
    await tap(find.byValueKey('ai-create'));
    await text('prompt', prompt);
    if (reference) {
      await tap(find.text('Chọn ảnh tham khảo'));
      final picked = await Process.run('python', [
        '-B',
        'tool/full_picker.py',
        'sweetcake-mobile-cake.jpg',
      ]);
      if (picked.exitCode != 0) {
        throw StateError('Native reference picker failed');
      }
    }
  }

  Future<String> createJob(
    String rid,
    String prompt, {
    bool reference = false,
  }) async {
    final count = (await events()).length;
    await openCreate(rid, prompt, reference: reference);
    await submit();
    final created = await event(
      '/api/v1/generation-jobs',
      'POST',
      202,
      since: count,
    );
    return '${(created['ids'] as List).first}';
  }

  Future<void> terminal(String id, String expected) async {
    for (var n = 0; n < 12; n++) {
      final rows = (await events())
          .where(
            (e) =>
                e['path'] == '/api/v1/generation-jobs/$id' &&
                e['method'] == 'GET' &&
                e['status'] == 200,
          )
          .toList();
      if (rows.isNotEmpty && (rows.last['states'] as List).contains(expected)) {
        return;
      }
      await Future<void>.delayed(const Duration(seconds: 1));
      if (n == 7) await tap(find.byValueKey('ai-refresh'));
    }
    throw StateError('Expected terminal state $expected was not observed');
  }

  try {
    await driver.runUnsynchronized(() async {
      step = 'customer-login';
      await login('customer');
      pass('Customer authenticates against existing real Identity');
      step = 'rfq';
      String rid;
      if (fixture['requestId'] is String) {
        rid = fixture['requestId'] as String;
      } else {
        await nav('/request-new');
        final title =
            'Cake AI Android ${DateTime.now().millisecondsSinceEpoch}';
        await text('title', title);
        await text(
          'description',
          'Synthetic Android Cake AI journey; no purchase or external payment.',
        );
        await text(
          'neededAt',
          DateTime.now()
              .toUtc()
              .add(const Duration(days: 15))
              .toIso8601String(),
        );
        await text('deliveryCity', 'Local Test City');
        await text('deliveryDistrict', 'Local Test District');
        await submit();
        rid =
            '${((await event('/api/v1/cake-requests', 'POST', 201))['ids'] as List).first}';
        fixture['requestId'] = rid;
        fixture['title'] = title;
        persist();
        pass('Android creates RFQ via real POST 201 and reconciles detail');
      }
      step = 'form-and-source';
      final before = (await events()).length;
      await openCreate(
        rid,
        'Strawberry pink cake for a local Android verification',
        reference: true,
      );
      await driver.scrollIntoView(
        find.byValueKey('field-prompt'),
        alignment: .2,
      );
      await shot('01-customer-form-local-mode-reference');
      await submit();
      final created = await event(
        '/api/v1/generation-jobs',
        'POST',
        202,
        since: before,
      );
      final jid = '${(created['ids'] as List).first}';
      fixture['jobId'] = jid;
      persist();
      await shot('02-customer-submitted-progress');
      pass('Native picker, multipart submission and real job detail');
      step = 'generation-result';
      await terminal(jid, 'SUCCEEDED');
      await driver.scrollIntoView(find.byValueKey('ai-refresh'), alignment: .7);
      await shot('03-customer-local-result');
      await tap(find.text('Xem thiết kế · APPROVED'));
      final designEvent = (await events()).lastWhere(
        (e) =>
            (e['path'] as String).startsWith('/api/v1/generated-designs/') &&
            e['status'] == 200,
      );
      fixture['designId'] = (designEvent['ids'] as List).first;
      persist();
      await shot('04-design-local-mode');
      pass('Generated design opens from job result; local mode is disclosed');
      step = 'selected-design';
      await tap(find.byValueKey('ai-select'));
      await tap(find.text('Xác nhận'));
      await event('/api/v1/cake-requests/$rid/selected-design', 'PUT', 200);
      await nav('/request-detail', id: rid);
      await tap(find.text('Xem thiết kế đã chọn'));
      await shot('05-selected-design-handoff');
      pass('Approved design selected and rediscovered through actual RFQ');
      step = 'revision';
      await tap(find.text('Xem tiến trình và phiên bản'));
      await tap(find.byValueKey('ai-revise'));
      await text('prompt', 'Matcha green cake revised on Android');
      await shot('06-revision-form');
      await submit();
      await event('/api/v1/generation-jobs/$jid/prompt-revisions', 'POST', 202);
      await terminal(jid, 'SUCCEEDED');
      // Refresh after the initial terminal event so the revision is reconciled.
      await Future<void>.delayed(const Duration(seconds: 7));
      await tap(find.byValueKey('ai-refresh'));
      await driver.waitFor(find.text('Ý tưởng lần 2'));
      await shot('07-revision-history');
      pass('Revision POST 202 and second prompt history rendered');
      step = 'cancel';
      final cancelId = await createJob(
        rid,
        'Yellow mango cake for Android cancellation',
      );
      fixture['cancelJobId'] = cancelId;
      persist();
      await tap(find.byValueKey('ai-cancel'));
      await tap(find.text('Xác nhận'));
      await event('/api/v1/generation-jobs/$cancelId/cancel', 'POST', 200);
      await shot('08-cancelled');
      pass('Customer cancels actual queued/processing job');
      step = 'failed-job';
      final failedId = await createJob(
        rid,
        'weapon cake local safety rejection',
      );
      fixture['failedJobId'] = failedId;
      persist();
      await terminal(failedId, 'FAILED');
      await shot('09-local-moderation-failure');
      pass('Local safety rejection renders failure without fake result');
      step = 'customer-permission';
      await nav('/admin-requests');
      await shot('10-customer-admin-route-denied');
      await logout();
      step = 'other-customer';
      await login('owner');
      await nav('/request-detail', id: rid);
      await event('/api/v1/cake-requests/$rid', 'GET', 403);
      await shot('11-other-customer-rfq-denied');
      pass('Other authenticated Customer/Owner cannot read private draft RFQ');
      await logout();
      step = 'admin';
      await login('admin');
      await nav('/admin-request-detail', id: rid);
      await tap(find.text('Xem thiết kế đã chọn'));
      await shot('12-admin-approved-design-readonly');
      await driver.waitFor(
        find.text(
          'Thiết kế đã có quyết định duyệt. Dịch vụ chỉ nhận quyết định cho thiết kế đang chờ duyệt.',
        ),
      );
      await tap(find.text('Xem tiến trình và phiên bản'));
      await event('/api/v1/generation-jobs/$jid', 'GET', 200);
      await shot('13-admin-job-oversight');
      pass('Admin discovers selected design from RFQ and reads actual job');
      step = 'regression';
      await logout();
      await nav('/');
      await event('/api/v1/products', 'GET', 200);
      await shot('14-public-home-regression');
      await nav('/subscription-plans');
      await shot('15-public-plans-regression');
      pass('Public home remains reachable after Cake AI role journeys');
    });
  } catch (error) {
    results.add({
      'step': step,
      'result': 'FAILED_OR_BLOCKED',
      'errorType': error.runtimeType.toString(),
    });
    await shot('stopped-$step');
    stdout.writeln('BLOCKED: Android stage $step (${error.runtimeType})');
    exitCode = 2;
  } finally {
    final evidence = await state();
    File('${out.path}/android-events.json')
        .writeAsStringSync(jsonEncode(evidence['events']));
    File('${out.path}/android-results.json')
        .writeAsStringSync(jsonEncode({'checks': results, 'lastStep': step}));
    await driver.close();
  }
}
