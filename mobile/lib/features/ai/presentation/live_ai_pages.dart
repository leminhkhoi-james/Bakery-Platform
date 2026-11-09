import 'dart:async';

import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';

import '../../../core/api/contracts.dart';
import '../../../core/api/environment.dart';
import '../../../core/api/phase5_contracts.dart';
import '../../../core/api/transport.dart';
import '../../../core/live/live_workspace.dart';
import '../../../core/widgets/live_data.dart';
import '../../../core/widgets/live_form.dart';
import '../../../core/widgets/live_scaffold.dart';
import '../../../core/widgets/phase5_widgets.dart';
import '../../../core/widgets/sweetcake_widgets.dart';
import '../data/live_ai_repository.dart';

class _AiModeNotice extends StatelessWidget {
  const _AiModeNotice();
  @override
  Widget build(BuildContext context) =>
      SCNotice(switch (LiveScope.of(context).session.environment.cakeAiMode) {
        CakeAiMode.localFallback => 'Chế độ cục bộ: dịch vụ vẽ hình minh họa bánh, không gọi nhà cung cấp AI. Ảnh lưu tạm và mất khi dịch vụ khởi động lại.',
        CakeAiMode.providerConfigured => 'Môi trường có cấu hình nhà cung cấp. Trạng thái hoàn tất chưa xác nhận nguồn tạo ảnh; yêu cầu có thể phát sinh phí.',
        CakeAiMode.unknown => 'Chưa xác minh chế độ tạo ảnh của dịch vụ. Trạng thái hoàn tất không xác nhận ảnh được tạo bởi nhà cung cấp AI.',
      });
}

class LiveAiJobsPage extends StatelessWidget {
  const LiveAiJobsPage({super.key, this.request});
  final Json? request;
  @override
  Widget build(BuildContext context) {
    final w = LiveScope.of(context);
    return LiveDomainList(
      title: 'Thiết kế bánh AI',
      statuses: aiStatuses,
      load: (page, status) =>
          w.ai.list(page, status, requestId: request?['id']),
      header: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            request?['title'] ?? 'Ý tưởng của bạn, từng phiên bản.',
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          const _AiModeNotice(),
          const Text('Làm mới chỉ đọc trạng thái, không tạo yêu cầu mới.'),
          if (request == null)
            SCButton(
              'Chọn yêu cầu để tạo thiết kế',
              outlined: true,
              onPressed: () => liveOpen(context, '/requests'),
            ),
          if (request != null && request!['status'] == 'DRAFT')
            SCButton(
              'Tạo thiết kế',
              key: const ValueKey('ai-create'),
              onPressed: w.session.environment.cakeAi == null
                  ? null
                  : () async {
                      final result = await openAiPrompt(
                        context,
                        request: request,
                      );
                      if (result != null && context.mounted) {
                        await Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => LiveAiJobPage(
                              apiId(result['id']),
                              request: request,
                            ),
                          ),
                        );
                      }
                    },
            ),
          if (w.session.environment.cakeAi == null)
            const SCNotice(
              'Dịch vụ thiết kế chưa sẵn sàng trong môi trường này. Yêu cầu bánh vẫn được giữ lại.',
              warning: true,
            ),
        ],
      ),
      tile: (context, j) => SCCard(
        key: ValueKey('ai-job-${j['id']}'),
        onTap: () => Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => LiveAiJobPage(apiId(j['id']), request: request),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SCStatusBadge('${j['status']}'),
            Text('Phiên bản ${j['currentRevision']}'),
            Text(displayInstant(j['createdAt'])),
          ],
        ),
      ),
    );
  }
}

