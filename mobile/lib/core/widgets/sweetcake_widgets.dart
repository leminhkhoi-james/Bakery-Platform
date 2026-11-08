import 'package:flutter/material.dart';

import '../../app/theme/app_colors.dart';
import '../../app/theme/app_theme.dart';

String vnd(num amount) {
  final digits = amount.round().toString();
  final value = digits.replaceAllMapped(
    RegExp(r'(\d)(?=(\d{3})+(?!\d))'),
    (m) => '${m[1]}.',
  );
  return '$value đ';
}

void demoFeedback(
  BuildContext context, [
  String text = 'Đã lưu trong bản demo',
]) {
  ScaffoldMessenger.of(context)
    ..hideCurrentSnackBar()
    ..showSnackBar(
      SnackBar(content: Text(text), duration: const Duration(seconds: 3)),
    );
}

bool demoAction(BuildContext context, VoidCallback action, {String? message}) {
  try {
    action();
    demoFeedback(context, message ?? 'Đã lưu trong bản demo');
    return true;
  } on StateError catch (error) {
    demoFeedback(context, error.message.toString());
    return false;
  }
}

class SCButton extends StatelessWidget {
  const SCButton(
    this.label, {
    super.key,
    required this.onPressed,
    this.icon,
    this.outlined = false,
    this.busy = false,
  });
  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;
  final bool outlined, busy;
  @override
  Widget build(BuildContext context) {
    final child = Row(
      mainAxisSize: MainAxisSize.min,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        if (busy) ...[
          SizedBox(
            width: 18,
            height: 18,
            child: CircularProgressIndicator(
              strokeWidth: 2,
              color: outlined ? AppColors.wine : AppColors.white,
            ),
          ),
          const SizedBox(width: 8),
        ] else if (icon != null) ...[
          Icon(icon, size: 20),
          const SizedBox(width: 8),
        ],
        Flexible(child: Text(label, textAlign: TextAlign.center)),
      ],
    );
    return Semantics(
      button: true,
      enabled: onPressed != null && !busy,
      child: outlined
          ? OutlinedButton(onPressed: busy ? null : onPressed, child: child)
          : FilledButton(onPressed: busy ? null : onPressed, child: child),
    );
  }
}

class SCCard extends StatelessWidget {
  const SCCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(20),
    this.color = AppColors.white,
    this.onTap,
  });
  final Widget child;
  final EdgeInsetsGeometry padding;
  final Color color;
  final VoidCallback? onTap;
  @override
  Widget build(BuildContext context) => Container(
    decoration: BoxDecoration(
      color: color,
      borderRadius: BorderRadius.circular(20),
      border: Border.all(color: AppColors.border),
      boxShadow: const [
        BoxShadow(
          color: Color(0x0D0F172A),
          blurRadius: 20,
          spreadRadius: -2,
          offset: Offset(0, 4),
        ),
      ],
    ),
    child: Material(
      color: Colors.transparent,
      borderRadius: BorderRadius.circular(20),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Padding(padding: padding, child: child),
      ),
    ),
  );
}

class SCSection extends StatelessWidget {
  const SCSection(
    this.title, {
    super.key,
    this.description,
    this.action,
    this.onAction,
  });
  final String title;
  final String? description, action;
  final VoidCallback? onAction;
  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Wrap(
        alignment: WrapAlignment.spaceBetween,
        crossAxisAlignment: WrapCrossAlignment.center,
        spacing: 12,
        children: [
          Text(title, style: Theme.of(context).textTheme.titleLarge),
          if (action != null)
            TextButton(onPressed: onAction, child: Text(action!)),
        ],
      ),
      if (description != null)
        Padding(
          padding: const EdgeInsets.only(top: 4),
          child: Text(
            description!,
            style: Theme.of(context).textTheme.bodySmall,
          ),
        ),
    ],
  );
}

