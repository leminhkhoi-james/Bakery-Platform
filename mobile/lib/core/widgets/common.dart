import 'package:flutter/material.dart';

import '../../state/app_state.dart';
import '../theme/app_theme.dart';

void feedback(BuildContext context, String message) {
  ScaffoldMessenger.of(context)
    ..hideCurrentSnackBar()
    ..showSnackBar(
      SnackBar(content: Text(message), duration: const Duration(seconds: 3)),
    );
}

Future<bool> confirm(
  BuildContext context,
  String title,
  String message,
) async =>
    await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(title),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Quay lại'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Xác nhận'),
          ),
        ],
      ),
    ) ??
    false;

class PageBody extends StatelessWidget {
  const PageBody({
    super.key,
    required this.title,
    required this.children,
    this.eyebrow = '',
    this.subtitle = '',
  });
  final String title, eyebrow, subtitle;
  final List<Widget> children;
  @override
  Widget build(BuildContext context) => SingleChildScrollView(
    key: const PageStorageKey('page-scroll'),
    child: Center(
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 800),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (eyebrow.isNotEmpty)
                Text(
                  eyebrow.toUpperCase(),
                  style: const TextStyle(
                    color: Brand.caramel,
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 2,
                  ),
                ),
              const SizedBox(height: 8),
              Text(title, style: Theme.of(context).textTheme.headlineLarge),
              if (subtitle.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: Text(
                    subtitle,
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ),
              const SizedBox(height: 24),
              ...children.expand((w) => [w, const SizedBox(height: 16)]),
            ],
          ),
        ),
      ),
    ),
  );
}

class Panel extends StatelessWidget {
  const Panel({super.key, required this.child, this.color, this.padding = 18});
  final Widget child;
  final Color? color;
  final double padding;
  @override
  Widget build(BuildContext context) => Card(
    color: color,
    child: Padding(padding: EdgeInsets.all(padding), child: child),
  );
}

class SectionTitle extends StatelessWidget {
  const SectionTitle(this.text, {super.key, this.action});
  final String text;
  final Widget? action;
  @override
  Widget build(BuildContext context) => Wrap(
    alignment: WrapAlignment.spaceBetween,
    crossAxisAlignment: WrapCrossAlignment.center,
    spacing: 12,
    children: [
      Text(text, style: Theme.of(context).textTheme.titleLarge),
      ?action,
    ],
  );
}

class StatusPill extends StatelessWidget {
  const StatusPill(this.text, {super.key, this.color = Brand.wine});
  final String text;
  final Color color;
  @override
  Widget build(BuildContext context) => Align(
    alignment: Alignment.centerLeft,
    child: Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color.withValues(alpha: .08),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        text,
        style: TextStyle(
          color: color,
          fontSize: 12,
          fontWeight: FontWeight.w700,
        ),
      ),
    ),
  );
}

class CakePicture extends StatelessWidget {
  const CakePicture(
    this.source, {
    super.key,
    this.height = 180,
    this.label = 'Bánh nghệ thuật',
    this.fit = BoxFit.cover,
  });
  final String source, label;
  final double height;
  final BoxFit fit;
  @override
  Widget build(BuildContext context) {
    final state = AppScope.of(context);
    final path = source.startsWith('assets/')
        ? source
        : state.fixtures.images[source];
    Widget fallback() => Container(
      height: height,
      color: Brand.cream,
      child: const Center(
        child: Icon(Icons.cake_outlined, size: 48, color: Brand.caramel),
      ),
    );
    return ClipRRect(
      borderRadius: BorderRadius.circular(14),
      child: Semantics(
        label: label,
        image: true,
        child: path == null
            ? fallback()
            : Image.asset(
                path,
                height: height,
                width: double.infinity,
                fit: fit,
                excludeFromSemantics: true,
                errorBuilder: (_, _, _) => fallback(),
              ),
      ),
    );
  }
}

class EmptyView extends StatelessWidget {
  const EmptyView({
    super.key,
    this.message = 'Không có kết quả phù hợp.',
    this.action,
  });
  final String message;
  final Widget? action;
  @override
  Widget build(BuildContext context) => Panel(
    child: Column(
      children: [
        const Icon(Icons.cake_outlined, color: Brand.caramel, size: 40),
        const SizedBox(height: 12),
        Text(message, textAlign: TextAlign.center),
        if (action != null)
          Padding(padding: const EdgeInsets.only(top: 12), child: action),
      ],
    ),
  );
}

class SearchField extends StatelessWidget {
  const SearchField({
    super.key,
    required this.onChanged,
    this.hint = 'Tìm kiếm...',
    this.initial = '',
  });
  final ValueChanged<String> onChanged;
  final String hint, initial;
  @override
  Widget build(BuildContext context) => TextFormField(
    initialValue: initial,
    decoration: InputDecoration(
      hintText: hint,
      prefixIcon: const Icon(Icons.search),
    ),
    textInputAction: TextInputAction.search,
    onChanged: onChanged,
  );
}

class SelectField extends StatelessWidget {
  const SelectField({
    super.key,
    required this.label,
    required this.value,
    required this.options,
    required this.onChanged,
  });
  final String label, value;
  final Map<String, String> options;
  final ValueChanged<String> onChanged;
  @override
  Widget build(BuildContext context) => DropdownButtonFormField<String>(
    key: ValueKey('$label:$value'),
    initialValue: options.containsKey(value) ? value : null,
    isExpanded: true,
    decoration: InputDecoration(labelText: label),
    items: options.entries
        .map(
          (e) => DropdownMenuItem(
            value: e.key,
            child: Text(e.value, maxLines: 2, overflow: TextOverflow.ellipsis),
          ),
        )
        .toList(),
    onChanged: (v) {
      if (v != null) onChanged(v);
    },
  );
}

class FilterChips extends StatelessWidget {
  const FilterChips({
    super.key,
    required this.values,
    required this.selected,
    required this.onSelected,
  });
  final Map<String, String> values;
  final String selected;
  final ValueChanged<String> onSelected;
  @override
  Widget build(BuildContext context) => Wrap(
    spacing: 8,
    runSpacing: 4,
    children: [
      for (final e in values.entries)
        ChoiceChip(
          label: Text(e.value),
          selected: selected == e.key,
          onSelected: (_) => onSelected(e.key),
        ),
    ],
  );
}

class ActionButtons extends StatelessWidget {
  const ActionButtons({super.key, required this.children});
  final List<Widget> children;
  @override
  Widget build(BuildContext context) =>
      Wrap(spacing: 8, runSpacing: 8, children: children);
}

class InfoRow extends StatelessWidget {
  const InfoRow(this.label, this.value, {super.key});
  final String label, value;
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 5),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: Theme.of(context).textTheme.bodySmall),
        Text(
          value.isEmpty ? '—' : value,
          style: const TextStyle(fontWeight: FontWeight.w600),
        ),
      ],
    ),
  );
}
