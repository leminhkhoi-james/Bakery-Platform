import 'package:flutter/material.dart';

import '../../app/router/destination.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/common.dart';
import '../../models/catalog.dart';
import '../../state/app_state.dart';
import '../catalog/cake_card.dart';
import 'patisserie_booth.dart';
import 'category_section.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});
  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  String tone = 'Hồng dịu';
  final idea = TextEditingController();
  bool preview = false;
  @override
  void dispose() {
    idea.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = AppScope.of(context);
    return PageBody(
      title: 'Một chiếc bánh,\nthật là bạn.',
      eyebrow: 'SweetCake · Petit Pâtisserie',
      subtitle: 'Bánh nghệ thuật. Làm bằng cả trái tim.',
      children: [
        Panel(
          color: const Color(0xFFFFF4E9),
          child: Column(
            children: [
              const PatisserieBooth(),
              const SizedBox(height: 16),
              Text(
                'Một chiếc bánh,\nngàn lời yêu thương.',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.headlineMedium,
              ),
              const SizedBox(height: 12),
              FilledButton.icon(
                onPressed: () => go(context, Destination.explore),
                icon: const Icon(Icons.cake_outlined),
                label: const Text('Khám phá mẫu bánh'),
              ),
              TextButton(
                onPressed: () => go(context, Destination.studio),
                child: const Text('Tự thiết kế chiếc bánh của bạn →'),
              ),
              TextButton(
                onPressed: () => go(context, Destination.bidding),
                child: const Text('Sàn so sánh giá'),
              ),
            ],
          ),
        ),
        const HomeCategories(),
        SectionTitle(
          'Được yêu thích nhất',
          action: TextButton(
            onPressed: () => go(context, Destination.explore),
            child: const Text('Xem tất cả →'),
          ),
        ),
        for (final cake in state.catalog.take(4))
          CakeCard(cake, key: ValueKey('home-${cake.id}')),
        Panel(
          color: Brand.cream,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SectionTitle('Bespoke Atelier'),
              const SizedBox(height: 8),
              const Text('Biến ý tưởng thành chiếc bánh của riêng bạn.'),
              const SizedBox(height: 16),
              TextField(
                controller: idea,
                maxLines: 3,
                decoration: const InputDecoration(
                  labelText: 'Ý tưởng của bạn',
                  hintText: 'Bánh sinh nhật cho bé, màu hồng pastel...',
                ),
              ),
              const SizedBox(height: 12),
              FilterChips(
                values: const {
                  'Hồng dịu': 'Hồng dịu',
                  'Xanh mát': 'Xanh mát',
                  'Kem ấm': 'Kem ấm',
                },
                selected: tone,
                onSelected: (v) => setState(() => tone = v),
              ),
              TextButton(
                onPressed: () {
                  if (idea.text.trim().isEmpty) {
                    feedback(context, 'Hãy nhập ý tưởng bánh của bạn.');
                    return;
                  }
                  setState(() => preview = true);
                },
                child: const Text('Xem trước ý tưởng'),
              ),
              if (preview)
                Text(
                  'Gợi ý mô phỏng: ${idea.text} · Tone $tone',
                  style: const TextStyle(color: Brand.wine),
                ),
              FilledButton(
                onPressed: () => go(context, Destination.studio),
                child: const Text('Thiết kế bánh theo yêu cầu'),
              ),
            ],
          ),
        ),
        const SectionTitle('Dễ dàng tạo nên niềm vui'),
        for (final step in state.fixtures.rows('HOW_IT_WORKS_STEPS'))
          Panel(
            child: InfoRow(
              textValue(step, 'title'),
              textValue(step, 'description', textValue(step, 'desc')),
            ),
          ),
        SectionTitle(
          'Tiệm bánh đối tác',
          action: TextButton(
            onPressed: () => go(context, Destination.vendorDashboard),
            child: const Text('Trở thành đối tác'),
          ),
        ),
        const StatusPill('TP. Hồ Chí Minh'),
        for (final store in state.stores.take(3))
          Panel(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  store.name,
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                Text(store.location),
                TextButton(
                  onPressed: () => go(context, Destination.explore),
                  child: const Text('Xem menu tiệm →'),
                ),
              ],
            ),
          ),
        const Divider(),
        const Text(
          'SweetCake',
          style: TextStyle(
            fontFamily: 'Quicksand',
            fontSize: 26,
            color: Brand.wine,
            fontWeight: FontWeight.w700,
          ),
        ),
        const Text('Bánh kem nghệ thuật & những khoảnh khắc ngọt ngào.'),
        ActionButtons(
          children: [
            TextButton(
              onPressed: () => go(context, Destination.auth),
              child: const Text('Đăng nhập / Đăng ký'),
            ),
            TextButton(
              onPressed: () => go(context, Destination.tracking),
              child: const Text('Theo dõi đơn hàng'),
            ),
            TextButton(
              onPressed: () => go(context, Destination.stores),
              child: const Text('Tiệm bánh đối tác'),
            ),
            TextButton(
              onPressed: () => showPolicies(context),
              child: const Text('Điều khoản & chính sách'),
            ),
          ],
        ),
      ],
    );
  }
}

Future<void> showPolicies(BuildContext context) async {
  final fixtures = AppScope.of(context).fixtures;
  var tab = 'terms', query = '';
  await showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    showDragHandle: true,
    builder: (context) => StatefulBuilder(
      builder: (context, refresh) => FractionallySizedBox(
        heightFactor: .9,
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SectionTitle('Điều khoản & chính sách'),
              const Text('Nội dung mẫu được giữ từ giao diện web SweetCake.'),
              const SizedBox(height: 12),
              FilterChips(
                values: const {
                  'terms': 'Điều khoản',
                  'privacy': 'Bảo mật',
                  'regulations': 'Quy chế sàn',
                },
                selected: tab,
                onSelected: (v) => refresh(() => tab = v),
              ),
              const SizedBox(height: 12),
              SearchField(
                hint: 'Tìm kiếm quy định...',
                onChanged: (v) => refresh(() => query = v),
              ),
              const SizedBox(height: 16),
              for (final line in strings(
                (fixtures.raw['POLICY_TEXT'] as Map?)?[tab],
              ).where((s) => s.toLowerCase().contains(query.toLowerCase())))
                Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Text(line),
                ),
            ],
          ),
        ),
      ),
    ),
  );
}
