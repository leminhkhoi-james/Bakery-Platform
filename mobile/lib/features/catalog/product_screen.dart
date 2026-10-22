import 'package:flutter/material.dart';

import '../../app/router/destination.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/formatters.dart';
import '../../core/widgets/common.dart';
import '../../models/catalog.dart';
import '../../state/app_state.dart';
import 'cake_card.dart';

class ProductScreen extends StatefulWidget {
  const ProductScreen({super.key, this.cake});
  final Cake? cake;
  @override
  State<ProductScreen> createState() => _ProductScreenState();
}

class _ProductScreenState extends State<ProductScreen> {
  int sizeIndex = 0, quantity = 1, imageIndex = 0;
  bool candle = false, hat = false;
  String sugar = 'less30', delivery = 'express', tab = 'taste';
  final message = TextEditingController();
  @override
  void dispose() {
    message.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = AppScope.of(context);
    final cake = widget.cake ?? state.catalog.first;
    final sizes = cake.sizes.isEmpty
        ? [CakeSize('Size tiêu chuẩn', cake.price)]
        : cake.sizes;
    final size = sizes[sizeIndex];
    final price = size.price + (candle ? 15000 : 0) + (hat ? 25000 : 0);
    final gallery = [
      cake.image,
      ...strings(state.fixtures.raw['PRODUCT_GALLERY_IMAGES']),
    ];
    void add() {
      state.cart.add(
        CartLine(
          id: state.repository.nextId('cart'),
          title: cake.title,
          price: price,
          size: size.label,
          image: cake.image,
          flavor: cake.flavor,
          bakery: cake.vendor,
          message: message.text,
          sweetness: sugar,
          delivery: delivery,
          quantity: quantity,
        ),
      );
      go(context, Destination.cart);
    }

    return PageBody(
      title: cake.title,
      eyebrow: cake.category,
      subtitle: '${cake.vendor} · ★ ${cake.rating} (${cake.reviews} đánh giá)',
      children: [
        CakePicture(gallery[imageIndex], height: 300, label: cake.title),
        Wrap(
          spacing: 8,
          children: [
            for (var i = 0; i < gallery.length; i++)
              SizedBox(
                width: 64,
                child: InkWell(
                  onTap: () => setState(() => imageIndex = i),
                  child: CakePicture(
                    gallery[i],
                    height: 64,
                    label: 'Ảnh sản phẩm ${i + 1}',
                  ),
                ),
              ),
          ],
        ),
        Text(cake.description),
        SectionTitle(
          '1. Chọn kích thước',
          action: TextButton(
            onPressed: () => showDialog<void>(
              context: context,
              builder: (context) => AlertDialog(
                title: const Text('Cẩm nang chọn kích cỡ bánh'),
                content: Text(
                  sizes.map((s) => '${s.label} · ${s.guests}').join('\n\n'),
                ),
                actions: [
                  TextButton(
                    onPressed: () => Navigator.pop(context),
                    child: const Text('Đóng'),
                  ),
                ],
              ),
            ),
            child: const Text('Cẩm nang size'),
          ),
        ),
        Wrap(
          spacing: 8,
          runSpacing: 4,
          children: [
            for (var i = 0; i < sizes.length; i++)
              ChoiceChip(
                label: Text('${sizes[i].label} · ${vnd(sizes[i].price)}'),
                selected: i == sizeIndex,
                onSelected: (_) => setState(() => sizeIndex = i),
              ),
          ],
        ),
        const SectionTitle('2. Tùy chọn vị ngọt'),
        SelectField(
          label: 'Sugar level',
          value: sugar,
          options: const {
            'french': 'Chuẩn vị Pháp 100% tự nhiên',
            'less30': 'Giảm 30% đường · Khuyên dùng',
            'less50': 'Giảm 50% đường',
          },
          onChanged: (v) => setState(() => sugar = v),
        ),
        TextField(
          controller: message,
          maxLength: 35,
          decoration: const InputDecoration(
            labelText: '3. Viết chữ lên bánh (Miễn phí)',
          ),
        ),
        Panel(
          child: Column(
            children: [
              const InfoRow(
                '4. Phụ kiện bàn tiệc',
                'Tặng nến tăm pastel, dao & đĩa thân thiện',
              ),
              CheckboxListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('Nến số nhũ vàng +15.000₫'),
                value: candle,
                onChanged: (v) => setState(() => candle = v!),
              ),
              CheckboxListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('Nón tiệc ép kim +25.000₫'),
                value: hat,
                onChanged: (v) => setState(() => hat = v!),
              ),
            ],
          ),
        ),
        SelectField(
          label: '5. Thời gian nhận bánh',
          value: delivery,
          options: const {
            'express': 'Giao hỏa tốc trong 2 giờ',
            'schedule': 'Hẹn ngày & giờ chính xác',
          },
          onChanged: (v) => setState(() => delivery = v),
        ),
        Panel(
          color: Brand.cream,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ActionButtons(
                children: [
                  IconButton(
                    tooltip: 'Giảm số lượng',
                    onPressed: quantity > 1
                        ? () => setState(() => quantity--)
                        : null,
                    icon: const Icon(Icons.remove),
                  ),
                  Padding(
                    padding: const EdgeInsets.all(12),
                    child: Text('$quantity'),
                  ),
                  IconButton(
                    tooltip: 'Tăng số lượng',
                    onPressed: () => setState(() => quantity++),
                    icon: const Icon(Icons.add),
                  ),
                ],
              ),
              Text(
                vnd(price * quantity),
                style: Theme.of(context).textTheme.headlineMedium,
              ),
              const SizedBox(height: 12),
              ActionButtons(
                children: [
                  FilledButton.icon(
                    onPressed: add,
                    icon: const Icon(Icons.shopping_bag_outlined),
                    label: const Text('Thêm vào giỏ hàng'),
                  ),
                  OutlinedButton(
                    onPressed: add,
                    child: const Text('Đặt nhanh'),
                  ),
                ],
              ),
            ],
          ),
        ),
        FilterChips(
          values: const {
            'taste': 'Hương vị',
            'ingredients': 'Nguyên liệu',
            'care': 'Bảo quản',
          },
          selected: tab,
          onSelected: (v) => setState(() => tab = v),
        ),
        Panel(
          child: Text(switch (tab) {
            'ingredients' => 'Bơ Elle & Vire Normandy · Mâm xôi tươi Đà Lạt · Vani Bourbon Madagascar. Thông tin minh họa theo trang chi tiết web.',
            'care' => 'Bảo quản ngăn mát 2°C – 6°C. Dùng dao ấm để cắt lát bánh phẳng mịn.',
            _ => cake.description,
          }),
        ),
        const SectionTitle('Gợi ý kết hợp cùng tiệc ngọt'),
        for (final c in state.catalog.where(
          (c) => [
            'macarons-6',
            'rose-earl-grey',
            'croissant-black-garlic',
          ].contains(c.id),
        ))
          CakeCard(c),
        OutlinedButton(
          onPressed: () => go(context, Destination.studio),
          child: const Text('Tự thiết kế bánh độc bản'),
        ),
      ],
    );
  }
}
