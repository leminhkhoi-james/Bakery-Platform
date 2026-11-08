import 'package:flutter/material.dart';

import '../../features/admin/domain/admin_repository.dart';
import '../../features/auth/domain/demo_session.dart';
import '../../features/cake_ai/domain/design_repository.dart';
import '../../features/cart/domain/cart_repository.dart';
import '../../features/catalog/domain/catalog_repository.dart';
import '../../features/chat/domain/chat_repository.dart';
import '../../features/marketplace/domain/marketplace_repository.dart';
import '../../features/orders/domain/order_repository.dart';
import '../../features/subscription/domain/subscription_repository.dart';

/// Composition root của các repository local, không điều phối Backend.
class DemoWorkspace {
  final session = DemoSession();
  final catalog = LocalCatalogRepository();
  final cart = LocalCartRepository();
  final marketplace = LocalMarketplaceRepository();
  final orders = LocalOrderRepository();
  final chat = LocalChatRepository();
  final subscriptions = LocalSubscriptionRepository();
  final designs = LocalDesignRepository();
  final admin = LocalAdminRepository();
  late final Listenable changes = Listenable.merge([
    session,
    catalog,
    cart,
    marketplace,
    orders,
    chat,
    subscriptions,
    designs,
    admin,
  ]);
  void reset() {
    cart.reset();
    catalog.reset();
    marketplace.reset();
    orders.reset();
    chat.reset();
    subscriptions.reset();
    designs.reset();
    admin.reset();
  }

  void dispose() {
    for (final notifier in [
      session,
      catalog,
      cart,
      marketplace,
      orders,
      chat,
      subscriptions,
      designs,
      admin,
    ]) {
      notifier.dispose();
    }
  }
}

class DemoScope extends InheritedNotifier<Listenable> {
  DemoScope({super.key, required this.workspace, required super.child})
    : super(notifier: workspace.changes);
  final DemoWorkspace workspace;
  static DemoWorkspace of(BuildContext context) =>
      context.dependOnInheritedWidgetOfExactType<DemoScope>()!.workspace;
}
