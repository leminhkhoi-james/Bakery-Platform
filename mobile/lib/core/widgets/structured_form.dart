import 'dart:convert';

import 'package:flutter/material.dart';

import '../api/contracts.dart';
import '../live/live_workspace.dart';
import 'live_data.dart';
import 'live_form.dart';
import 'live_scaffold.dart';
import 'sweetcake_widgets.dart';

class CollectionSpec {
  const CollectionSpec(
    this.name,
    this.label,
    this.fields, {
    this.children = const [],
    this.defaults = const {},
  });
  final String name, label;
  final List<FormFieldSpec> fields;
  final List<CollectionSpec> children;
  final Json defaults;
}

Future<Json?> openStructuredForm(
  BuildContext context, {
  required String title,
  required Json initial,
  List<FormFieldSpec> fields = const [],
  required List<CollectionSpec> collections,
  required Future<Json> Function(Json) save,
  String? notice,
  void Function(Json)? validate,
}) => Navigator.push<Json>(
  context,
  MaterialPageRoute(
    builder: (_) => StructuredFormPage(
      title: title,
      initial: initial,
      fields: fields,
      collections: collections,
      save: save,
      notice: notice,
      validate: validate,
    ),
  ),
);

class StructuredFormPage extends StatefulWidget {
  const StructuredFormPage({
    super.key,
    required this.title,
    required this.initial,
    required this.fields,
    required this.collections,
    required this.save,
    this.notice,
    this.validate,
  });
  final String title;
  final Json initial;
  final List<FormFieldSpec> fields;
  final List<CollectionSpec> collections;
  final Future<Json> Function(Json) save;
  final String? notice;
  final void Function(Json)? validate;
  @override
  State<StructuredFormPage> createState() => _StructuredFormPageState();
}

