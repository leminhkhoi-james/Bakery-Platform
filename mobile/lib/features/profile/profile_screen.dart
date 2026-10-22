import 'package:flutter/material.dart';

import '../../app/router/destination.dart';
import '../../core/widgets/common.dart';
import '../../core/widgets/form_sheet.dart';
import '../../core/utils/formatters.dart';
import '../../models/accounts.dart';
import '../../models/catalog.dart';
import '../../models/workflow.dart';
import '../../state/app_state.dart';
import '../tracking/order_dialogs.dart';
import 'security_panel.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});
  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  String tab = 'orders', filter = 'delivering';
  Future<void> editProfile() async {
    final state = AppScope.of(context), p = state.profile;
    final result = await editForm(context, 'Cập nhật thông tin cá nhân', [
      FieldSpec('name', 'Họ và tên', initial: p.name),
      FieldSpec(
        'phone',
        'Số điện thoại',
        initial: p.phone,
        keyboard: TextInputType.phone,
      ),
    ]);
    if (result == null || !mounted) return;
    state.saveProfile(
      CustomerProfile(
        name: result['name']!,
        phone: result['phone']!,
        email: p.email,
        tier: p.tier,
        points: p.points,
        taste: p.taste,
      ),
    );
    feedback(context, 'Đã cập nhật hồ sơ mô phỏng.');
  }

  Future<void> addAddress() async {
    final state = AppScope.of(context);
    final result = await editForm(context, 'Thêm địa chỉ nhận bánh', [
      const FieldSpec('title', 'Tên gợi nhớ'),
      FieldSpec(
        'phone',
        'Số điện thoại người nhận',
        initial: state.profile.phone,
        keyboard: TextInputType.phone,
        required: false,
      ),
      const FieldSpec('address', 'Địa chỉ chi tiết', lines: 3),
    ], submit: 'Thêm địa chỉ');
    if (result == null) return;
    state.addAddress(
      result['title']!,
      result['phone']!.isEmpty ? state.profile.phone : result['phone']!,
      result['address']!,
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = AppScope.of(context), p = state.profile;
    final current = state.activeOrder;
    final past = state.fixtures
        .rows('DEFAULT_PAST_ORDERS')
        .map((j) => CakeOrder.fromJson(j, OrderPhase.completed));
    final orders = filter == 'completed'
        ? [
            ...state.repository.orders.where(
              (o) =>
                  o.phase == OrderPhase.completed ||
                  o.phase == OrderPhase.cancelled,
            ),
            ...past,
          ]
        : filter == 'bespoke'
        ? state.repository.orders.where((o) => o.rfqId.isNotEmpty).toList()
        : (current != null &&
                  ![
                    OrderPhase.completed,
                    OrderPhase.cancelled,
                  ].contains(current.phase)
              ? [current]
              : <CakeOrder>[]);
    return PageBody(
      title: 'Chào ${p.name.split(' ').last}!',
      eyebrow: 'Tài khoản của bạn',
      children: [
        Panel(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(p.name, style: Theme.of(context).textTheme.titleLarge),
              Text(p.phone),
              Text(p.email),
              const SizedBox(height: 8),
              StatusPill(p.tier),
              if (p.points > 0) Text('${p.points} điểm chào mừng mô phỏng'),
              const SizedBox(height: 8),
              ActionButtons(
                children: [
                  OutlinedButton(
                    onPressed: editProfile,
                    child: const Text('Chỉnh sửa hồ sơ'),
                  ),
                  TextButton(
                    onPressed: () async {
                      if (!await confirm(
                        context,
                        'Đăng xuất?',
                        'Kết thúc đăng nhập demo.',
                      )) {
                        return;
                      }
                      state.signedIn = false;
                      state.changed();
                      if (context.mounted) go(context, Destination.auth);
                    },
                    child: const Text('Đăng xuất'),
                  ),
                ],
              ),
            ],
          ),
        ),
        FilterChips(
          values: const {
            'orders': 'Đơn bánh',
            'addresses': 'Sổ địa chỉ',
            'security': 'Cài đặt & mật khẩu',
          },
          selected: tab,
          onSelected: (v) => setState(() => tab = v),
        ),
        if (tab == 'orders') ...[
          FilterChips(
            values: const {
              'delivering': 'Đang chuẩn bị & giao',
              'completed': 'Đã hoàn tất',
              'bespoke': 'Bespoke Atelier',
            },
            selected: filter,
            onSelected: (v) => setState(() => filter = v),
          ),
          if (orders.isEmpty)
            const EmptyView(message: 'Chưa có đơn trong nhóm này.'),
          for (final o in orders)
            Panel(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  CakePicture(o.image, height: 170, label: o.title),
                  const SizedBox(height: 12),
                  Text(o.title, style: Theme.of(context).textTheme.titleMedium),
                  Text(o.id),
                  StatusPill(o.phase.label),
                  InfoRow('Giá trị', vnd(o.price)),
                  if (o.phase == OrderPhase.completed ||
                      o.phase == OrderPhase.cancelled)
                    FilledButton(
                      onPressed: () {
                        state.cart.add(
                          CartLine(
                            id: state.repository.nextId('reorder'),
                            title: o.title,
                            price: o.price,
                            size: o.size,
                            image: o.image,
                            bakery: o.bakery,
                          ),
                        );
                        go(context, Destination.cart);
                      },
                      child: const Text('Đặt lại đơn này'),
                    )
                  else
                    OutlinedButton(
                      onPressed: () {
                        state.activeOrderId = o.id;
                        state.changed();
                        go(context, Destination.tracking);
                      },
                      child: const Text('Theo dõi đơn & nhắn bếp trưởng'),
                    ),
                  TextButton(
                    onPressed: () => showReceipt(context, o),
                    child: const Text('Biên lai mẫu'),
                  ),
                  if (o.phase == OrderPhase.delivering)
                    FilledButton(
                      onPressed: () => showReview(context, o),
                      child: const Text('Đã nhận bánh'),
                    ),
                ],
              ),
            ),
        ],
        if (tab == 'addresses') ...[
          SectionTitle(
            'Sổ địa chỉ nhận tiệc',
            action: TextButton(
              onPressed: addAddress,
              child: const Text('+ Thêm mới'),
            ),
          ),
          for (final a in state.addresses)
            Panel(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(a.title, style: Theme.of(context).textTheme.titleMedium),
                  Text(a.address),
                  Text(a.phone),
                  if (a.isDefault)
                    const StatusPill('Mặc định')
                  else
                    TextButton(
                      onPressed: () => state.defaultAddress(a.id),
                      child: const Text('Đặt làm mặc định'),
                    ),
                ],
              ),
            ),
        ],
        if (tab == 'security') const Panel(child: SecurityPanel()),
      ],
    );
  }
}
