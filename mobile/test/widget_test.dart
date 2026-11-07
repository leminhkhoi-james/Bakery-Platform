import 'package:bakery_mobile/main.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('Scaffold khởi tạo không phát sinh exception', (tester) async {
    await tester.pumpWidget(const BakeryApp());
    expect(find.text('Một chiếc bánh,\nthật là bạn.'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });
}
