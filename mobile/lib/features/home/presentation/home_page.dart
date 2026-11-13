import 'package:flutter/material.dart';

import '../../../app/navigation/navigation.dart';
import '../../../app/router/screen_id.dart';
import '../../../app/theme/app_colors.dart';
import '../../../core/demo/demo_workspace.dart';
import '../../../core/widgets/sweetcake_scaffold.dart';
import '../../../core/widgets/sweetcake_widgets.dart';
import '../../catalog/presentation/catalog_widgets.dart';

class HomePage extends StatelessWidget {
  const HomePage({super.key});
  @override
  Widget build(BuildContext context) {
    final w = DemoScope.of(context);
    return SweetCakeScaffold(
      screen: ScreenId.home,
      children: [
        SCCard(
          padding: EdgeInsets.zero,
          color: AppColors.pagePink,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(
                height: 20,
                child: CustomPaint(painter: _CandyStripePainter()),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(24, 20, 24, 28),
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
                      'Tìm vị ngọt cho những ngày đáng nhớ. Chọn bánh có sẵn hoặc kể tiệm nghe ý tưởng của bạn.',
                    ),
                    const SizedBox(height: 20),
                    SCButton(
                      'Khám phá bánh',
                      icon: Icons.arrow_forward,
                      onPressed: () => openScreen(context, ScreenId.explore),
                    ),
                    TextButton(
                      onPressed: () => openScreen(context, ScreenId.studio),
                      child: const Text('Thiết kế theo ý tưởng của bạn'),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SCSection('Hôm nay bạn thích bánh gì?'),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            for (final category in w.catalog.categories)
              ActionChip(
                avatar: const Icon(Icons.cake_outlined, size: 18),
                label: Text(category),
                onPressed: () =>
                    openScreen(context, ScreenId.explore, relatedId: category),
              ),
          ],
        ),
        SCSection(
          'Mẫu bánh mới nhất',
          description: 'Ảnh và giá trong bộ dữ liệu minh họa local.',
          action: 'Xem tất cả',
          onAction: () => openScreen(context, ScreenId.explore),
        ),
        ProductGrid(w.catalog.published.take(4).toList()),
        SCCard(
          color: AppColors.softPink,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Bạn kể ý tưởng.\nBánh sẽ thành hình.',
                style: Theme.of(context).textTheme.headlineSmall,
              ),
              const SizedBox(height: 12),
              const Text(
                'Lưu yêu cầu, tham khảo báo giá và trao đổi với tiệm trong không gian demo của bạn.',
              ),
              const SizedBox(height: 16),
              SCButton(
                'Tạo yêu cầu bánh',
                onPressed: () => openScreen(context, ScreenId.requestNew),
                icon: Icons.edit_note,
              ),
            ],
          ),
        ),
        SCSection(
          'Tiệm bánh đối tác',
          action: 'Xem các tiệm',
          onAction: () => openScreen(context, ScreenId.stores),
        ),
        BakeryCard(
          w.catalog.bakery('bakery-01'),
          image: 'assets/demo/cake_02.jpg',
        ),
        const SCNotice(
          'Bản xem trước UI hoạt động offline. Không gửi đơn, tiền, tin nhắn hoặc yêu cầu AI ra ngoài thiết bị.',
        ),
      ],
    );
  }
}

class _CandyStripePainter extends CustomPainter {
  const _CandyStripePainter();
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..color = AppColors.mint;
    for (double x = 0; x < size.width; x += 32) {
      canvas.drawRect(Rect.fromLTWH(x, 0, 16, size.height), paint);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
