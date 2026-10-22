import 'package:flutter/services.dart';

Future<void> loadBrandFonts() async {
  for (final family in ['Quicksand', 'PlusJakartaSans']) {
    final loader = FontLoader(family)
      ..addFont(rootBundle.load('assets/fonts/$family.ttf'));
    await loader.load();
  }
  final icons = FontLoader('MaterialIcons')
    ..addFont(rootBundle.load('fonts/MaterialIcons-Regular.otf'));
  await icons.load();
}
