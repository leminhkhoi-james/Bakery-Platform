import 'package:flutter/material.dart';

import '../../core/widgets/common.dart';
import '../../core/utils/formatters.dart';
import '../../models/catalog.dart';

Future<Cake?> editCake(BuildContext context, Cake cake) => showDialog<Cake>(
  context: context,
  builder: (_) => _CakeEditor(cake: cake),
);

class _SizeFields {
  _SizeFields(CakeSize size)
    : label = TextEditingController(text: size.label),
      price = TextEditingController(text: '${size.price}'),
      cost = size.cost;
  final TextEditingController label, price;
  final int cost;
  void dispose() {
    label.dispose();
    price.dispose();
  }
}

class _CakeEditor extends StatefulWidget {
  const _CakeEditor({required this.cake});
  final Cake cake;
  @override
  State<_CakeEditor> createState() => _CakeEditorState();
}

class _CakeEditorState extends State<_CakeEditor> {
  final form = GlobalKey<FormState>();
  late final title = TextEditingController(text: widget.cake.title);
  late final flavor = TextEditingController(text: widget.cake.flavor);
  late final sweetness = TextEditingController(text: widget.cake.sweetness);
  late final sizes = widget.cake.sizes.map(_SizeFields.new).toList();
  late String category = widget.cake.category;
  late bool gift = widget.cake.gift,
      calligraphy = widget.cake.calligraphy,
      flowers = widget.cake.flowers;
  @override
  void dispose() {
    title.dispose();
    flavor.dispose();
    sweetness.dispose();
    for (final s in sizes) {
      s.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Dialog(
    child: ConstrainedBox(
      constraints: const BoxConstraints(maxWidth: 580),
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: form,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SectionTitle('Thông tin mẫu bánh'),
              Text(widget.cake.id),
              const SizedBox(height: 16),
              TextFormField(
                controller: title,
                validator: requiredValue,
                decoration: const InputDecoration(labelText: 'Tên mẫu bánh'),
              ),
              const SizedBox(height: 16),
              SelectField(
                label: 'Danh mục',
                value: category,
                options: {
                  for (final c in [
                    'Bánh sinh nhật nghệ thuật',
                    'Bánh Mousse & Entremet',
                    'Bánh cưới Haute Couture',
                    'Bento Cake tối giản Hàn Quốc',
                    widget.cake.category,
                  ])
                    c: c,
                },
                onChanged: (v) => setState(() => category = v),
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: flavor,
                decoration: const InputDecoration(
                  labelText: 'Hương vị chủ đạo',
                ),
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: sweetness,
                decoration: const InputDecoration(
                  labelText: 'Độ ngọt tiêu chuẩn',
                ),
              ),
              const SizedBox(height: 20),
              const SectionTitle('Kích thước & bảng giá'),
              for (final s in sizes)
                Padding(
                  padding: const EdgeInsets.only(top: 16),
                  child: Panel(
                    child: Column(
                      children: [
                        TextFormField(
                          controller: s.label,
                          validator: requiredValue,
                          decoration: const InputDecoration(
                            labelText: 'Tên phân loại / kích thước',
                          ),
                        ),
                        const SizedBox(height: 12),
                        TextFormField(
                          controller: s.price,
                          keyboardType: TextInputType.number,
                          validator: (v) => parseMoney(v ?? '') > 0
                              ? null
                              : 'Giá bán phải lớn hơn 0.',
                          decoration: const InputDecoration(
                            labelText: 'Giá bán niêm yết (VNĐ)',
                          ),
                        ),
                        if (s.cost > 0)
                          InfoRow('Giá vốn tham khảo', vnd(s.cost)),
                      ],
                    ),
                  ),
                ),
              TextButton.icon(
                onPressed: () => setState(
                  () => sizes.add(
                    _SizeFields(
                      const CakeSize('Size 20cm (8–10 người)', 680000),
                    ),
                  ),
                ),
                icon: const Icon(Icons.add),
                label: const Text('Thêm size khác'),
              ),
              CheckboxListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('Tặng dao cắt bánh & nến pastel'),
                value: gift,
                onChanged: (v) => setState(() => gift = v!),
              ),
              CheckboxListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('Viết thông điệp miễn phí'),
                value: calligraphy,
                onChanged: (v) => setState(() => calligraphy = v!),
              ),
              CheckboxListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('Hoa tươi trang trí +45.000₫'),
                value: flowers,
                onChanged: (v) => setState(() => flowers = v!),
              ),
              FilledButton(
                onPressed: () {
                  if (!form.currentState!.validate()) return;
                  Navigator.pop(
                    context,
                    widget.cake.copyWith(
                      title: title.text,
                      category: category,
                      flavor: flavor.text,
                      sweetness: sweetness.text,
                      sizes: sizes
                          .map(
                            (s) => CakeSize(
                              s.label.text,
                              parseMoney(s.price.text),
                              cost: s.cost,
                            ),
                          )
                          .toList(),
                      gift: gift,
                      calligraphy: calligraphy,
                      flowers: flowers,
                    ),
                  );
                },
                child: const Text('Lưu mẫu bánh mô phỏng'),
              ),
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Hủy'),
              ),
            ],
          ),
        ),
      ),
    ),
  );
}
