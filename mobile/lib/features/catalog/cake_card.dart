import 'package:flutter/material.dart';

import '../../app/router/destination.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/formatters.dart';
import '../../core/widgets/common.dart';
import '../../models/catalog.dart';
import '../../state/app_state.dart';

class CakeCard extends StatefulWidget {
  const CakeCard(this.cake, {super.key});
  final Cake cake;
  @override
  State<CakeCard> createState() => _CakeCardState();
}

class _CakeCardState extends State<CakeCard> {
  int sizeIndex = 0;
  @override
  Widget build(BuildContext context) {
    final c = widget.cake;
    final state = AppScope.of(context);
    final sizes = c.sizes.isEmpty
        ? [CakeSize('Size tiêu chuẩn', c.price)]
        : c.sizes;
    final size = sizes[sizeIndex.clamp(0, sizes.length - 1)];
    return Panel(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Stack(
            children: [
              InkWell(
                onTap: () => go(context, Destination.product, c),
                child: CakePicture(c.image, label: c.title, height: 220),
              ),
              Positioned(
                right: 8,
                top: 8,
                child: IconButton.filledTonal(
                  tooltip: state.favorites.contains(c.id)
                      ? 'Bỏ yêu thích'
                      : 'Yêu thích',
                  onPressed: () => state.toggleFavorite(c.id),
                  icon: Icon(
                    state.favorites.contains(c.id)
                        ? Icons.favorite
                        : Icons.favorite_border,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Text(
            c.category.toUpperCase(),
            style: const TextStyle(
              color: Brand.caramel,
              fontSize: 10,
              fontWeight: FontWeight.w700,
              letterSpacing: 1,
            ),
          ),
          const SizedBox(height: 6),
          InkWell(
            onTap: () => go(context, Destination.product, c),
            child: Text(
              c.title,
              style: Theme.of(context).textTheme.titleMedium,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            '${c.vendor}  ·  ★ ${c.rating}',
            style: Theme.of(context).textTheme.bodySmall,
          ),
          const SizedBox(height: 10),
          Wrap(
            spacing: 6,
            runSpacing: 4,
            children: [
              for (var i = 0; i < sizes.length; i++)
                ChoiceChip(
                  label: Text(sizes[i].label),
                  selected: i == sizeIndex,
                  onSelected: (_) => setState(() => sizeIndex = i),
                ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            vnd(size.price),
            style: const TextStyle(
              color: Brand.wine,
              fontSize: 20,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 12),
          ActionButtons(
            children: [
              FilledButton.icon(
                onPressed: () {
                  state.cart.add(
                    CartLine(
                      id: state.repository.nextId('cart'),
                      title: c.title,
                      price: size.price,
                      size: size.label,
                      image: c.image,
                      bakery: c.vendor,
                      flavor: c.flavor,
                    ),
                  );
                  feedback(context, 'Đã thêm vào giỏ hàng mô phỏng.');
                },
                icon: const Icon(Icons.add_shopping_cart, size: 18),
                label: const Text('Thêm vào giỏ'),
              ),
              OutlinedButton(
                onPressed: () {
                  state.cart.add(
                    CartLine(
                      id: state.repository.nextId('cart'),
                      title: c.title,
                      price: size.price,
                      size: size.label,
                      image: c.image,
                      bakery: c.vendor,
                    ),
                  );
                  go(context, Destination.cart);
                },
                child: const Text('Đặt ngay'),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