Future<Json?> openAiPrompt(
  BuildContext context, {
  Json? request,
  String? jobId,
}) {
  final w = LiveScope.of(context), key = commandId();
  var images = <UploadPart>[];
  return openLiveForm<Json>(
    context,
    title: jobId == null ? 'Tạo thiết kế từ yêu cầu' : 'Điều chỉnh ý tưởng',
    action: jobId == null ? 'Gửi yêu cầu tạo thiết kế' : 'Tạo phiên bản mới',
    initial: const {'aspectRatio': '1:1', 'numberOfDesigns': '1'},
    fields: const [
      FormFieldSpec(
        'prompt',
        'Mô tả chiếc bánh',
        required: true,
        maximum: 4000,
      ),
      FormFieldSpec('negativePrompt', 'Chi tiết cần tránh', maximum: 2000),
      FormFieldSpec(
        'aspectRatio',
        'Tỷ lệ ảnh',
        kind: FieldKind.choice,
        required: true,
        choices: ['1:1', '4:3', '3:4'],
      ),
      FormFieldSpec(
        'numberOfDesigns',
        'Số thiết kế',
        kind: FieldKind.choice,
        required: true,
        choices: ['1', '2', '3', '4'],
      ),
    ],
    extra: Column(
      children: [
        const _AiModeNotice(),
        const Text(
          'Yêu cầu chạy bất đồng bộ. Không tự gửi lại khi chưa rõ kết quả. Hủy tác vụ không hoàn lại phí đã phát sinh nếu có.',
        ),
        if (jobId == null) _AiSourcePicker(onChanged: (v) => images = v),
      ],
    ),
    save: (j) {
      final body = LiveAiRepository.prompt(
        j['prompt'],
        j['negativePrompt'] ?? '',
        j['aspectRatio'],
        int.parse(j['numberOfDesigns']),
      );
      return jobId == null
          ? w.ai.create(apiId(request!['id']), body, images, key)
          : w.ai.revise(jobId, body, key);
    },
  );
}

class _AiSourcePicker extends StatefulWidget {
  const _AiSourcePicker({required this.onChanged});
  final ValueChanged<List<UploadPart>> onChanged;
  @override
  State<_AiSourcePicker> createState() => _AiSourcePickerState();
}

class _AiSourcePickerState extends State<_AiSourcePicker> {
  List<UploadPart> images = [];
  String? error;
  bool busy = false;
  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.stretch,
    children: [
      Text('${images.length} / 5 ảnh tham khảo (không bắt buộc)'),
      SCButton(
        'Chọn ảnh tham khảo',
        outlined: true,
        busy: busy,
        onPressed: () async {
          setState(() => busy = true);
          try {
            final picked = await FilePicker.platform.pickFiles(
              type: FileType.custom,
              allowedExtensions: ['jpg', 'jpeg', 'png', 'webp'],
              allowMultiple: true,
              withData: true,
            );
            if (picked == null) return;
            if (picked.files.length > 5) {
              throw const FormatException('Chọn tối đa 5 ảnh.');
            }
            final parts = <UploadPart>[];
            for (final file in picked.files) {
              final bytes = file.bytes;
              if (bytes == null || bytes.length > 10 * 1024 * 1024) {
                throw const FormatException(
                  'Không đọc được ảnh hoặc ảnh vượt 10 MiB.',
                );
              }
              parts.add(
                UploadPart.image(
                  'sourceImages',
                  file.name,
                  bytes,
                  limit: 10 * 1024 * 1024,
                ),
              );
            }
            if (mounted) {
              setState(() {
                images = parts;
                error = null;
              });
            }
            widget.onChanged(parts);
          } on Object catch (e) {
            if (mounted) setState(() => error = safeError(e));
          } finally {
            if (mounted) setState(() => busy = false);
          }
        },
      ),
      if (images.isNotEmpty)
        TextButton(
          onPressed: () {
            setState(() => images = []);
            widget.onChanged([]);
          },
          child: const Text('Bỏ ảnh đã chọn'),
        ),
      if (error != null) SCNotice(error!, warning: true),
    ],
  );
}

class LiveAiJobPage extends StatefulWidget {
  const LiveAiJobPage(this.id, {super.key, this.request, this.admin = false});
  final String id;
  final Json? request;
  final bool admin;
  @override
  State<LiveAiJobPage> createState() => _LiveAiJobPageState();
}

