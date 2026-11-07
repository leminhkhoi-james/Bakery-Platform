import 'package:flutter/material.dart';

import '../../../app/navigation/navigation.dart';
import '../../../app/router/screen_id.dart';
import '../../../app/theme/app_colors.dart';
import '../../../core/demo/demo_workspace.dart';
import '../../../core/widgets/sweetcake_scaffold.dart';
import '../../../core/widgets/sweetcake_widgets.dart';
import '../../../core/widgets/unsaved_guard.dart';
import '../domain/design_repository.dart';

class StudioPage extends StatefulWidget {
  const StudioPage({super.key});
  @override
  State<StudioPage> createState() => _StudioPageState();
}

class _StudioPageState extends State<StudioPage> {
  final prompt = TextEditingController(
    text: 'Bánh sinh nhật kem hồng, dâu tươi và những bông hoa nhỏ.',
  );
  String color = 'Hồng pastel', flavor = 'Vani dâu';
  int tiers = 1, image = 0;
  bool dirty = false;
  DesignDraft? current;
  @override
  void dispose() {
    prompt.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final w = DemoScope.of(context);
    return UnsavedGuard(
      dirty: dirty,
      child: SweetCakeScaffold(
        screen: ScreenId.studio,
        children: [
          const SCSection(
            'Ý tưởng nhỏ, chiếc bánh của riêng bạn',
            description:
                'Chọn cảm hứng, lưu phiên bản rồi mang mô tả đến yêu cầu bánh.',
          ),
          const SCNotice(
            'Preview native dùng ảnh mẫu có sẵn. Không gọi AI, không tạo ảnh mới, không phải mô hình 3D hay cam kết tiệm sẽ làm giống ảnh.',
          ),
          ClipRRect(
            borderRadius: BorderRadius.circular(20),
            child: Stack(
              alignment: Alignment.bottomLeft,
              children: [
                SCImage('assets/demo/cake_0${image + 1}.jpg', height: 300),
                Container(
                  color: AppColors.wine,
                  padding: const EdgeInsets.all(12),
                  child: Text(
                    'Ảnh cảm hứng local · $color · $tiers tầng',
                    style: const TextStyle(color: Colors.white),
                  ),
                ),
              ],
            ),
          ),
          Wrap(
            spacing: 8,
            children: [
              for (var i = 0; i < 3; i++)
                ChoiceChip(
                  label: Text('Mẫu ${i + 1}'),
                  selected: image == i,
                  onSelected: (_) => setState(() {
                    image = i;
                    dirty = true;
                  }),
                ),
            ],
          ),
          SCField(
            'Mô tả ý tưởng',
            controller: prompt,
            lines: 4,
            onChanged: (_) {
              if (!dirty) setState(() => dirty = true);
            },
          ),
          DropdownButtonFormField<String>(
            initialValue: color,
            isExpanded: true,
            decoration: const InputDecoration(labelText: 'Tông màu'),
            items: [
              for (final c in ['Hồng pastel', 'Kem vani', 'Nâu chocolate'])
                DropdownMenuItem(value: c, child: Text(c)),
            ],
            onChanged: (v) => setState(() {
              color = v!;
              dirty = true;
            }),
          ),
          DropdownButtonFormField<String>(
            initialValue: flavor,
            isExpanded: true,
            decoration: const InputDecoration(labelText: 'Hương vị'),
            items: [
              for (final c in ['Vani dâu', 'Chocolate', 'Trà Earl Grey'])
                DropdownMenuItem(value: c, child: Text(c)),
            ],
            onChanged: (v) => setState(() {
              flavor = v!;
              dirty = true;
            }),
          ),
          Wrap(
            crossAxisAlignment: WrapCrossAlignment.center,
            spacing: 16,
            children: [
              const Text('Số tầng minh họa'),
              SCQuantity(
                tiers,
                onChanged: (v) {
                  if (v <= 3) {
                    setState(() {
                      tiers = v;
                      dirty = true;
                    });
                  }
                },
              ),
            ],
          ),
          SCButton(
            'Lưu phiên bản local',
            icon: Icons.bookmark_outline,
            onPressed: () => demoAction(context, () {
              final d =
                  current ??
                  DesignDraft(
                    'design-local-${w.designs.drafts.length}',
                    prompt.text,
                  );
              d.prompt = prompt.text;
              d.color = color;
              d.flavor = flavor;
              d.tiers = tiers;
              d.image = 'assets/demo/cake_0${image + 1}.jpg';
              w.designs.save(d);
              setState(() {
                current = d;
                dirty = false;
              });
            }),
          ),
          SCButton(
            'Dùng ý tưởng để tạo yêu cầu',
            outlined: true,
            onPressed: () => openScreen(
              context,
              ScreenId.requestNew,
              relatedId: current?.id ?? 'design-01',
            ),
          ),
          SCButton(
            'Tạo bản nháp khác',
            outlined: true,
            onPressed: () async {
              if (dirty &&
                  !await confirmDemo(
                    context,
                    title: 'Bỏ thay đổi chưa lưu?',
                    message: 'Mở bản nháp mới trong phiên demo.',
                  )) {
                return;
              }
              if (mounted) {
                setState(() {
                  current = null;
                  prompt.clear();
                  color = 'Hồng pastel';
                  flavor = 'Vani dâu';
                  tiers = 1;
                  image = 0;
                  dirty = false;
                });
              }
            },
          ),
          const SCSection(
            'Bản nháp của bạn',
            description:
                'Chạm để mở lại. Các phiên bản chỉ tồn tại trong phiên demo.',
          ),
          for (final d in w.designs.drafts)
            SCCard(
              onTap: () => setState(() {
                current = d;
                prompt.text = d.prompt;
                color = d.color;
                flavor = d.flavor;
                tiers = d.tiers;
                image =
                    int.tryParse(
                          d.image.substring(
                            d.image.length - 5,
                            d.image.length - 4,
                          ),
                        ) !=
                        null
                    ? int.parse(
                            d.image.substring(
                              d.image.length - 5,
                              d.image.length - 4,
                            ),
                          ) -
                          1
                    : 0;
                dirty = false;
              }),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    d.prompt,
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  Text('${d.color} · ${d.tiers} tầng · ${d.flavor}'),
                  SCStatusBadge(d.moderation),
                  ExpansionTile(
                    tilePadding: EdgeInsets.zero,
                    title: Text('Lịch sử ${d.revisions.length} phiên bản'),
                    children: [
                      for (var i = 0; i < d.revisions.length; i++)
                        ListTile(
                          title: Text('Phiên bản ${i + 1}'),
                          subtitle: Text(d.revisions[i]),
                        ),
                    ],
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}
