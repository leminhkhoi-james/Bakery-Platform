import 'package:flutter/material.dart';

import '../../../core/api/contracts.dart';
import '../../../core/live/live_workspace.dart';
import '../../../core/widgets/live_data.dart';
import '../../../core/widgets/live_form.dart';
import '../../../core/widgets/live_scaffold.dart';
import '../../../core/widgets/live_upload.dart';
import '../../../core/widgets/structured_form.dart';
import '../../../core/widgets/sweetcake_widgets.dart';
import 'live_editor_schemas.dart';
import 'live_owner_profile.dart';

class _CatalogData {
  _CatalogData(this.bakery, this.products, this.categories, this.addOns);
  final Json? bakery;
  final ApiPage? products;
  final List<Json> categories, addOns;
}

class LiveOwnerCatalog extends StatefulWidget {
  const LiveOwnerCatalog({super.key});
  @override
  State<LiveOwnerCatalog> createState() => _LiveOwnerCatalogState();
}

class _LiveOwnerCatalogState extends State<LiveOwnerCatalog> {
  int tab = 0, page = 1, revision = 0;
  String query = '', status = '', sort = 'createdAt,desc';
  @override
  Widget build(BuildContext context) {
    final w = LiveScope.of(context);
    return LiveData<_CatalogData>(
      key: ValueKey('$page:$revision'),
      title: 'Catalog của tiệm',
      operational: true,
      load: () async {
        final b = await currentBakery(w);
        if (b == null) return _CatalogData(null, null, [], []);
        final id = '${b['id']}';
        final data = await Future.wait([
          w.bakeries.products(
            id,
            query: {
              'page': page,
              'size': 12,
              'query': query,
              'status': status,
              'sort': sort,
            },
          ),
          w.bakeries.categories(id),
          w.bakeries.addOns(id),
        ]);
        return _CatalogData(
          b,
          data[0] as ApiPage,
          data[1] as List<Json>,
          data[2] as List<Json>,
        );
      },
      builder: (context, data, reload) {
        final b = data.bakery;
        if (b == null) {
          return [
            const SCNotice('Chưa có hồ sơ tiệm.'),
            SCButton(
              'Mở hồ sơ đối tác',
              onPressed: () => liveOpen(context, '/vendor-profile'),
            ),
          ];
        }
        final id = '${b['id']}';
        return [
          Text(
            '${b['name']}',
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          Wrap(
            spacing: 8,
            children: [
              for (var i = 0; i < 3; i++)
                ChoiceChip(
                  key: ValueKey('catalog-tab-$i'),
                  label: Text(['Bánh', 'Danh mục', 'Phụ kiện'][i]),
                  selected: tab == i,
                  onSelected: (_) => setState(() => tab = i),
                ),
            ],
          ),
          if (tab == 0) ...[
            TextField(
              key: const ValueKey('owner-product-search'),
              decoration: const InputDecoration(
                labelText: 'Tìm bánh trong tiệm',
                prefixIcon: Icon(Icons.search),
              ),
              onSubmitted: (s) => setState(() {
                query = s;
                page = 1;
                revision++;
              }),
            ),
            DropdownButtonFormField<String>(
              initialValue: status,
              decoration: const InputDecoration(labelText: 'Trạng thái bánh'),
              items: [
                for (final s in [
                  '',
                  'DRAFT',
                  'PUBLISHED',
                  'HIDDEN',
                  'ARCHIVED',
                ])
                  DropdownMenuItem(
                    value: s,
                    child: Text(s.isEmpty ? 'Tất cả' : s),
                  ),
              ],
              onChanged: (s) => setState(() {
                status = s!;
                page = 1;
                revision++;
              }),
            ),
            DropdownButtonFormField<String>(
              initialValue: sort,
              decoration: const InputDecoration(labelText: 'Sắp xếp'),
              items: [
                for (final s in [
                  'createdAt,desc',
                  'name,asc',
                  'basePrice,asc',
                  'basePrice,desc',
                ])
                  DropdownMenuItem(
                    value: s,
                    child: Text(
                      const {
                            'createdAt,desc': 'M\u1edbi nh\u1ea5t',
                            'name,asc': 'T\u00ean A-Z',
                            'basePrice,asc': 'Gi\u00e1 t\u0103ng d\u1ea7n',
                            'basePrice,desc': 'Gi\u00e1 gi\u1ea3m d\u1ea7n',
                          }[s] ??
                          s,
                    ),
                  ),
              ],
              onChanged: (s) => setState(() {
                sort = s!;
                page = 1;
                revision++;
              }),
            ),
            SCButton(
              'Thêm bánh',
              key: const ValueKey('create-product'),
              onPressed: () =>
                  editProduct(context, w, id, null, data.categories, reload),
            ),
            Text(
              '${data.products!.total} bánh · Trang $page/${data.products!.pages == 0 ? 1 : data.products!.pages}',
            ),
            if (data.products!.items.isEmpty)
              const SCNotice(
                'Chưa có bánh phù hợp. Thêm bánh mới hoặc đổi bộ lọc.',
              ),
            for (final p in data.products!.items)
              SCCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text(
                      '${p['name']}',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    Text(
                      '${p['status']} · ${Money.parse(p['basePrice']).display()}',
                    ),
                    const SizedBox(height: 12),
                    SCButton(
                      'Quản lý bánh',
                      key: ValueKey('manage-product-${p['id']}'),
                      outlined: true,
                      onPressed: () async {
                        await Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => LiveOwnerProduct(
                              bakeryId: id,
                              product: p,
                              categories: data.categories,
                            ),
                          ),
                        );
                        reload();
                      },
                    ),
                  ],
                ),
              ),
            Wrap(
              spacing: 12,
              children: [
                if (page > 1)
                  OutlinedButton(
                    onPressed: () => setState(() => page--),
                    child: const Text('Trang trước'),
                  ),
                if (data.products!.hasNext)
                  OutlinedButton(
                    onPressed: () => setState(() => page++),
                    child: const Text('Trang tiếp'),
                  ),
              ],
            ),
          ] else if (tab == 1) ...[
            SCButton(
              'Thêm danh mục',
              key: const ValueKey('create-category'),
              onPressed: () async {
                await openLiveForm<Json>(
                  context,
                  title: 'Danh mục mới',
                  fields: categoryFields,
                  initial: const {'active': true, 'displayOrder': 0},
                  save: (body) async {
                    final result = await w.bakeries.saveCategory(id, body);
                    await w.bakeries.categories(id);
                    return result;
                  },
                );
                reload();
              },
            ),
            if (data.categories.isEmpty)
              const SCNotice('Tiệm chưa có danh mục.'),
            for (final c in data.categories)
              SCCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text(
                      '${c['name']} · ${c['active'] == true ? 'Đang dùng' : 'Đã tắt'}',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    TextButton(
                      key: ValueKey('edit-category-${c['id']}'),
                      onPressed: () async {
                        await openLiveForm<Json>(
                          context,
                          title: 'Sửa danh mục',
                          fields: categoryFields,
                          initial: c,
                          save: (body) async {
                            final result = await w.bakeries.saveCategory(
                              id,
                              body,
                              categoryId: '${c['id']}',
                            );
                            await w.bakeries.categories(id);
                            return result;
                          },
                        );
                        reload();
                      },
                      child: const Text('Sửa danh mục'),
                    ),
                    LiveCommand(
                      'Xóa danh mục',
                      key: ValueKey('delete-category-${c['id']}'),
                      run: () async {
                        if (!await confirmRemove(
                          context,
                          'Xóa danh mục?',
                          'Sản phẩm sẽ được bỏ liên kết với danh mục này.',
                        )) {
                          return;
                        }
                        await w.bakeries.deleteCategory(id, '${c['id']}');
                        await w.bakeries.categories(id);
                      },
                      after: reload,
                      outlined: true,
                    ),
                  ],
                ),
              ),
          ] else ...[
            SCButton(
              'Thêm phụ kiện',
              key: const ValueKey('create-addon'),
              onPressed: () async {
                await openLiveForm<Json>(
                  context,
                  title: 'Phụ kiện mới',
                  fields: addOnFields,
                  initial: const {'active': true},
                  save: (body) async {
                    final result = await w.bakeries.saveAddOn(id, body);
                    await w.bakeries.addOns(id);
                    return result;
                  },
                );
                reload();
              },
            ),
            if (data.addOns.isEmpty) const SCNotice('Tiệm chưa có phụ kiện.'),
            for (final a in data.addOns)
              SCCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text(
                      '${a['name']}',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    Text(
                      '${Money.parse(a['price']).display()} · ${a['active'] == true ? 'Đang dùng' : 'Đã tắt'}',
                    ),
                    TextButton(
                      key: ValueKey('edit-addon-${a['id']}'),
                      onPressed: () async {
                        await openLiveForm<Json>(
                          context,
                          title: 'Sửa phụ kiện',
                          fields: addOnFields,
                          initial: a,
                          save: (body) async {
                            final result = await w.bakeries.saveAddOn(
                              id,
                              body,
                              addOnId: '${a['id']}',
                            );
                            await w.bakeries.addOns(id);
                            return result;
                          },
                        );
                        reload();
                      },
                      child: const Text('Sửa phụ kiện'),
                    ),
                    LiveUpload(
                      'Ảnh phụ kiện',
                      upload: (file) async {
                        await w.bakeries.upload(
                          id,
                          'add-ons/${a['id']}/image',
                          [file],
                        );
                        await w.bakeries.addOns(id);
                      },
                      after: reload,
                    ),
                    LiveCommand(
                      'Ngừng sử dụng phụ kiện',
                      key: ValueKey('disable-addon-${a['id']}'),
                      run: () async {
                        if (!await confirmRemove(
                          context,
                          'Ngừng sử dụng phụ kiện?',
                          'Phụ kiện được tắt theo contract Backend.',
                        )) {
                          return;
                        }
                        await w.bakeries.deleteAddOn(id, '${a['id']}');
                        await w.bakeries.addOns(id);
                      },
                      after: reload,
                      outlined: true,
                    ),
                  ],
                ),
              ),
          ],
        ];
      },
    );
  }
}

