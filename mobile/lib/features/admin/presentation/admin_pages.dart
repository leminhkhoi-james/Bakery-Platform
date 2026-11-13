import 'package:flutter/material.dart';

import '../../../app/navigation/navigation.dart';
import '../../../app/router/screen_id.dart';
import '../../../core/demo/demo_workspace.dart';
import '../../../core/widgets/sweetcake_scaffold.dart';
import '../../../core/widgets/sweetcake_widgets.dart';
import '../../catalog/presentation/vendor_catalog_page.dart';
import '../../catalog/presentation/vendor_workspace_pages.dart';
import '../../marketplace/presentation/offer_pages.dart';
import '../../subscription/domain/subscription_repository.dart';
import '../domain/admin_repository.dart';

class AdminDashboardPage extends StatelessWidget {
  const AdminDashboardPage({super.key});
  @override
  Widget build(BuildContext context) {
    final w = DemoScope.of(context);
    return SweetCakeScaffold(
      screen: ScreenId.adminDashboard,
      children: [
        const SCSection(
          'Bàn làm việc quản trị',
          description:
              'Hàng chờ từ fixture local, không phải dữ liệu nền tảng thật.',
        ),
        MetricGrid(
          items: [
            ('Người dùng', '${w.admin.users.length}'),
            (
              'Tiệm chờ duyệt',
              '${w.catalog.bakeries.where((b) => b.status == 'PENDING_APPROVAL').length}',
            ),
            (
              'Chứng từ chờ',
              '${w.subscriptions.orders.where((o) => o.status == 'PAYMENT_REVIEW').length}',
            ),
            (
              'Thiết kế chờ',
              '${w.designs.drafts.where((d) => d.moderation == 'PENDING').length}',
            ),
          ],
        ),
        SCButton(
          'Duyệt hồ sơ tiệm',
          icon: Icons.storefront_outlined,
          onPressed: () => openScreen(context, ScreenId.adminBakeries),
        ),
        SCButton(
          'Duyệt chứng từ gói',
          outlined: true,
          onPressed: () => openScreen(context, ScreenId.adminPayments),
        ),
        const SCSection('Quản lý nền tảng'),
        for (final s in [
          ScreenId.adminUsers,
          ScreenId.adminPlans,
          ScreenId.adminOrders,
          ScreenId.adminModeration,
          ScreenId.adminRevenue,
        ])
          SCCard(
            onTap: () => openScreen(context, s),
            child: Row(
              children: [
                Expanded(child: Text(s.title)),
                const Icon(Icons.arrow_forward),
              ],
            ),
          ),
      ],
    );
  }
}

class AdminUsersPage extends StatefulWidget {
  const AdminUsersPage({super.key});
  @override
  State<AdminUsersPage> createState() => _AdminUsersPageState();
}

