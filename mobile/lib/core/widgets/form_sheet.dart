import 'package:flutter/material.dart';

import '../utils/formatters.dart';

class FieldSpec {
  const FieldSpec(
    this.id,
    this.label, {
    this.initial = '',
    this.required = true,
    this.keyboard = TextInputType.text,
    this.secret = false,
    this.lines = 1,
    this.maxLength,
    this.options,
    this.validate,
  });
  final String id, label, initial;
  final bool required, secret;
  final int lines;
  final int? maxLength;
  final TextInputType keyboard;
  final Map<String, String>? options;
  final String? Function(String)? validate;
}

Future<Map<String, String>?> editForm(
  BuildContext context,
  String title,
  List<FieldSpec> fields, {
  String submit = 'Lưu thay đổi',
}) => showDialog<Map<String, String>>(
  context: context,
  builder: (_) => _FormDialog(title: title, fields: fields, submit: submit),
);

class _FormDialog extends StatefulWidget {
  const _FormDialog({
    required this.title,
    required this.fields,
    required this.submit,
  });
  final String title, submit;
  final List<FieldSpec> fields;
  @override
  State<_FormDialog> createState() => _FormDialogState();
}

class _FormDialogState extends State<_FormDialog> {
  final _key = GlobalKey<FormState>();
  late final _controllers = {
    for (final f in widget.fields)
      f.id: TextEditingController(
        text: f.options != null && !f.options!.containsKey(f.initial)
            ? f.options!.keys.first
            : f.initial,
      ),
  };
  final Set<String> _visible = {};
  @override
  void dispose() {
    for (final c in _controllers.values) {
      c.dispose();
    }
    super.dispose();
  }

  void _submit() {
    if (!_key.currentState!.validate()) return;
    Navigator.pop(context, {
      for (final e in _controllers.entries) e.key: e.value.text.trim(),
    });
  }

  @override
  Widget build(BuildContext context) => Dialog(
    child: ConstrainedBox(
      constraints: const BoxConstraints(maxWidth: 540),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: SingleChildScrollView(
          child: Form(
            key: _key,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  widget.title,
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: 20),
                for (final f in widget.fields)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 16),
                    child: f.options != null
                        ? DropdownButtonFormField<String>(
                            initialValue: f.options!.containsKey(f.initial)
                                ? f.initial
                                : f.options!.keys.first,
                            isExpanded: true,
                            decoration: InputDecoration(labelText: f.label),
                            items: f.options!.entries
                                .map(
                                  (e) => DropdownMenuItem(
                                    value: e.key,
                                    child: Text(
                                      e.value,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                )
                                .toList(),
                            onChanged: (v) =>
                                _controllers[f.id]!.text = v ?? '',
                            onSaved: (_) {},
                          )
                        : TextFormField(
                            key: ValueKey('field-${f.id}'),
                            controller: _controllers[f.id],
                            keyboardType: f.keyboard,
                            textInputAction: f.lines > 1
                                ? TextInputAction.newline
                                : TextInputAction.next,
                            maxLines: f.secret ? 1 : f.lines,
                            maxLength: f.maxLength,
                            obscureText: f.secret && !_visible.contains(f.id),
                            decoration: InputDecoration(
                              labelText: f.label,
                              suffixIcon: f.secret
                                  ? IconButton(
                                      tooltip: 'Ẩn/hiện mật khẩu',
                                      onPressed: () => setState(() {
                                        _visible.contains(f.id)
                                            ? _visible.remove(f.id)
                                            : _visible.add(f.id);
                                      }),
                                      icon: Icon(
                                        _visible.contains(f.id)
                                            ? Icons.visibility_off
                                            : Icons.visibility,
                                      ),
                                    )
                                  : null,
                            ),
                            validator: (v) =>
                                (f.required ? requiredValue(v) : null) ??
                                f.validate?.call(v ?? ''),
                          ),
                  ),
                FilledButton(onPressed: _submit, child: Text(widget.submit)),
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('Hủy'),
                ),
              ],
            ),
          ),
        ),
      ),
    ),
  );
}
