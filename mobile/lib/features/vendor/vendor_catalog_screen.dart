import 'package:flutter/material.dart';

import '../../core/widgets/common.dart';
import '../../core/utils/formatters.dart';
import '../../models/catalog.dart';
import '../../state/app_state.dart';
import 'cake_editor.dart';

class VendorCatalogScreen extends StatefulWidget {
  const VendorCatalogScreen({super.key});
  @override
  State<VendorCatalogScreen> createState() => _VendorCatalogScreenState();
}

class _VendorCatalogScreenState extends State<VendorCatalogScreen> {
  String search = '', status = 'all', prep = 'all', category = 'all';
  Future<void> edit(Cake? cake) async {
    final state = AppScope.of(context);
    final blank = Cake(
      id: state.repository.nextId('#CK'),
      title: 'Mẫu bánh nghệ thuật mới',
      price: 420000,
      category: 'Bánh sinh nhật nghệ thuật',
      flavor: 'Cốt Chiffon, kem Mascarpone',
      image: state.repository.cakes.firstOrNull?.image ?? '',
      sizes: const [
        CakeSize('14cm (2–4 người)', 420000),
        CakeSize('16cm (4–6 người)', 480000),
      ],
    );
    final result = await editCake(context, cake ?? blank);
    if (result == null || !mounted) return;
    state.repository.saveCake(result);
    state.changed();
    feedback(context, 'Đã lưu mẫu bánh trong catalog mô phỏng.');
  }

  @override
  Widget build(BuildContext context) {
    final state = AppScope.of(context);
    final cakes = state.repository.cakes
        .where(
          (c) =>
              '${c.id} ${c.title} ${c.flavor}'.toLowerCase().contains(
                search.toLowerCase(),
              ) &&
              (status == 'all' || (status == 'open' ? c.open : !c.open)) &&
              (prep == 'all' || c.delivery == prep) &&
              (category == 'all' || c.category == category),
        )
        .toList();
    return PageBody(
      title: 'Mẫu bánh tiệm',
      eyebrow: 'Thực đơn & catalog',
      children: [
        FilledButton.icon(
          onPressed: () => edit(null),
          icon: const Icon(Icons.add),
          label: const Text('Thêm mẫu bánh'),
        ),
        SearchField(
          hint: 'Tìm SKU, tên bánh, hương vị...',
          onChanged: (v) => setState(() => search = v),
        ),
        FilterChips(
          values: const {
            'all': 'Tất cả',
            'open': 'Đang mở bán',
            'paused': 'Hết nguyên liệu',
          },
          selected: status,
          onSelected: (v) => setState(() => status = v),
        ),
        ExpansionTile(
          title: const Text('Lọc theo loại & thời gian'),
          children: [
            SelectField(
              label: 'Thời gian chuẩn bị',
              value: prep,
              options: const {
                'all': 'Tất cả',
                'express': 'Lấy liền 2 giờ',
                'same-day': 'Trong ngày 4–6h',
              },
              onChanged: (v) => setState(() => prep = v),
            ),
            const SizedBox(height: 12),
            SelectField(
              label: 'Danh mục',
              value: category,
              options: {
                'all': 'Tất cả',
                for (final c in state.repository.cakes) c.category: c.category,
              },
              onChanged: (v) => setState(() => category = v),
            ),
          ],
        ),
        if (cakes.isEmpty) const EmptyView(),
        for (final c in cakes)
          Panel(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                CakePicture(c.image, height: 170, label: c.title),
                const SizedBox(height: 12),
                Text(c.title, style: Theme.of(context).textTheme.titleLarge),
                Text(c.id),
                Text('${c.category} · ${c.flavor}'),
                InfoRow('Giá từ', vnd(c.sizes.firstOrNull?.price ?? c.price)),
                SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  title: const Text('Mở bán trên sàn'),
                  value: c.open,
                  onChanged: (v) {
                    state.repository.saveCake(c.copyWith(open: v));
                    state.changed();
                  },
                ),
                ActionButtons(
                  children: [
                    FilledButton(
                      onPressed: () => edit(c),
                      child: const Text('Chỉnh sửa'),
                    ),
                    OutlinedButton(
                      onPressed: () {
                        state.repository.saveCake(
                          c.copyWith(
                            id: state.repository.nextId('${c.id}-COPY'),
                            title: '${c.title} (Bản sao)',
                          ),
                        );
                        state.changed();
                      },
                      child: const Text('Nhân bản'),
                    ),
                    TextButton(
                      onPressed: () async {
                        if (await confirm(
                          context,
                          'Xóa mẫu bánh?',
                          'Xóa mẫu này khỏi catalog mô phỏng.',
                        )) {
                          state.repository.deleteCake(c.id);
                          state.changed();
                        }
                      },
                      child: const Text('Xóa mẫu'),
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
