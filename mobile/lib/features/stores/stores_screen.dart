import 'package:flutter/material.dart';

import '../../app/router/destination.dart';
import '../../core/widgets/common.dart';
import '../../state/app_state.dart';

class StoresScreen extends StatefulWidget {
  const StoresScreen({super.key});
  @override
  State<StoresScreen> createState() => _StoresScreenState();
}

class _StoresScreenState extends State<StoresScreen> {
  String search = '';
  @override
  Widget build(BuildContext context) {
    final state = AppScope.of(context);
    final stores = state.stores
        .where(
          (s) => '${s.name} ${s.location} ${s.chef} ${s.specialty}'
              .toLowerCase()
              .contains(search.toLowerCase()),
        )
        .toList();
    return PageBody(
      title: 'Tiệm bánh đối tác',
      eyebrow: 'Nghệ nhân quanh bạn',
      children: [
        StatusPill('TP. Hồ Chí Minh · ${state.stores.length} tiệm bánh'),
        SearchField(
          hint: 'Tìm tiệm, quận, bếp trưởng...',
          onChanged: (v) => setState(() => search = v),
        ),
        if (stores.isEmpty) const EmptyView(),
        for (final s in stores)
          Panel(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                CakePicture(s.image, height: 180, label: s.name),
                const SizedBox(height: 12),
                Text(s.name, style: Theme.of(context).textTheme.titleLarge),
                Text(s.location),
                const SizedBox(height: 12),
                OutlinedButton(
                  onPressed: () => go(context, Destination.explore),
                  child: const Text('Xem menu & mẫu bánh'),
                ),
                TextButton(
                  onPressed: () => go(context, Destination.studio),
                  child: const Text('Tự thiết kế bánh'),
                ),
              ],
            ),
          ),
      ],
    );
  }
}