class _LiveAiJobPageState extends State<LiveAiJobPage>
    with WidgetsBindingObserver {
  Timer? timer;
  int polls = 0;
  int? epoch;
  bool foreground = true;
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    foreground = state == AppLifecycleState.resumed;
  }

  @override
  void dispose() {
    timer?.cancel();
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final w = LiveScope.of(context);
    epoch ??= w.api.context;
    if (epoch != w.api.context) {
      timer?.cancel();
      return const LiveUnavailable(
        'Tài khoản đã thay đổi. Mở lại thiết kế từ tài khoản hiện tại.',
      );
    }
    return LiveData<Json>(
      title: 'Tiến trình thiết kế',
      operational: widget.admin,
      load: () => w.ai.detail(widget.id),
      builder: (context, d, reload) {
        final job = object(d['job']),
            status = '${job['status']}',
            active = ['QUEUED', 'PROCESSING'].contains(status);
        if (active && polls < 6 && timer == null) {
          timer = Timer(const Duration(seconds: 5), () {
            timer = null;
            polls++;
            if (mounted &&
                foreground &&
                epoch == w.api.context &&
                ModalRoute.of(context)?.isCurrent == true) {
              reload();
            }
          });
        }
        if (!active) {
          timer?.cancel();
          timer = null;
        }
        final mine = job['customerId'] == w.session.user?['id'];
        return [
          const _AiModeNotice(),
          SCStatusBadge(status),
          Text(
            'Phiên bản ${d['currentRevision']}',
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          Text('Cập nhật ${displayInstant(job['updatedAt'])}'),
          if (status == 'FAILED')
            SCNotice(
              job['errorMessage'] == 'INPUT_REJECTED'
                  ? 'Nội dung không vượt qua kiểm tra an toàn. Điều chỉnh ý tưởng để tạo phiên bản mới.'
                  : 'Dịch vụ không hoàn tất thiết kế. Xem lại ý tưởng và chủ động tạo phiên bản mới nếu muốn thử tiếp.',
              warning: true,
            ),
          if (active)
            Text(
              polls < 6
                  ? 'Đang theo dõi tiến trình, tối đa 30 giây.'
                  : 'Đã dừng theo dõi tự động. Bạn có thể làm mới trạng thái.',
            ),
          for (final r in objects(d['promptRevisions'])) ...[
            SCSection('Ý tưởng lần ${r['revisionNumber']}'),
            Text('${r['prompt']}'),
            if (r['negativePrompt'] != null)
              Text('Tránh: ${r['negativePrompt']}'),
          ],
          for (final source in objects(d['sourceImages']))
            LiveMedia(
              source['url'] as String?,
              label: 'Ảnh tham khảo đã duyệt',
            ),
          const SCSection('Thiết kế được tạo'),
          if (objects(d['generatedDesigns']).isEmpty)
            const Text('Chưa có kết quả thiết kế.'),
          for (final design in objects(d['generatedDesigns']))
            SCButton(
              'Xem thiết kế · ${design['moderationStatus']}',
              key: ValueKey('ai-design-${design['id']}'),
              outlined: true,
              onPressed: () => Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => LiveAiDesignPage(
                    apiId(design['id']),
                    request: widget.request,
                    admin: widget.admin,
                  ),
                ),
              ),
            ),
          if (mine && active)
            LiveCommand(
              'Hủy tác vụ',
              key: const ValueKey('ai-cancel'),
              outlined: true,
              run: () async {
                if (await confirmLive(context, 'Hủy tác vụ thiết kế?')) {
                  await w.ai.cancel(widget.id);
                }
              },
              after: reload,
            ),
          if (mine && ['SUCCEEDED', 'FAILED'].contains(status))
            SCButton(
              'Điều chỉnh prompt',
              key: const ValueKey('ai-revise'),
              onPressed: () async {
                await openAiPrompt(context, jobId: widget.id);
                if (mounted) reload();
              },
            ),
          SCButton(
            'Làm mới trạng thái',
            key: const ValueKey('ai-refresh'),
            outlined: true,
            onPressed: reload,
          ),
        ];
      },
    );
  }
}

