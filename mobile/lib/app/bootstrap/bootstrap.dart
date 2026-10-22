import 'package:flutter/material.dart';

import '../../core/theme/app_theme.dart';
import '../../mocks/fixture_bundle.dart';
import '../../state/app_state.dart';
import '../app.dart';

class Bootstrap extends StatefulWidget {
  const Bootstrap({super.key, this.loader});
  final Future<FixtureBundle> Function()? loader;
  @override
  State<Bootstrap> createState() => _BootstrapState();
}

class _BootstrapState extends State<Bootstrap> {
  late Future<FixtureBundle> future = (widget.loader ?? FixtureBundle.load)();
  AppState? state;
  @override
  void dispose() {
    state?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => FutureBuilder<FixtureBundle>(
    future: future,
    builder: (context, snapshot) {
      if (snapshot.hasData) {
        state ??= AppState(snapshot.data!);
        return SweetCakeApp(state: state!);
      }
      return MaterialApp(
        debugShowCheckedModeBanner: false,
        theme: Brand.theme,
        home: Scaffold(
          body: SafeArea(
            child: Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Image.asset('assets/images/brand-logo.png', width: 180),
                    const SizedBox(height: 24),
                    if (snapshot.hasError) ...[
                      const Text(
                        'Không thể mở dữ liệu mẫu cục bộ. Vui lòng thử lại.',
                      ),
                      const SizedBox(height: 16),
                      FilledButton(
                        onPressed: () {
                          final retry = (widget.loader ?? FixtureBundle.load)();
                          setState(() {
                            future = retry;
                          });
                        },
                        child: const Text('Thử lại'),
                      ),
                    ] else ...[
                      const CircularProgressIndicator(),
                      const SizedBox(height: 16),
                      const Text('Đang mở xưởng bánh...'),
                    ],
                  ],
                ),
              ),
            ),
          ),
        ),
      );
    },
  );
}
