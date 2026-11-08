import 'package:flutter/material.dart';

class NativeInstantField extends StatefulWidget {
  const NativeInstantField({
    super.key,
    required this.fieldKey,
    required this.label,
    required this.value,
    required this.onChanged,
    required this.validator,
  });
  final Key fieldKey;
  final String label;
  final Object? value;
  final ValueChanged<Object?> onChanged;
  final String? Function(Object?) validator;
  @override
  State<NativeInstantField> createState() => _NativeInstantFieldState();
}

class _NativeInstantFieldState extends State<NativeInstantField> {
  late final controller = TextEditingController(text: '${widget.value ?? ''}');
  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }

  Future<void> choose() async {
    final now = DateTime.now(),
        initial = DateTime.tryParse(controller.text)?.toLocal();
    final day = await showDatePicker(
      context: context,
      initialDate: initial != null && initial.isAfter(now)
          ? initial
          : now.add(const Duration(days: 1)),
      firstDate: DateTime(now.year, now.month, now.day),
      lastDate: DateTime(2100, 12, 31),
    );
    if (day == null || !mounted) return;
    final hour = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.fromDateTime(initial ?? now),
    );
    if (hour == null || !mounted) return;
    final value = DateTime(
      day.year,
      day.month,
      day.day,
      hour.hour,
      hour.minute,
    ).toUtc().toIso8601String();
    controller.text = value;
    widget.onChanged(value);
  }

  @override
  Widget build(BuildContext context) => TextFormField(
    key: widget.fieldKey,
    controller: controller,
    validator: widget.validator,
    onChanged: widget.onChanged,
    decoration: InputDecoration(
      labelText: widget.label,
      helperMaxLines: 3,
      helperText: 'Chọn lịch theo giờ thiết bị; gửi UTC. Có thể nhập ISO 8601 kèm múi giờ.',
      suffixIcon: IconButton(
        tooltip: 'Chọn ngày và giờ',
        onPressed: choose,
        icon: const Icon(Icons.calendar_month_outlined),
      ),
    ),
  );
}
