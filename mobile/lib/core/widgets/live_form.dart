import 'package:flutter/material.dart';

import '../api/contracts.dart';
import '../live/live_workspace.dart';
import 'live_data.dart';
import 'live_scaffold.dart';
import 'sweetcake_widgets.dart';
import 'native_instant_field.dart';
import '../api/phase5_contracts.dart';

enum FieldKind {
  text,
  email,
  password,
  integer,
  money,
  signedMoney,
  boolean,
  choice,
  time,
  instant,
}

class FormFieldSpec {
  const FormFieldSpec(
    this.name,
    this.label, {
    this.kind = FieldKind.text,
    this.required = false,
    this.maximum = 255,
    this.minimum = 0,
    this.choices = const [],
    this.choiceLabels = const {},
    this.help,
  });
  final String name, label;
  final FieldKind kind;
  final bool required;
  final int maximum, minimum;
  final List<String> choices;
  final Map<String, String> choiceLabels;
  final String? help;
  String? validate(Object? input) {
    final text = '${input ?? ''}'.trim();
    if (required && text.isEmpty) return 'Vui lòng nhập $label.';
    if (text.isEmpty) return null;
    if (text.length > maximum) return 'Tối đa $maximum ký tự.';
    if (kind == FieldKind.email &&
        !RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$').hasMatch(text)) {
      return 'Email chưa đúng định dạng.';
    }
    if (kind == FieldKind.password && text.length < minimum) {
      return 'Cần ít nhất $minimum ký tự.';
    }
    if (kind == FieldKind.integer &&
        (int.tryParse(text) == null || int.parse(text) < minimum)) {
      return 'Nhập số nguyên từ $minimum.';
    }
    if (kind == FieldKind.money || kind == FieldKind.signedMoney) {
      try {
        final money = Money.parse(text);
        if (kind == FieldKind.money && money.minor.isNegative) {
          return 'Số tiền không được âm.';
        }
      } on Object {
        return 'Nhập số tiền, tối đa 2 số thập phân (dấu chấm).';
      }
    }
    if (kind == FieldKind.time &&
        !RegExp(r'^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$').hasMatch(text)) {
      return 'Nhập giờ HH:mm.';
    }
    if (kind == FieldKind.instant) {
      try {
        futureInstant(text);
      } on Object {
        return 'Chọn ngày giờ trong tương lai, kèm múi giờ.';
      }
    }
    return null;
  }

  Object? parse(Object? input) {
    if (kind == FieldKind.boolean) return input == true;
    final text = kind == FieldKind.password
        ? '${input ?? ''}'
        : '${input ?? ''}'.trim();
    if (text.isEmpty) return null;
    if (kind == FieldKind.integer) return int.parse(text);
    if (kind == FieldKind.money || kind == FieldKind.signedMoney) {
      return Money.parse(text).decimal;
    }
    return text;
  }
}

class NativeField extends StatelessWidget {
  const NativeField(
    this.spec, {
    super.key,
    required this.value,
    required this.onChanged,
    this.prefix = 'field',
  });
  final FormFieldSpec spec;
  final Object? value;
  final ValueChanged<Object?> onChanged;
  final String prefix;
  @override
  Widget build(BuildContext context) {
    final key = ValueKey('$prefix-${spec.name}');
    if (spec.kind == FieldKind.instant) {
      return NativeInstantField(
        fieldKey: key,
        label: spec.label,
        value: value,
        onChanged: onChanged,
        validator: spec.validate,
      );
    }
    if (spec.kind == FieldKind.boolean) {
      return SwitchListTile(
        key: key,
        title: Text(spec.label),
        value: value == true,
        onChanged: onChanged,
      );
    }
    if (spec.kind == FieldKind.choice) {
      return DropdownButtonFormField<String>(
        key: key,
        initialValue: spec.choices.contains(value) ? value as String : null,
        isExpanded: true,
        decoration: InputDecoration(
          labelText: spec.label,
          helperText: spec.help,
        ),
        items: [
          for (final s in spec.choices)
            DropdownMenuItem(value: s, child: Text(spec.choiceLabels[s] ?? s)),
        ],
        onChanged: onChanged,
        validator: spec.validate,
      );
    }
    return TextFormField(
      key: key,
      initialValue: value?.toString() ?? '',
      obscureText: spec.kind == FieldKind.password,
      enableSuggestions: spec.kind != FieldKind.password,
      autocorrect: spec.kind != FieldKind.password,
      keyboardType:
          spec.kind == FieldKind.integer ||
              spec.kind == FieldKind.money ||
              spec.kind == FieldKind.signedMoney
          ? const TextInputType.numberWithOptions(decimal: true, signed: true)
          : spec.kind == FieldKind.email
          ? TextInputType.emailAddress
          : TextInputType.text,
      maxLength: spec.maximum,
      decoration: InputDecoration(
        labelText: spec.label,
        helperText: spec.help,
        counterText: '',
      ),
      validator: spec.validate,
      onChanged: onChanged,
    );
  }
}

