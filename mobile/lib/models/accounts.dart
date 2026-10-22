import 'catalog.dart';

class CustomerProfile {
  const CustomerProfile({
    required this.name,
    required this.phone,
    required this.email,
    this.tier = 'Diamond VIP',
    this.points = 0,
    this.taste = '',
  });
  final String name, phone, email, tier, taste;
  final int points;
  factory CustomerProfile.fromJson(Json j) => CustomerProfile(
    name: textValue(j, 'fullName'),
    phone: textValue(j, 'phone'),
    email: textValue(j, 'email'),
    tier: textValue(j, 'vipStatus'),
    taste: textValue(j, 'tasteNotes'),
  );
}

class SavedAddress {
  const SavedAddress(
    this.id,
    this.title,
    this.phone,
    this.address,
    this.isDefault,
  );
  final String id, title, phone, address;
  final bool isDefault;
  SavedAddress asDefault(bool value) =>
      SavedAddress(id, title, phone, address, value);
  factory SavedAddress.fromJson(Json j) => SavedAddress(
    textValue(j, 'id'),
    textValue(j, 'title'),
    textValue(j, 'phone'),
    textValue(j, 'address'),
    j['isDefault'] == true,
  );
}

class UserAccount {
  const UserAccount({
    required this.id,
    required this.name,
    required this.email,
    required this.phone,
    this.location = '',
    this.tier = 'standard',
    this.status = 'active',
    this.spending = 0,
    this.orderCount = 0,
    this.trust = 90,
    this.taste = '',
  });
  final String id, name, email, phone, location, tier, status, taste;
  final int spending, orderCount, trust;
  factory UserAccount.fromJson(Json j) => UserAccount(
    id: textValue(j, 'id'),
    name: textValue(j, 'name'),
    email: textValue(j, 'email'),
    phone: textValue(j, 'phone'),
    location: textValue(j, 'location'),
    tier: textValue(j, 'tier'),
    status: textValue(j, 'status'),
    spending: intValue(j, 'gmv'),
    orderCount: intValue(j, 'ordersCount'),
    trust: intValue(j, 'trustScore'),
    taste: textValue(j, 'tasteNotes'),
  );
  UserAccount toggle() => UserAccount(
    id: id,
    name: name,
    email: email,
    phone: phone,
    location: location,
    tier: status == 'suspended' ? 'standard' : 'suspended',
    status: status == 'suspended' ? 'active' : 'suspended',
    spending: spending,
    orderCount: orderCount,
    trust: status == 'suspended' ? 85 : 42,
    taste: taste,
  );
}

class VendorAccount {
  const VendorAccount({
    required this.id,
    required this.name,
    this.chef = '',
    this.phone = '',
    this.email = '',
    this.location = '',
    this.district = 'q1',
    this.specialty = '',
    this.category = 'couture',
    this.status = 'pending',
    this.fee = '5.0%',
    this.image = '',
    this.certification = '',
    this.legal = '',
    this.revenue = '',
    this.rating = '',
    this.photos = const [],
  });
  final String id, name, chef, phone, email, location, district, specialty;
  final String category,
      status,
      fee,
      image,
      certification,
      legal,
      revenue,
      rating;
  final List<String> photos;
  factory VendorAccount.fromJson(Json j) => VendorAccount(
    id: textValue(j, 'id'),
    name: textValue(j, 'name'),
    chef: textValue(j, 'chef'),
    location: textValue(j, 'location'),
    district: textValue(j, 'district'),
    specialty: textValue(j, 'specialty'),
    category: textValue(j, 'categoryType'),
    status: textValue(j, 'status'),
    fee: textValue(j, 'takeRate'),
    image: textValue(j, 'image'),
    certification: textValue(j, 'certification'),
    legal: textValue(j, 'legalBadge'),
    revenue: textValue(j, 'revenueFormatted'),
    rating: textValue(j, 'rating'),
    photos: objects(j['inspectionPhotos'])
        .map((p) => textValue(p, 'url'))
        .toList(),
  );
  VendorAccount copyWith({String? status, String? fee}) => VendorAccount(
    id: id,
    name: name,
    chef: chef,
    phone: phone,
    email: email,
    location: location,
    district: district,
    specialty: specialty,
    category: category,
    status: status ?? this.status,
    fee: fee ?? this.fee,
    image: image,
    certification: certification,
    legal: legal,
    revenue: revenue,
    rating: rating,
    photos: photos,
  );
}

class WalletTransaction {
  const WalletTransaction({
    required this.id,
    required this.orderId,
    required this.title,
    required this.gross,
    required this.net,
    required this.status,
    this.fee = 0,
    this.customer = '',
    this.date = '',
  });
  final String id, orderId, title, status, customer, date;
  final int gross, net, fee;
  factory WalletTransaction.fromJson(Json j) => WalletTransaction(
    id: textValue(j, 'id'),
    orderId: textValue(j, 'orderId'),
    title: textValue(j, 'cakeTitle'),
    gross: intValue(j, 'grossAmount'),
    net: intValue(j, 'netAmount'),
    fee: intValue(j, 'platformFee'),
    status: textValue(j, 'status'),
    customer: textValue(j, 'customer'),
    date: textValue(j, 'date'),
  );
}

class VendorSettings {
  VendorSettings({
    required this.values,
    required this.receiveRfq,
    required this.sound,
    required this.urgent,
  });
  final Map<String, String> values;
  final bool receiveRfq, sound, urgent;
  factory VendorSettings.fromJson(Json j) => VendorSettings(
    values: {
      for (final e in j.entries)
        if (e.value is String) e.key: e.value as String,
    },
    receiveRfq: j['acceptRfqAuto'] == true,
    sound: j['soundNotification'] == true,
    urgent: j['acceptUrgentOrder'] == true,
  );
}
