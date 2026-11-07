import 'package:flutter/material.dart';

import '../../../app/router/screen_id.dart';
import '../../../core/demo/demo_workspace.dart';
import '../../../core/widgets/sweetcake_scaffold.dart';
import '../../../core/widgets/sweetcake_widgets.dart';
import '../../../core/widgets/unsaved_guard.dart';
import '../../marketplace/presentation/offer_pages.dart';
import '../domain/catalog_repository.dart';

class VendorCatalogPage extends StatefulWidget {
  const VendorCatalogPage({super.key});
  @override
  State<VendorCatalogPage> createState() => _VendorCatalogPageState();
}

class _VendorCatalogPageState extends State<VendorCatalogPage> {
  int tab = 0;
  String query = '', status = 'ALL';
  @override
  Widget build(BuildContext context) {
    final w = DemoScope.of(context);
    final products = w.catalog.products
        .where(
          (p) =>
              p.bakeryId == w.session.selectedBakeryId &&
              p.name.toLowerCase().contains(query.toLowerCase()) &&
              (status == 'ALL' || status == p.status),
        )
        .toList();
    return SweetCakeScaffold(
      screen: ScreenId.vendorCatalog,
      children: [
        const BakerySelector(),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            for (var i = 0; i < 3; i++)
              ChoiceChip(
                label: Text(['Sản phẩm', 'Danh mục', 'Add-on'][i]),
                selected: tab == i,
                onSelected: (_) => setState(() => tab = i),
              ),
          ],
        ),
        if (tab == 0) ...[
          SCButton(
            'Thêm sản phẩm',
            icon: Icons.add,
            onPressed: () => _product(context),
          ),
          SCSearch(
            hint: 'Tìm tên bánh',
            onChanged: (v) => setState(() => query = v),
          ),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              for (final s in [
                'ALL',
                'DRAFT',
                'PUBLISHED',
                'HIDDEN',
                'ARCHIVED',
              ])
                FilterChip(
                  label: Text(s == 'ALL' ? 'Tất cả' : statusLabels[s] ?? s),
                  selected: status == s,
                  onSelected: (_) => setState(() => status = s),
                ),
            ],
          ),
          if (products.isEmpty)
            const SCStateView(
              title: 'Chưa có sản phẩm phù hợp',
              message: 'Thêm sản phẩm hoặc thay bộ lọc để bắt đầu.',
            ),
          for (final p in products)
            SCCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SCImage(p.image, height: 170),
                  const SizedBox(height: 12),
                  Text(p.name, style: Theme.of(context).textTheme.titleMedium),
                  Text(p.category),
                  SCPrice(p.price),
                  SCStatusBadge(p.status),
                  Wrap(
                    spacing: 8,
                    children: [
                      TextButton.icon(
                        onPressed: () => _product(context, p),
                        icon: const Icon(Icons.edit_outlined),
                        label: const Text('Chỉnh sửa'),
                      ),
                      TextButton(
                        onPressed: () => demoAction(
                          context,
                          () => w.catalog.changePublication(
                            p,
                            p.status == 'PUBLISHED' ? 'HIDDEN' : 'PUBLISHED',
                          ),
                        ),
                        child: Text(
                          p.status == 'PUBLISHED'
                              ? 'Ẩn local'
                              : 'Xuất bản local',
                        ),
                      ),
                      TextButton(
                        onPressed: () async {
                          if (await confirmDemo(
                                context,
                                title: 'Lưu trữ sản phẩm demo?',
                                message: 'Sản phẩm sẽ không xuất hiện ở catalog công khai local.',
                              ) &&
                              context.mounted) {
                            demoAction(
                              context,
                              () => w.catalog.changePublication(p, 'ARCHIVED'),
                            );
                          }
                        },
                        child: const Text('Lưu trữ'),
                      ),
                    ],
                  ),
                ],
              ),
            ),
        ],
        if (tab == 1) ...[
          const SCNotice(
            'Danh mục trong demo dùng chung để thử tổ chức catalog. Tích hợp thật phải phân quyền và phân phạm vi theo tiệm.',
          ),
          SCButton(
            'Thêm danh mục',
            icon: Icons.add,
            onPressed: () => _category(context),
          ),
          for (final c in w.catalog.categories)
            SCCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(c, style: Theme.of(context).textTheme.titleMedium),
                  Wrap(
                    children: [
                      TextButton(
                        onPressed: () => _category(context, c),
                        child: const Text('Đổi tên'),
                      ),
                      TextButton(
                        onPressed: () async {
                          if (await confirmDemo(
                                context,
                                title: 'Xóa danh mục local?',
                                message: 'Sản phẩm hiện có sẽ chuyển sang Chưa phân loại.',
                              ) &&
                              context.mounted) {
                            w.catalog.removeCategory(c);
                          }
                        },
                        child: const Text('Xóa danh mục'),
                      ),
                    ],
                  ),
                ],
              ),
            ),
        ],
        if (tab == 2) ...[
          SCButton(
            'Thêm add-on',
            icon: Icons.add,
            onPressed: () => _addon(context),
          ),
          for (final a in w.catalog.addons)
            SCCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(a.name, style: Theme.of(context).textTheme.titleMedium),
                  SCPrice(a.price),
                  SwitchListTile(
                    contentPadding: EdgeInsets.zero,
                    title: const Text('Hiển thị trong lựa chọn bánh'),
                    value: a.active,
                    onChanged: (v) {
                      a.active = v;
                      w.catalog.changed();
                    },
                  ),
                  TextButton(
                    onPressed: () => _addon(context, a),
                    child: const Text('Chỉnh sửa'),
                  ),
                ],
              ),
            ),
        ],
        const SCNotice(
          'Lưu và xuất bản chỉ thay đổi dữ liệu demo. Ảnh chọn từ thư viện bundle, không tải lên máy chủ.',
        ),
      ],
    );
  }

  void _product(BuildContext context, [CakeProduct? product]) =>
      Navigator.of(context).push(
        MaterialPageRoute<void>(
          builder: (_) => ProductEditorPage(product: product),
        ),
      );
  void _category(BuildContext context, [String? previous]) => showSCSheet(
    context,
    title: previous == null ? 'Danh mục mới' : 'Đổi tên danh mục',
    child: LocalTextEditor(
      label: 'Tên danh mục',
      initial: previous ?? '',
      onSave: (v) =>
          DemoScope.of(context).catalog.saveCategory(v, previous: previous),
    ),
  );
  void _addon(BuildContext context, [CatalogAddon? addon]) => showSCSheet(
    context,
    title: 'Add-on local',
    child: AddonEditor(addon: addon),
  );
}

