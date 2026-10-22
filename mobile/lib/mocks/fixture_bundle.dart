import 'dart:convert';

import 'package:flutter/services.dart';

import '../models/accounts.dart';
import '../models/catalog.dart';
import '../models/workflow.dart';

class FixtureBundle {
  FixtureBundle(this.raw, this.images);
  final Json raw;
  final Map<String, String> images;
  static Future<FixtureBundle> load({AssetBundle? bundle}) async {
    final source = bundle ?? rootBundle;
    final values = await Future.wait([
      source.loadString('assets/data/web_fixtures.json'),
      source.loadString('assets/data/image_manifest.json'),
    ]);
    return FixtureBundle(
      Map<String, Object?>.from(jsonDecode(values[0]) as Map),
      Map<String, String>.from(jsonDecode(values[1]) as Map),
    );
  }

  List<Json> rows(String key) => objects(raw[key]);
  Json record(String key) => Map<String, Object?>.from(raw[key] as Map);
  List<Cake> get cakes => rows('INITIAL_CAKES').map(Cake.fromJson).toList();
  List<Cake> get vendorCakes =>
      rows('INITIAL_VENDOR_CAKES').map(Cake.fromJson).toList();
  List<Store> get stores => rows('STORES').map(Store.fromJson).toList();
  List<Quote> get quotes => rows('BIDS_DATA').map(Quote.fromJson).toList();
  List<CakeRequest> get requests =>
      rows('INITIAL_RFQS').map(CakeRequest.fromJson).toList();
  List<CakeOrder> get orders {
    final board = record('INITIAL_KANBAN_ORDERS');
    return [
      for (final phase in OrderPhase.values)
        ...objects(board[phase.name]).map((j) => CakeOrder.fromJson(j, phase)),
    ];
  }

  List<CakeOrder> get adminOrders => rows('INITIAL_ADMIN_ORDERS').map((j) {
    final stage = textValue(j, 'progressStage');
    final phase =
        OrderPhase.values.where((v) => v.name == stage).firstOrNull ??
        OrderPhase.pending;
    return CakeOrder.fromJson(j, phase);
  }).toList();
  List<UserAccount> get users =>
      rows('INITIAL_USERS').map(UserAccount.fromJson).toList();
  List<VendorAccount> get vendors =>
      rows('INITIAL_VENDORS').map(VendorAccount.fromJson).toList();
  List<WalletTransaction> get transactions =>
      rows('INITIAL_TRANSACTIONS').map(WalletTransaction.fromJson).toList();
  List<Voucher> get vouchers => rows('VOUCHERS').map(Voucher.fromJson).toList();
  List<Choice> choices(String key) => rows(key).map(Choice.fromJson).toList();
}
