import 'package:flutter/material.dart';

import '../../app/router/destination.dart';
import '../../core/widgets/common.dart';
import '../../core/utils/formatters.dart';
import '../../models/catalog.dart';
import '../../models/workflow.dart';
import '../../state/app_state.dart';

class QuoteEditorScreen extends StatefulWidget {
  const QuoteEditorScreen({super.key, this.request});
  final CakeRequest? request;
  @override
  State<QuoteEditorScreen> createState() => _QuoteEditorScreenState();
}

class _QuoteEditorScreenState extends State<QuoteEditorScreen> {
  final form = GlobalKey<FormState>();
  final price = TextEditingController(text: '950000'),
      hours = TextEditingController(text: '6');
  final note = TextEditingController(
    text: 'Cam kết giống mẫu 90% – 95%, cốt Chiffon dâu tây ít ngọt. Tặng nến số và thiệp.',
  );
  String size = '2-tier', flavor = 'vanilla-strawberry';
  bool onTime = true, cold = true, moneyBack = true;
  int sampleCount = 2;
  @override
  void dispose() {
    price.dispose();
    hours.dispose();
    note.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = AppScope.of(context),
        r = widget.request ?? state.activeRequest!;
    final samples = state.fixtures
        .rows('DEFAULT_QUOTE_SAMPLE_IMAGES')
        .map((j) => textValue(j, 'url'))
        .toList();
    return Form(
      key: form,
      child: PageBody(
        title: 'Soạn báo giá chi tiết',
        eyebrow: r.id,
        children: [
          Panel(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(r.title),
                InfoRow('Ngân sách khách', vnd(r.budget)),
                Text(r.description),
              ],
            ),
          ),
          TextFormField(
            controller: price,
            keyboardType: TextInputType.number,
            decoration: const InputDecoration(
              labelText: 'Mức giá đề xuất (VNĐ)',
            ),
            validator: (v) => parseMoney(v ?? '') > 0
                ? null
                : 'Vui lòng nhập mức giá hợp lệ.',
          ),
          SelectField(
            label: 'Kích thước',
            value: size,
            options: const {
              '2-tier': '2 Tầng (20cm + 14cm)',
              '20cm': '20cm · 1 tầng cao',
              '24cm': '24cm · 1 tầng rộng',
              '16cm': '16cm · nhỏ gọn',
            },
            onChanged: (v) => setState(() => size = v),
          ),
          SelectField(
            label: 'Hương vị / cốt bánh',
            value: flavor,
            options: const {
              'vanilla-strawberry': 'Chiffon Vani dâu tây ít ngọt 30%',
              'chocolate': 'Chocolate Bỉ',
              'redvelvet': 'Red Velvet Mascarpone',
              'matcha': 'Matcha Uji đậu đỏ',
            },
            onChanged: (v) => setState(() => flavor = v),
          ),
          TextFormField(
            controller: hours,
            keyboardType: TextInputType.number,
            decoration: const InputDecoration(
              labelText: 'Thời gian hoàn thành (giờ)',
            ),
            validator: (v) => int.tryParse(v ?? '') != null && int.parse(v!) > 0
                ? null
                : 'Nhập số giờ lớn hơn 0.',
          ),
          TextFormField(
            controller: note,
            minLines: 4,
            maxLines: 6,
            decoration: const InputDecoration(
              labelText: 'Mức độ tương đồng & cam kết tay nghề',
            ),
            validator: requiredValue,
          ),
          SectionTitle('Ảnh minh họa ($sampleCount/3)'),
          for (var i = 0; i < sampleCount; i++)
            Panel(
              child: Column(
                children: [
                  CakePicture(
                    samples[i % samples.length],
                    height: 160,
                    label: 'Ảnh mẫu cục bộ',
                  ),
                  TextButton(
                    onPressed: sampleCount > 1
                        ? () => setState(() => sampleCount--)
                        : null,
                    child: const Text('Xóa ảnh mẫu'),
                  ),
                ],
              ),
            ),
          OutlinedButton(
            onPressed: sampleCount < 3
                ? () => setState(() => sampleCount++)
                : null,
            child: const Text('Thêm ảnh mẫu cục bộ'),
          ),
          CheckboxListTile(
            contentPadding: EdgeInsets.zero,
            title: const Text('Cam kết giao đúng giờ'),
            value: onTime,
            onChanged: (v) => setState(() => onTime = v!),
          ),
          CheckboxListTile(
            contentPadding: EdgeInsets.zero,
            title: const Text('Vận chuyển xe lạnh chuyên dụng'),
            value: cold,
            onChanged: (v) => setState(() => cold = v!),
          ),
          CheckboxListTile(
            contentPadding: EdgeInsets.zero,
            title: const Text('Hoàn tiền nếu không đủ yêu cầu'),
            value: moneyBack,
            onChanged: (v) => setState(() => moneyBack = v!),
          ),
          FilledButton(
            onPressed: () {
              if (!form.currentState!.validate()) return;
              state.submitQuote(
                Quote(
                  id: state.repository.nextId('bid'),
                  rfqId: r.id,
                  bakery:
                      state.settings.values['shopName'] ?? 'Tiệm Bánh Của Bạn',
                  price: parseMoney(price.text),
                  pitch: note.text,
                  size: size,
                  flavor: flavor,
                  duration: '${hours.text} giờ hoàn thiện',
                  durationRank: 99,
                  samples: [
                    for (var i = 0; i < sampleCount; i++)
                      samples[i % samples.length],
                  ],
                  onTime: onTime,
                  coldShipping: cold,
                  moneyBack: moneyBack,
                  packages: [
                    if (onTime) 'Cam kết giao đúng giờ',
                    if (cold) 'Vận chuyển xe lạnh chuyên dụng',
                    if (moneyBack) 'Hoàn tiền nếu không đủ yêu cầu',
                  ],
                ),
              );
              feedback(context, 'Đã lưu báo giá mô phỏng cho ${r.id}.');
              go(context, Destination.vendorRfq);
            },
            child: const Text('Gửi báo giá mô phỏng'),
          ),
        ],
      ),
    );
  }
}
