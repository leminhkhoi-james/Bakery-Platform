import 'package:flutter/material.dart';

class MultiChoice extends StatelessWidget {
  const MultiChoice({
    super.key,
    required this.label,
    required this.options,
    required this.selected,
    required this.onChanged,
  });
  final String label;
  final Map<String, String> options;
  final Set<String> selected;
  final void Function(String, bool) onChanged;
  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Text(label, style: Theme.of(context).textTheme.titleMedium),
      const SizedBox(height: 8),
      Wrap(
        spacing: 6,
        runSpacing: 4,
        children: [
          for (final e in options.entries)
            FilterChip(
              label: Text(e.value),
              selected: selected.contains(e.key),
              onSelected: (v) => onChanged(e.key, v),
            ),
        ],
      ),
    ],
  );
}