Future<T?> openLiveForm<T>(
  BuildContext context, {
  required String title,
  required List<FormFieldSpec> fields,
  Json initial = const {},
  required Future<T> Function(Json) save,
  String action = 'Lưu thay đổi',
  Widget? extra,
  Json Function(Json)? transform,
}) => Navigator.of(context).push<T>(
  MaterialPageRoute(
    builder: (_) => LiveFormPage<T>(
      title: title,
      fields: fields,
      initial: initial,
      save: save,
      action: action,
      extra: extra,
      transform: transform,
    ),
  ),
);

class LiveFormPage<T> extends StatefulWidget {
  const LiveFormPage({
    super.key,
    required this.title,
    required this.fields,
    required this.initial,
    required this.save,
    required this.action,
    this.extra,
    this.transform,
    this.privateContext = true,
    this.recoveryBuilder,
    this.onSuccess,
  });
  final String title, action;
  final List<FormFieldSpec> fields;
  final Json initial;
  final Future<T> Function(Json) save;
  final Widget? extra;
  final Json Function(Json)? transform;
  final bool privateContext;
  final Widget Function(BuildContext, Json, ApiFailure)? recoveryBuilder;
  final void Function(BuildContext, T)? onSuccess;
  @override
  State<LiveFormPage<T>> createState() => _LiveFormPageState<T>();
}

class _LiveFormPageState<T> extends State<LiveFormPage<T>> {
  final form = GlobalKey<FormState>();
  late final Json values = Map.from(widget.initial);
  bool busy = false, dirty = false;
  bool uncertain = false;
  int? epoch;
  String? error;
  ApiFailure? failure;
  @override
  void dispose() {
    for (final field in widget.fields.where(
      (f) => f.kind == FieldKind.password,
    )) {
      values.remove(field.name);
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final workspace = LiveScope.of(context);
    epoch ??= workspace.api.context;
    if (widget.privateContext && epoch != workspace.api.context) {
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
        if (discard == true && context.mounted) {
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
                for (final spec in widget.fields)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 20),
                    child: NativeField(
                      spec,
                      value: values[spec.name],
                      onChanged: (v) => setState(() {
                        values[spec.name] = v;
                        dirty = true;
                      }),
                    ),
                  ),
                if (widget.extra != null) widget.extra!,
                if (error != null)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 16),
                    child: Semantics(
                      liveRegion: true,
                      child: SCNotice(error!, warning: true),
                    ),
                  ),
                SCButton(
                  widget.action,
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
                            failure = null;
                          });
                          try {
                            final payload = <String, dynamic>{
                              for (final f in widget.fields)
                                if (f.parse(values[f.name]) != null)
                                  f.name: f.parse(values[f.name]),
                            };
                            final result = await widget.save(
                              widget.transform?.call(payload) ?? payload,
                            );
                            if (mounted) {
                              setState(() {
                                dirty = false;
                                busy = false;
                              });
                              await WidgetsBinding.instance.endOfFrame;
                              if (context.mounted) {
                                if (widget.onSuccess != null) {
                                  widget.onSuccess!(context, result);
                                } else {
                                  Navigator.pop(context, result);
                                }
                              }
                            }
                          } on Object catch (e) {
                            if (mounted) {
                              setState(() {
                                uncertain = e is ApiFailure && e.uncertain;
                                failure = e is ApiFailure ? e : null;
                                error =
                                    '${safeError(e)}${uncertain && widget.recoveryBuilder == null ? ' Quay lại danh sách và làm mới để đối chiếu trước khi mở yêu cầu khác.' : ''}';
                              });
                            }
                          } finally {
                            if (mounted) setState(() => busy = false);
                          }
                        },
                ),
                if (failure != null &&
                    (uncertain || failure!.status == 409) &&
                    widget.recoveryBuilder != null)
                  widget.recoveryBuilder!(
                    context,
                    Map.unmodifiable(values),
                    failure!,
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
