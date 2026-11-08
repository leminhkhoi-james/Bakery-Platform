import 'package:flutter/material.dart';

import '../router/screen_id.dart';

void openScreen(
  BuildContext context,
  ScreenId screen, {
  String? id,
  String? relatedId,
  int tab = 0,
  bool replace = false,
}) {
  final args = ScreenArguments(id: id, relatedId: relatedId, tab: tab);
  if (replace) {
    Navigator.of(context).pushReplacementNamed(screen.path, arguments: args);
  } else {
    Navigator.of(context).pushNamed(screen.path, arguments: args);
  }
}
