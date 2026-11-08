import 'package:flutter/material.dart';

import '../../cart/presentation/live_cart_page.dart';

import '../../../core/api/contracts.dart';
import '../../../core/live/live_workspace.dart';
import '../../../core/widgets/live_data.dart';
import '../../../core/widgets/live_form.dart';
import '../../../core/widgets/live_scaffold.dart';
import '../../../core/widgets/sweetcake_widgets.dart';

class LiveCatalogPage extends StatefulWidget {
  const LiveCatalogPage({
    super.key,
    this.bakeries = false,
    this.home = false,
    this.bakeryId,
  });
  final bool bakeries, home;
  final String? bakeryId;
  @override
  State<LiveCatalogPage> createState() => _LiveCatalogPageState();
}

class _LiveCatalogPageState extends State<LiveCatalogPage> {
  Json filters = {};
  int page = 1, revision = 0;
  String sort = '';
  @override
  Widget build(BuildContext context) {
    final w = LiveScope.of(context);
    return LiveData<ApiPage>(
      key: ValueKey('$page:$revision'),
      title: widget.home
          ? 'SweetCake'
          : widget.bakeries
          ? 'Tiệm bánh đối tác'
          : 'Khám phá bánh',
      load: () => widget.bakeries
          ? w.catalog.bakeries(
              query: {
                ...filters,
                'page': page,
                'size': 12,
                'sort': sort.isEmpty ? 'name,asc' : sort,
              },
            )
          : w.catalog.products(
              query: {
                ...filters,
                'bakeryId': widget.bakeryId,
                'page': page,
                'size': 12,
                'sort': sort.isEmpty ? 'createdAt,desc' : sort,
              },
            ),
      builder: (context, data, reload) => [
        if (widget.home)
          SCCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Center(child: SCMascot()),
                const SizedBox(height: 12),
                Text(
                  'Một chiếc bánh,\nthật là bạn.',
                  style: Theme.of(context).textTheme.headlineLarge,
                ),
                const SizedBox(height: 12),
                const Text(
                  'Tìm vị ngọt cho những ngày đáng nhớ từ những tiệm đang mở catalog.',
                ),
                const SizedBox(height: 20),
                SCButton(
                  'Khám phá bánh',
                  onPressed: () => liveOpen(context, '/explore'),
                ),
              ],
            ),
          ),
        Row(
          children: [
            Expanded(
              child: TextField(
                key: const ValueKey('catalog-search'),
                decoration: InputDecoration(
                  labelText: widget.bakeries ? 'Tìm tên tiệm' : 'Tìm tên bánh',
                  prefixIcon: const Icon(Icons.search),
                ),
                onSubmitted: (s) => setState(() {
                  filters['query'] = s;
                  page = 1;
                  revision++;
                }),
              ),
            ),
            IconButton(
              key: const ValueKey('catalog-filter'),
              tooltip: 'Bộ lọc',
              onPressed: () async {
                final result = await openLiveForm<Json>(
                  context,
                  title: 'Lọc ${widget.bakeries ? 'tiệm' : 'bánh'}',
                  initial: filters,
                  fields: [
                    const FormFieldSpec('query', 'Từ khóa'),
                    const FormFieldSpec('city', 'Thành phố', maximum: 120),
                    if (widget.bakeries)
                      const FormFieldSpec(
                        'district',
                        'Quận / huyện',
                        maximum: 120,
                      ),
                    if (!widget.bakeries) ...[
                      const FormFieldSpec(
                        'minPrice',
                        'Giá thấp nhất',
                        kind: FieldKind.money,
                      ),
                      const FormFieldSpec(
                        'maxPrice',
                        'Giá cao nhất',
                        kind: FieldKind.money,
                      ),
                      const FormFieldSpec(
                        'customizable',
                        'Cho phép tùy chỉnh',
                        kind: FieldKind.choice,
                        choices: ['true', 'false'],
                      ),
                    ],
                  ],
                  save: (body) async => body,
                  action: 'Áp dụng bộ lọc',
                );
                if (result != null && mounted) {
                  setState(() {
                    filters = result;
                    page = 1;
                    revision++;
                  });
                }
              },
              icon: const Icon(Icons.tune),
            ),
          ],
        ),
        DropdownButtonFormField<String>(
          key: const ValueKey('catalog-sort'),
          initialValue: sort.isEmpty
              ? (widget.bakeries ? 'name,asc' : 'createdAt,desc')
              : sort,
          decoration: const InputDecoration(labelText: 'Sắp xếp'),
          items: [
            for (final item
                in widget.bakeries
                    ? [('name,asc', 'Tên A–Z'), ('createdAt,desc', 'Mới nhất')]
                    : [
                        ('createdAt,desc', 'Mới nhất'),
                        ('basePrice,asc', 'Giá tăng dần'),
                        ('basePrice,desc', 'Giá giảm dần'),
                      ])
              DropdownMenuItem(value: item.$1, child: Text(item.$2)),
          ],
          onChanged: (s) => setState(() {
            sort = s!;
            page = 1;
            revision++;
          }),
        ),
        Text(
          '${data.total} ${widget.bakeries ? 'tiệm' : 'mẫu bánh'} · Trang ${data.page}/${data.pages == 0 ? 1 : data.pages}',
        ),
        if (data.items.isEmpty)
          const SCNotice(
            'Chưa có nội dung phù hợp. Thử từ khóa khác hoặc làm mới sau.',
          ),
        for (final item in data.items)
          widget.bakeries
              ? _BakeryTile(item)
              : _ProductTile(PublicProduct.fromJson(item)),
        Wrap(
          spacing: 12,
          runSpacing: 8,
          children: [
            if (page > 1)
              OutlinedButton(
                onPressed: () => setState(() => page--),
                child: const Text('Trang trước'),
              ),
            if (data.hasNext)
              OutlinedButton(
                key: const ValueKey('next-page'),
                onPressed: () => setState(() => page++),
                child: const Text('Trang tiếp'),
              ),
          ],
        ),
        if (widget.home)
          SCButton(
            'Xem tiệm đối tác',
            outlined: true,
            onPressed: () => liveOpen(context, '/stores'),
          ),
        if (widget.home)
          SCButton(
            'Xem gói đối tác',
            outlined: true,
            onPressed: () => liveOpen(context, '/subscription-plans'),
          ),
      ],
    );
  }
}

