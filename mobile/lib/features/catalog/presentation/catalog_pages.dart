import 'package:flutter/material.dart';

import '../../../app/navigation/navigation.dart';
import '../../../app/router/screen_id.dart';
import '../../../core/demo/demo_workspace.dart';
import '../../../core/widgets/sweetcake_scaffold.dart';
import '../../../core/widgets/sweetcake_widgets.dart';
import 'catalog_widgets.dart';

class ExplorePage extends StatefulWidget {
  const ExplorePage({super.key, this.category});
  final String? category;
  @override
  State<ExplorePage> createState() => _ExplorePageState();
}

class _ExplorePageState extends State<ExplorePage> {
  String query = '', sorting = 'Mới nhất';
  String? category;
  int limit = 4;
  @override
  void initState() {
    super.initState();
    category = widget.category;
  }

  @override
  Widget build(BuildContext context) {
    final w = DemoScope.of(context);
    final products = w.catalog.published
        .where(
          (p) =>
              (category == null || p.category == category) &&
              '${p.name} ${p.description}'.toLowerCase().contains(
                query.toLowerCase(),
              ),
        )
        .toList();
    if (sorting == 'Giá tăng dần') {
      products.sort((a, b) => a.price.compareTo(b.price));
    }
    if (sorting == 'Giá giảm dần') {
      products.sort((a, b) => b.price.compareTo(a.price));
    }
    return SweetCakeScaffold(
      screen: ScreenId.explore,
      children: [
        Text(
          'Một chút ngọt ngào,\nđúng điều bạn tìm.',
          style: Theme.of(context).textTheme.headlineMedium,
        ),
        SCSearch(
          onChanged: (value) => setState(() {
            query = value;
            limit = 4;
          }),
        ),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: [
              Padding(
                padding: const EdgeInsets.only(right: 8),
                child: ChoiceChip(
                  label: const Text('Tất cả'),
                  selected: category == null,
                  onSelected: (_) => setState(() => category = null),
                ),
              ),
              for (final c in w.catalog.categories)
                Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChoiceChip(
                    label: Text(c),
                    selected: category == c,
                    onSelected: (_) => setState(() {
                      category = c;
                      limit = 4;
                    }),
                  ),
                ),
            ],
          ),
        ),
        Row(
          children: [
            Expanded(
              child: Text(
                '${products.length} mẫu bánh',
                style: Theme.of(context).textTheme.titleMedium,
              ),
            ),
            TextButton.icon(
              onPressed: () async {
                final value = await showSCSheet<String>(
                  context,
                  title: 'Sắp xếp bánh',
                  child: Column(
                    children: [
                      for (final label in [
                        'Mới nhất',
                        'Giá tăng dần',
                        'Giá giảm dần',
                      ])
                        ListTile(
                          title: Text(label),
                          trailing: sorting == label
                              ? const Icon(Icons.check)
                              : null,
                          onTap: () => Navigator.pop(context, label),
                        ),
                    ],
                  ),
                );
                if (value != null && mounted) setState(() => sorting = value);
              },
              icon: const Icon(Icons.tune),
              label: Text(sorting),
            ),
          ],
        ),
        if (products.isEmpty)
          SCStateView(
            title: 'Chưa tìm thấy mẫu phù hợp',
            message: 'Thử tên bánh hoặc danh mục khác.',
            action: 'Bỏ lọc danh mục',
            onAction: () => setState(() => category = null),
          )
        else
          ProductGrid(products.take(limit).toList()),
        if (products.length > limit)
          SCButton(
            'Xem thêm bánh',
            outlined: true,
            onPressed: () => setState(() => limit += 4),
          ),
      ],
    );
  }
}

class ProductDetailPage extends StatefulWidget {
  const ProductDetailPage({super.key, this.id});
  final String? id;
  @override
  State<ProductDetailPage> createState() => _ProductDetailPageState();
}

