import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

import '../../core/theme/app_theme.dart';

/// Native adaptation of HeroSection.jsx's striped booth and original cat SVG.
class PatisserieBooth extends StatelessWidget {
  const PatisserieBooth({super.key});
  static const mint = Color(0xFF6FB9C6), pink = Color(0xFFFFC6DB);
  @override
  Widget build(BuildContext context) => Column(
    children: [
      Container(
        padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 10),
        decoration: BoxDecoration(
          color: Brand.paper,
          border: Border.all(color: Brand.wine, width: 2),
          borderRadius: BorderRadius.circular(20),
        ),
        child: const Text(
          'SweetCake',
          style: TextStyle(
            fontFamily: 'Quicksand',
            fontSize: 22,
            fontWeight: FontWeight.w700,
            color: Brand.wine,
          ),
        ),
      ),
      const SizedBox(height: 6),
      Container(
        height: 42,
        clipBehavior: Clip.antiAlias,
        decoration: BoxDecoration(
          border: Border.all(color: Brand.wine, width: 2),
          borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Row(
          children: [
            for (var i = 0; i < 9; i++)
              Expanded(
                child: ColoredBox(
                  color: i.isEven ? Colors.white : mint,
                  child: const Center(
                    child: Icon(Icons.favorite, size: 12, color: Brand.wine),
                  ),
                ),
              ),
          ],
        ),
      ),
      Container(
        width: double.infinity,
        padding: const EdgeInsets.only(top: 12),
        decoration: BoxDecoration(
          color: pink.withValues(alpha: .2),
          border: const Border.symmetric(
            vertical: BorderSide(color: Brand.wine, width: 2),
          ),
        ),
        child: SvgPicture.asset(
          'assets/images/cat-baker.svg',
          height: 190,
          semanticsLabel: 'Mèo đầu bếp SweetCake từ giao diện web',
        ),
      ),
      Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
        decoration: BoxDecoration(
          color: pink,
          border: Border.all(color: Brand.wine, width: 2),
          borderRadius: const BorderRadius.vertical(
            bottom: Radius.circular(16),
          ),
        ),
        child: const Text(
          'Handmade · Fresh Daily · Custom Style',
          textAlign: TextAlign.center,
          style: TextStyle(
            color: Brand.wine,
            fontSize: 11,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
    ],
  );
}
