import 'package:flutter/material.dart';

import '../../app/router/destination.dart';
import '../../core/widgets/common.dart';
import '../../core/utils/formatters.dart';
import '../../models/catalog.dart';
import '../../models/workflow.dart';
import '../../state/app_state.dart';

class StudioScreen extends StatefulWidget {
  const StudioScreen({super.key, this.request});
  final CakeRequest? request;
  @override
  State<StudioScreen> createState() => _StudioScreenState();
}

class _StudioScreenState extends State<StudioScreen> {
  final form = GlobalKey<FormState>();
  late final prompt = TextEditingController(
    text: widget.request?.title ?? 'Bánh Pikachu 2 tầng màu vàng, cốt chiffon vani dâu tây ít ngọt 30%, chữ Happy 7th Birthday Minh Khang!',
  );
  late final message = TextEditingController(
    text: widget.request?.message ?? 'Happy 7th Birthday Minh Khang!',
  );
  late final note = TextEditingController(
    text:
        widget.request?.description ??
        'Bánh cho tiệc sinh nhật bé 7 tuổi. Giao xe lạnh đúng hẹn.',
  );
  late final budget = TextEditingController(
    text: '${widget.request?.budget ?? 1000000}',
  );
  late final address = TextEditingController(
    text:
        widget.request?.address ??
        'Căn hộ 18.04, Saigon Pearl, Bình Thạnh, TP.HCM',
  );
  late final date = TextEditingController(
    text: widget.request?.date ?? '22/10/2026',
  );
  final customTime = TextEditingController();
  String mode = 'ai',
      sizeId = '2tier',
      placement = 'cake',
      time = '15:30 - 16:30';
  final flavors = <String>{'vanilla', 'strawberry'};
  final toppings = <String>{'Fruit Tươi Theo Mùa', 'Macaron Pháp Thủ Công'};
  final accessories = <String>{
    'candle',
    'cutlery',
    'card',
    'flowers',
    'mica_box',
  };
  final references = <String>[];
  int previewIndex = 0;
  bool initialized = false;
  bool generating = false, submitting = false, flexible = true;
  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (initialized) return;
    initialized = true;
    final f = AppScope.of(context).fixtures, request = widget.request;
    references.add(strings(f.raw['AI_RENDER_IMAGES']).first);
    if (request == null) return;
    sizeId =
        f
            .choices('STUDIO_SIZES')
            .where((s) => s.name == request.size)
            .firstOrNull
            ?.id ??
        sizeId;
    final chosen = f
        .choices('STUDIO_FLAVORS')
        .where((s) => request.flavor.contains(s.name))
        .map((s) => s.id)
        .toSet();
    if (chosen.isNotEmpty) {
      flavors
        ..clear()
        ..addAll(chosen);
    }
    if (request.toppings.isNotEmpty) {
      toppings
        ..clear()
        ..addAll(request.toppings);
    }
    if (request.accessories.isNotEmpty) {
      accessories
        ..clear()
        ..addAll(request.accessories);
    }
    placement = request.placement;
    const slots = [
      '15:30 - 16:30',
      '09:00 - 11:00',
      '11:00 - 13:00',
      '14:00 - 16:00',
      '17:00 - 19:00',
    ];
    time = slots.contains(request.time) ? request.time : 'custom';
    customTime.text = request.time;
  }

  @override
  void dispose() {
    for (final c in [
      prompt,
      message,
      note,
      budget,
      address,
      date,
      customTime,
    ]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _generate() async {
    if (prompt.text.trim().isEmpty) {
      feedback(context, 'Hãy mô tả ý tưởng bánh.');
      return;
    }
    setState(() => generating = true);
    await Future<void>.delayed(const Duration(milliseconds: 600));
    if (!mounted) return;
    setState(() {
      generating = false;
      previewIndex = (previewIndex + 1) % 2;
    });
    feedback(context, 'Đã đổi ảnh minh họa cục bộ. Không gọi AI.');
  }

  CakeRequest _draft(AppState state) {
    final size = state.fixtures
        .choices('STUDIO_SIZES')
        .firstWhere((s) => s.id == sizeId);
    final images = strings(state.fixtures.raw['AI_RENDER_IMAGES']);
    return CakeRequest(
      id: widget.request?.id ?? state.repository.nextId('#RFQ'),
      title: mode == 'ai' ? prompt.text : 'Bánh custom theo ảnh mẫu',
      budget: parseMoney(budget.text),
      image: mode == 'upload' && references.isNotEmpty
          ? references.first
          : images[previewIndex],
      description: note.text,
      size: size.name,
      flavor: state.fixtures
          .choices('STUDIO_FLAVORS')
          .where((f) => flavors.contains(f.id))
          .map((f) => f.name)
          .join(', '),
      message: message.text,
      address: address.text,
      date: date.text,
      time: time == 'custom' ? customTime.text : time,
      accessories: accessories.toList(),
      toppings: toppings.toList(),
      flexible: flexible,
      placement: placement,
    );
  }

  Future<void> _submit() async {
    if (!form.currentState!.validate() || submitting) return;
    final state = AppScope.of(context);
    setState(() => submitting = true);
    final request = _draft(state);
    await Future<void>.delayed(const Duration(milliseconds: 400));
    if (!mounted) return;
    state.saveRequest(request);
    setState(() => submitting = false);
    feedback(context, 'Đã đăng yêu cầu trong dữ liệu mô phỏng.');
    go(context, Destination.bidding);
  }

  @override
  Widget build(BuildContext context) {
    final state = AppScope.of(context);
    final f = state.fixtures;
    final images = strings(f.raw['AI_RENDER_IMAGES']);
    final sizes = f.choices('STUDIO_SIZES');
    final flavorOptions = f.choices('STUDIO_FLAVORS');
    final extras = f.choices('STUDIO_ACCESSORIES');
    final estimate =
        sizes.firstWhere((s) => s.id == sizeId).price +
        flavorOptions
            .where((s) => flavors.contains(s.id))
            .fold<int>(0, (a, b) => a + b.price) +
        extras
            .where((s) => accessories.contains(s.id))
            .fold<int>(0, (a, b) => a + b.price);
    return Form(
      key: form,
      child: PageBody(
        title: 'Thiết kế bánh',
        eyebrow: 'Bespoke Cake Studio',
        subtitle: 'Ý tưởng của bạn, bàn tay nghệ nhân. Ảnh AI và upload được mô phỏng offline.',
        children: [
          FilterChips(
            values: const {'ai': 'Thiết kế AI', 'upload': 'Ảnh mẫu có sẵn'},
            selected: mode,
            onSelected: (v) => setState(() => mode = v),
          ),
          if (mode == 'ai') ...[
            TextFormField(
              controller: prompt,
              minLines: 3,
              maxLines: 5,
              validator: requiredValue,
              decoration: const InputDecoration(
                labelText: 'Mô tả ý tưởng bánh kem',
              ),
            ),
            Wrap(
              spacing: 6,
              children: [
                for (final p in f.rows('STYLE_PROMPTS'))
                  ActionChip(
                    label: Text(textValue(p, 'label')),
                    onPressed: () =>
                        setState(() => prompt.text = textValue(p, 'text')),
                  ),
              ],
            ),
            Wrap(
              spacing: 6,
              children: [
                for (final tag in strings(f.raw['SUGGESTION_TAGS']))
                  ActionChip(
                    label: Text(tag),
                    onPressed: () => prompt.text = '${prompt.text}, $tag',
                  ),
              ],
            ),
            FilledButton.icon(
              onPressed: generating ? null : _generate,
              icon: generating
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.auto_awesome),
              label: Text(
                generating
                    ? 'Đang dựng bản xem trước...'
                    : 'Tạo lại mẫu minh họa',
              ),
            ),
          ] else ...[
            const Text(
              'Chọn ảnh mẫu đã bundle để mô phỏng tải ảnh. Không truy cập thư viện hay tải lên server.',
            ),
            OutlinedButton.icon(
              onPressed: references.length >= 3
                  ? null
                  : () => setState(
                      () => references.add(
                        images[references.length % images.length],
                      ),
                    ),
              icon: const Icon(Icons.add_photo_alternate_outlined),
              label: const Text('Thêm ảnh mẫu cục bộ'),
            ),
            for (final image in references)
              Panel(
                child: Column(
                  children: [
                    CakePicture(image, height: 150),
                    TextButton(
                      onPressed: () => setState(() => references.remove(image)),
                      child: const Text('Xóa ảnh'),
                    ),
                  ],
                ),
              ),
          ],
          CakePicture(
            mode == 'upload' && references.isNotEmpty
                ? references.first
                : images[previewIndex],
            height: 270,
            label: 'Bản xem trước thiết kế mô phỏng',
          ),
          ExpansionTile(
            initiallyExpanded: true,
            title: const Text('Cấu hình bánh'),
            children: [
              SelectField(
                label: 'Kích thước',
                value: sizeId,
                options: {
                  for (final s in sizes) s.id: '${s.name} · ${vnd(s.price)}',
                },
                onChanged: (v) => setState(() => sizeId = v),
              ),
              const SizedBox(height: 16),
              const SectionTitle('Hương vị'),
              Wrap(
                spacing: 6,
                children: [
                  for (final f in flavorOptions)
                    FilterChip(
                      label: Text('${f.name} +${vnd(f.price)}'),
                      selected: flavors.contains(f.id),
                      onSelected: (v) => setState(
                        () => v ? flavors.add(f.id) : flavors.remove(f.id),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 16),
              const SectionTitle('Topping'),
              Wrap(
                spacing: 6,
                children: [
                  for (final t in strings(f.raw['STUDIO_TOPPINGS']))
                    FilterChip(
                      label: Text(t),
                      selected: toppings.contains(t),
                      onSelected: (v) => setState(
                        () => v ? toppings.add(t) : toppings.remove(t),
                      ),
                    ),
                ],
              ),
            ],
          ),
          TextFormField(
            controller: message,
            maxLength: 60,
            decoration: const InputDecoration(
              labelText: 'Nội dung viết lên bánh / bảng gỗ',
            ),
          ),
          SelectField(
            label: 'Vị trí lời chúc',
            value: placement,
            options: const {
              'cake': 'Trên bánh',
              'wood_plaque': 'Bảng gỗ',
              'choco_plaque': 'Bảng socola',
              'card': 'Thiệp',
            },
            onChanged: (v) => setState(() => placement = v),
          ),
          ExpansionTile(
            title: const Text('Phụ kiện đi kèm'),
            children: [
              for (final e in extras)
                CheckboxListTile(
                  title: Text(e.name),
                  subtitle: Text(vnd(e.price)),
                  value: accessories.contains(e.id),
                  onChanged: (v) => setState(
                    () => v! ? accessories.add(e.id) : accessories.remove(e.id),
                  ),
                ),
            ],
          ),
          Panel(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                InfoRow('Giá dự tính (mô phỏng)', vnd(estimate)),
                TextButton(
                  onPressed: () => setState(() => budget.text = '$estimate'),
                  child: const Text('Đồng bộ ngân sách theo cấu hình'),
                ),
              ],
            ),
          ),
          TextFormField(
            controller: budget,
            keyboardType: TextInputType.number,
            validator: (v) => parseMoney(v ?? '') <= 0
                ? 'Vui lòng nhập ngân sách hợp lệ.'
                : null,
            decoration: const InputDecoration(
              labelText: 'Ngân sách mong muốn (VNĐ)',
            ),
          ),
          Wrap(
            spacing: 6,
            children: [
              for (final p in f.rows('BUDGET_PRESETS'))
                ActionChip(
                  label: Text(textValue(p, 'label')),
                  onPressed: () =>
                      setState(() => budget.text = '${intValue(p, 'value')}'),
                ),
            ],
          ),
          TextFormField(
            controller: date,
            validator: requiredValue,
            keyboardType: TextInputType.datetime,
            decoration: const InputDecoration(
              labelText: 'Ngày tiệc / nhận bánh',
            ),
          ),
          SelectField(
            label: 'Khung giờ giao',
            value: time,
            options: {
              for (final t in [
                '15:30 - 16:30',
                '09:00 - 11:00',
                '11:00 - 13:00',
                '14:00 - 16:00',
                '17:00 - 19:00',
              ])
                t: t,
              'custom': 'Tự nhập khung giờ khác...',
            },
            onChanged: (v) => setState(() => time = v),
          ),
          if (time == 'custom')
            TextFormField(
              controller: customTime,
              validator: requiredValue,
              decoration: const InputDecoration(labelText: 'Khung giờ riêng'),
            ),
          TextFormField(
            controller: address,
            minLines: 2,
            maxLines: 3,
            validator: requiredValue,
            decoration: const InputDecoration(
              labelText: 'Địa chỉ giao bánh chi tiết',
            ),
          ),
          TextFormField(
            controller: note,
            minLines: 3,
            maxLines: 5,
            decoration: const InputDecoration(
              labelText: 'Ghi chú gửi các tiệm',
            ),
          ),
          FilledButton(
            onPressed: submitting ? null : _submit,
            child: Text(
              submitting ? 'Đang đăng mô phỏng...' : 'Gửi yêu cầu nhận báo giá',
            ),
          ),
        ],
      ),
    );
  }
}
