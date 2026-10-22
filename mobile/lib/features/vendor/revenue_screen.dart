import 'package:flutter/material.dart';

import '../../core/widgets/common.dart';
import '../../core/widgets/form_sheet.dart';
import '../../core/utils/formatters.dart';
import '../../state/app_state.dart';

class RevenueScreen extends StatefulWidget {
  const RevenueScreen({super.key});
  @override
  State<RevenueScreen> createState() => _RevenueScreenState();
}

class _RevenueScreenState extends State<RevenueScreen> {
  String query = '', filter = 'all';
  Future<void> withdraw() async {
    final state = AppScope.of(context);
    final result = await editForm(context, 'Rút tiền mô phỏng về ngân hàng', [
      FieldSpec(
        'amount',
        'Số tiền muốn rút (VNĐ)',
        initial: '${state.balance}',
        keyboard: TextInputType.number,
        validate: (v) => parseMoney(v) < 500000
            ? 'Hạn mức tối thiểu 500.000đ.'
            : parseMoney(v) > state.balance
            ? 'Vượt số dư khả dụng.'
            : null,
      ),
    ], submit: 'Xác nhận rút tiền mô phỏng');
    if (result == null || !mounted) return;
    final error = state.withdraw(parseMoney(result['amount']!));
    feedback(
      context,
      error ??
          'Đã ghi giao dịch rút tiền vào sổ mô phỏng. Không chuyển khoản thật.',
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = AppScope.of(context),
        transactions = state.repository.transactions
            .where(
              (t) =>
                  (filter == 'all' || t.status == filter) &&
                  '${t.orderId} ${t.title} ${t.customer}'
                      .toLowerCase()
                      .contains(query.toLowerCase()),
            )
            .toList();
    return PageBody(
      title: 'Doanh thu & Escrow',
      eyebrow: 'Ví tiệm bánh',
      subtitle: 'Số dư, ký quỹ và giao dịch đều là mô phỏng offline.',
      children: [
        Panel(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              InfoRow('Số dư khả dụng', vnd(state.balance)),
              FilledButton.icon(
                onPressed: withdraw,
                icon: const Icon(Icons.account_balance_outlined),
                label: const Text('Rút tiền về ngân hàng'),
              ),
              const InfoRow('Đang khóa Escrow', '14.200.000 ₫'),
              const InfoRow('Doanh thu tháng (fixture web)', '68.400.000 ₫'),
              const InfoRow(
                'Phí sàn trong trang doanh thu',
                '10% cố định (mô phỏng theo web)',
              ),
            ],
          ),
        ),
        FilterChips(
          values: const {
            'all': 'Tất cả',
            'released': 'Đã giải ngân',
            'locked': 'Đang khóa',
            'withdrawn': 'Đã rút',
          },
          selected: filter,
          onSelected: (v) => setState(() => filter = v),
        ),
        SearchField(
          hint: 'Mã đơn, khách, mẫu bánh...',
          onChanged: (v) => setState(() => query = v),
        ),
        if (transactions.isEmpty) const EmptyView(),
        for (final t in transactions)
          Panel(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(t.title, style: Theme.of(context).textTheme.titleMedium),
                Text('${t.orderId} · ${t.date}'),
                StatusPill(t.status),
                InfoRow('Tổng tiền', vnd(t.gross)),
                InfoRow('Phí sàn', vnd(t.fee)),
                InfoRow('Thực nhận', vnd(t.net)),
              ],
            ),
          ),
      ],
    );
  }
}