class _ProductTile extends StatelessWidget {
  const _ProductTile(this.product);
  final PublicProduct product;
  @override
  Widget build(BuildContext context) => SCCard(
    key: ValueKey('product-${product.id}'),
    onTap: () => liveOpen(context, '/product-detail', id: product.id),
    padding: EdgeInsets.zero,
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        LiveMedia(
          product.images.isEmpty
              ? null
              : product.images.first['url'] as String?,
          label: product.name,
        ),
        Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(product.name, style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 8),
              Text(product.bakeryName),
              const SizedBox(height: 8),
              Text(
                product.price.display(),
                style: Theme.of(context).textTheme.titleMedium,
              ),
            ],
          ),
        ),
      ],
    ),
  );
}

class _BakeryTile extends StatelessWidget {
  const _BakeryTile(this.value);
  final Json value;
  @override
  Widget build(BuildContext context) => SCCard(
    key: ValueKey('bakery-${value['id']}'),
    onTap: () =>
        liveOpen(context, '/bakery-detail', id: requiredText(value, 'id')),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        LiveMedia(
          value['coverUrl'] as String? ?? value['logoUrl'] as String?,
          label: 'Tiệm ${value['name']}',
        ),
        const SizedBox(height: 16),
        Text(
          requiredText(value, 'name'),
          style: Theme.of(context).textTheme.titleLarge,
        ),
        if (value['description'] != null) Text('${value['description']}'),
      ],
    ),
  );
}

