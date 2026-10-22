import 'package:flutter/material.dart';

import '../../core/widgets/common.dart';
import '../../core/widgets/multi_choice.dart';
import '../../core/utils/formatters.dart';
import '../../state/app_state.dart';
import 'cake_card.dart';
import 'catalog_filter.dart';

class CatalogScreen extends StatefulWidget {
  const CatalogScreen({super.key, this.category});
  final String? category;
  @override
  State<CatalogScreen> createState() => _CatalogScreenState();
}

class _CatalogScreenState extends State<CatalogScreen> {
  CatalogFilter filter = CatalogFilter();
  int page = 1;
  @override
  void initState() {
    super.initState();
    filter.category = widget.category ?? 'all';
  }

  Future<void> _filters() async {
    final state = AppScope.of(context);
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      showDragHandle: true,
      builder: (context) => StatefulBuilder(
        builder: (context, refresh) => FractionallySizedBox(
          heightFactor: .9,
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SectionTitle('Bộ lọc chi tiết'),
                const SizedBox(height: 16),
                SelectField(
                  label: 'Loại bánh',
                  value: filter.category,
                  options: {
                    'all': 'Tất cả',
                    for (final c in state.catalog) c.category: c.category,
                  },
                  onChanged: (v) => refresh(() => filter.category = v),
                ),
                const SizedBox(height: 16),
                Text('Khoảng giá: ${vnd(filter.maximum)}'),
                Slider(
                  value: filter.maximum.toDouble(),
                  min: 0,
                  max: 2500000,
                  divisions: 50,
                  label: vnd(filter.maximum),
                  onChanged: (v) => refresh(() => filter.maximum = v.round()),
                ),
                SelectField(
                  label: 'Thời gian nhận bánh',
                  value: filter.delivery,
                  options: const {
                    'all': 'Tất cả',
                    'fast': 'Giao ngay trong 2h',
                    'same_day': 'Trong ngày (4–6h)',
                    'custom': 'Đặt trước 24h–48h',
                  },
                  onChanged: (v) => refresh(() => filter.delivery = v),
                ),
                const SizedBox(height: 16),
                MultiChoice(
                  label: 'Phong cách & chủ đề',
                  selected: filter.themes,
                  options: const {
                    'korean': 'Minimalist Hàn Quốc',
                    'cartoon': 'Nhân vật 3D',
                    'vintage': 'Vintage Pháp',
                    'abstract': 'Trừu tượng Modern',
                    'crown': 'Vương miện Công chúa',
                    'natural': 'Hoa tươi Trái cây',
                    'bento': 'Bento Mini',
                    'luxury': 'Gold Luxury',
                  },
                  onChanged: (v, selected) => refresh(
                    () => selected
                        ? filter.themes.add(v)
                        : filter.themes.remove(v),
                  ),
                ),
                const SizedBox(height: 16),
                MultiChoice(
                  label: 'Dịp tổ chức',
                  selected: filter.occasions,
                  options: const {
                    'kids': 'Sinh nhật bé',
                    'family': 'Gia đình',
                    'love': 'Tình yêu',
                    'wedding': 'Tiệc cưới',
                    'baby': 'Thôi nôi',
                    'event': 'Khai trương công ty',
                    'holiday': 'Ngày lễ',
                  },
                  onChanged: (v, selected) => refresh(
                    () => selected
                        ? filter.occasions.add(v)
                        : filter.occasions.remove(v),
                  ),
                ),
                const SizedBox(height: 16),
                SelectField(
                  label: 'Bảng màu',
                  value: filter.color,
                  options: const {
                    'all': 'Tất cả',
                    'pink': 'Hồng',
                    'white': 'Trắng',
                    'yellow': 'Vàng',
                    'blue': 'Xanh',
                    'red': 'Đỏ',
                    'purple': 'Tím',
                    'matcha': 'Matcha',
                    'chocolate': 'Cacao',
                    'rainbow': 'Rainbow',
                  },
                  onChanged: (v) => refresh(() => filter.color = v),
                ),
                const SizedBox(height: 16),
                SelectField(
                  label: 'Khu vực tiệm bánh',
                  value: filter.district,
                  options: const {
                    'all': 'TP. Hồ Chí Minh',
                    'q.1': 'Quận 1',
                    'thảo điền': 'Thảo Điền',
                    'q.3': 'Quận 3',
                    'q.7': 'Quận 7',
                    'q.10': 'Quận 10',
                    'bình thạnh': 'Bình Thạnh',
                  },
                  onChanged: (v) => refresh(() => filter.district = v),
                ),
                const SizedBox(height: 16),
                FilledButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('Áp dụng bộ lọc'),
                ),
                TextButton(
                  onPressed: () => refresh(() => filter = CatalogFilter()),
                  child: const Text('Xóa tất cả bộ lọc'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
    if (mounted) setState(() => page = 1);
  }

  @override
  Widget build(BuildContext context) {
    final cakes = filter.apply(AppScope.of(context).catalog);
    final pages = (cakes.length / 9).ceil().clamp(1, 1000);
    page = page.clamp(1, pages);
    final visible = cakes.skip((page - 1) * 9).take(9);
    return PageBody(
      title: 'Khám phá mẫu bánh',
      eyebrow: 'Bộ sưu tập nghệ nhân',
      subtitle: 'Tìm chiếc bánh dành riêng cho khoảnh khắc của bạn.',
      children: [
        SearchField(
          key: ValueKey(filter),
          hint: 'Tìm bánh, tiệm bánh...',
          onChanged: (v) => setState(() {
            filter.query = v;
            page = 1;
          }),
        ),
        SelectField(
          label: 'Sắp xếp',
          value: filter.sort,
          options: const {
            'popular': 'Phổ biến nhất',
            'price_asc': 'Giá tăng dần',
            'price_desc': 'Giá giảm dần',
            'rating': 'Đánh giá cao nhất',
            'fastest': 'Giao nhanh nhất',
          },
          onChanged: (v) => setState(() {
            filter.sort = v;
            page = 1;
          }),
        ),
        ActionButtons(
          children: [
            OutlinedButton.icon(
              onPressed: _filters,
              icon: const Icon(Icons.tune),
              label: const Text('Bộ lọc'),
            ),
            TextButton(
              onPressed: () => setState(() {
                filter = CatalogFilter();
                page = 1;
              }),
              child: const Text('Xóa bộ lọc'),
            ),
          ],
        ),
        Text('${cakes.length} mẫu bánh  ·  Trang $page / $pages'),
        if (cakes.isEmpty) const EmptyView(),
        for (final c in visible) CakeCard(c, key: ValueKey(c.id)),
        ActionButtons(
          children: [
            OutlinedButton(
              onPressed: page > 1 ? () => setState(() => page--) : null,
              child: const Text('Trang trước'),
            ),
            OutlinedButton(
              onPressed: page < pages ? () => setState(() => page++) : null,
              child: const Text('Trang sau'),
            ),
          ],
        ),
      ],
    );
  }
}
