import 'dart:io';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';

import '../api/contracts.dart';
import '../api/transport.dart';
import 'live_data.dart';
import 'sweetcake_widgets.dart';

Future<UploadPart?> pickLiveFile(
  String field, {
  bool proof = false,
  int? limitBytes,
}) async {
  final result = await FilePicker.platform.pickFiles(
    // Use the scoped document picker consistently, including Android 16.
    // Image-only GET_CONTENT can be redirected to the OS photo picker.
    // Byte/MIME and size validation below remain authoritative on the client.
    type: FileType.any,
    allowMultiple: false,
  );
  if (result == null) return null;
  final picked = result.files.single,
      limit = limitBytes ?? (proof ? 10 * 1024 * 1024 : 5 * 1024 * 1024);
  if (picked.size > limit) {
    throw ApiFailure(400, 'Tệp vượt giới hạn ${limit ~/ (1024 * 1024)} MiB.');
  }
  final data =
      picked.bytes ??
      (picked.path == null ? null : await File(picked.path!).readAsBytes());
  if (data == null) throw const ApiFailure(400, 'Không đọc được tệp đã chọn.');
  return UploadPart.image(field, picked.name, data, proof: proof, limit: limit);
}

class LiveUpload extends StatefulWidget {
  const LiveUpload(
    this.label, {
    super.key,
    required this.upload,
    this.after,
    this.field = 'file',
    this.maximumMiB = 5,
  });
  final String label, field;
  final int maximumMiB;
  final Future<void> Function(UploadPart) upload;
  final VoidCallback? after;
  @override
  State<LiveUpload> createState() => _LiveUploadState();
}

class _LiveUploadState extends State<LiveUpload> {
  UploadPart? file;
  bool busy = false;
  String? error;
  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.stretch,
    children: [
      Text(widget.label, style: Theme.of(context).textTheme.titleMedium),
      const SizedBox(height: 8),
      Text('JPEG, PNG, WEBP · tối đa ${widget.maximumMiB} MiB mỗi tệp'),
      OutlinedButton.icon(
        key: ValueKey('pick-${widget.field}-${widget.label}'),
        onPressed: busy
            ? null
            : () async {
                try {
                  final f = await pickLiveFile(
                    widget.field,
                    limitBytes: widget.maximumMiB * 1024 * 1024,
                  );
                  if (mounted && f != null) {
                    setState(() {
                      file = f;
                      error = null;
                    });
                  }
                } on Object catch (e) {
                  if (mounted) setState(() => error = safeError(e));
                }
              },
        icon: const Icon(Icons.attach_file),
        label: Text(file == null ? 'Chọn ảnh' : 'Đã chọn ${file!.name}'),
      ),
      if (file != null) ...[
        const SizedBox(height: 8),
        SCButton(
          'Tải ${widget.label.toLowerCase()}',
          key: ValueKey('upload-${widget.label}'),
          busy: busy,
          onPressed: () async {
            setState(() {
              busy = true;
              error = null;
            });
            try {
              await widget.upload(file!);
              if (mounted) {
                setState(() => file = null);
                widget.after?.call();
              }
            } on Object catch (e) {
              if (mounted) setState(() => error = safeError(e));
            } finally {
              if (mounted) setState(() => busy = false);
            }
          },
        ),
      ],
      if (error != null) SCNotice(error!, warning: true),
    ],
  );
}