class LiveProductPage extends StatelessWidget {
  const LiveProductPage(this.id, {super.key});
  final String id;
  @override
  Widget build(BuildContext context) {
    final w = LiveScope.of(context);
    return LiveData<PublicProduct>(
      title: 'Chi tiết bánh',
      load: () => w.catalog.product(id),
      builder: (context, p, _) => [
        for (final image in p.images)
          LiveMedia(image['url'] as String?, label: p.name),
        if (p.images.isEmpty) LiveMedia(null, label: p.name),
        Text(p.name, style: Theme.of(context).textTheme.headlineMedium),
        Text(p.price.display(), style: Theme.of(context).textTheme.titleLarge),
        Text('${p.product['description'] ?? ''}'),
        Text(
          'Khẩu phần: ${p.product['defaultServingSize'] ?? 'Chưa cung cấp'} · Đặt trước ${p.product['minimumNoticeHours'] ?? 0} giờ',
        ),
        SCButton(
          'Xem tiệm ${p.bakeryName}',
          outlined: true,
          onPressed: () => liveOpen(context, '/bakery-detail', id: p.bakeryId),
        ),
        const SCSection('Tùy chọn của bánh'),
        for (final group in objects(p.options['groups']))
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                '${group['name']} · ${group['selectionType']} · chọn ${group['minimumSelections']}–${group['maximumSelections']}',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              for (final v in objects(group['values']))
                if (v['active'] == true)
                  ListTile(
                    contentPadding: EdgeInsets.zero,
                    title: Text('${v['name']}'),
                    trailing: Text(Money.parse(v['priceAdjustment']).display()),
                  ),
            ],
          ),
        if (p.addOns.isNotEmpty) const SCSection('Phụ kiện có sẵn'),
        for (final a in p.addOns)
          ListTile(
            contentPadding: EdgeInsets.zero,
            title: Text('${a['name']}'),
            subtitle: Text('${a['description'] ?? ''}'),
            trailing: Text(Money.parse(a['price']).display()),
          ),
        SCButton(
          'Chọn bánh và tùy chọn',
          key: const ValueKey('product-select'),
          onPressed: () => Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => LiveProductSelection(p)),
          ),
        ),
        if (p.product['customizable'] == true)
          SCButton(
            'Yêu cầu tùy chỉnh bánh này',
            outlined: true,
            onPressed: () => Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => LiveProductSelection(p, customRequest: true),
              ),
            ),
          ),
      ],
    );
  }
}

class LiveBakeryPage extends StatelessWidget {
  const LiveBakeryPage(this.id, {super.key});
  final String id;
  @override
  Widget build(BuildContext context) {
    final w = LiveScope.of(context);
    return LiveData<Json>(
      title: 'Chi tiết tiệm',
      load: () => w.catalog.bakery(id),
      builder: (context, b, _) => [
        LiveMedia(
          b['coverUrl'] as String? ?? b['logoUrl'] as String?,
          label: 'Tiệm ${b['name']}',
        ),
        Text('${b['name']}', style: Theme.of(context).textTheme.headlineMedium),
        Text('${b['description'] ?? ''}'),
        ...operationSummary(object(b['operations'])),
        SCButton(
          'Xem bánh của tiệm',
          onPressed: () => Navigator.of(context).push(
            MaterialPageRoute(builder: (_) => LiveCatalogPage(bakeryId: id)),
          ),
        ),
      ],
    );
  }
}

List<Widget> operationSummary(Json value) => [
  const SCSection('Địa chỉ và giờ mở cửa'),
  for (final a in objects(value['addresses']))
    Text(
      '${a['addressLine']}, ${a['ward'] ?? ''}, ${a['district']}, ${a['city']}${a['isPrimary'] == true ? ' · Địa chỉ chính' : ''}',
    ),
  for (final h in objects(value['businessHours']))
    Text(
      '${h['dayOfWeek'] == 7 ? 'Chủ nhật' : 'Thứ ${(h['dayOfWeek'] as num).toInt() + 1}'}: ${h['closed'] == true ? 'Đóng cửa' : '${h['opensAt']}–${h['closesAt']}'}',
    ),
  const SCSection('Khu vực giao hàng'),
  for (final a in objects(value['serviceAreas']))
    if (a['active'] == true)
      Text(
        '${a['district']}, ${a['city']} · Phí ${Money.parse(a['deliveryFee']).display()} · Tối thiểu ${Money.parse(a['minimumOrder']).display()}',
      ),
];