Future<bool> confirmRemove(
  BuildContext context,
  String title,
  String message,
) async =>
    await showDialog<bool>(
      context: context,
      builder: (c) => AlertDialog(
        title: Text(title),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(c, false),
            child: const Text('Hủy'),
          ),
          TextButton(
            key: const ValueKey('confirm-action'),
            onPressed: () => Navigator.pop(c, true),
            child: const Text('Xác nhận'),
          ),
        ],
      ),
    ) ??
    false;

Future<void> editProduct(
  BuildContext context,
  LiveWorkspace w,
  String bakeryId,
  Json? product,
  List<Json> categories,
  VoidCallback reload,
) async {
  await openLiveForm<Json>(
    context,
    title: product == null ? 'Bánh mới' : 'Sửa thông tin bánh',
    fields: [
      ...productFields,
      FormFieldSpec(
        'categoryId',
        'Danh mục',
        kind: FieldKind.choice,
        choices: [for (final c in categories) '${c['id']}'],
        choiceLabels: {
          for (final c in categories) '${c['id']}': '${c['name']}',
        },
      ),
    ],
    initial: product ?? const {'customizable': false, 'minimumNoticeHours': 0},
    save: (body) async {
      final result = await w.bakeries.saveProduct(
        bakeryId,
        body,
        productId: product?['id'] as String?,
      );
      final page = await w.bakeries.products(
        bakeryId,
        query: {'query': body['name'], 'size': 100},
      );
      if (!page.items.any((p) => p['id'] == result['id'])) {
        throw const ApiFailure(
          502,
          'Đã gửi nhưng chưa đọc lại được bánh. Quay về danh sách để đối chiếu.',
          uncertain: true,
        );
      }
      if (product == null) {
        w.knownOptions['${result['id']}'] = {'groups': <dynamic>[]};
        w.knownImages['${result['id']}'] = [];
      }
      return result;
    },
  );
  reload();
}