class SCNotice extends StatelessWidget {
  const SCNotice(
    this.text, {
    super.key,
    this.icon = Icons.info_outline,
    this.warning = false,
  });
  final String text;
  final IconData icon;
  final bool warning;
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(16),
    decoration: BoxDecoration(
      color: warning ? AppColors.amberBackground : AppColors.lightPink,
      borderRadius: BorderRadius.circular(12),
    ),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 20, color: warning ? AppColors.amber : AppColors.wine),
        const SizedBox(width: 12),
        Expanded(
          child: Text(
            text,
            style: AppTypography.style(
              12,
              color: warning ? AppColors.amber : AppColors.wineDark,
            ),
          ),
        ),
      ],
    ),
  );
}

const statusLabels = {
  'ACTIVE': 'Đang hoạt động',
  'PUBLISHED': 'Đang hiển thị',
  'APPROVED': 'Đã duyệt',
  'COMPLETED': 'Hoàn tất',
  'DRAFT': 'Bản nháp',
  'PENDING': 'Đang chờ',
  'OPEN': 'Đang nhận báo giá',
  'PENDING_APPROVAL': 'Chờ duyệt hồ sơ',
  'PAYMENT_REVIEW': 'Chờ duyệt thanh toán',
  'SUBMITTED': 'Đã gửi',
  'CONFIRMED': 'Đã xác nhận',
  'BAKING': 'Đang làm bánh',
  'READY': 'Sẵn sàng giao',
  'DELIVERING': 'Đang giao',
  'SCHEDULED': 'Kỳ tiếp theo',
  'PAID': 'Đã duyệt gói',
  'REJECTED': 'Đã từ chối',
  'CANCELLED': 'Đã hủy',
  'CLOSED': 'Đã đóng',
  'SUSPENDED': 'Tạm ngưng',
  'EXPIRED': 'Hết hạn',
  'HIDDEN': 'Đã ẩn',
  'WITHDRAWN': 'Đã rút',
  'INACTIVE': 'Ngừng cung cấp',
  'ARCHIVED': 'Lưu trữ',
  'DELETED': 'Đã xóa',
  'CUSTOMER': 'Khách hàng',
  'BAKERY_OWNER': 'Chủ tiệm',
  'ADMIN': 'Quản trị',
};

class SCStatusBadge extends StatelessWidget {
  const SCStatusBadge(this.status, {super.key, this.label});
  final String status;
  final String? label;
  @override
  Widget build(BuildContext context) {
    final (fg, bg) = switch (status) {
      'ACTIVE' ||
      'PUBLISHED' ||
      'APPROVED' ||
      'COMPLETED' ||
      'PAID' => (AppColors.green, AppColors.greenBackground),
      'PENDING' ||
      'OPEN' ||
      'PENDING_APPROVAL' ||
      'SUBMITTED' ||
      'PAYMENT_REVIEW' ||
      'BAKING' => (AppColors.amber, AppColors.amberBackground),
      'CONFIRMED' ||
      'READY' ||
      'DELIVERING' ||
      'SCHEDULED' => (AppColors.blue, AppColors.blueBackground),
      'REJECTED' ||
      'CANCELLED' ||
      'SUSPENDED' ||
      'CLOSED' ||
      'EXPIRED' => (AppColors.red, AppColors.redBackground),
      _ => (AppColors.muted, AppColors.surfaceLow),
    };
    return Semantics(
      label: 'Trạng thái: ${label ?? statusLabels[status] ?? status}',
      child: ExcludeSemantics(
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
          decoration: BoxDecoration(
            color: bg,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Text(
            label ?? statusLabels[status] ?? status,
            style: AppTypography.style(12, weight: 600, color: fg),
          ),
        ),
      ),
    );
  }
}

class SCPrice extends StatelessWidget {
  const SCPrice(this.amount, {super.key, this.large = false});
  final num amount;
  final bool large;
  @override
  Widget build(BuildContext context) => Text(
    vnd(amount),
    style: AppTypography.style(
      large ? 28 : 20,
      weight: 700,
      color: AppColors.wine,
    ),
  );
}