class _AdminUsersPageState extends State<AdminUsersPage> {
  String query = '', role = 'ALL';
  int limit = 2;
  @override
  Widget build(BuildContext context) {
    final w = DemoScope.of(context);
    final users = w.admin.users
        .where(
          (u) =>
              '${u.name} ${u.email}'.toLowerCase().contains(
                query.toLowerCase(),
              ) &&
              (role == 'ALL' || role == u.role),
        )
        .toList();
    return SweetCakeScaffold(
      screen: ScreenId.adminUsers,
      children: [
        SCSearch(
          hint: 'Tìm tên hoặc email demo',
          onChanged: (v) => setState(() {
            query = v;
            limit = 2;
          }),
        ),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            for (final r in ['ALL', 'CUSTOMER', 'BAKERY_OWNER', 'ADMIN'])
              ChoiceChip(
                label: Text(r == 'ALL' ? 'Tất cả' : r),
                selected: role == r,
                onSelected: (_) => setState(() => role = r),
              ),
          ],
        ),
        SCButton(
          'Thêm người dùng local',
          icon: Icons.person_add_alt,
          onPressed: () => _edit(context),
        ),
        if (users.isEmpty)
          const SCStateView(
            title: 'Không tìm thấy người dùng',
            message: 'Thử từ khóa hoặc vai khác.',
          ),
        for (final u in users.take(limit))
          SCCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(u.name, style: Theme.of(context).textTheme.titleMedium),
                Text(u.email),
                Text(u.role),
                SCStatusBadge(u.status),
                Wrap(
                  children: [
                    TextButton(
                      onPressed: () => _edit(context, u),
                      child: const Text('Chỉnh sửa'),
                    ),
                    TextButton(
                      onPressed: u.role == 'ADMIN'
                          ? null
                          : () {
                              u.status = u.status == 'ACTIVE'
                                  ? 'SUSPENDED'
                                  : 'ACTIVE';
                              w.admin.changed();
                            },
                      child: Text(
                        u.status == 'ACTIVE' ? 'Khóa local' : 'Mở khóa local',
                      ),
                    ),
                    TextButton(
                      onPressed: u.role == 'ADMIN'
                          ? null
                          : () async {
                              if (await confirmDemo(
                                    context,
                                    title: 'Xóa người dùng demo?',
                                    message: 'Không tác động tài khoản thật.',
                                  ) &&
                                  context.mounted) {
                                demoAction(context, () => w.admin.remove(u));
                              }
                            },
                      child: const Text('Xóa'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        if (users.length > limit)
          SCButton(
            'Xem thêm người dùng',
            outlined: true,
            onPressed: () => setState(() => limit += 2),
          ),
        const SCNotice(
          'CRUD người dùng chưa có hợp đồng Backend đầy đủ. Các thay đổi ở đây chỉ thử UI, không cấp vai hoặc thay mật khẩu thật.',
        ),
      ],
    );
  }

  void _edit(BuildContext context, [AdminDemoUser? user]) => showSCSheet(
    context,
    title: 'Người dùng local',
    child: UserEditor(user: user),
  );
}

class UserEditor extends StatefulWidget {
  const UserEditor({super.key, this.user});
  final AdminDemoUser? user;
  @override
  State<UserEditor> createState() => _UserEditorState();
}

class _UserEditorState extends State<UserEditor> {
  late final name = TextEditingController(text: widget.user?.name ?? '');
  late final email = TextEditingController(text: widget.user?.email ?? '');
  late String role = widget.user?.role ?? 'CUSTOMER';
  final form = GlobalKey<FormState>();
  @override
  void dispose() {
    name.dispose();
    email.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Form(
    key: form,
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        SCField('Họ tên', controller: name),
        SCField(
          'Email minh họa',
          controller: email,
          keyboardType: TextInputType.emailAddress,
          validator: (v) =>
              RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$').hasMatch(v ?? '')
              ? null
              : 'Email chưa đúng định dạng.',
        ),
        DropdownButtonFormField<String>(
          initialValue: role,
          isExpanded: true,
          decoration: const InputDecoration(labelText: 'Vai local'),
          items: [
            for (final r in ['CUSTOMER', 'BAKERY_OWNER', 'ADMIN'])
              DropdownMenuItem(value: r, child: Text(r)),
          ],
          onChanged: widget.user?.role == 'ADMIN' ? null : (v) => role = v!,
        ),
        const SizedBox(height: 16),
        SCButton(
          'Lưu người dùng demo',
          onPressed: () {
            if (!form.currentState!.validate()) return;
            demoAction(context, () {
              final repo = DemoScope.of(context).admin;
              final u =
                  widget.user ??
                  AdminDemoUser(
                    'user-local-${repo.users.length + 10}',
                    name.text,
                    email.text,
                    role,
                  );
              u.name = name.text;
              u.email = email.text;
              u.role = role;
              repo.save(u);
              Navigator.pop(context);
            });
          },
        ),
      ],
    ),
  );
}

class AdminBakeriesPage extends StatefulWidget {
  const AdminBakeriesPage({super.key});
  @override
  State<AdminBakeriesPage> createState() => _AdminBakeriesPageState();
}

class _AdminBakeriesPageState extends State<AdminBakeriesPage> {
  String query = '', status = 'ALL';
  @override
  Widget build(BuildContext context) {
    final w = DemoScope.of(context),
        bakeries = w.catalog.bakeries.where(
          (b) =>
              b.name.toLowerCase().contains(query.toLowerCase()) &&
              (status == 'ALL' || b.status == status),
        );
    return SweetCakeScaffold(
      screen: ScreenId.adminBakeries,
      children: [
        SCSearch(
          hint: 'Tìm tiệm bánh',
          onChanged: (v) => setState(() => query = v),
        ),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            for (final s in [
              'ALL',
              'PENDING_APPROVAL',
              'ACTIVE',
              'SUSPENDED',
              'CLOSED',
            ])
              FilterChip(
                label: Text(statusLabels[s] ?? (s == 'ALL' ? 'Tất cả' : s)),
                selected: status == s,
                onSelected: (_) => setState(() => status = s),
              ),
          ],
        ),
        if (bakeries.isEmpty)
          const SCStateView(
            title: 'Không có hồ sơ phù hợp',
            message: 'Thử trạng thái khác.',
          ),
        for (final b in bakeries)
          SCCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(b.name, style: Theme.of(context).textTheme.titleLarge),
                SCStatusBadge(b.status),
                Text(b.address),
                ExpansionTile(
                  tilePadding: EdgeInsets.zero,
                  title: const Text('Chi tiết hồ sơ'),
                  children: [
                    SCKeyValue('Khu vực', b.district),
                    SCKeyValue('Giờ mở', b.hours),
                    Text(b.description),
                    const SCNotice(
                      'Tài liệu pháp lý chưa có trong fixture. Duyệt dưới đây chỉ minh họa chuyển trạng thái local.',
                    ),
                  ],
                ),
                Wrap(
                  children: [
                    if (b.status == 'PENDING_APPROVAL')
                      TextButton(
                        onPressed: () async {
                          if (await confirmDemo(
                                context,
                                title: 'Duyệt tiệm trong demo?',
                                message: 'Chỉ chuyển hồ sơ local sang ACTIVE; không cấp JWT hay vai thật.',
                              ) &&
                              context.mounted) {
                            b.status = 'ACTIVE';
                            w.catalog.changed();
                          }
                        },
                        child: const Text('Duyệt local'),
                      ),
                    if (b.status == 'PENDING_APPROVAL')
                      TextButton(
                        onPressed: () => showSCSheet(
                          context,
                          title: 'Lý do cần bổ sung',
                          child: LocalTextEditor(
                            label: 'Lý do',
                            onSave: (v) {
                              b.status = 'DRAFT';
                              b.description =
                                  '${b.description}\nYêu cầu bổ sung local: $v';
                              w.catalog.changed();
                            },
                          ),
                        ),
                        child: const Text('Yêu cầu bổ sung'),
                      ),
                    if (['ACTIVE', 'SUSPENDED'].contains(b.status))
                      TextButton(
                        onPressed: () async {
                          if (await confirmDemo(
                                context,
                                title: b.status == 'ACTIVE'
                                    ? 'Tạm dừng tiệm local?'
                                    : 'Mở lại tiệm local?',
                                message: 'Catalog công khai local sẽ thay đổi theo trạng thái tiệm.',
                              ) &&
                              context.mounted) {
                            b.status = b.status == 'ACTIVE'
                                ? 'SUSPENDED'
                                : 'ACTIVE';
                            w.catalog.changed();
                          }
                        },
                        child: Text(
                          b.status == 'ACTIVE' ? 'Tạm dừng' : 'Mở lại',
                        ),
                      ),
                  ],
                ),
              ],
            ),
          ),
      ],
    );
  }
}

