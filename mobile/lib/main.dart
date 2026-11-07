import 'package:flutter/material.dart';

void main() => runApp(const BakeryApp());

/// Điểm khởi động tối thiểu; chưa triển khai giao diện hoặc nghiệp vụ.
class BakeryApp extends StatelessWidget {
  const BakeryApp({super.key});

  @override
  Widget build(BuildContext context) {
    return const MaterialApp(
      title: 'Bakery Platform',
      home: Scaffold(body: SizedBox.expand()),
    );
  }
}
