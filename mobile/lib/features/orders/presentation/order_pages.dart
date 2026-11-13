import 'package:flutter/material.dart';

import '../../../app/navigation/navigation.dart';
import '../../../app/router/screen_id.dart';
import '../../../app/theme/app_colors.dart';
import '../../../core/demo/demo_workspace.dart';
import '../../../core/widgets/sweetcake_scaffold.dart';
import '../../../core/widgets/sweetcake_widgets.dart';
import '../../auth/domain/demo_session.dart';
import '../domain/order_repository.dart';

class OrderListPage extends StatefulWidget {
  const OrderListPage({super.key, required this.screen, this.id});
  final ScreenId screen;
  final String? id;
  @override
  State<OrderListPage> createState() => _OrderListPageState();
}

class _OrderListPageState extends State<OrderListPage> {
  String query = '';
  OrderStatus? filter;
  @override
  Widget build(BuildContext context) {
    if (widget.id != null) {
      return OrderDetailPage(screen: widget.screen, id: widget.id!);
    }
    final w = DemoScope.of(context);
    final orders = w.orders.orders
        .where(
          (o) =>
              (widget.screen != ScreenId.vendorOrders ||
                  o.bakeryId == w.session.selectedBakeryId) &&
              (filter == null || o.status == filter) &&
              '${o.id} ${o.productName}'.toLowerCase().contains(
                query.toLowerCase(),
              ),
        )
        .toList();
    return SweetCakeScaffold(
      screen: widget.screen,
      children: [
        if (widget.screen == ScreenId.vendorOrders) const BakerySelector(),
        Text(
          widget.screen == ScreenId.tracking
              ? 'Theo từng bước,\nđến ngày thật vui.'
              : 'Mỗi đơn bánh đều\nđược chăm chút.',
          style: Theme.of(context).textTheme.headlineSmall,
        ),
        SCSearch(
          hint: 'Tìm mã đơn hoặc tên bánh…',
          onChanged: (v) => setState(() => query = v),
        ),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: [
              Padding(
                padding: const EdgeInsets.only(right: 8),
                child: ChoiceChip(
                  label: const Text('Tất cả'),
                  selected: filter == null,
                  onSelected: (_) => setState(() => filter = null),
                ),
              ),
              for (final status in OrderStatus.values)
                Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChoiceChip(
                    label: Text(status.label),
                    selected: filter == status,
                    onSelected: (_) => setState(() => filter = status),
                  ),
                ),
            ],
          ),
        ),
        if (orders.isEmpty)
          const SCStateView(
            title: 'Chưa có đơn phù hợp',
            message: 'Đổi bộ lọc để xem các đơn minh họa khác.',
          )
        else
          for (final order in orders)
            SCCard(
              onTap: () => openScreen(context, widget.screen, id: order.id),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Wrap(
                    alignment: WrapAlignment.spaceBetween,
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      Text(
                        order.id,
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      SCStatusBadge(order.status.code),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      SCImage(
                        order.image,
                        label: order.productName,
                        width: 72,
                        height: 72,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              order.productName,
                              style: Theme.of(context).textTheme.titleMedium,
                            ),
                            Text(
                              order.date,
                              style: Theme.of(context).textTheme.bodySmall,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  SCPrice(order.total),
                  const SizedBox(height: 8),
                  const Text('Xem chi tiết và tiến trình →'),
                ],
              ),
            ),
      ],
    );
  }
}

class OrderDetailPage extends StatefulWidget {
  const OrderDetailPage({super.key, required this.screen, required this.id});
  final ScreenId screen;
  final String id;
  @override
  State<OrderDetailPage> createState() => _OrderDetailPageState();
}