class _ProductDetailPageState extends State<ProductDetailPage> {
  int size = 0, quantity = 1;
  String flavor = 'Vani dâu';
  final Set<String> addons = {};
  @override
  Widget build(BuildContext context) {
    final w = DemoScope.of(context);
    final product = w.catalog.product(widget.id ?? 'product-1');
    if (!product.flavors.contains(flavor)) flavor = product.flavors.first;
    final bakery = w.catalog.bakery(product.bakeryId);
    final extra =
        product.sizeExtras[size] +
        w.catalog.addons
            .where((a) => addons.contains(a.id))
            .fold<int>(0, (sum, a) => sum + a.price);
    return SweetCakeScaffold(
      screen: ScreenId.product,
      bottom: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        mainAxisSize: MainAxisSize.min,
        children: [
          SCKeyValue(
            'Giá minh họa · $quantity bánh',
            vnd((product.price + extra) * quantity),
            emphasized: true,
          ),
          const SizedBox(height: 8),
          SCButton(
            'Thêm vào giỏ demo',
            icon: Icons.shopping_bag_outlined,
            onPressed: () {
              demoAction(
                context,
                () => w.cart.add(
                  product,
                  size: ['14 cm', '16 cm', '18 cm'][size],
                  flavor: flavor,
                  extras: extra,
                  addons: w.catalog.addons
                      .where((a) => addons.contains(a.id))
                      .map((a) => a.name)
                      .toList(),
                  quantity: quantity,
                ),
                message: 'Đã thêm bánh vào giỏ local',
              );
            },
          ),
        ],
      ),
      children: [
        Stack(
          alignment: Alignment.bottomRight,
          children: [
            Hero(
              tag: 'product-${product.id}',
              child: AspectRatio(
                aspectRatio: 1,
                child: SCImage(product.image, label: product.name, radius: 20),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(12),
              child: IconButton.filled(
                tooltip: 'Mở thư viện ảnh sản phẩm',
                icon: const Icon(Icons.zoom_in),
                onPressed: () => showDialog<void>(
                  context: context,
                  builder: (dialogContext) => Dialog(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        ListTile(
                          title: const Text('Ảnh mẫu · 1 / 1'),
                          trailing: IconButton(
                            tooltip: 'Đóng thư viện ảnh',
                            onPressed: () => Navigator.pop(dialogContext),
                            icon: const Icon(Icons.close),
                          ),
                        ),
                        Flexible(
                          child: InteractiveViewer(
                            minScale: 1,
                            maxScale: 4,
                            child: SCImage(product.image, label: product.name),
                          ),
                        ),
                        const Padding(
                          padding: EdgeInsets.all(16),
                          child: Text(
                            'Chụm hai ngón để phóng to. Fixture hiện có một ảnh cho mỗi bánh.',
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
        Text(product.name, style: Theme.of(context).textTheme.headlineMedium),
        TextButton.icon(
          onPressed: () => openScreen(context, ScreenId.bakery, id: bakery.id),
          icon: const Icon(Icons.storefront_outlined),
          label: Text(bakery.name),
        ),
        Text(product.description),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            Chip(
              label: Text('Đặt trước ${product.noticeHours} giờ'),
              avatar: const Icon(Icons.schedule, size: 18),
            ),
            if (product.customizable)
              const Chip(
                label: Text('Có thể tùy chỉnh'),
                avatar: Icon(Icons.palette_outlined, size: 18),
              ),
          ],
        ),
        const SCSection('Chọn kích thước'),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            for (var i = 0; i < 3; i++)
              ChoiceChip(
                label: Text(
                  '${[14, 16, 18][i]} cm · ${i == 0
                      ? '2–4'
                      : i == 1
                      ? '4–6'
                      : '6–8'} người',
                ),
                selected: size == i,
                onSelected: (_) => setState(() => size = i),
              ),
          ],
        ),
        DropdownButtonFormField<String>(
          initialValue: flavor,
          isExpanded: true,
          decoration: const InputDecoration(labelText: 'Hương vị'),
          items: [
            for (final f in product.flavors)
              DropdownMenuItem(value: f, child: Text(f)),
          ],
          onChanged: (v) => setState(() => flavor = v!),
        ),
        const SCSection('Thêm một chút chu đáo'),
        SCCard(
          padding: const EdgeInsets.all(8),
          child: Column(
            children: [
              for (final addon in w.catalog.addons.where((a) => a.active))
                CheckboxListTile(
                  title: Text(addon.name),
                  subtitle: Text(vnd(addon.price)),
                  value: addons.contains(addon.id),
                  onChanged: (v) => setState(() {
                    if (v == true) {
                      addons.add(addon.id);
                    } else {
                      addons.remove(addon.id);
                    }
                  }),
                ),
            ],
          ),
        ),
        Row(
          children: [
            const Expanded(child: Text('Số lượng')),
            SCQuantity(
              quantity,
              onChanged: (v) => setState(() => quantity = v),
            ),
          ],
        ),
        SCButton(
          'Yêu cầu tùy chỉnh mẫu bánh',
          outlined: true,
          onPressed: () =>
              openScreen(context, ScreenId.requestNew, relatedId: product.id),
        ),
        const SCNotice(
          'Giá được tính từ fixture để xem trước UI, không phải báo giá chính thức từ tiệm.',
        ),
      ],
    );
  }
}

class StoreDirectoryPage extends StatefulWidget {
  const StoreDirectoryPage({super.key});
  @override
  State<StoreDirectoryPage> createState() => _StoreDirectoryPageState();
}

class _StoreDirectoryPageState extends State<StoreDirectoryPage> {
  String query = '', district = 'Tất cả khu vực';
  @override
  Widget build(BuildContext context) {
    final w = DemoScope.of(context);
    final bakeries = w.catalog.bakeries
        .where(
          (b) =>
              b.status == 'ACTIVE' &&
              b.name.toLowerCase().contains(query.toLowerCase()) &&
              (district == 'Tất cả khu vực' || b.district == district),
        )
        .toList();
    return SweetCakeScaffold(
      screen: ScreenId.stores,
      children: [
        Text(
          'Tìm tiệm bánh\nhợp gu bạn.',
          style: Theme.of(context).textTheme.headlineMedium,
        ),
        const Text(
          'Mỗi tiệm một nét riêng. Cùng khám phá thực đơn và trao đổi trực tiếp về chiếc bánh của bạn.',
        ),
        SCSearch(
          hint: 'Tìm tên tiệm bánh…',
          onChanged: (value) => setState(() => query = value),
        ),
        DropdownButtonFormField<String>(
          initialValue: district,
          isExpanded: true,
          decoration: const InputDecoration(labelText: 'Khu vực'),
          items: [
            for (final d in ['Tất cả khu vực', 'Quận 3', 'Bình Thạnh'])
              DropdownMenuItem(value: d, child: Text(d)),
          ],
          onChanged: (v) => setState(() => district = v!),
        ),
        if (bakeries.isEmpty)
          const SCStateView(
            title: 'Chưa có tiệm phù hợp',
            message: 'Thử khu vực hoặc từ khóa khác.',
          )
        else
          for (final bakery in bakeries)
            BakeryCard(
              bakery,
              image: bakery.id == 'bakery-01'
                  ? 'assets/demo/cake_02.jpg'
                  : 'assets/demo/cake_05.jpg',
            ),
      ],
    );
  }
}

class BakeryDetailPage extends StatelessWidget {
  const BakeryDetailPage({super.key, this.id});
  final String? id;
  @override
  Widget build(BuildContext context) {
    final w = DemoScope.of(context),
        bakery = w.catalog.bakery(id ?? 'bakery-01');
    return SweetCakeScaffold(
      screen: ScreenId.bakery,
      children: [
        SCImage(
          bakery.id == 'bakery-01'
              ? 'assets/demo/cake_02.jpg'
              : 'assets/demo/cake_05.jpg',
          label: 'Bánh minh họa của tiệm',
          height: 230,
          radius: 20,
        ),
        Text(bakery.name, style: Theme.of(context).textTheme.headlineMedium),
        SCStatusBadge(bakery.status),
        Text(bakery.description),
        SCCard(
          child: Column(
            children: [
              SCKeyValue('Khu vực', bakery.district),
              SCKeyValue('Địa chỉ demo', bakery.address),
              SCKeyValue('Giờ mở cửa', bakery.hours),
              SCKeyValue('Phí giao minh họa', vnd(bakery.deliveryFee)),
            ],
          ),
        ),
        SCButton(
          'Trao đổi với tiệm',
          icon: Icons.chat_bubble_outline,
          onPressed: () => openScreen(
            context,
            ScreenId.chat,
            id: bakery.id == 'bakery-01' ? 'chat-01' : 'chat-02',
          ),
        ),
        const SCSection('Thực đơn của tiệm'),
        ProductGrid(
          w.catalog.published.where((p) => p.bakeryId == bakery.id).toList(),
        ),
      ],
    );
  }
}