class LocalTextEditor extends StatefulWidget {
  const LocalTextEditor({
    super.key,
    required this.label,
    this.initial = '',
    required this.onSave,
  });
  final String label, initial;
  final ValueChanged<String> onSave;
  @override
  State<LocalTextEditor> createState() => _LocalTextEditorState();
}

class _LocalTextEditorState extends State<LocalTextEditor> {
  late final controller = TextEditingController(text: widget.initial);
  final form = GlobalKey<FormState>();
  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Form(
    key: form,
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        SCField(widget.label, controller: controller),
        SCButton(
          'Lưu local',
          onPressed: () {
            if (form.currentState!.validate()) {
              demoAction(context, () {
                widget.onSave(controller.text);
                Navigator.pop(context);
              });
            }
          },
        ),
      ],
    ),
  );
}

class AddonEditor extends StatefulWidget {
  const AddonEditor({super.key, this.addon});
  final CatalogAddon? addon;
  @override
  State<AddonEditor> createState() => _AddonEditorState();
}

class _AddonEditorState extends State<AddonEditor> {
  late final name = TextEditingController(text: widget.addon?.name ?? '');
  late final price = TextEditingController(
    text: '${widget.addon?.price ?? 15000}',
  );
  final form = GlobalKey<FormState>();
  @override
  void dispose() {
    name.dispose();
    price.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Form(
    key: form,
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        SCField('Tên add-on', controller: name),
        SCField(
          'Giá (VND)',
          controller: price,
          keyboardType: TextInputType.number,
          validator: moneyValidation,
        ),
        SCButton(
          'Lưu add-on local',
          onPressed: () {
            if (!form.currentState!.validate()) return;
            final repo = DemoScope.of(context).catalog;
            final a =
                widget.addon ??
                CatalogAddon(
                  repo.nextId('addon'),
                  name.text,
                  int.parse(price.text),
                );
            a.name = name.text;
            a.price = int.parse(price.text);
            if (widget.addon == null) repo.addons.add(a);
            repo.changed();
            Navigator.pop(context);
          },
        ),
      ],
    ),
  );
}

class ProductEditorPage extends StatefulWidget {
  const ProductEditorPage({super.key, this.product});
  final CakeProduct? product;
  @override
  State<ProductEditorPage> createState() => _ProductEditorPageState();
}

