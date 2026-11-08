import 'package:flutter/material.dart';

import '../../../app/navigation/navigation.dart';
import '../../../app/router/screen_id.dart';
import '../../../core/demo/demo_workspace.dart';
import '../../../core/widgets/sweetcake_scaffold.dart';
import '../../../core/widgets/sweetcake_widgets.dart';
import '../../../core/widgets/unsaved_guard.dart';
import '../domain/marketplace_repository.dart';
import 'request_pages.dart';

class ComparisonPage extends StatefulWidget {
  const ComparisonPage({super.key, this.id});
  final String? id;
  @override
  State<ComparisonPage> createState() => _ComparisonPageState();
}

class _ComparisonPageState extends State<ComparisonPage> {
  bool ascending = true;
  @override
  Widget build(BuildContext context) {
    final w = DemoScope.of(context),
        r = w.marketplace.request(widget.id ?? 'request-01');
    final offers = [...w.marketplace.forRequest(r.id)]
      ..sort(
        (a, b) =>
            ascending ? a.total.compareTo(b.total) : b.total.compareTo(a.total),
      );
    return SweetCakeScaffold(
      screen: ScreenId.comparison,
      children: [
        SCSection(
          r.title,
          description: 'Đối chiếu tổng giá, nội dung và thời gian. Giá là dữ liệu minh họa.',
        ),
        SCButton(
          ascending ? 'Tổng giá: thấp đến cao' : 'Tổng giá: cao đến thấp',
          outlined: true,
          icon: Icons.sort,
          onPressed: () => setState(() => ascending = !ascending),
        ),
        if (offers.isEmpty)
          const SCStateView(
            title: 'Chưa có báo giá để so sánh',
            message: 'Quay lại yêu cầu để kiểm tra trạng thái.',
          )
        else
          LayoutBuilder(
            builder: (context, c) => Wrap(
              spacing: 16,
              runSpacing: 16,
              children: [
                for (final o in offers)
                  SizedBox(
                    width: c.maxWidth >= 650
                        ? (c.maxWidth - 16) / 2
                        : c.maxWidth,
                    child: Column(
                      children: [
                        OfferCard(
                          o,
                          selected: w.marketplace.previewOfferId == o.id,
                        ),
                        const SizedBox(height: 12),
                        SCButton(
                          w.marketplace.previewOfferId == o.id
                              ? 'Đã chọn để xem trước'
                              : 'Chọn xem trước',
                          onPressed: o.status != 'PENDING'
                              ? null
                              : () => demoAction(
                                  context,
                                  () => w.marketplace.choosePreview(o),
                                ),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
          ),
        const SCNotice(
          'Lựa chọn chỉ lưu local. Báo giá vẫn ở trạng thái PENDING; không tạo đơn hoặc thực hiện thanh toán.',
        ),
      ],
    );
  }
}

class OfferDetailPage extends StatelessWidget {
  const OfferDetailPage({super.key, this.id});
  final String? id;
  @override
  Widget build(BuildContext context) {
    final w = DemoScope.of(context),
        offer = w.marketplace.offer(id ?? 'offer-01');
    final request = w.marketplace.request(offer.requestId),
        bakery = w.catalog.bakery(offer.bakeryId);
    return SweetCakeScaffold(
      screen: ScreenId.offer,
      children: [
        Text(bakery.name, style: Theme.of(context).textTheme.headlineSmall),
        SCStatusBadge(offer.status),
        SCSection(request.title, description: offer.message),
        SCCard(
          child: Column(
            children: [
              SCKeyValue('Giá bánh', vnd(offer.cakePrice)),
              SCKeyValue('Giao bánh', vnd(offer.deliveryFee)),
              SCKeyValue('Tổng dự kiến', vnd(offer.total)),
              SCKeyValue('Ngày hoàn thành demo', offer.completion),
              SCKeyValue('Hiệu lực demo', offer.expiry),
            ],
          ),
        ),
        SCButton(
          w.marketplace.previewOfferId == offer.id
              ? 'Đã chọn trong bản xem trước'
              : 'Chọn báo giá để xem trước',
          onPressed: offer.status == 'PENDING'
              ? () => demoAction(
                  context,
                  () => w.marketplace.choosePreview(offer),
                )
              : null,
        ),
        SCButton(
          'Trao đổi với tiệm',
          outlined: true,
          icon: Icons.chat_bubble_outline,
          onPressed: () => openScreen(
            context,
            ScreenId.chat,
            id: offer.bakeryId == 'bakery-01' ? 'chat-01' : 'chat-02',
          ),
        ),
        SCButton(
          'Xem thông tin thanh toán',
          outlined: true,
          onPressed: () => openScreen(context, ScreenId.payment),
        ),
        const SCNotice(
          'Đây là báo giá mẫu. Chọn xem trước không chấp nhận giao dịch, giữ tiền hay tạo hợp đồng thật.',
        ),
      ],
    );
  }
}

class VendorOfferPage extends StatefulWidget {
  const VendorOfferPage({super.key, this.requestId});
  final String? requestId;
  @override
  State<VendorOfferPage> createState() => _VendorOfferPageState();
}

class _VendorOfferPageState extends State<VendorOfferPage> {
  final form = GlobalKey<FormState>();
  final price = TextEditingController(),
      delivery = TextEditingController(text: '30000'),
      message = TextEditingController();
  CakeOffer? existing;
  bool initialized = false, dirty = false;
  @override
  void dispose() {
    price.dispose();
    delivery.dispose();
    message.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final w = DemoScope.of(context),
        r = w.marketplace.request(widget.requestId ?? 'request-01');
    final bakery = w.catalog.bakery(w.session.selectedBakeryId);
    if (!initialized) {
      final matches = w.marketplace.offers.where(
        (o) => o.requestId == r.id && o.bakeryId == bakery.id,
      );
      existing = matches.isEmpty ? null : matches.first;
      price.text = '${existing?.cakePrice ?? 600000}';
      delivery.text = '${existing?.deliveryFee ?? 30000}';
      message.text = existing?.message ?? '';
      initialized = true;
    }
    final editable =
        r.status == 'OPEN' &&
        (r.type != 'TARGETED_PRODUCT_CUSTOM' ||
            (r.productId != null &&
                w.catalog.product(r.productId!).bakeryId == bakery.id)) &&
        bakery.status == 'ACTIVE' &&
        (existing == null || existing!.status == 'PENDING');
    return UnsavedGuard(
      dirty: dirty,
      child: SweetCakeScaffold(
        screen: ScreenId.vendorOffer,
        children: [
          SCSection(
            r.title,
            description:
                '${bakery.name} · ${shortDate(r.neededAt)} · ${r.servings} người',
          ),
          Text(r.description),
          if (existing != null) SCStatusBadge(existing!.status),
          if (!editable)
            const SCNotice(
              'Tiệm cần ACTIVE, yêu cầu cần OPEN và báo giá cần PENDING để chỉnh sửa. Không tạo báo giá thứ hai sau khi rút.',
              warning: true,
            ),
          Form(
            key: form,
            onChanged: () {
              if (!dirty) setState(() => dirty = true);
            },
            child: Column(
              children: [
                SCField(
                  'Giá bánh (VND)',
                  controller: price,
                  keyboardType: TextInputType.number,
                  validator: moneyValidation,
                ),
                SCField(
                  'Phí giao (VND)',
                  controller: delivery,
                  keyboardType: TextInputType.number,
                  validator: moneyValidation,
                ),
                SCField(
                  'Nội dung, nguyên liệu và điều kiện',
                  controller: message,
                  lines: 5,
                ),
              ],
            ),
          ),
          const SCNotice(
            'Mốc thời gian fixture: hiệu lực 13/11/2026, hoàn thành 15/11/2026. Bản soạn này chỉ minh họa thao tác; khi tích hợp cần xác thực thời gian và hạn mức gói.',
          ),
          SCButton(
            existing == null ? 'Lưu báo giá demo' : 'Lưu chỉnh sửa local',
            onPressed: !editable
                ? null
                : () {
                    if (!form.currentState!.validate()) return;
                    demoAction(context, () {
                      final o =
                          existing ??
                          CakeOffer(
                            id: 'offer-local-${r.id}-${bakery.id}',
                            requestId: r.id,
                            bakeryId: bakery.id,
                            cakePrice: int.parse(price.text),
                            message: message.text,
                          );
                      o.cakePrice = int.parse(price.text);
                      o.deliveryFee = int.parse(delivery.text);
                      o.message = message.text;
                      w.marketplace.saveOffer(o);
                      setState(() {
                        existing = o;
                        dirty = false;
                      });
                    });
                  },
          ),
          if (existing?.status == 'PENDING')
            SCButton(
              'Rút báo giá local',
              outlined: true,
              onPressed: () async {
                if (await confirmDemo(
                      context,
                      title: 'Rút báo giá demo?',
                      message: 'Báo giá đã rút không được tạo lại cho cùng yêu cầu và tiệm.',
                    ) &&
                    context.mounted) {
                  demoAction(context, () {
                    w.marketplace.withdraw(existing!);
                    setState(() => dirty = false);
                  });
                }
              },
            ),
        ],
      ),
    );
  }
}

String? moneyValidation(String? v) =>
    int.tryParse(v ?? '') == null || int.parse(v!) < 0
    ? 'Nhập số tiền nguyên, không âm.'
    : null;
