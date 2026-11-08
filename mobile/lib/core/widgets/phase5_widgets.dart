import 'package:flutter/material.dart';

import '../api/contracts.dart';
import 'live_data.dart';
import 'live_form.dart';
import 'sweetcake_widgets.dart';

Future<bool> confirmLive(BuildContext context, String action) async =>
    await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(action),
        content: const Text(
          'Thao tác sẽ gửi tới dịch vụ thật. Bạn muốn tiếp tục?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Quay lại'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Xác nhận'),
          ),
        ],
      ),
    ) ??
    false;

class LiveDomainList extends StatefulWidget {
  const LiveDomainList({
    super.key,
    required this.title,
    required this.load,
    required this.tile,
    this.header,
    this.statuses = const [],
    this.operational = false,
  });
  final String title;
  final Future<ApiPage> Function(int, String?) load;
  final Widget Function(BuildContext, Json) tile;
  final Widget? header;
  final List<String> statuses;
  final bool operational;
  @override
  State<LiveDomainList> createState() => _LiveDomainListState();
}

class _LiveDomainListState extends State<LiveDomainList> {
  int page = 1, revision = 0;
  String? status;
  @override
  Widget build(BuildContext context) => LiveData<ApiPage>(
    key: ValueKey('$page:$status:$revision'),
    title: widget.title,
    operational: widget.operational,
    load: () => widget.load(page, status),
    builder: (context, data, reload) => [
      ?widget.header,
      if (widget.statuses.isNotEmpty)
        DropdownButtonFormField<String>(
          isExpanded: true,
          initialValue: status,
          decoration: const InputDecoration(labelText: 'Trạng thái'),
          items: [
            const DropdownMenuItem(value: null, child: Text('Tất cả')),
            for (final s in widget.statuses)
              DropdownMenuItem(value: s, child: Text(statusLabels[s] ?? s)),
          ],
          onChanged: (v) => setState(() {
            status = v;
            page = 1;
          }),
        ),
      Text(
        '${data.total} kết quả · Trang ${data.page}/${data.pages == 0 ? 1 : data.pages}',
      ),
      if (data.items.isEmpty)
        const SCStateView(
          title: 'Chưa có dữ liệu phù hợp',
          message:
              'Không có bản ghi ở bộ lọc này. Thử bộ lọc khác hoặc làm mới.',
        ),
      for (final row in data.items) widget.tile(context, row),
      Wrap(
        spacing: 12,
        children: [
          if (page > 1)
            TextButton(
              onPressed: () => setState(() => page--),
              child: const Text('Trang trước'),
            ),
          if (data.hasNext)
            TextButton(
              key: const ValueKey('domain-next'),
              onPressed: () => setState(() => page++),
              child: const Text('Trang tiếp'),
            ),
          TextButton(onPressed: reload, child: const Text('Làm mới')),
        ],
      ),
    ],
  );
}

Future<String?> liveReason(
  BuildContext context,
  String title, {
  int max = 2000,
}) => openLiveForm<String>(
  context,
  title: title,
  action: 'Xác nhận',
  fields: [FormFieldSpec('reason', 'Lý do', required: true, maximum: max)],
  save: (j) async => j['reason'] as String,
);

String displayMoney(Object? value) {
  try {
    return Money.parse(value).display();
  } on Object {
    return 'Chưa có giá hợp lệ';
  }
}

String displayInstant(Object? value) {
  final d = DateTime.tryParse('$value')?.toLocal();
  if (d == null) return 'Chưa cung cấp';
  String two(int n) => n.toString().padLeft(2, '0');
  return '${two(d.day)}/${two(d.month)}/${d.year} ${two(d.hour)}:${two(d.minute)} (${d.timeZoneName})';
}