class _ProductEditorPageState extends State<ProductEditorPage> {
  final form = GlobalKey<FormState>();
  late final name = TextEditingController(text: widget.product?.name ?? '');
  late final description = TextEditingController(
    text: widget.product?.description ?? '',
  );
  late final price = TextEditingController(
    text: '${widget.product?.price ?? 450000}',
  );
  late final hours = TextEditingController(
    text: '${widget.product?.noticeHours ?? 24}',
  );
  late final flavors = TextEditingController(
    text: widget.product?.flavors.join(', ') ?? 'Vani dâu, Chocolate',
  );
  late final extras = TextEditingController(
    text: widget.product?.sizeExtras.join(', ') ?? '0, 140000, 300000',
  );
  late String image = widget.product?.image ?? 'assets/demo/cake_01.jpg';
  String? category;
  late bool custom = widget.product?.customizable ?? true;
  bool dirty = false;
  @override
  void dispose() {
    for (final c in [name, description, price, hours, flavors, extras]) {
      c.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final w = DemoScope.of(context);
    category ??=
        widget.product?.category ??
        (w.catalog.categories.isEmpty
            ? 'Chưa phân loại'
            : w.catalog.categories.first);
    return UnsavedGuard(
      dirty: dirty,
      child: SweetCakeScaffold(
        screen: ScreenId.vendorCatalog,
        children: [
          SCSection(
            widget.product == null ? 'Sản phẩm mới' : 'Chỉnh sửa sản phẩm',
          ),
          Form(
            key: form,
            onChanged: () {
              if (!dirty) setState(() => dirty = true);
            },
            child: Column(
              children: [
                SCField('Tên bánh', controller: name),
                SCField('Mô tả', controller: description, lines: 3),
                SCField(
                  'Giá cơ bản (VND)',
                  controller: price,
                  keyboardType: TextInputType.number,
                  validator: moneyValidation,
                ),
                DropdownButtonFormField<String>(
                  initialValue: category,
                  isExpanded: true,
                  decoration: const InputDecoration(labelText: 'Danh mục'),
                  items: [
                    for (final c in {...w.catalog.categories, category!})
                      DropdownMenuItem(value: c, child: Text(c)),
                  ],
                  onChanged: (v) {
                    category = v!;
                    dirty = true;
                  },
                ),
                const SizedBox(height: 16),
                SCField(
                  'Cần đặt trước (giờ)',
                  controller: hours,
                  keyboardType: TextInputType.number,
                  validator: moneyValidation,
                ),
                SCField(
                  'Hương vị, cách nhau bằng dấu phẩy',
                  controller: flavors,
                  validator: (v) =>
                      (v ?? '').split(',').every((s) => s.trim().isEmpty)
                      ? 'Cần ít nhất một hương vị.'
                      : null,
                ),
                SCField(
                  'Phụ phí size 14 / 16 / 18 cm',
                  controller: extras,
                  validator: (v) {
                    final values = (v ?? '').split(',');
                    return values.length != 3 ||
                            values.any(
                              (x) =>
                                  int.tryParse(x.trim()) == null ||
                                  int.parse(x.trim()) < 0,
                            )
                        ? 'Nhập đúng 3 số không âm, cách nhau bằng dấu phẩy.'
                        : null;
                  },
                ),
                SwitchListTile(
                  title: const Text('Cho phép yêu cầu tùy chỉnh'),
                  value: custom,
                  onChanged: (v) => setState(() {
                    custom = v;
                    dirty = true;
                  }),
                ),
              ],
            ),
          ),
          const SCSection(
            'Ảnh sản phẩm',
            description:
                'Chọn ảnh bundle. Không yêu cầu quyền ảnh và không upload.',
          ),
          SCImage(image, height: 200),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              for (var i = 1; i <= 8; i++)
                ChoiceChip(
                  label: Text('Ảnh $i'),
                  selected: image.endsWith('0$i.jpg'),
                  onSelected: (_) => setState(() {
                    image = 'assets/demo/cake_0$i.jpg';
                    dirty = true;
                  }),
                ),
            ],
          ),
          SCButton(
            'Lưu bản nháp local',
            onPressed: () {
              if (!form.currentState!.validate()) return;
              demoAction(context, () {
                final p =
                    widget.product ??
                    CakeProduct(
                      id: w.catalog.nextId('product'),
                      bakeryId: w.session.selectedBakeryId,
                      name: name.text,
                      price: int.parse(price.text),
                      image: image,
                      status: 'DRAFT',
                    );
                p.name = name.text;
                p.description = description.text;
                p.price = int.parse(price.text);
                p.image = image;
                p.category = category!;
                p.noticeHours = int.parse(hours.text);
                p.flavors = flavors.text
                    .split(',')
                    .map((s) => s.trim())
                    .where((s) => s.isNotEmpty)
                    .toList();
                p.sizeExtras = extras.text
                    .split(',')
                    .map((s) => int.parse(s.trim()))
                    .toList();
                p.customizable = custom;
                w.catalog.saveProduct(p);
                setState(() => dirty = false);
                Navigator.pop(context);
              });
            },
          ),
        ],
      ),
    );
  }
}
