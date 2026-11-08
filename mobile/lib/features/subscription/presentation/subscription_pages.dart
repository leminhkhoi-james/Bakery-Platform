import 'package:flutter/material.dart';

import '../../../app/navigation/navigation.dart';
import '../../../app/router/screen_id.dart';
import '../../../app/theme/app_colors.dart';
import '../../../core/demo/demo_workspace.dart';
import '../../../core/widgets/sweetcake_scaffold.dart';
import '../../../core/widgets/sweetcake_widgets.dart';
import '../../auth/domain/demo_session.dart';
import '../domain/subscription_repository.dart';

class PlansPage extends StatelessWidget {
  const PlansPage({super.key});
  @override
  Widget build(BuildContext context) {
    final w = DemoScope.of(context);
    return SweetCakeScaffold(
      screen: ScreenId.plans,
      children: [
        const SCSection(
          'Cùng SweetCake nuôi lớn tiệm bánh',
          description: 'Gói thuê dành cho đối tác. Giá và hạn mức dưới đây là fixture để xem UI.',
        ),
        for (final plan in w.subscriptions.plans.where(
          (p) => p.status == 'ACTIVE',
        ))
          PlanCard(
            plan,
            onSelect: () {
              if (w.session.persona == Persona.guest) {
                openScreen(context, ScreenId.login);
                return;
              }
              if (w.session.persona == Persona.admin) {
                openScreen(context, ScreenId.adminPlans);
                return;
              }
              openScreen(context, ScreenId.vendorSubscription, id: plan.id);
            },
          ),
        const SCNotice(
          'Onboarding thật gồm hồ sơ tiệm, đơn gói, duyệt tiệm và duyệt chứng từ độc lập. Demo không cấp quyền thật, không chuyển khoản và không dùng sandbox của Backend.',
        ),
      ],
    );
  }
}

class PlanCard extends StatelessWidget {
  const PlanCard(this.plan, {super.key, required this.onSelect});
  final SubscriptionPlan plan;
  final VoidCallback onSelect;
  @override
  Widget build(BuildContext context) => SCCard(
    color: plan.id == 'PRO' ? AppColors.lightPink : AppColors.white,
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(plan.name, style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: 12),
        SCPrice(plan.price),
        const Text('/ tháng · dữ liệu mẫu'),
        const Divider(height: 32),
        SCKeyValue(
          'Sản phẩm',
          plan.products < 0 ? 'Không giới hạn' : '${plan.products}',
        ),
        SCKeyValue(
          'Báo giá / tháng',
          plan.offers < 0 ? 'Không giới hạn' : '${plan.offers}',
        ),
        const SizedBox(height: 16),
        SCButton('Xem và chọn gói', onPressed: onSelect),
      ],
    ),
  );
}

class VendorSubscriptionPage extends StatefulWidget {
  const VendorSubscriptionPage({super.key, this.planId});
  final String? planId;
  @override
  State<VendorSubscriptionPage> createState() => _VendorSubscriptionPageState();
}

class _VendorSubscriptionPageState extends State<VendorSubscriptionPage> {
  String? selected;
  @override
  void initState() {
    super.initState();
    selected = widget.planId ?? 'PRO';
  }