class _StructuredFormPageState extends State<StructuredFormPage> {
  final form = GlobalKey<FormState>();
  late final Json values = object(jsonDecode(jsonEncode(widget.initial)));
  bool busy = false, dirty = false;
  bool uncertain = false;
  String? error;
  int? epoch;
  @override
  Widget build(BuildContext context) {
    final w = LiveScope.of(context);
    epoch ??= w.api.context;
    if (epoch != w.api.context) {
      return const LiveUnavailable(
        'Tiệm hoặc tài khoản đã thay đổi. Mở lại biểu mẫu từ ngữ cảnh hiện tại.',
      );
    }
    return PopScope(
      canPop: !busy && !dirty,
      onPopInvokedWithResult: (didPop, result) async {
        if (didPop || busy) return;
        final discard = await showDialog<bool>(
          context: context,
          builder: (c) => AlertDialog(
            title: const Text('Bỏ thay đổi chưa lưu?'),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(c, false),
                child: const Text('Tiếp tục nhập'),
              ),
              TextButton(
                onPressed: () => Navigator.pop(c, true),
                child: const Text('Bỏ thay đổi'),
              ),
            ],
          ),
        );
        if (discard == true && mounted) {
          setState(() => dirty = false);
          await WidgetsBinding.instance.endOfFrame;
          if (context.mounted) Navigator.pop(context);
        }
      },
      child: LiveScaffold(
        title: widget.title,
        navigation: false,
        operational: true,
        children: [
          Form(
            key: form,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                if (widget.notice != null)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 20),
                    child: SCNotice(widget.notice!),
                  ),
                ...fields(values, widget.fields, 'field'),
                for (final collection in widget.collections)
                  ...collectionFields(values, collection, collection.name),
                if (error != null) SCNotice(error!, warning: true),
                const SizedBox(height: 20),
                SCButton(
                  'Lưu thay đổi',
                  key: const ValueKey('form-submit'),
                  busy: busy,
                  onPressed: uncertain
                      ? null
                      : () async {
                          if (!form.currentState!.validate()) return;
                          FocusManager.instance.primaryFocus?.unfocus();
                          setState(() {
                            busy = true;
                            error = null;
                          });
                          try {
                            final body = serialize(
                              values,
                              widget.fields,
                              widget.collections,
                            );
                            widget.validate?.call(body);
                            final result = await widget.save(body);
                            if (mounted) {
                              setState(() {
                                dirty = false;
                                busy = false;
                              });
                              await WidgetsBinding.instance.endOfFrame;
                              if (context.mounted) {
                                Navigator.pop(context, result);
                              }
                            }
                          } on Object catch (e) {
                            if (mounted) {
                              setState(() {
                                uncertain = e is ApiFailure && e.uncertain;
                                error =
                                    '${safeError(e)}${uncertain ? ' Quay lại và làm mới để đối chiếu trước khi mở yêu cầu khác.' : ''}';
                              });
                            }
                          } finally {
                            if (mounted) setState(() => busy = false);
                          }
                        },
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  List<Widget> fields(Json target, List<FormFieldSpec> specs, String prefix) =>
      [
        for (final f in specs)
          Padding(
            padding: const EdgeInsets.only(bottom: 18),
            child: NativeField(
              f,
              prefix: prefix,
              value: target[f.name],
              onChanged: (v) => setState(() {
                target[f.name] = v;
                dirty = true;
              }),
            ),
          ),
      ];
  List<Widget> collectionFields(Json parent, CollectionSpec spec, String path) {
    final list = (parent[spec.name] ??= <dynamic>[]) as List;
    return [
      SCSection(spec.label),
      for (var i = 0; i < list.length; i++)
        Padding(
          padding: const EdgeInsets.only(bottom: 20),
          child: ExpansionTile(
            key: ObjectKey(list[i]),
            initiallyExpanded: true,
            maintainState: true,
            tilePadding: EdgeInsets.zero,
            title: Text('${spec.label} ${i + 1}'),
            childrenPadding: const EdgeInsets.only(bottom: 12),
            children: [
              ...fields(object(list[i]), spec.fields, '$path-$i'),
              for (final child in spec.children)
                ...collectionFields(
                  object(list[i]),
                  child,
                  '$path-$i-${child.name}',
                ),
              TextButton.icon(
                key: ValueKey('remove-$path-$i'),
                onPressed: busy
                    ? null
                    : () async {
                        final yes = await showDialog<bool>(
                          context: context,
                          builder: (c) => AlertDialog(
                            title: Text(
                              'Xóa mục ${spec.label.toLowerCase()} này?',
                            ),
                            content: const Text(
                              'Thay đổi chỉ có hiệu lực sau khi lưu.',
                            ),
                            actions: [
                              TextButton(
                                onPressed: () => Navigator.pop(c, false),
                                child: const Text('Giữ lại'),
                              ),
                              TextButton(
                                onPressed: () => Navigator.pop(c, true),
                                child: const Text('Xóa mục'),
                              ),
                            ],
                          ),
                        );
                        if (yes == true && mounted) {
                          setState(() {
                            list.removeAt(i);
                            dirty = true;
                          });
                        }
                      },
                icon: const Icon(Icons.delete_outline),
                label: const Text('Xóa mục'),
              ),
            ],
          ),
        ),
      OutlinedButton.icon(
        key: ValueKey('add-$path'),
        onPressed: busy
            ? null
            : () => setState(() {
                list.add(Map<String, dynamic>.from(spec.defaults));
                dirty = true;
              }),
        icon: const Icon(Icons.add),
        label: Text('Thêm ${spec.label.toLowerCase()}'),
      ),
      const SizedBox(height: 24),
    ];
  }

  Json serialize(
    Json source,
    List<FormFieldSpec> specs,
    List<CollectionSpec> collections,
  ) => {
    if (source['id'] != null) 'id': source['id'],
    for (final f in specs)
      if (f.parse(source[f.name]) != null) f.name: f.parse(source[f.name]),
    for (final c in collections)
      c.name: [
        for (final item in (source[c.name] as List? ?? []))
          serialize(object(item), c.fields, c.children),
      ],
  };
}
