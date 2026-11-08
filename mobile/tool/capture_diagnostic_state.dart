// Read-only recovery of sanitized diagnostics from a running test entrypoint.
import 'dart:io';
import 'dart:convert';

import 'package:flutter_driver/flutter_driver.dart';

Future<void> main() async {
  final driver = await FlutterDriver.connect(
    dartVmServiceUrl: Platform.environment['DIAGNOSTIC_VM_URL'],
  );
  var state = await driver.requestData(
    '{}',
    timeout: const Duration(seconds: 20),
  );
  if (Platform.environment['DIAGNOSTIC_CAPTURE_WAIT_USER'] == '1') {
    for (var n = 0; n < 60; n++) {
      final value = jsonDecode(state) as Map;
      if (value['userId'] != null && value['restoring'] == false) {
        break;
      }
      await Future<void>.delayed(const Duration(seconds: 1));
      state = await driver.requestData(
        '{}',
        timeout: const Duration(seconds: 20),
      );
    }
  }
  final name =
      Platform.environment['DIAGNOSTIC_CAPTURE_FILE'] ??
      'after-interrupted-state.json';
  if (!RegExp(r'^[a-zA-Z0-9_.-]+\.json$').hasMatch(name)) {
    throw ArgumentError('Evidence basename required');
  }
  await File('docs/evidence/docker-api-diagnostic/$name').writeAsString(state);
  await driver.close();
}
