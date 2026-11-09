import 'dart:async';

import 'package:flutter/widgets.dart';

import '../api/api_client.dart';
import '../api/contracts.dart';
import '../api/environment.dart';
import '../api/transport.dart';
import '../../features/auth/data/live_session.dart';
import '../../features/auth/data/session_store.dart';
import '../../features/catalog/data/live_bakery_repository.dart';
import '../../features/catalog/data/live_catalog_repository.dart';
import '../../features/subscription/data/live_subscription_repository.dart';
import '../../features/marketplace/data/live_marketplace_repository.dart';
import '../../features/orders/data/live_order_repository.dart';
import '../../features/chat/data/live_chat_repository.dart';
import '../../features/chat/data/pending_chat_journal.dart';
import '../../features/cart/data/live_cart.dart';
import '../../features/reviews/data/live_review_repository.dart';
import '../../features/ai/data/live_ai_repository.dart';
import '../../features/addresses/data/live_address_repository.dart';
import '../../features/orders/data/pending_order_command.dart';

class LiveWorkspace extends ChangeNotifier {
  LiveWorkspace({
    ApiEnvironment? environment,
    ApiTransport? transport,
    SessionStore? store,
    PendingChatJournal? chatJournal,
  }) {
    session = LiveSession(
      environment ?? ApiEnvironment.configured(),
      transport ?? NativeTransport(),
      store ?? SecureSessionStore(),
    );
    api = ApiClient(session);
    catalog = LiveCatalogRepository(api);
    bakeries = LiveBakeryRepository(api);
    subscriptions = LiveSubscriptionRepository(api);
    marketplace = LiveMarketplaceRepository(api);
    orders = LiveOrderRepository(api);
    addresses = LiveAddressRepository(api);
    reviews = LiveReviewRepository(api);
    ai = LiveAiRepository(api);
    chat = LiveChatRepository(api, journal: chatJournal);
    if (session.environment.chat != null) {
      session.beforeLogout = chat.discardAccountPending;
    }
    cart.addListener(notifyListeners);
    _generation = session.generation;
    session.addListener(_sessionChanged);
  }
  late final LiveSession session;
  late final ApiClient api;
  late final LiveCatalogRepository catalog;
  late final LiveBakeryRepository bakeries;
  late final LiveSubscriptionRepository subscriptions;
  late final LiveMarketplaceRepository marketplace;
  late final LiveOrderRepository orders;
  late final LiveAddressRepository addresses;
  PendingOrderCommand? pendingDirectOrder;
  final Map<String, PendingOrderCommand> pendingOfferAcceptances = {};
  late final LiveReviewRepository reviews;
  late final LiveAiRepository ai;
  late final LiveChatRepository chat;
  final LiveCart cart = LiveCart();
  late int _generation;
  String? _chatAccount;
  bool _disposed = false;
  String? chatRecoveryNotice;
  Json? bakery;
  int bakeryRevision = 0;
  final Map<String, Json> knownOptions = {};
  final Map<String, List<Json>> knownImages = {};
  final List<Json> verifiedBakeries = [];
  void _sessionChanged() {
    if (_generation != session.generation) {
      _generation = session.generation;
      bakery = null;
      cart.clear();
      pendingDirectOrder = null;
      pendingOfferAcceptances.clear();
      chat.clearPending();
      _chatAccount = null;
      verifiedBakeries.clear();
      knownImages.clear();
      knownOptions.clear();
      bakeryRevision++;
      api.invalidate();
    }
    final account = session.user?['id'] as String?;
    if (session.environment.chat != null &&
        !session.restoring &&
        account != null &&
        account != _chatAccount) {
      _chatAccount = account;
      final expected = session.generation;
      unawaited(
        chat.restorePending().then(
          (_) {
            if (!_disposed && expected == session.generation) {
              chatRecoveryNotice = null;
              notifyListeners();
            }
          },
          onError: (Object _) {
            if (!_disposed && expected == session.generation) {
              _chatAccount = null;
              chatRecoveryNotice =
                  'Chưa đọc được tin đang chờ. Mở trò chuyện để thử khôi phục.';
              notifyListeners();
            }
          },
        ),
      );
    }
    notifyListeners();
  }

  void selectBakery(Json value) {
    bakery = value;
    bakeryRevision++;
    api.invalidate();
    knownImages.clear();
    knownOptions.clear();
    verifiedBakeries.removeWhere((b) => b['id'] == value['id']);
    verifiedBakeries.add(value);
    notifyListeners();
  }

  Future<void> discoverBakery() async {
    final expected = session.generation;
    final value = await bakeries.onboarding();
    if (expected != session.generation) return;
    if (value != null) {
      if (bakery?['id'] == value['id']) {
        bakery = value;
        notifyListeners();
      } else {
        selectBakery(value);
      }
    }
  }

  @override
  void dispose() {
    _disposed = true;
    session.removeListener(_sessionChanged);
    cart.removeListener(notifyListeners);
    cart.dispose();
    session.transport.close();
    session.dispose();
    super.dispose();
  }
}

class LiveScope extends InheritedNotifier<LiveWorkspace> {
  const LiveScope({
    super.key,
    required LiveWorkspace workspace,
    required super.child,
  }) : super(notifier: workspace);
  static LiveWorkspace of(BuildContext context) =>
      context.dependOnInheritedWidgetOfExactType<LiveScope>()!.notifier!;
}
