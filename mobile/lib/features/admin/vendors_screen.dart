import 'package:flutter/material.dart';

import '../../core/widgets/common.dart';
import '../../core/widgets/form_sheet.dart';
import '../../core/utils/formatters.dart';
import '../../models/accounts.dart';
import '../../state/app_state.dart';

class VendorsScreen extends StatefulWidget {
  const VendorsScreen({super.key});
  @override
  State<VendorsScreen> createState() => _VendorsScreenState();
}

class _VendorsScreenState extends State<VendorsScreen> {
  String query = '', status = 'all', district = 'all', specialty = 'all';
  Future<void> invite() async {
    final state = AppScope.of(context);
    final result = await editForm(context, 'Mời tiệm bánh mới', [
      const FieldSpec('name', 'Tên tiệm bánh'),
      const FieldSpec('chef', 'Bếp trưởng', required: false),
      const FieldSpec('phone', 'Hotline', keyboard: TextInputType.phone),
      FieldSpec(
        'email',
        'Email',
        keyboard: TextInputType.emailAddress,
        required: false,
        validate: emailValue,
      ),
      const FieldSpec(
        'specialty',
        'Chuyên môn',
        initial: 'Bánh Cưới Haute Couture',
        options: {
          'Bánh Cưới Haute Couture': 'Bánh Cưới Haute Couture',
          'AI Custom 3D & Fondant': 'AI Custom 3D & Fondant',
          'Mousse & Bánh Lạnh Pháp': 'Mousse & Bánh Lạnh Pháp',
          'Bento Studio Hàn Quốc': 'Bento Studio Hàn Quốc',
          'Tháp Macaron & Tiệc Sự Kiện': 'Tháp Macaron & Tiệc Sự Kiện',
        },
      ),
      const FieldSpec('location', 'Khu vực', initial: 'Quận 1, TP.HCM'),
    ], submit: 'Tạo thư mời mô phỏng');
    if (result == null || !mounted) return;
    state.repository.saveVendor(
      VendorAccount(
        id: state.repository.nextId('VEND'),
        name: result['name']!,
        chef: result['chef']!,
        phone: result['phone']!,
        email: result['email']!,
        specialty: result['specialty']!,
        location: result['location']!,
      ),
    );
    state.changed();
    feedback(context, 'Đã tạo hồ sơ mời trong phiên. Không gửi SMS hay email.');
  }

  void update(VendorAccount v, {String? status, String? fee}) {
    final state = AppScope.of(context);
    state.repository.saveVendor(v.copyWith(status: status, fee: fee));
    state.changed();
  }

  Future<void> fee(VendorAccount v) async {
    final result = await editForm(context, 'Biểu phí ${v.name}', [
      FieldSpec(
        'fee',
        'Phí sàn',
        initial: v.fee,
        options: const {
          '3.5%': '3.5% · Đối tác chiến lược',
          '5.0%': '5.0% · Tiêu chuẩn',
          '6.5%': '6.5% · Hỗ trợ Marketing',
          '8.0%': '8.0% · Giao xe lạnh',
        },
      ),
    ]);
    if (result != null && mounted) update(v, fee: result['fee']);
  }

