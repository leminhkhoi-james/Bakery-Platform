import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';

import 'app/router/app_router.dart';
import 'app/theme/app_theme.dart';
import 'core/demo/demo_workspace.dart';

void main() => runApp(const BakeryApp());

class BakeryApp extends StatefulWidget {
  const BakeryApp({
    super.key,
    this.workspace,
    this.initialRoute = '/',
    this.navigatorKey,
  });
  final DemoWorkspace? workspace;
  final String initialRoute;
  final GlobalKey<NavigatorState>? navigatorKey;
  @override
  State<BakeryApp> createState() => _BakeryAppState();
}

class _BakeryAppState extends State<BakeryApp> {
  late final workspace = widget.workspace ?? DemoWorkspace();
  @override
  void dispose() {
    if (widget.workspace == null) workspace.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => DemoScope(
    workspace: workspace,
    child: MaterialApp(
      title: 'SweetCake · Demo local',
      debugShowCheckedModeBanner: false,
      theme: SweetCakeTheme.light,
      locale: const Locale('vi'),
      supportedLocales: const [Locale('vi'), Locale('en')],
      localizationsDelegates: GlobalMaterialLocalizations.delegates,
      navigatorKey: widget.navigatorKey,
      initialRoute: widget.initialRoute,
      onGenerateRoute: (settings) => AppRouter.generate(settings, workspace),
    ),
  );
}
