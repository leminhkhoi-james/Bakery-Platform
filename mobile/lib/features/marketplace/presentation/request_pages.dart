import 'package:flutter/material.dart';

import '../../../app/navigation/navigation.dart';
import '../../../app/router/screen_id.dart';
import '../../../app/theme/app_colors.dart';
import '../../../core/demo/demo_workspace.dart';
import '../../../core/widgets/sweetcake_scaffold.dart';
import '../../../core/widgets/sweetcake_widgets.dart';
import '../../../core/widgets/unsaved_guard.dart';
import '../domain/marketplace_repository.dart';

class RequestsPage extends StatefulWidget {
  const RequestsPage({super.key, this.vendor = false});
  final bool vendor;
  @override
  State<RequestsPage> createState() => _RequestsPageState();
}

class _RequestsPageState extends State<RequestsPage> {
  String query = '', status = 'Tất cả';
  @override
  Widget build(BuildContext context) {
    final w = DemoScope.of(context);
    final requests = w.marketplace.requests
        .where(
          (r) =>
              (!widget.vendor || r.status == 'OPEN') &&
              (!widget.vendor ||
                  r.type != 'TARGETED_PRODUCT_CUSTOM' ||
                  (r.productId != null &&
                      w.catalog.product(r.productId!).bakeryId ==
                          w.session.selectedBakeryId)) &&
              (status == 'Tất cả' || r.status == status) &&
              r.title.toLowerCase().contains(query.toLowerCase()),
        )
        .toList();
    return SweetCakeScaffold(
      screen: widget.vendor ? ScreenId.vendorRequests : ScreenId.requests,
      children: [
        if (widget.vendor) const BakerySelector(),
        Text(
          widget.vendor
              ? 'Ý tưởng đang tìm\nđúng tiệm bánh.'
              : 'Từ một ý tưởng,\nđến chiếc bánh riêng.',
          style: Theme.of(context).textTheme.headlineSmall,
        ),
        if (!widget.vendor)
          SCButton(
            'Tạo yêu cầu mới',
            icon: Icons.add,
            onPressed: () => openScreen(context, ScreenId.requestNew),
          ),
        SCSearch(
          hint: 'Tìm yêu cầu bánh…',
          onChanged: (v) => setState(() => query = v),
        ),
        if (!widget.vendor)
          Wrap(
            spacing: 8,
            children: [
              for (final s in ['Tất cả', 'DRAFT', 'OPEN', 'CANCELLED'])
                ChoiceChip(
                  label: Text(statusLabels[s] ?? s),
                  selected: status == s,
                  onSelected: (_) => setState(() => status = s),
                ),
            ],
          ),
        if (requests.isEmpty)
          const SCStateView(
            title: 'Chưa có yêu cầu phù hợp',
            message: 'Thử tìm kiếm khác hoặc tạo bản nháp đầu tiên.',
          )
        else
          for (final request in requests)
            SCCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SCStatusBadge(request.status),
                  const SizedBox(height: 12),
                  Text(
                    request.title,
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    request.description,
                    maxLines: 3,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 16),
                  SCKeyValue('Ngày cần bánh', shortDate(request.neededAt)),
                  SCKeyValue('Khu vực', request.district),
                  SCKeyValue(
                    'Ngân sách demo',
                    '${vnd(request.budgetMin)} – ${vnd(request.budgetMax)}',
                  ),
                  const SizedBox(height: 12),
                  SCButton(
                    widget.vendor ? 'Xem & soạn báo giá' : 'Xem yêu cầu',
                    outlined: true,
                    onPressed: () => openScreen(
                      context,
                      widget.vendor
                          ? ScreenId.vendorOffer
                          : ScreenId.requestDetail,
                      id: request.id,
                    ),
                  ),
                ],
              ),
            ),
      ],
    );
  }
}

String shortDate(DateTime date) =>
    '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year}';

class RequestEditorPage extends StatefulWidget {
  const RequestEditorPage({super.key, this.id, this.productId, this.designId});
  final String? id, productId, designId;
  @override
  State<RequestEditorPage> createState() => _RequestEditorPageState();
}

