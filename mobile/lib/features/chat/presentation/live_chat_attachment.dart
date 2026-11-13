import 'dart:async';
import 'dart:io';
import 'dart:typed_data';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/foundation.dart';

import '../../../core/api/contracts.dart';

bool usableChatAttachmentUrl(Object? value) {
  final uri = Uri.tryParse('$value');
  return uri != null &&
      uri.userInfo.isEmpty &&
      (uri.scheme == 'https' ||
          kDebugMode &&
              uri.scheme == 'http' &&
              ['localhost', '127.0.0.1', '10.0.2.2'].contains(uri.host));
}

Future<void> saveChatAttachment(Json file) async {
  if (!usableChatAttachmentUrl(file['url'])) {
    throw const ApiFailure(
      422,
      'Liên kết tệp chưa có địa chỉ công khai hoặc local phù hợp. Cần Backend cung cấp URL truy cập được trên thiết bị.',
    );
  }
  final uri = Uri.tryParse('${file['url']}');
  if (uri == null ||
      !['http', 'https'].contains(uri.scheme) ||
      uri.userInfo.isNotEmpty) {
    throw const ApiFailure(422, 'URL tải tệp không hợp lệ.');
  }
  final client = HttpClient()..connectionTimeout = const Duration(seconds: 10);
  try {
    final request = await client.getUrl(uri);
    request.followRedirects = false;
    final response = await request.close().timeout(const Duration(seconds: 20));
    if (response.statusCode != 200) {
      throw const ApiFailure(
        410,
        'Liên kết tệp không còn khả dụng. Làm mới lịch sử để nhận URL mới.',
      );
    }
    final builder = BytesBuilder();
    await for (final chunk in response.timeout(const Duration(seconds: 20))) {
      builder.add(chunk);
      if (builder.length > 10 * 1024 * 1024) {
        throw const ApiFailure(422, 'Tệp vượt giới hạn 10 MiB.');
      }
    }
    await FilePicker.platform.saveFile(
      dialogTitle: 'Lưu tệp đính kèm',
      fileName: '${file['originalFileName'] ?? 'attachment'}'.replaceAll(
        RegExp(r'[^a-zA-Z0-9._-]'),
        '_',
      ),
      bytes: builder.takeBytes(),
    );
  } finally {
    client.close(force: true);
  }
}
