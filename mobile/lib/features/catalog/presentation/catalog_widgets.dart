import 'package:flutter/material.dart';

import '../../../app/navigation/navigation.dart';
import '../../../app/router/screen_id.dart';
import '../../../app/theme/app_colors.dart';
import '../../../core/widgets/sweetcake_widgets.dart';
import '../domain/catalog_repository.dart';

class ProductGrid extends StatelessWidget {
  const ProductGrid(this.products, {super.key});
  final List<CakeProduct> products;
  @override
  Widget build(BuildContext context) => LayoutBuilder(
    builder: (context, constraints) {
      final scale = MediaQuery.textScalerOf(context).scale(14) / 14;
      final columns = constraints.maxWidth < 340 || scale > 1.3
          ? 1
          : constraints.maxWidth >= 720
          ? 3
          : 2;
      final tileWidth = (constraints.maxWidth - 12 * (columns - 1)) / columns;
      return GridView.builder(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        itemCount: products.length,
        gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: columns,
          crossAxisSpacing: 12,
          mainAxisSpacing: 16,
          mainAxisExtent: tileWidth + 176 * scale,
        ),
        itemBuilder: (context, index) => ProductCard(products[index]),
      );
    },
  );
}

class ProductCard extends StatelessWidget {
  const ProductCard(this.product, {super.key});
  final CakeProduct product;
  @override
  Widget build(BuildContext context) => SCCard(
    padding: EdgeInsets.zero,
    onTap: () => openScreen(context, ScreenId.product, id: product.id),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        AspectRatio(
          aspectRatio: 1,
          child: Hero(
            tag: 'product-${product.id}',
            child: SCImage(product.image, label: product.name, radius: 16),
          ),
        ),
        Expanded(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(12, 12, 12, 10),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  product.name,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const Spacer(),
                Text(
                  product.category,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.bodySmall,
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Expanded(child: SCPrice(product.price)),
                    const Icon(
                      Icons.arrow_outward,
                      size: 18,
                      color: AppColors.wine,
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ],
    ),
  );
}

class BakeryCard extends StatelessWidget {
  const BakeryCard(this.bakery, {super.key, required this.image});
  final BakeryProfile bakery;
  final String image;
  @override
  Widget build(BuildContext context) => SCCard(
    padding: EdgeInsets.zero,
    onTap: () => openScreen(context, ScreenId.bakery, id: bakery.id),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        SCImage(
          image,
          label: 'Bánh minh họa của ${bakery.name}',
          height: 180,
          radius: 16,
        ),
        Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(bakery.name, style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 8),
              Row(
                children: [
                  const Icon(
                    Icons.location_on_outlined,
                    size: 18,
                    color: AppColors.muted,
                  ),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Text(
                      '${bakery.district} · TP. Hồ Chí Minh',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Text(bakery.description),
              const SizedBox(height: 16),
              const Row(
                children: [
                  Expanded(child: Text('Xem tiệm và thực đơn')),
                  Icon(Icons.arrow_forward, size: 20, color: AppColors.wine),
                ],
              ),
            ],
          ),
        ),
      ],
    ),
  );
}