  Future<void> inspect(VendorAccount v) => showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    showDragHandle: true,
    builder: (context) => FractionallySizedBox(
      heightFactor: .85,
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(v.name, style: Theme.of(context).textTheme.titleLarge),
            InfoRow('Bếp trưởng', v.chef),
            InfoRow('Địa chỉ', v.location),
            InfoRow('Hồ sơ ATTP', v.legal),
            InfoRow('Chứng chỉ', v.certification),
            InfoRow('Kết quả kinh doanh', '${v.revenue} · ${v.rating}'),
            for (final p in v.photos)
              Padding(
                padding: const EdgeInsets.only(top: 12),
                child: CakePicture(p, height: 180, label: 'Ảnh thẩm định mẫu'),
              ),
            const SizedBox(height: 16),
            ActionButtons(
              children: [
                FilledButton(
                  onPressed: () {
                    update(v, status: 'active');
                    Navigator.pop(context);
                  },
                  child: const Text('Phê duyệt tiệm'),
                ),
                OutlinedButton(
                  onPressed: () {
                    update(v, status: 'needs_info');
                    Navigator.pop(context);
                  },
                  child: const Text('Yêu cầu thẩm tra lại'),
                ),
              ],
            ),
          ],
        ),
      ),
    ),
  );
  @override
  Widget build(BuildContext context) {
    final state = AppScope.of(context);
    final vendors = state.repository.vendors
        .where(
          (v) =>
              '${v.id} ${v.name} ${v.chef}'.toLowerCase().contains(
                query.toLowerCase(),
              ) &&
              (status == 'all' || v.status == status) &&
              (district == 'all' || v.district == district) &&
              (specialty == 'all' || v.category == specialty),
        )
        .toList();
    return PageBody(
      title: 'Tiệm bánh & duyệt xưởng',
      eyebrow: 'Master Admin',
      children: [
        FilledButton.icon(
          onPressed: invite,
          icon: const Icon(Icons.add_business_outlined),
          label: const Text('Mời tiệm bánh mới'),
        ),
        SearchField(
          hint: 'Tên tiệm, bếp trưởng, mã...',
          onChanged: (v) => setState(() => query = v),
        ),
        FilterChips(
          values: const {
            'all': 'Tất cả',
            'active': 'Đang mở lò',
            'pending': 'Chờ duyệt',
            'needs_info': 'Bổ sung hồ sơ',
            'suspended': 'Tạm ngưng',
          },
          selected: status,
          onSelected: (v) => setState(() => status = v),
        ),
        ExpansionTile(
          title: const Text('Lọc khu vực & chuyên môn'),
          children: [
            SelectField(
              label: 'Khu vực',
              value: district,
              options: const {
                'all': 'Tất cả',
                'q1': 'Quận 1',
                'q2': 'Thảo Điền',
                'q3': 'Quận 3',
                'bt': 'Bình Thạnh',
                'q7': 'Quận 7',
              },
              onChanged: (v) => setState(() => district = v),
            ),
            const SizedBox(height: 12),
            SelectField(
              label: 'Chuyên môn',
              value: specialty,
              options: const {
                'all': 'Tất cả',
                'couture': 'Bánh cưới Haute Couture',
                'ai-3d': 'AI Custom 3D',
                'french': 'Mousse Pháp',
                'korean': 'Bento Hàn Quốc',
                'macaron': 'Macaron & Sự kiện',
              },
              onChanged: (v) => setState(() => specialty = v),
            ),
            TextButton(
              onPressed: () => setState(() {
                status = district = specialty = 'all';
              }),
              child: const Text('Xóa bộ lọc'),
            ),
          ],
        ),
        if (vendors.isEmpty) const EmptyView(),
        for (final v in vendors)
          Panel(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                if (v.image.isNotEmpty)
                  CakePicture(v.image, height: 150, label: v.name),
                const SizedBox(height: 12),
                Text(v.name, style: Theme.of(context).textTheme.titleLarge),
                Text('${v.chef}\n${v.location}'),
                StatusPill(switch (v.status) {
                  'active' => 'Đang mở lò',
                  'pending' => 'Chờ duyệt',
                  'needs_info' => 'Cần bổ sung',
                  _ => 'Tạm ngưng',
                }),
                InfoRow('Chuyên môn', v.specialty),
                InfoRow('Biểu phí', v.fee),
                ActionButtons(
                  children: [
                    OutlinedButton(
                      onPressed: () => inspect(v),
                      child: const Text('Thẩm định hồ sơ'),
                    ),
                    if (v.status == 'pending')
                      FilledButton(
                        onPressed: () => update(v, status: 'active'),
                        child: const Text('Phê duyệt'),
                      ),
                    TextButton(
                      onPressed: () => fee(v),
                      child: const Text('Biểu phí sàn'),
                    ),
                    TextButton(
                      onPressed: () => update(
                        v,
                        status: v.status == 'suspended'
                            ? 'active'
                            : 'suspended',
                      ),
                      child: Text(
                        v.status == 'suspended' ? 'Mở khóa' : 'Tạm ngưng',
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