class LiveAiDesignPage extends StatelessWidget {
  const LiveAiDesignPage(
    this.id, {
    super.key,
    this.request,
    this.admin = false,
  });
  final String id;
  final Json? request;
  final bool admin;
  @override
  Widget build(BuildContext context) {
    final w = LiveScope.of(context);
    return LiveData<Json>(
      title: 'Thiết kế bánh',
      operational: admin,
      load: () => w.ai.design(id),
      builder: (context, d, reload) => [
        const _AiModeNotice(),
        SCStatusBadge('${d['moderationStatus']}'),
        if (d['moderationStatus'] == 'APPROVED')
          LiveMedia(
            d['imageUrl'] as String?,
            key: const ValueKey('ai-design-image'),
            label: 'Thiết kế đã được duyệt',
            height: MediaQuery.orientationOf(context) == Orientation.landscape
                ? 160
                : (MediaQuery.sizeOf(context).width - 32)
                      .clamp(200, 480)
                      .toDouble(),
            fit: BoxFit.contain,
          )
        else
          const SCNotice(
            'Thiết kế chưa được phép hiển thị. Không dùng kết quả này cho yêu cầu bánh.',
          ),
        if (d['moderationReason'] != null)
          Text(switch (d['moderationReason']) {
            'AUTOMATED_REVIEW' => 'Đã qua kiểm tra nội dung tự động.',
            'ADMIN_REVIEW' => 'Đã được quản trị viên kiểm tra.',
            _ => 'Nội dung cần được kiểm tra trước khi sử dụng.',
          }),
        SCButton(
          'Xem tiến trình và phiên bản',
          outlined: true,
          onPressed: () => Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => LiveAiJobPage(
                apiId(d['generationJobId']),
                request: request,
                admin: admin,
              ),
            ),
          ),
        ),
        if (!admin &&
            request != null &&
            request!['status'] == 'DRAFT' &&
            request!['customerId'] == w.session.user?['id'] &&
            d['moderationStatus'] == 'APPROVED')
          LiveCommand(
            'Chọn cho yêu cầu này',
            key: const ValueKey('ai-select'),
            run: () async {
              final current = await w.marketplace.request(
                apiId(request!['id']),
              );
              if (current['status'] != 'DRAFT') {
                throw const ApiFailure(
                  409,
                  'Yêu cầu đã thay đổi. Mở lại yêu cầu để kiểm tra.',
                );
              }
              if (!context.mounted) return;
              if (await confirmLive(context, 'Chọn thiết kế cho yêu cầu?')) {
                await w.marketplace.selectDesign(apiId(current['id']), id);
                final confirmed = await w.marketplace.request(
                  apiId(current['id']),
                );
                if (confirmed['selectedDesignId'] != id) {
                  throw const ApiFailure(
                    502,
                    'Chưa xác nhận thiết kế đã chọn.',
                    uncertain: true,
                  );
                }
              }
            },
            after: reload,
          ),
        if (admin &&
            w.session.hasRole('ADMIN') &&
            d['moderationStatus'] == 'PENDING')
          for (final status in ['APPROVED', 'REJECTED'])
            if (d['moderationStatus'] != status)
              LiveCommand(
                status == 'APPROVED' ? 'Duyệt thiết kế' : 'Từ chối thiết kế',
                run: () async {
                  if (await confirmLive(context, 'Đổi trạng thái thiết kế?')) {
                    await w.ai.moderate(id, status);
                  }
                },
                after: reload,
              ),
        if (admin && d['moderationStatus'] != 'PENDING')
          const Text(
            'Thiết kế đã có quyết định duyệt. Dịch vụ chỉ nhận quyết định cho thiết kế đang chờ duyệt.',
          ),
        SCButton('Làm mới liên kết ảnh', outlined: true, onPressed: reload),
      ],
    );
  }
}
