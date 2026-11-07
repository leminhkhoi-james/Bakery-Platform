import 'package:bakery_mobile/main.dart';
import 'package:bakery_mobile/core/demo/demo_workspace.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('Scaffold khởi tạo không phát sinh exception', (tester) async {
    final workspace = DemoWorkspace();
    addTearDown(workspace.dispose);
    await tester.pumpWidget(BakeryApp(workspace: workspace));
    expect(find.text('Một chiếc bánh,\nthật là bạn.'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });
}
