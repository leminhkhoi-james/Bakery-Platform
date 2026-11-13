import 'package:flutter/material.dart';

import '../../../app/router/screen_id.dart';
import '../../../core/api/contracts.dart';
import '../../../core/api/phase5_contracts.dart';
import '../../../core/live/live_workspace.dart';
import '../../../core/widgets/live_form.dart';
import '../../../core/widgets/sweetcake_widgets.dart';

class LiveRequestEditor extends StatelessWidget {
  const LiveRequestEditor({
    super.key,
    this.request,
    this.product,
    this.optionSelections = const [],
  });
  final List<Json> optionSelections;
  final Json? request;
  final PublicProduct? product;
  @override
  Widget build(BuildContext context) {
    final w = LiveScope.of(context), edit = request != null;
    final p = product;
    return LiveFormPage<Json>(
      title: edit ? 'Sửa bản nháp' : 'Tạo yêu cầu bánh',
      action: edit ? 'Lưu bản nháp' : 'Tạo bản nháp',
      initial: request == null
          ? {
              'requestType': p == null
                  ? 'OPEN_CUSTOM'
                  : 'TARGETED_PRODUCT_CUSTOM',
            }
          : {...request!, ...?request!['preference'] as Json?},
      fields: [
        const FormFieldSpec(
          'title',
          'Tên yêu cầu',
          required: true,
          maximum: 180,
        ),
        const FormFieldSpec(
          'description',
          'Mô tả chiếc bánh',
          required: true,
          maximum: 10000,
        ),
        const FormFieldSpec('occasion', 'Dịp đặc biệt', maximum: 100),
        const FormFieldSpec(
          'servingSize',
          'Số người',
          kind: FieldKind.integer,
          minimum: 1,
        ),
        const FormFieldSpec('budgetMin', 'Ngân sách từ', kind: FieldKind.money),
        const FormFieldSpec(
          'budgetMax',
          'Ngân sách đến',
          kind: FieldKind.money,
        ),
        const FormFieldSpec(
          'neededAt',
          'Ngày cần bánh',
          kind: FieldKind.instant,
          required: true,
        ),
        const FormFieldSpec(
          'offerDeadline',
          'Hạn nhận báo giá',
          kind: FieldKind.instant,
        ),
        const FormFieldSpec(
          'deliveryCity',
          'Tỉnh / thành phố',
          required: true,
          maximum: 120,
        ),
        const FormFieldSpec(
          'deliveryDistrict',
          'Quận / huyện',
          required: true,
          maximum: 120,
        ),
        for (final field in const [
          ('cakeSize', 'Kích thước', 80),
          ('cakeShape', 'Hình dáng', 80),
          ('flavor', 'Hương vị', 120),
          ('filling', 'Nhân bánh', 120),
          ('frosting', 'Kem phủ', 120),
          ('colorPalette', 'Màu sắc', 255),
          ('decorationNotes', 'Trang trí', 4000),
          ('allergyNotes', 'Dị ứng', 4000),
        ])
          FormFieldSpec(field.$1, field.$2, maximum: field.$3),
      ],
      extra: SCNotice(
        p == null
            ? 'Yêu cầu mở để các tiệm đủ điều kiện gửi báo giá. Chỉ bản nháp được sửa hoặc thêm ảnh.'
            : 'Tùy chỉnh từ ${p.name}. Backend xác minh sản phẩm và điều kiện tùy chỉnh; không tạo đơn từ màn hình này.',
      ),
      transform: (j) {
        j['neededAt'] = futureInstant(j['neededAt']).toIso8601String();
        if (j['offerDeadline'] != null) {
          final date = futureInstant(j['offerDeadline']);
          if (!date.isBefore(DateTime.parse(j['neededAt']))) {
            throw const ApiFailure(
              400,
              'Hạn báo giá phải trước ngày cần bánh.',
            );
          }
          j['offerDeadline'] = date.toIso8601String();
        }
        if (j['budgetMin'] != null &&
            j['budgetMax'] != null &&
            Money.parse(j['budgetMin']).compareTo(Money.parse(j['budgetMax'])) >
                0) {
          throw const ApiFailure(
            400,
            'Ngân sách từ không được lớn hơn ngân sách đến.',
          );
        }
        final preference = <String, dynamic>{};
        for (final key in [
          'cakeSize',
          'cakeShape',
          'flavor',
          'filling',
          'frosting',
          'colorPalette',
          'decorationNotes',
          'allergyNotes',
        ]) {
          preference[key] = j.remove(key);
        }
        j['preference'] = {...?request?['preference'] as Json?, ...preference};
        if (!edit) {
          j['requestType'] = p == null
              ? 'OPEN_CUSTOM'
              : 'TARGETED_PRODUCT_CUSTOM';
          if (p != null) {
            j['targetBakeryId'] = p.bakeryId;
            j['baseProductId'] = p.id;
            j['optionSelections'] = optionSelections;
          }
        }
        return j;
      },
      save: (j) => edit
          ? w.marketplace.edit(apiId(request!['id']), j)
          : w.marketplace.create(j),
      onSuccess: (context, result) {
        if (edit) {
          Navigator.pop(context, result);
        } else {
          Navigator.of(context).pushReplacementNamed(
            '/request-detail',
            arguments: ScreenArguments(id: apiId(result['id'])),
          );
        }
      },
    );
  }
}
