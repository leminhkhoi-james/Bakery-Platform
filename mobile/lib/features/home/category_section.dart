import 'package:flutter/material.dart';

import '../../app/router/destination.dart';
import '../../core/widgets/common.dart';
import '../../models/catalog.dart';
import '../../state/app_state.dart';

class HomeCategories extends StatelessWidget {
  const HomeCategories({super.key});
  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.stretch,
    children: [
      const SectionTitle('Bạn thích loại bánh nào?'),
      for (final category in AppScope.of(
        context,
      ).fixtures.rows('BENTO_CATEGORIES'))
        Padding(
          padding: const EdgeInsets.only(top: 16),
          child: Panel(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                CakePicture(
                  textValue(category, 'image'),
                  height: 140,
                  label: textValue(category, 'title'),
                ),
                const SizedBox(height: 12),
                Text(
                  textValue(category, 'title'),
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                Text(textValue(category, 'desc')),
                TextButton(
                  onPressed: () => go(
                    context,
                    Destination.explore,
                    switch (textValue(category, 'id')) {
                      'bento-1' => 'Bánh Kem Sinh Nhật',
                      'bento-2' => 'Bánh Cưới (Wedding)',
                      'bento-3' => 'Bánh Mousse',
                      'bento-4' => 'Bánh Trung Thu & Quà Tặng',
                      'bento-5' => 'Bánh Tạo Hình 3D',
                      _ => 'all',
                    },
                  ),
                  child: const Text('Khám phá danh mục này →'),
                ),
              ],
            ),
          ),
        ),
    ],
  );
}