class AdminPaymentsPage extends StatefulWidget {
  const AdminPaymentsPage({super.key});
  @override
  State<AdminPaymentsPage> createState() => _AdminPaymentsPageState();
}

class _AdminPaymentsPageState extends State<AdminPaymentsPage> {
  String status = 'PAYMENT_REVIEW';
  @override
  Widget build(BuildContext context) {
    final w = DemoScope.of(context),
        orders = w.subscriptions.orders
            .where((o) => status == 'ALL' || status == o.status)
            .toList();
    return SweetCakeScaffold(
      screen: ScreenId.adminPayments,
      children: [
        const SCNotice(
          'Chỉ duyệt chứng từ gói thuê trong bộ nhớ demo. Không xác nhận thanh toán bánh, escrow hay tiền thật.',
        ),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            for (final s in ['PAYMENT_REVIEW', 'PENDING', 'PAID', 'ALL'])
              ChoiceChip(
                label: Text(statusLabels[s] ?? (s == 'ALL' ? 'Tất cả' : s)),
                selected: status == s,
                onSelected: (_) => setState(() => status = s),
              ),
          ],
        ),
        if (orders.isEmpty)
          const SCStateView(
            title: 'Hàng chờ đã trống',
            message: 'Thay bộ lọc để xem lịch sử local.',
          ),
        for (final o in orders)
          SCCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(o.id, style: Theme.of(context).textTheme.titleMedium),
                Text(w.catalog.bakery(o.bakeryId).name),
                Text(o.planName),
                SCPrice(o.amount),
                SCStatusBadge(o.status),
                SCKeyValue(
                  'Tham chiếu demo',
                  o.reference.isEmpty ? 'Chưa có' : o.reference,
                ),
                if (o.proof != null) ...[
                  const Text('Ảnh mẫu, không phải chứng từ thật'),
                  SCImage(o.proof!, height: 180),
                ],
                if (o.note.isNotEmpty) Text(o.note),
                if (o.status == 'PAYMENT_REVIEW') ...[
                  SCButton(
                    'Duyệt trong bản demo',
                    onPressed: () async {
                      if (await confirmDemo(
                            context,
                            title: 'Duyệt chứng từ local?',
                            message: 'Chuyển trạng thái đơn gói local sang PAID, không tác động giao dịch thật.',
                          ) &&
                          context.mounted) {
                        demoAction(
                          context,
                          () => w.subscriptions.review(
                            o,
                            approve: true,
                            note: 'Đã duyệt trong bản demo',
                          ),
                        );
                      }
                    },
                  ),
                  const SizedBox(height: 8),
                  SCButton(
                    'Từ chối và ghi lý do',
                    outlined: true,
                    onPressed: () => showSCSheet(
                      context,
                      title: 'Từ chối chứng từ local',
                      child: LocalTextEditor(
                        label: 'Lý do từ chối',
                        onSave: (v) =>
                            w.subscriptions.review(o, approve: false, note: v),
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
      ],
    );
  }
}

class AdminPlansPage extends StatelessWidget {
  const AdminPlansPage({super.key});
  @override
  Widget build(BuildContext context) {
    final w = DemoScope.of(context);
    return SweetCakeScaffold(
      screen: ScreenId.adminPlans,
      children: [
        SCButton(
          'Tạo gói local',
          icon: Icons.add,
          onPressed: () => showSCSheet(
            context,
            title: 'Gói thuê mới',
            child: const PlanEditor(),
          ),
        ),
        for (final p in w.subscriptions.plans)
          SCCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(p.name, style: Theme.of(context).textTheme.titleLarge),
                SCPrice(p.price),
                SCKeyValue(
                  'Giới hạn sản phẩm',
                  p.products < 0 ? 'Không giới hạn' : '${p.products}',
                ),
                SCKeyValue(
                  'Báo giá / tháng',
                  p.offers < 0 ? 'Không giới hạn' : '${p.offers}',
                ),
                SCStatusBadge(p.status),
                Wrap(
                  children: [
                    TextButton(
                      onPressed: () => showSCSheet(
                        context,
                        title: 'Sửa gói local',
                        child: PlanEditor(plan: p),
                      ),
                      child: const Text('Chỉnh sửa'),
                    ),
                    TextButton(
                      onPressed: () {
                        p.status = p.status == 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
                        w.subscriptions.changed();
                      },
                      child: Text(
                        p.status == 'ACTIVE'
                            ? 'Ngừng cung cấp local'
                            : 'Cung cấp lại local',
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        const SCNotice(
          'Đơn đã tạo giữ giá snapshot. Thay giá gói local không sửa số tiền của đơn cũ.',
        ),
      ],
    );
  }
}

class PlanEditor extends StatefulWidget {
  const PlanEditor({super.key, this.plan});
  final SubscriptionPlan? plan;
  @override
  State<PlanEditor> createState() => _PlanEditorState();
}

class _PlanEditorState extends State<PlanEditor> {
  final form = GlobalKey<FormState>();
  late final fields = [
    widget.plan?.name ?? '',
    '${widget.plan?.price ?? 199000}',
    '${widget.plan?.products ?? 20}',
    '${widget.plan?.offers ?? 30}',
  ].map((s) => TextEditingController(text: s)).toList();
  @override
  void dispose() {
    for (final c in fields) {
      c.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Form(
    key: form,
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        for (var i = 0; i < fields.length; i++)
          SCField(
            [
              'Tên gói',
              'Giá tháng (VND)',
              'Sản phẩm (-1 = không giới hạn)',
              'Báo giá / tháng (-1 = không giới hạn)',
            ][i],
            controller: fields[i],
            keyboardType: i > 0
                ? const TextInputType.numberWithOptions(signed: true)
                : null,
            validator: i == 0
                ? null
                : i == 1
                ? moneyValidation
                : (v) => int.tryParse(v ?? '') == null || int.parse(v!) < -1
                      ? 'Nhập -1 hoặc số nguyên không âm.'
                      : null,
          ),
        SCButton(
          'Lưu gói demo',
          onPressed: () {
            if (!form.currentState!.validate()) return;
            demoAction(context, () {
              final repo = DemoScope.of(context).subscriptions;
              final p =
                  widget.plan ??
                  SubscriptionPlan(
                    'LOCAL-${repo.plans.length}',
                    fields[0].text,
                    int.parse(fields[1].text),
                    int.parse(fields[2].text),
                    int.parse(fields[3].text),
                  );
              p.name = fields[0].text;
              p.price = int.parse(fields[1].text);
              p.products = int.parse(fields[2].text);
              p.offers = int.parse(fields[3].text);
              repo.savePlan(p);
              Navigator.pop(context);
            });
          },
        ),
      ],
    ),
  );
}

class AdminModerationPage extends StatefulWidget {
  const AdminModerationPage({super.key});
  @override
  State<AdminModerationPage> createState() => _AdminModerationPageState();
}

class _AdminModerationPageState extends State<AdminModerationPage> {
  bool designs = true;
  @override
  Widget build(BuildContext context) {
    final w = DemoScope.of(context),
        reviews = w.orders.orders.where((o) => o.review != null).toList();
    return SweetCakeScaffold(
      screen: ScreenId.adminModeration,
      children: [
        Wrap(
          spacing: 8,
          children: [
            ChoiceChip(
              label: const Text('Thiết kế'),
              selected: designs,
              onSelected: (_) => setState(() => designs = true),
            ),
            ChoiceChip(
              label: const Text('Đánh giá'),
              selected: !designs,
              onSelected: (_) => setState(() => designs = false),
            ),
          ],
        ),
        if (designs)
          for (final d in w.designs.drafts)
            SCCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SCImage(d.image, height: 180),
                  Text(d.prompt),
                  SCStatusBadge(d.moderation),
                  Wrap(
                    children: [
                      TextButton(
                        onPressed: () => w.designs.moderate(d, 'APPROVED'),
                        child: const Text('Duyệt local'),
                      ),
                      TextButton(
                        onPressed: () => showSCSheet(
                          context,
                          title: 'Lý do từ chối thiết kế',
                          child: LocalTextEditor(
                            label: 'Lý do',
                            onSave: (v) {
                              d.revisions.add('Kiểm duyệt demo: $v');
                              w.designs.moderate(d, 'REJECTED');
                            },
                          ),
                        ),
                        child: const Text('Từ chối local'),
                      ),
                    ],
                  ),
                ],
              ),
            ),
        if (!designs && reviews.isEmpty)
          const SCStateView(
            title: 'Chưa có đánh giá để duyệt',
            message: 'Chuyển sang CUSTOMER demo, mở đơn hoàn tất để thêm đánh giá local.',
          ),
        if (!designs)
          for (final o in reviews)
            SCCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    o.productName,
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  Text('${o.rating}/5 · ${o.review}'),
                  SCStatusBadge(o.reviewStatus),
                  TextButton(
                    onPressed: () => w.orders.moderate(
                      o,
                      o.reviewStatus == 'PUBLISHED' ? 'HIDDEN' : 'PUBLISHED',
                    ),
                    child: Text(
                      o.reviewStatus == 'PUBLISHED'
                          ? 'Ẩn đánh giá local'
                          : 'Hiển thị lại local',
                    ),
                  ),
                ],
              ),
            ),
        const SCNotice(
          'Không gọi AI hoặc dịch vụ kiểm duyệt. Quyết định chỉ tồn tại trong fixture phiên này.',
        ),
      ],
    );
  }
}

