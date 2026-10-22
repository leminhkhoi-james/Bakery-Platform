import '../../models/accounts.dart';
import '../../models/catalog.dart';
import '../../models/workflow.dart';

/// Local demo contract. A future public-API adapter belongs behind this boundary.
abstract interface class BakeryRepository {
  List<Cake> get catalog;
  List<Store> get stores;
  List<Cake> get cakes;
  List<CakeRequest> get requests;
  List<Quote> quotesFor(String requestId);
  List<CakeOrder> get orders;
  List<UserAccount> get users;
  List<VendorAccount> get vendors;
  List<WalletTransaction> get transactions;
  String nextId(String prefix);
  void saveRequest(CakeRequest request);
  void saveQuote(Quote quote);
  void saveOrder(CakeOrder order);
  void saveUser(UserAccount user);
  void saveVendor(VendorAccount vendor);
  void saveCake(Cake cake);
  void deleteCake(String id);
  void addTransaction(WalletTransaction transaction);
}
