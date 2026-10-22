import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';

import '../core/theme/app_theme.dart';
import '../state/app_state.dart';
import 'router/app_router.dart';
import 'router/destination.dart';

class SweetCakeApp extends StatelessWidget {
  const SweetCakeApp({
    super.key,
    required this.state,
    this.initialDestination = Destination.home,
    this.navigatorKey,
  });
  final AppState state;
  final Destination initialDestination;
  final GlobalKey<NavigatorState>? navigatorKey;
  @override
  Widget build(BuildContext context) => AppScope(
    state: state,
    child: MaterialApp(
      title: 'SweetCake',
      debugShowCheckedModeBanner: false,
      theme: Brand.theme,
      locale: const Locale('vi'),
      supportedLocales: const [Locale('vi'), Locale('en')],
      localizationsDelegates: GlobalMaterialLocalizations.delegates,
      navigatorKey: navigatorKey,
      initialRoute: '/${initialDestination.name}',
      onGenerateInitialRoutes: (name) => [appRoute(RouteSettings(name: name))],
      onGenerateRoute: appRoute,
    ),
  );
}
