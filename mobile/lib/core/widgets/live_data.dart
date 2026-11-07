import 'package:flutter/material.dart';

import '../api/contracts.dart';
import '../live/live_workspace.dart';
import 'live_scaffold.dart';
import 'sweetcake_widgets.dart';

class LiveData<T> extends StatefulWidget {
  const LiveData({
    super.key,
    required this.title,
    required this.load,
    required this.builder,
    this.operational = false,
  });
  final String title;
  final Future<T> Function() load;
  final List<Widget> Function(BuildContext, T, VoidCallback) builder;
  final bool operational;
  @override
  State<LiveData<T>> createState() => _LiveDataState<T>();
}

class _LiveDataState<T> extends State<LiveData<T>> {
  Future<T>? future;
  String? scope;
  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final w = LiveScope.of(context);
    final next = '${w.session.generation}:${w.bakeryRevision}';
    if (scope != next) {
      scope = next;
      future = widget.load();
    }
  }

  void reload() {
    if (!mounted) return;
    final next = widget.load();
    setState(() {
      future = next;
    });
  }

  @override
  Widget build(BuildContext context) => LiveScaffold(
    title: widget.title,
    operational: widget.operational,
    onRefresh: () async {
      reload();
      try {
        await future;
      } on Object {
        /* rendered below */
      }
    },
    children: [
      FutureBuilder<T>(
        future: future,
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return Semantics(
              liveRegion: true,
              child: Column(
                children: [
                  LinearProgressIndicator(),
                  SizedBox(height: 24),
                  Text('Đang tải dữ liệu…'),
                ],
              ),
            );
          }
          if (snapshot.hasError) {
            return SCStateView(
              title: 'Chưa tải được dữ liệu',
              message: safeError(snapshot.error),
              action: 'Thử lại',
              onAction: reload,
            );
          }
          try {
            return Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                for (final item in widget.builder(
                  context,
                  snapshot.data as T,
                  reload,
                ))
                  Padding(
                    padding: const EdgeInsets.only(bottom: 20),
                    child: item,
                  ),
              ],
            );
          } on Object {
            return SCStateView(
              title: 'Dữ liệu dịch vụ chưa đúng định dạng',
              message: 'Vui lòng thử tải lại. Không dùng dữ liệu mẫu thay thế.',
              action: 'Thử lại',
              onAction: reload,
            );
          }
        },
      ),
    ],
  );
}

String safeError(Object? e) => e is ApiFailure
    ? '${e.message}${e.status == 0 ? '' : ' (HTTP ${e.status})'}'
    : e is FormatException
    ? 'Dữ liệu dịch vụ không đúng contract. Vui lòng thử lại.'
    : 'Không thể hoàn tất. Kiểm tra kết nối và thử lại.';

class LiveCommand extends StatefulWidget {
  const LiveCommand(
    this.label, {
    super.key,
    required this.run,
    this.after,
    this.outlined = false,
  });
  final String label;
  final Future<void> Function() run;
  final VoidCallback? after;
  final bool outlined;
  @override
  State<LiveCommand> createState() => _LiveCommandState();
}

class _LiveCommandState extends State<LiveCommand> {
  bool busy = false;
  String? error;
  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.stretch,
    children: [
      if (error != null)
        Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: Semantics(
            liveRegion: true,
            child: SCNotice(error!, warning: true),
          ),
        ),
      SCButton(
        widget.label,
        busy: busy,
        outlined: widget.outlined,
        onPressed: () async {
          setState(() {
            busy = true;
            error = null;
          });
          try {
            await widget.run();
            if (mounted) {
              widget.after?.call();
              ScaffoldMessenger.of(this.context).showSnackBar(
                const SnackBar(content: Text('Đã nhận kết quả từ dịch vụ.')),
              );
            }
          } on Object catch (e) {
            if (mounted) {
              setState(() => error = safeError(e));
              if (e is ApiFailure && e.uncertain) widget.after?.call();
            }
          } finally {
            if (mounted) setState(() => busy = false);
          }
        },
      ),
    ],
  );
}

class LiveMedia extends StatelessWidget {
  const LiveMedia(
    this.url, {
    super.key,
    required this.label,
    this.height = 200,
  });
  final String? url;
  final String label;
  final double height;
  @override
  Widget build(BuildContext context) {
    final uri = Uri.tryParse(url ?? '');
    final valid =
        uri != null &&
        ['http', 'https'].contains(uri.scheme) &&
        uri.userInfo.isEmpty;
    Widget missing() => Container(
      height: height,
      color: Theme.of(context).colorScheme.surfaceContainerLow,
      child: const Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.image_not_supported_outlined, size: 32),
            SizedBox(height: 8),
            Text('Chưa có ảnh khả dụng'),
          ],
        ),
      ),
    );
    return ClipRRect(
      borderRadius: BorderRadius.circular(16),
      child: valid
          ? Image.network(
              url!,
              height: height,
              width: double.infinity,
              fit: BoxFit.cover,
              semanticLabel: label,
              errorBuilder: (_, _, _) => missing(),
              loadingBuilder: (_, child, progress) => progress == null
                  ? child
                  : SizedBox(
                      height: height,
                      child: const Center(child: CircularProgressIndicator()),
                    ),
            )
          : missing(),
    );
  }
}
