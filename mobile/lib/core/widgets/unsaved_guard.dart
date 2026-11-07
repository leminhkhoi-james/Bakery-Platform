import 'package:flutter/material.dart';

import 'sweetcake_widgets.dart';

class UnsavedGuard extends StatefulWidget {
  const UnsavedGuard({super.key, required this.dirty, required this.child});
  final bool dirty;
  final Widget child;
  @override
  State<UnsavedGuard> createState() => _UnsavedGuardState();
}

class _UnsavedGuardState extends State<UnsavedGuard> {
  bool allowExit = false, confirming = false;
  @override
  Widget build(BuildContext context) => PopScope<Object?>(
    canPop: !widget.dirty || allowExit,
    onPopInvokedWithResult: (didPop, result) async {
      if (didPop || confirming || !widget.dirty) return;
      confirming = true;
      final discard = await confirmDemo(
        context,
        title: 'Bỏ thay đổi chưa lưu?',
        message: 'Những nội dung này chưa được lưu vào bản demo.',
        action: 'Bỏ thay đổi',
      );
      confirming = false;
      if (discard && mounted) {
        setState(() => allowExit = true);
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (mounted) Navigator.pop(context, result);
        });
      }
    },
    child: widget.child,
  );
}