class AdminRevenuePage extends StatelessWidget {
  const AdminRevenuePage({super.key});
  @override
  Widget build(BuildContext context) {
    final repo = DemoScope.of(context).subscriptions;
    return SweetCakeScaffold(
      screen: ScreenId.adminRevenue,
      children: [
        const SCSection(
          'Gói thuê đã duyệt · demo',
          description: 'Chỉ tổng hợp đơn gói có trạng thái PAID trong fixture.',
        ),
        MetricGrid(
          items: [
            ('Tổng giá trị gói demo', vnd(repo.approvedTotal)),
            (
              'Đơn gói PAID',
              '${repo.orders.where((o) => o.status == 'PAID').length}',
            ),
          ],
        ),
        for (final p in repo.plans)
          SCKeyValue(
            p.name,
            vnd(
              repo.orders
                  .where((o) => o.status == 'PAID' && o.planName == p.name)
                  .fold<int>(0, (s, o) => s + o.amount),
            ),
          ),
        const SCNotice(
          'Không bao gồm doanh thu bán bánh, tiền giữ hộ hay tiền có thể rút. Số liệu mẫu không chứng minh đã nhận thanh toán thật.',
        ),
        SCButton(
          'Đối chiếu đơn gói local',
          outlined: true,
          onPressed: () => openScreen(context, ScreenId.adminPayments),
        ),
      ],
    );
  }
}