class _OrderDetailPageState extends State<OrderDetailPage> {
  final reviewController = TextEditingController();
  int rating = 0;
  @override
  void dispose() {
    reviewController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final w = DemoScope.of(context), order = w.orders.get(widget.id);
    final customer = w.session.persona == Persona.customer;
    final canAdvance =
        !customer && order.status.index < OrderStatus.delivering.index;
    return SweetCakeScaffold(
      screen: widget.screen,
      children: [
        Wrap(
          spacing: 12,
          runSpacing: 12,
          crossAxisAlignment: WrapCrossAlignment.center,
          children: [
            Text(order.id, style: Theme.of(context).textTheme.headlineSmall),
            SCStatusBadge(order.status.code),
          ],
        ),
        SCCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SCImage(
                order.image,
                label: order.productName,
                height: 200,
                width: double.infinity,
              ),
              const SizedBox(height: 16),
              Text(
                order.productName,
                style: Theme.of(context).textTheme.titleLarge,
              ),
              SCKeyValue('Tiệm', w.catalog.bakery(order.bakeryId).name),
              SCKeyValue('Cấu hình', '${order.size} · ${order.flavor}'),
              SCKeyValue('Ngày nhận demo', order.date),
              SCKeyValue('Địa chỉ minh họa', w.session.address),
              const Divider(),
              SCKeyValue(
                'Tổng snapshot demo',
                vnd(order.total),
                emphasized: true,
              ),
            ],
          ),
        ),
        const SCSection('Hành trình chiếc bánh'),
        SCCard(
          child: Column(
            children: [
              for (final status in OrderStatus.values.take(6))
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 10),
                  child: Row(
                    children: [
                      Icon(
                        order.history.contains(status)
                            ? Icons.check_circle
                            : Icons.radio_button_unchecked,
                        color: order.history.contains(status)
                            ? AppColors.green
                            : AppColors.muted,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          status.label,
                          style: order.status == status
                              ? Theme.of(context).textTheme.titleMedium
                              : Theme.of(context).textTheme.bodyMedium,
                        ),
                      ),
                    ],
                  ),
                ),
            ],
          ),
        ),
        if (canAdvance)
          SCButton(
            'Mô phỏng: ${OrderStatus.values[order.status.index + 1].label}',
            onPressed: () async {
              final next = OrderStatus.values[order.status.index + 1];
              if (await confirmDemo(
                    context,
                    title: 'Chuyển trạng thái demo?',
                    message:
                        'Đơn ${order.id} sẽ chuyển sang ${next.label} trên thiết bị. Không cập nhật Backend.',
                  ) &&
                  context.mounted) {
                demoAction(
                  context,
                  () => w.orders.transition(order, next, customer: false),
                );
              }
            },
          ),
        if (customer && order.status == OrderStatus.delivering)
          SCButton(
            'Xác nhận đã nhận · demo',
            onPressed: () => demoAction(
              context,
              () => w.orders.transition(
                order,
                OrderStatus.completed,
                customer: true,
              ),
            ),
          ),
        if (customer && order.status == OrderStatus.pending)
          SCButton(
            'Hủy đơn minh họa',
            outlined: true,
            onPressed: () async {
              if (await confirmDemo(
                    context,
                    title: 'Hủy đơn trong demo?',
                    message: 'Chỉ thay đổi trạng thái local của đơn đang chờ.',
                  ) &&
                  context.mounted) {
                demoAction(
                  context,
                  () => w.orders.transition(
                    order,
                    OrderStatus.cancelled,
                    customer: true,
                  ),
                );
              }
            },
          ),
        if (order.review != null)
          SCCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Đánh giá của khách',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                Text('${order.rating}/5 · ${order.review}'),
                const SizedBox(height: 12),
                SCStatusBadge(order.reviewStatus),
                if (w.session.persona == Persona.admin)
                  TextButton(
                    onPressed: () => demoAction(
                      context,
                      () => w.orders.moderate(
                        order,
                        order.reviewStatus == 'HIDDEN' ? 'PUBLISHED' : 'HIDDEN',
                      ),
                    ),
                    child: Text(
                      order.reviewStatus == 'HIDDEN'
                          ? 'Công khai đánh giá · demo'
                          : 'Ẩn đánh giá · demo',
                    ),
                  ),
              ],
            ),
          ),
        if (customer && order.status == OrderStatus.completed)
          SCCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  order.review == null
                      ? 'Chiếc bánh có làm bạn vui?'
                      : 'Cập nhật đánh giá local',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                Wrap(
                  children: [
                    for (var i = 1; i <= 5; i++)
                      IconButton(
                        tooltip: '$i sao',
                        onPressed: () => setState(() => rating = i),
                        icon: Icon(
                          i <= rating ? Icons.star : Icons.star_outline,
                          color: AppColors.wine,
                        ),
                      ),
                  ],
                ),
                SCField(
                  'Cảm nhận của bạn',
                  controller: reviewController,
                  lines: 3,
                ),
                SCButton(
                  'Lưu đánh giá demo',
                  onPressed: () => demoAction(
                    context,
                    () => w.orders.review(order, rating, reviewController.text),
                  ),
                ),
              ],
            ),
          ),
        const SCNotice(
          'Đơn và timeline là fixture local. Không chứng minh API tạo đơn, thanh toán hay giao nhận thật đã hoạt động.',
        ),
      ],
    );
  }
}