class _RequestEditorPageState extends State<RequestEditorPage> {
  final form = GlobalKey<FormState>();
  final title = TextEditingController(),
      description = TextEditingController(),
      minimum = TextEditingController(text: '400000'),
      maximum = TextEditingController(text: '900000');
  DateTime date = DateTime(2026, 11, 15);
  String district = 'Quận 3', type = 'OPEN_CUSTOM';
  String? selectedProduct;
  bool dirty = false, initialized = false, busy = false;
  int servings = 8;
  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (initialized) return;
    initialized = true;
    selectedProduct = widget.productId;
    if (selectedProduct != null) type = 'TARGETED_PRODUCT_CUSTOM';
    if (widget.designId != null) {
      final matches = DemoScope.of(context).designs.drafts
          .where((d) => d.id == widget.designId);
      if (matches.isNotEmpty) {
        final d = matches.first;
        title.text = 'Ý tưởng bánh của tôi';
        description.text =
            '${d.prompt}\n${d.color} · ${d.tiers} tầng · ${d.flavor}';
      }
    }
    if (widget.id != null) {
      final request = DemoScope.of(context).marketplace.request(widget.id!);
      title.text = request.title;
      description.text = request.description;
      minimum.text = '${request.budgetMin}';
      maximum.text = '${request.budgetMax}';
      date = request.neededAt;
      district = request.district;
      type = request.type;
      selectedProduct = request.productId;
      servings = request.servings;
    }
  }

  @override
  void dispose() {
    for (final c in [title, description, minimum, maximum]) {
      c.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final w = DemoScope.of(context);
    return UnsavedGuard(
      dirty: dirty,
      child: SweetCakeScaffold(
        screen: ScreenId.requestNew,
        children: [
          Text(
            'Kể tiệm nghe\nchiếc bánh bạn muốn.',
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          Form(
            key: form,
            onChanged: () {
              if (!dirty) setState(() => dirty = true);
            },
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                SCField('Tên yêu cầu', controller: title),
                SCField('Mô tả ý tưởng', controller: description, lines: 4),
                DropdownButtonFormField<String>(
                  initialValue: type,
                  isExpanded: true,
                  decoration: const InputDecoration(labelText: 'Loại yêu cầu'),
                  items: const [
                    DropdownMenuItem(
                      value: 'OPEN_CUSTOM',
                      child: Text('Ý tưởng mở cho các tiệm'),
                    ),
                    DropdownMenuItem(
                      value: 'TARGETED_PRODUCT_CUSTOM',
                      child: Text('Tùy chỉnh một mẫu bánh'),
                    ),
                  ],
                  onChanged: (v) => setState(() {
                    type = v!;
                    dirty = true;
                  }),
                ),
                const SizedBox(height: 16),
                if (type == 'TARGETED_PRODUCT_CUSTOM') ...[
                  DropdownButtonFormField<String>(
                    initialValue: selectedProduct,
                    isExpanded: true,
                    decoration: const InputDecoration(
                      labelText: 'Mẫu bánh gốc',
                    ),
                    items: [
                      for (final p in w.catalog.published.where(
                        (p) => p.customizable,
                      ))
                        DropdownMenuItem(
                          value: p.id,
                          child: Text(p.name, overflow: TextOverflow.ellipsis),
                        ),
                    ],
                    validator: (v) =>
                        v == null ? 'Chọn mẫu bánh để tùy chỉnh.' : null,
                    onChanged: (v) => setState(() {
                      selectedProduct = v;
                      dirty = true;
                    }),
                  ),
                  const SizedBox(height: 16),
                ],
                SCField(
                  'Ngân sách từ (VND)',
                  controller: minimum,
                  keyboardType: TextInputType.number,
                  validator: (v) => (int.tryParse(v ?? '') ?? -1) >= 0
                      ? null
                      : 'Ngân sách không được âm.',
                ),
                SCField(
                  'Ngân sách đến (VND)',
                  controller: maximum,
                  keyboardType: TextInputType.number,
                  validator: (v) =>
                      (int.tryParse(v ?? '') ?? -1) >=
                          (int.tryParse(minimum.text) ?? 0)
                      ? null
                      : 'Ngân sách tối đa phải lớn hơn hoặc bằng tối thiểu.',
                ),
                DropdownButtonFormField<String>(
                  initialValue: district,
                  isExpanded: true,
                  decoration: const InputDecoration(
                    labelText: 'Khu vực nhận bánh',
                  ),
                  items: [
                    for (final d in [
                      'Quận 3',
                      'Bình Thạnh',
                      'Thảo Điền',
                      'Quận 7',
                    ])
                      DropdownMenuItem(value: d, child: Text(d)),
                  ],
                  onChanged: (v) => setState(() {
                    district = v!;
                    dirty = true;
                  }),
                ),
                const SizedBox(height: 16),
                OutlinedButton.icon(
                  icon: const Icon(Icons.calendar_month_outlined),
                  label: Text('Ngày cần bánh: ${shortDate(date)}'),
                  onPressed: () async {
                    final selected = await showDatePicker(
                      context: context,
                      initialDate: date,
                      firstDate: DateTime(2026, 11, 8),
                      lastDate: DateTime(2028),
                    );
                    if (selected != null && mounted) {
                      setState(() {
                        date = selected;
                        dirty = true;
                      });
                    }
                  },
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    const Expanded(child: Text('Số phần bánh')),
                    SCQuantity(
                      servings,
                      onChanged: (v) => setState(() {
                        servings = v;
                        dirty = true;
                      }),
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                SCButton(
                  'Lưu bản nháp local',
                  busy: busy,
                  onPressed: () async {
                    if (!form.currentState!.validate() || busy) return;
                    setState(() => busy = true);
                    final request = CakeRequest(
                      id: widget.id ?? w.marketplace.nextRequestId(),
                      title: title.text.trim(),
                      description: description.text.trim(),
                      neededAt: date,
                      district: district,
                      budgetMin: int.parse(minimum.text),
                      budgetMax: int.parse(maximum.text),
                      servings: servings,
                      type: type,
                      productId: type == 'TARGETED_PRODUCT_CUSTOM'
                          ? selectedProduct
                          : null,
                    );
                    await Future<void>.delayed(
                      const Duration(milliseconds: 150),
                    );
                    if (!context.mounted) return;
                    if (widget.id != null) {
                      final original = w.marketplace.request(widget.id!);
                      original.title = request.title;
                      original.description = request.description;
                      original.neededAt = request.neededAt;
                      original.budgetMin = request.budgetMin;
                      original.budgetMax = request.budgetMax;
                      original.district = district;
                      original.servings = servings;
                      original.type = request.type;
                      original.productId = request.productId;
                    }
                    final saved = demoAction(
                      context,
                      () => w.marketplace.save(
                        widget.id == null
                            ? request
                            : w.marketplace.request(widget.id!),
                      ),
                    );
                    setState(() {
                      busy = false;
                      if (saved) dirty = false;
                    });
                    if (saved) {
                      openScreen(
                        context,
                        ScreenId.requestDetail,
                        id: request.id,
                        replace: true,
                      );
                    }
                  },
                ),
              ],
            ),
          ),
          const SCNotice(
            'Đây là bản nháp trên thiết bị. Thời gian, khu vực và giá cần được Backend/tiệm xác minh khi tích hợp thật.',
          ),
        ],
      ),
    );
  }
}

class RequestDetailPage extends StatelessWidget {
  const RequestDetailPage({super.key, this.id});
  final String? id;
  @override
  Widget build(BuildContext context) {
    final w = DemoScope.of(context),
        request = w.marketplace.request(id ?? 'request-01');
    final offers = w.marketplace.forRequest(request.id);
    return SweetCakeScaffold(
      screen: ScreenId.requestDetail,
      children: [
        SCStatusBadge(request.status),
        Text(request.title, style: Theme.of(context).textTheme.headlineSmall),
        Text(request.description),
        SCCard(
          child: Column(
            children: [
              SCKeyValue('Ngày cần bánh', shortDate(request.neededAt)),
              SCKeyValue('Khu vực', request.district),
              SCKeyValue('Số phần', '${request.servings} người'),
              SCKeyValue(
                'Ngân sách',
                '${vnd(request.budgetMin)} – ${vnd(request.budgetMax)}',
              ),
              SCKeyValue(
                'Loại',
                request.type == 'OPEN_CUSTOM'
                    ? 'Ý tưởng mở'
                    : 'Tùy chỉnh mẫu bánh',
              ),
            ],
          ),
        ),
        if (request.status == 'DRAFT') ...[
          SCButton(
            'Mở nhận báo giá · demo',
            onPressed: () =>
                demoAction(context, () => w.marketplace.publish(request)),
          ),
          SCButton(
            'Chỉnh sửa bản nháp',
            outlined: true,
            onPressed: () =>
                openScreen(context, ScreenId.requestNew, id: request.id),
          ),
        ],
        SCSection(
          'Báo giá từ các tiệm',
          description: '${offers.length} báo giá trong fixture local',
        ),
        if (offers.isEmpty)
          const SCStateView(
            title: 'Chưa có báo giá',
            message: 'Yêu cầu mở sẽ hiển thị báo giá khi có dữ liệu phù hợp.',
          )
        else ...[
          for (final offer in offers) OfferCard(offer),
          SCButton(
            'So sánh các báo giá',
            outlined: true,
            onPressed: () =>
                openScreen(context, ScreenId.comparison, id: request.id),
          ),
        ],
        if (['DRAFT', 'OPEN'].contains(request.status))
          TextButton(
            onPressed: () async {
              if (await confirmDemo(
                    context,
                    title: 'Hủy yêu cầu local?',
                    message:
                        'Các báo giá đang chờ trong fixture này sẽ bị từ chối.',
                  ) &&
                  context.mounted) {
                demoAction(context, () => w.marketplace.cancel(request));
              }
            },
            child: const Text('Hủy yêu cầu demo'),
          ),
      ],
    );
  }
}

class OfferCard extends StatelessWidget {
  const OfferCard(this.offer, {super.key, this.selected = false});
  final CakeOffer offer;
  final bool selected;
  @override
  Widget build(BuildContext context) {
    final bakery = DemoScope.of(context).catalog.bakery(offer.bakeryId);
    return SCCard(
      color: selected ? AppColors.lightPink : AppColors.white,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              Text(bakery.name, style: Theme.of(context).textTheme.titleMedium),
              SCStatusBadge(offer.status),
            ],
          ),
          const SizedBox(height: 12),
          Text(offer.message),
          const SizedBox(height: 12),
          SCPrice(offer.total),
          SCKeyValue('Hạn báo giá demo', offer.expiry),
          const SizedBox(height: 12),
          SCButton(
            'Xem chi tiết báo giá',
            outlined: true,
            onPressed: () => openScreen(context, ScreenId.offer, id: offer.id),
          ),
        ],
      ),
    );
  }
}
