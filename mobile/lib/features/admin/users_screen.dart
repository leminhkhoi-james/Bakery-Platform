import 'package:flutter/material.dart';

import '../../core/widgets/common.dart';
import '../../core/widgets/form_sheet.dart';
import '../../core/utils/formatters.dart';
import '../../models/accounts.dart';
import '../../state/app_state.dart';

class UsersScreen extends StatefulWidget {
  const UsersScreen({super.key});
  @override
  State<UsersScreen> createState() => _UsersScreenState();
}

class _UsersScreenState extends State<UsersScreen> {
  String query = '',
      tier = 'all',
      status = 'all',
      spending = 'all',
      sort = 'recent';
  Future<void> add() async {
    final state = AppScope.of(context);
    final result = await editForm(context, 'Thêm người dùng', [
      const FieldSpec('name', 'Họ tên'),
      FieldSpec(
        'email',
        'Email',
        keyboard: TextInputType.emailAddress,
        validate: emailValue,
      ),
      const FieldSpec(
        'phone',
        'Số điện thoại',
        keyboard: TextInputType.phone,
        required: false,
      ),
      const FieldSpec(
        'location',
        'Khu vực',
        initial: 'Quận 1, TP.HCM',
        options: {
          'Quận 1, TP.HCM': 'Quận 1, TP.HCM',
          'Quận 3, TP.HCM': 'Quận 3, TP.HCM',
          'Quận 7, TP.HCM': 'Quận 7, TP.HCM',
          'Thủ Đức, TP.HCM': 'Thủ Đức, TP.HCM',
          'Tây Hồ, Hà Nội': 'Tây Hồ, Hà Nội',
          'Hoàn Kiếm, Hà Nội': 'Hoàn Kiếm, Hà Nội',
        },
      ),
    ], submit: 'Thêm người dùng mô phỏng');
    if (result == null || !mounted) return;
    state.repository.saveUser(
      UserAccount(
        id: state.repository.nextId('CUST'),
        name: result['name']!,
        email: result['email']!,
        phone: result['phone']!,
        location: result['location']!,
      ),
    );
    state.changed();
    feedback(context, 'Đã thêm người dùng vào danh sách mô phỏng.');
  }

  bool matches(UserAccount u) =>
      '${u.id} ${u.name} ${u.email} ${u.phone}'.toLowerCase().contains(
        query.toLowerCase(),
      ) &&
      (tier == 'all' || u.tier == tier) &&
      (status == 'all' || u.status == status) &&
      switch (spending) {
        'under1' => u.spending < 1000000,
        '1to5' => u.spending >= 1000000 && u.spending <= 5000000,
        '5to20' => u.spending >= 5000000 && u.spending <= 20000000,
        'over20' => u.spending > 20000000,
        _ => true,
      };
  Future<void> detail(UserAccount u) => showDialog<void>(
    context: context,
    builder: (context) => AlertDialog(
      title: Text(u.name),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            InfoRow(u.id, '${u.phone}\n${u.email}\n${u.location}'),
            InfoRow('Phân loại', u.tier),
            InfoRow('Tổng chi tiêu', vnd(u.spending)),
            InfoRow('Số đơn', '${u.orderCount}'),
            InfoRow('Độ uy tín', '${u.trust}/100'),
            InfoRow('Khẩu vị', u.taste),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Đóng'),
        ),
      ],
    ),
  );
  @override
  Widget build(BuildContext context) {
    final state = AppScope.of(context),
        users = state.repository.users.where(matches).toList();
    if (sort == 'gmv-high') {
      users.sort((a, b) => b.spending.compareTo(a.spending));
    }
    if (sort == 'trust-high') users.sort((a, b) => b.trust.compareTo(a.trust));
    if (sort == 'order-recent') {
      users.sort((a, b) => b.orderCount.compareTo(a.orderCount));
    }
    return PageBody(
      title: 'Quản trị người dùng',
      eyebrow: 'Master Admin',
      children: [
        FilledButton.icon(
          onPressed: add,
          icon: const Icon(Icons.person_add_outlined),
          label: const Text('Thêm người dùng'),
        ),
        SearchField(
          hint: 'Tên, email, số điện thoại, mã...',
          onChanged: (v) => setState(() => query = v),
        ),
        ExpansionTile(
          title: const Text('Bộ lọc & sắp xếp'),
          children: [
            SelectField(
              label: 'Phân loại',
              value: tier,
              options: const {
                'all': 'Tất cả',
                'diamond': 'Khách Doanh Nghiệp',
                'gold': 'Khách đặt tiệc',
                'silver': 'Khách Cá Nhân',
                'standard': 'Khách Hàng Mới',
              },
              onChanged: (v) => setState(() => tier = v),
            ),
            const SizedBox(height: 12),
            SelectField(
              label: 'Trạng thái',
              value: status,
              options: const {
                'all': 'Tất cả',
                'active': 'Hoạt động',
                'suspended': 'Tạm khóa',
              },
              onChanged: (v) => setState(() => status = v),
            ),
            const SizedBox(height: 12),
            SelectField(
              label: 'Chi tiêu',
              value: spending,
              options: const {
                'all': 'Tất cả',
                'under1': 'Dưới 1.000.000đ',
                '1to5': '1 – 5 triệu',
                '5to20': '5 – 20 triệu',
                'over20': 'Trên 20 triệu',
              },
              onChanged: (v) => setState(() => spending = v),
            ),
            const SizedBox(height: 12),
            SelectField(
              label: 'Sắp xếp',
              value: sort,
              options: const {
                'recent': 'Mới nhất',
                'gmv-high': 'Chi tiêu cao nhất',
                'order-recent': 'Đặt đơn gần nhất',
                'trust-high': 'Uy tín cao nhất',
              },
              onChanged: (v) => setState(() => sort = v),
            ),
            TextButton(
              onPressed: () => setState(() {
                tier = status = spending = 'all';
                sort = 'recent';
              }),
              child: const Text('Xóa bộ lọc'),
            ),
          ],
        ),
        Text('${users.length} người dùng'),
        if (users.isEmpty) const EmptyView(),
        for (final u in users)
          Panel(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(u.name, style: Theme.of(context).textTheme.titleLarge),
                Text('${u.id} · ${u.email}'),
                Text(u.phone),
                StatusPill(u.status == 'active' ? 'Hoạt động' : 'Tạm khóa'),
                InfoRow(
                  'Chi tiêu · Đơn hàng',
                  '${vnd(u.spending)} · ${u.orderCount} đơn',
                ),
                ActionButtons(
                  children: [
                    OutlinedButton(
                      onPressed: () => detail(u),
                      child: const Text('Hồ sơ'),
                    ),
                    TextButton(
                      onPressed: () async {
                        final yes = await confirm(
                          context,
                          u.status == 'active'
                              ? 'Tạm khóa tài khoản?'
                              : 'Mở khóa tài khoản?',
                          'Chỉ cập nhật trạng thái tài khoản mô phỏng.',
                        );
                        if (yes) {
                          state.repository.saveUser(u.toggle());
                          state.changed();
                        }
                      },
                      child: Text(
                        u.status == 'active' ? 'Tạm khóa' : 'Mở khóa',
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
      ],
    );
  }
}