class LiveOwnerProduct extends StatefulWidget {
  const LiveOwnerProduct({
    super.key,
    required this.bakeryId,
    required this.product,
    required this.categories,
  });
  final String bakeryId;
  final Json product;
  final List<Json> categories;
  @override
  State<LiveOwnerProduct> createState() => _LiveOwnerProductState();
}

class _LiveOwnerProductState extends State<LiveOwnerProduct> {
  late Json product = widget.product;
  int revision = 0;
  @override
  Widget build(BuildContext context) {
    final w = LiveScope.of(context),
        id = '${product['id']}',
        bid = widget.bakeryId;
    if (w.bakery?['id'] != bid) {
      return const LiveUnavailable(
        'Tiệm đang chọn đã thay đổi. Mở lại bánh từ catalog.',
      );
    }
    return LiveData<Json>(
      key: ValueKey(revision),
      title: 'Quản lý bánh',
      operational: true,
      load: () async {
        final page = await w.bakeries.products(
          bid,
          query: {'query': product['name'], 'size': 100},
        );
        product = page.items.firstWhere(
          (p) => p['id'] == id,
          orElse: () => throw const ApiFailure(
            404,
            'Chưa tìm thấy bánh trong trang kết quả.',
          ),
        );
        if (product['status'] == 'PUBLISHED') {
          final detail = await w.catalog.product(id);
          w.knownOptions[id] = detail.options;
          w.knownImages[id] = detail.images;
        }
        return product;
      },
      builder: (context, p, reload) => [
        Text('${p['name']}', style: Theme.of(context).textTheme.headlineMedium),
        SCKeyValue('Trạng thái', '${p['status']}'),
        SCKeyValue('Giá cơ bản', Money.parse(p['basePrice']).display()),
        if (p['status'] != 'ARCHIVED') ...[
          SCButton(
            'Sửa thông tin bánh',
            key: const ValueKey('edit-product'),
            onPressed: () => editProduct(
              context,
              w,
              bid,
              p,
              widget.categories,
              () => setState(() => revision++),
            ),
          ),
          if (w.knownOptions.containsKey(id))
            SCButton(
              'Sửa tùy chọn bánh',
              key: const ValueKey('edit-product-options'),
              onPressed: () async {
                await openStructuredForm(
                  context,
                  title: 'Tùy chọn bánh',
                  initial: w.knownOptions[id]!,
                  collections: optionsSchema,
                  validate: validateOptions,
                  notice: 'Lưu thay thế toàn bộ nhóm và giá trị. Giữ ID đã đọc để cập nhật; xóa mục sẽ gỡ khỏi bánh.',
                  save: (body) async {
                    final result = await w.bakeries.options(bid, id, body);
                    w.knownOptions[id] = result;
                    await w.bakeries.products(bid, query: {'query': p['name']});
                    return result;
                  },
                );
                reload();
              },
            )
          else
            const SCNotice(
              'Backend chưa có API đọc options/ảnh của bánh nháp hoặc đã ẩn. Không mở biểu mẫu thay thế khi chưa đọc đủ dữ liệu. Bánh mới trong phiên này hoặc bánh đang public có thể chỉnh đầy đủ.',
            ),
          LiveUpload(
            'Ảnh bánh',
            field: 'files',
            upload: (file) async {
              if ((w.knownImages[id]?.length ?? 0) >= 10) {
                throw const ApiFailure(400, 'Tối đa 10 ảnh mỗi bánh.');
              }
              final response = objects(
                await w.bakeries.upload(bid, 'products/$id/images', [file]),
              );
              (w.knownImages[id] ??= []).addAll(response);
              await w.bakeries.products(bid, query: {'query': p['name']});
            },
            after: reload,
          ),
          if (w.knownImages[id] != null)
            for (final image in w.knownImages[id]!)
              Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  LiveMedia(image['url'] as String?, label: 'Ảnh ${p['name']}'),
                  Text(image['primary'] == true ? 'Ảnh chính' : 'Ảnh bổ sung'),
                  LiveCommand(
                    'Xóa ảnh',
                    key: ValueKey('delete-image-${image['id']}'),
                    run: () async {
                      if (!await confirmRemove(
                        context,
                        'Xóa ảnh bánh?',
                        'Xóa ảnh chính sẽ ngăn công khai bánh nếu chưa có ảnh chính khác.',
                      )) {
                        return;
                      }
                      await w.bakeries.deleteImage(bid, id, '${image['id']}');
                      w.knownImages[id]?.removeWhere(
                        (x) => x['id'] == image['id'],
                      );
                      await w.bakeries.products(
                        bid,
                        query: {'query': p['name']},
                      );
                    },
                    after: reload,
                    outlined: true,
                  ),
                ],
              ),
          if (['DRAFT', 'HIDDEN'].contains(p['status']))
            LiveCommand(
              'Công khai bánh',
              key: const ValueKey('publish-product'),
              run: () async {
                await w.bakeries.productAction(bid, id, 'publish');
                await w.catalog.product(id);
              },
              after: reload,
            ),
          if (p['status'] == 'PUBLISHED')
            LiveCommand(
              'Ẩn bánh',
              key: const ValueKey('hide-product'),
              run: () async {
                await w.bakeries.productAction(bid, id, 'hide');
                await w.bakeries.products(bid, query: {'query': p['name']});
              },
              after: reload,
            ),
          LiveCommand(
            'Lưu trữ bánh',
            key: const ValueKey('archive-product'),
            run: () async {
              if (!await confirmRemove(
                context,
                'Lưu trữ bánh?',
                'Trạng thái lưu trữ là kết thúc; Backend không hỗ trợ khôi phục.',
              )) {
                return;
              }
              await w.bakeries.productAction(bid, id, 'archive');
              await w.bakeries.products(bid, query: {'query': p['name']});
            },
            after: reload,
            outlined: true,
          ),
        ],
        if (p['status'] == 'PUBLISHED')
          SCButton(
            'Xem trang bánh công khai',
            onPressed: () => liveOpen(context, '/product-detail', id: id),
          ),
      ],
    );
  }
}