  @override
  Widget build(BuildContext context) {
    final w = DemoScope.of(context),
        bakery = w.catalog.bakery(w.session.selectedBakeryId);
    final orders = w.subscriptions.orders
        .where((o) => o.bakeryId == bakery.id)
        .toList();
    final activePlans = w.subscriptions.plans
        .where((p) => p.status == 'ACTIVE')
        .toList();
    if (!activePlans.any((p) => p.id == selected)) {
      selected = activePlans.isEmpty ? null : activePlans.first.id;
    }
    return SweetCakeScaffold(
      screen: ScreenId.vendorSubscription,
      children: [
        const BakerySelector(),
        SCSection(
          'Gói thuê của ${bakery.name}',
          description: 'Membership OWNER local · trạng thái tiệm và gói được duyệt riêng.',
        ),
        const SCNotice(
          'Không có tài khoản nhận tiền, QR thanh toán hay giao dịch thật. Chứng từ là ảnh bánh mẫu có nhãn minh họa.',
        ),
        if (w.session.persona == Persona.customer)
          const SCNotice(
            'Bạn đang xem hành trình đăng ký đối tác ở vai CUSTOMER demo. Hồ sơ local có sẵn; duyệt gói không tự đổi vai hiện tại.',
          ),
        DropdownButtonFormField<String>(
          key: ValueKey(selected),
          initialValue: selected,
          isExpanded: true,
          decoration: const InputDecoration(
            labelText: 'Gói lựa chọn · 1 tháng',
          ),
          items: [
            for (final p in w.subscriptions.plans.where(
              (p) => p.status == 'ACTIVE',
            ))
              DropdownMenuItem(
                value: p.id,
                child: Text('${p.name} · ${vnd(p.price)}'),
              ),
          ],
          onChanged: activePlans.isEmpty
              ? null
              : (v) => setState(() => selected = v),
        ),
        SCButton(
          'Tạo đơn gói local',
          onPressed: selected == null
              ? null
              : () => demoAction(
                  context,
                  () => w.subscriptions.create(
                    bakery.id,
                    w.subscriptions.plans.firstWhere((p) => p.id == selected),
                  ),
                ),
        ),
        if (activePlans.isEmpty)
          const SCNotice(
            'Chưa có gói đang cung cấp. Admin có thể mở lại một gói trong bản demo.',
            warning: true,
          ),
        const SCSection('Đơn và lịch sử gói'),
        if (orders.isEmpty)
          const SCStateView(
            title: 'Chưa có đơn gói',
            message: 'Chọn gói để xem quy trình tạo đơn local.',
          ),
        for (final o in orders)
          SCCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(o.id, style: Theme.of(context).textTheme.titleMedium),
                Text(o.planName),
                SCPrice(o.amount),
                SCStatusBadge(o.status),
                if (o.reference.isNotEmpty)
                  SCKeyValue('Tham chiếu demo', o.reference),
                if (o.note.isNotEmpty) SCNotice(o.note, warning: true),
                if (o.proof != null) ...[
                  const Text('Ảnh minh họa, không phải chứng từ thật'),
                  SCImage(o.proof!, height: 130),
                ],
                if (o.status == 'PENDING')
                  SCButton(
                    'Gửi tham chiếu minh họa',
                    outlined: true,
                    onPressed: () => showSCSheet(
                      context,
                      title: 'Chứng từ local',
                      child: ProofForm(order: o),
                    ),
                  ),
                if (o.status == 'PAID')
                  const SCNotice(
                    'Trạng thái PAID thuộc fixture/demo đã duyệt. Không xác nhận dòng tiền thực tế.',
                  ),
              ],
            ),
          ),
        const SCSection('Điều kiện sử dụng'),
        const Text(
          'Tiệm ACTIVE và gói hợp lệ mới đủ điều kiện vận hành theo hợp đồng Backend. Bản mobile hiện chỉ kiểm tra quy tắc UI, không xác minh hạn mức từ máy chủ.',
        ),
      ],
    );
  }
}

class ProofForm extends StatefulWidget {
  const ProofForm({super.key, required this.order});
  final SubscriptionOrder order;
  @override
  State<ProofForm> createState() => _ProofFormState();
}

class _ProofFormState extends State<ProofForm> {
  final reference = TextEditingController();
  bool proof = false;
  @override
  void dispose() {
    reference.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.stretch,
    children: [
      const SCNotice(
        'Chỉ nhập mã giả lập, không nhập dữ liệu ngân hàng hoặc thông tin cá nhân thật.',
      ),
      const SizedBox(height: 16),
      SCField(
        'Mã tham chiếu demo',
        controller: reference,
        requiredField: false,
      ),
      CheckboxListTile(
        value: proof,
        onChanged: (v) => setState(() => proof = v!),
        title: const Text('Đính kèm ảnh bánh mẫu thay chứng từ'),
      ),
      SCButton(
        'Gửi vào hàng chờ local',
        onPressed: () => demoAction(context, () {
          DemoScope.of(context).subscriptions.submit(
            widget.order,
            reference.text,
            proof ? 'assets/demo/cake_01.jpg' : null,
          );
          Navigator.pop(context);
        }),
      ),
    ],
  );
}