/// Cắt khung hiển thị native, giữ nguyên bitmap mascot gốc của Web.
class SCMascot extends StatelessWidget {
  const SCMascot({super.key});
  @override
  Widget build(BuildContext context) => Semantics(
    label: 'Mèo SweetCake',
    image: true,
    child: SizedBox(
      width: 140,
      height: 140,
      child: ClipOval(
        child: OverflowBox(
          alignment: Alignment.topLeft,
          maxWidth: 190,
          maxHeight: 238,
          child: Transform.translate(
            offset: const Offset(-20, -30),
            child: Image.asset(
              'assets/images/cat_mascot.png',
              width: 190,
              height: 238,
              fit: BoxFit.fill,
              excludeFromSemantics: true,
            ),
          ),
        ),
      ),
    ),
  );
}

class SCImage extends StatelessWidget {
  const SCImage(
    this.asset, {
    super.key,
    this.label = 'Ảnh minh họa bánh local',
    this.width,
    this.height,
    this.fit = BoxFit.cover,
    this.radius = 12,
  });
  final String asset, label;
  final double? width, height;
  final BoxFit fit;
  final double radius;
  @override
  Widget build(BuildContext context) => ClipRRect(
    borderRadius: BorderRadius.circular(radius),
    child: Image.asset(
      asset,
      width: width,
      height: height,
      fit: fit,
      semanticLabel: label,
      errorBuilder: (context, error, stack) => Container(
        width: width,
        height: height ?? 120,
        color: AppColors.softPink,
        child: Semantics(
          label: 'Ảnh minh họa chưa sẵn sàng',
          child: const Icon(
            Icons.cake_outlined,
            color: AppColors.wine,
            size: 40,
          ),
        ),
      ),
    ),
  );
}

class SCSearch extends StatefulWidget {
  const SCSearch({
    super.key,
    required this.onChanged,
    this.hint = 'Tìm tên bánh, hương vị…',
  });
  final ValueChanged<String> onChanged;
  final String hint;
  @override
  State<SCSearch> createState() => _SCSearchState();
}

class _SCSearchState extends State<SCSearch> {
  final _controller = TextEditingController();
  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => TextField(
    controller: _controller,
    textInputAction: TextInputAction.search,
    onChanged: (text) {
      setState(() {});
      widget.onChanged(text);
    },
    decoration: InputDecoration(
      hintText: widget.hint,
      prefixIcon: const Icon(Icons.search),
      suffixIcon: _controller.text.isEmpty
          ? null
          : IconButton(
              tooltip: 'Xóa tìm kiếm',
              onPressed: () {
                _controller.clear();
                setState(() {});
                widget.onChanged('');
              },
              icon: const Icon(Icons.close),
            ),
    ),
  );
}

class SCStateView extends StatelessWidget {
  const SCStateView({
    super.key,
    required this.title,
    required this.message,
    this.icon = Icons.inbox_outlined,
    this.action = 'Thử lại',
    this.onAction,
    this.loading = false,
  });
  final String title, message, action;
  final IconData icon;
  final VoidCallback? onAction;
  final bool loading;
  @override
  Widget build(BuildContext context) => SingleChildScrollView(
    child: Padding(
      padding: const EdgeInsets.all(24),
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 420),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (loading)
                const CircularProgressIndicator(
                  semanticsLabel: 'Đang tải dữ liệu demo',
                )
              else
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: const BoxDecoration(
                    color: AppColors.softPink,
                    shape: BoxShape.circle,
                  ),
                  child: Icon(icon, color: AppColors.wine, size: 36),
                ),
              const SizedBox(height: 20),
              Text(
                title,
                style: Theme.of(context).textTheme.titleLarge,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                message,
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              if (onAction != null) ...[
                const SizedBox(height: 20),
                SCButton(action, onPressed: onAction),
              ],
            ],
          ),
        ),
      ),
    ),
  );
}

