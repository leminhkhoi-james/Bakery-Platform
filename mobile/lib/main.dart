import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';

import 'app/router/app_router.dart';
import 'app/router/live_router.dart';
import 'app/theme/app_theme.dart';
import 'core/demo/demo_workspace.dart';
import 'core/live/live_workspace.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const BakeryApp());
}

class BakeryApp extends StatefulWidget {
  const BakeryApp({
    super.key,
    this.workspace,
    this.liveWorkspace,
    this.initialRoute = '/',
    this.navigatorKey,
  });
  final DemoWorkspace? workspace;
  final LiveWorkspace? liveWorkspace;
  final String initialRoute;
  final GlobalKey<NavigatorState>? navigatorKey;
  @override
  State<BakeryApp> createState() => _BakeryAppState();
}

class _BakeryAppState extends State<BakeryApp> {
  late final workspace = widget.workspace;
  late final liveWorkspace = workspace == null
      ? widget.liveWorkspace ?? LiveWorkspace()
      : null;
  @override
  void initState() {
    super.initState();
    if (liveWorkspace != null) liveWorkspace!.session.restore();
  }

  @override
  void dispose() {
    if (widget.liveWorkspace == null) liveWorkspace?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => workspace != null
      ? DemoScope(
          workspace: workspace!,
          child: MaterialApp(
            title: 'SweetCake · Demo local',
            debugShowCheckedModeBanner: false,
            theme: SweetCakeTheme.light,
            locale: const Locale('vi'),
            supportedLocales: const [Locale('vi'), Locale('en')],
            localizationsDelegates: GlobalMaterialLocalizations.delegates,
            navigatorKey: widget.navigatorKey,
            initialRoute: widget.initialRoute,
            onGenerateRoute: (settings) =>
                AppRouter.generate(settings, workspace!),
          ),
        )
      : LiveScope(
          workspace: liveWorkspace!,
          child: ListenableBuilder(
            listenable: liveWorkspace!,
            builder: (context, _) => MaterialApp(
              key: ValueKey(liveWorkspace!.session.user?['id'] ?? 'guest'),
              title: 'SweetCake',
              debugShowCheckedModeBanner: false,
              theme: SweetCakeTheme.light,
              locale: const Locale('vi'),
              supportedLocales: const [Locale('vi'), Locale('en')],
              localizationsDelegates: GlobalMaterialLocalizations.delegates,
              navigatorKey: widget.navigatorKey,
              initialRoute: widget.initialRoute,
              onGenerateRoute: LiveRouter.generate,
            ),
          ),
        );
}
