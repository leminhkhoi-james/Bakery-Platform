import '../../mocks/fixture_bundle.dart';
import '../../models/accounts.dart';
import '../../models/catalog.dart';
import '../../models/workflow.dart';
import '../contracts/bakery_repository.dart';

class MockBakeryRepository implements BakeryRepository {
  MockBakeryRepository(FixtureBundle fixtures)
    : _catalog = fixtures.cakes,
      _stores = fixtures.stores,
      _cakes = fixtures.vendorCakes,
      _requests = fixtures.requests,
      _quotes = fixtures.quotes,
      _orders = fixtures.orders,
      _users = fixtures.users,
      _vendors = fixtures.vendors,
      _transactions = fixtures.transactions;
  final List<Cake> _cakes;
  final List<Cake> _catalog;
  final List<Store> _stores;
  final List<CakeRequest> _requests;
  final List<Quote> _quotes;
  final List<CakeOrder> _orders;
  final List<UserAccount> _users;
  final List<VendorAccount> _vendors;
  final List<WalletTransaction> _transactions;
  int _counter = 10000;
  @override
  String nextId(String prefix) => '$prefix-${++_counter}';
  @override
  List<Cake> get cakes => List.unmodifiable(_cakes);
  @override
  List<Cake> get catalog => List.unmodifiable(_catalog);
  @override
  List<Store> get stores => List.unmodifiable(_stores);
  @override
  List<CakeRequest> get requests => List.unmodifiable(_requests);
  @override
  List<Quote> quotesFor(String id) =>
      List.unmodifiable(_quotes.where((q) => q.rfqId == id));
  @override
  List<CakeOrder> get orders => List.unmodifiable(_orders);
  @override
  List<UserAccount> get users => List.unmodifiable(_users);
  @override
  List<VendorAccount> get vendors => List.unmodifiable(_vendors);
  @override
  List<WalletTransaction> get transactions => List.unmodifiable(_transactions);
  void _save<T>(List<T> items, T value, bool Function(T) matches) {
    final i = items.indexWhere(matches);
    if (i < 0) {
      items.insert(0, value);
    } else {
      items[i] = value;
    }
  }

  @override
  void saveCake(Cake v) => _save(_cakes, v, (x) => x.id == v.id);
  @override
  void deleteCake(String id) => _cakes.removeWhere((x) => x.id == id);
  @override
  void saveRequest(CakeRequest v) => _save(_requests, v, (x) => x.id == v.id);
  @override
  void saveQuote(Quote v) => _save(_quotes, v, (x) => x.id == v.id);
  @override
  void saveOrder(CakeOrder v) => _save(_orders, v, (x) => x.id == v.id);
  @override
  void saveUser(UserAccount v) => _save(_users, v, (x) => x.id == v.id);
  @override
  void saveVendor(VendorAccount v) => _save(_vendors, v, (x) => x.id == v.id);
  @override
  void addTransaction(WalletTransaction v) => _transactions.insert(0, v);
}