class SCQuantity extends StatelessWidget {
  const SCQuantity(this.value, {super.key, required this.onChanged});
  final int value;
  final ValueChanged<int> onChanged;
  @override
  Widget build(BuildContext context) => Row(
    mainAxisSize: MainAxisSize.min,
    children: [
      IconButton(
        tooltip: 'Giảm số lượng',
        onPressed: value > 1 ? () => onChanged(value - 1) : null,
        icon: const Icon(Icons.remove_circle_outline),
      ),
      Semantics(
        label: 'Số lượng $value',
        child: SizedBox(
          width: 32,
          child: Text(
            '$value',
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.titleMedium,
          ),
        ),
      ),
      IconButton(
        tooltip: 'Tăng số lượng',
        onPressed: value < 99 ? () => onChanged(value + 1) : null,
        icon: const Icon(Icons.add_circle_outline),
      ),
    ],
  );
}

class SCKeyValue extends StatelessWidget {
  const SCKeyValue(
    this.label,
    this.value, {
    super.key,
    this.emphasized = false,
  });
  final String label, value;
  final bool emphasized;
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 6),
    child: SizedBox(
      width: double.infinity,
      child: LayoutBuilder(
        builder: (context, c) => c.maxWidth < 360
            ? Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(label, style: Theme.of(context).textTheme.bodySmall),
                  Text(
                    value,
                    style: emphasized
                        ? Theme.of(context).textTheme.titleLarge
                        : Theme.of(context).textTheme.titleSmall,
                  ),
                ],
              )
            : Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Text(
                      label,
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Flexible(
                    child: Text(
                      value,
                      textAlign: TextAlign.end,
                      style: emphasized
                          ? Theme.of(context).textTheme.titleLarge
                          : Theme.of(context).textTheme.titleSmall,
                    ),
                  ),
                ],
              ),
      ),
    ),
  );
}

Future<bool> confirmDemo(
  BuildContext context, {
  required String title,
  required String message,
  String action = 'Xác nhận trong demo',
}) async =>
    await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: Text(title),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext, false),
            child: const Text('Quay lại'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(dialogContext, true),
            child: Text(action),
          ),
        ],
      ),
    ) ??
    false;

Future<T?> showSCSheet<T>(
  BuildContext context, {
  required String title,
  required Widget child,
}) => showModalBottomSheet<T>(
  context: context,
  isScrollControlled: true,
  useSafeArea: true,
  constraints: const BoxConstraints(maxWidth: 640),
  builder: (context) => Padding(
    padding: EdgeInsets.fromLTRB(
      20,
      0,
      20,
      20 + MediaQuery.viewInsetsOf(context).bottom,
    ),
    child: SingleChildScrollView(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  title,
                  style: Theme.of(context).textTheme.titleLarge,
                ),
              ),
              IconButton(
                tooltip: 'Đóng',
                onPressed: () => Navigator.pop(context),
                icon: const Icon(Icons.close),
              ),
            ],
          ),
          const SizedBox(height: 12),
          child,
        ],
      ),
    ),
  ),
);

class SCField extends StatelessWidget {
  const SCField(
    this.label, {
    super.key,
    required this.controller,
    this.requiredField = true,
    this.lines = 1,
    this.keyboardType,
    this.validator,
    this.obscure = false,
    this.onChanged,
  });
  final String label;
  final TextEditingController controller;
  final bool requiredField, obscure;
  final int lines;
  final TextInputType? keyboardType;
  final FormFieldValidator<String>? validator;
  final ValueChanged<String>? onChanged;
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 16),
    child: TextFormField(
      controller: controller,
      maxLines: lines,
      obscureText: obscure,
      keyboardType: keyboardType,
      onChanged: onChanged,
      decoration: InputDecoration(
        labelText: label,
        alignLabelWithHint: lines > 1,
      ),
      validator:
          validator ??
          (value) => requiredField && (value?.trim().isEmpty ?? true)
              ? 'Vui lòng nhập ${label.toLowerCase()}.'
              : null,
    ),
  );
}
