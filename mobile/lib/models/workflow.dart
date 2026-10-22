import 'catalog.dart';

enum RfqStage {
  open('Đang nhận báo giá'),
  quoted('Đã có báo giá'),
  accepted('Khách đã chốt tiệm'),
  confirmed('Tiệm đã xác nhận'),
  baking('Đang làm bánh'),
  delivering('Đang giao xe lạnh'),
  completed('Đã hoàn tất'),
  cancelled('Đã hủy'),
  expired('Hết hạn'),
  closed('Đã đóng');

  const RfqStage(this.label);
  final String label;
}

class CakeRequest {
  const CakeRequest({
    required this.id,
    required this.title,
    required this.budget,
    this.customer = 'Khách hàng (Bạn)',
    this.category = 'birthday',
    this.image = '',
    this.description = '',
    this.size = '',
    this.flavor = '',
    this.message = '',
    this.address = '',
    this.date = '',
    this.time = '',
    this.distance = 5,
    this.urgent = false,
    this.stage = RfqStage.open,
    this.accessories = const [],
    this.toppings = const [],
    this.flexible = true,
    this.placement = 'cake',
    this.quoteCount = 0,
  });
  final String id, title, customer, category, image, description, size, flavor;
  final String message, address, date, time, placement;
  final int budget, quoteCount;
  final double distance;
  final bool urgent, flexible;
  final List<String> accessories, toppings;
  final RfqStage stage;
  factory CakeRequest.fromJson(Json j) => CakeRequest(
    id: textValue(j, 'id'),
    title: textValue(j, 'title'),
    budget: intValue(j, 'budget'),
    customer: textValue(j, 'customerName'),
    category: textValue(j, 'category'),
    image: textValue(j, 'image'),
    description: textValue(j, 'description'),
    size: textValue(j, 'sizeRequirement'),
    flavor: textValue(j, 'flavorRequirement'),
    message: textValue(j, 'inscription'),
    address: textValue(j, 'address'),
    date: textValue(j, 'needDate'),
    time: textValue(j, 'deliveryTime'),
    distance: (j['distanceKm'] as num?)?.toDouble() ?? 5,
    urgent: j['urgent'] == true,
    quoteCount: intValue(j, 'bidsSent'),
  );
  CakeRequest withStage(RfqStage stage, {int? quoteCount}) => CakeRequest(
    id: id,
    title: title,
    budget: budget,
    customer: customer,
    category: category,
    image: image,
    description: description,
    size: size,
    flavor: flavor,
    message: message,
    address: address,
    date: date,
    time: time,
    distance: distance,
    urgent: urgent,
    stage: stage,
    quoteCount: quoteCount ?? this.quoteCount,
    accessories: accessories,
    toppings: toppings,
    flexible: flexible,
    placement: placement,
  );
}

class Quote {
  const Quote({
    required this.id,
    required this.rfqId,
    required this.bakery,
    required this.price,
    this.image = '',
    this.pitch = '',
    this.duration = '',
    this.durationRank = 0,
    this.rating = 4.8,
    this.packages = const [],
    this.samples = const [],
    this.size = '',
    this.flavor = '',
    this.coldShipping = true,
    this.onTime = true,
    this.moneyBack = true,
  });
  final String id, rfqId, bakery, image, pitch, duration, size, flavor;
  final int price, durationRank;
  final double rating;
  final List<String> packages, samples;
  final bool coldShipping, onTime, moneyBack;
  factory Quote.fromJson(Json j) => Quote(
    id: textValue(j, 'id'),
    rfqId: textValue(j, 'rfqId', '#RFQ-2025-8892'),
    bakery: textValue(j, 'name'),
    price: intValue(j, 'price'),
    image: textValue(j, 'avatar'),
    pitch: textValue(j, 'pitchQuote'),
    duration: textValue(j, 'durationText'),
    durationRank: intValue(j, 'speedRank'),
    rating: (j['rating'] as num?)?.toDouble() ?? 5,
    packages: strings(j['packageItems']),
  );
}

enum OrderPhase {
  pending('Chờ xử lý'),
  scheduled('Đã lên lịch'),
  baking('Đang làm bánh'),
  delivering('Đang giao'),
  completed('Hoàn tất'),
  cancelled('Đã hủy');

  const OrderPhase(this.label);
  final String label;
}

class WorkStep {
  const WorkStep(this.name, this.done);
  final String name;
  final bool done;
}

class CakeOrder {
  const CakeOrder({
    required this.id,
    required this.title,
    required this.price,
    required this.phase,
    this.rfqId = '',
    this.customer = '',
    this.bakery = 'La Crème Pâtisserie',
    this.phone = '',
    this.address = '',
    this.date = '',
    this.image = '',
    this.size = '',
    this.flavor = '',
    this.message = '',
    this.note = '',
    this.category = 'birthday',
    this.urgent = false,
    this.released = false,
    this.paid = false,
    this.reviewed = false,
    this.driver = 'Trần Minh Tâm',
    this.driverPhone = '0918 889 900',
    this.vehicle = '51D-921.44',
    this.steps = const [],
    this.timeline = const [],
    this.lines = const [],
    this.review = '',
    this.rating = 0,
    this.orderType = 'catalog',
  });
  final String id, rfqId, title, customer, bakery, phone, address, date, image;
  final String size,
      flavor,
      message,
      note,
      category,
      driver,
      driverPhone,
      vehicle,
      review;
  final int price, rating;
  final String orderType;
  final OrderPhase phase;
  final bool urgent, released, paid, reviewed;
  final List<WorkStep> steps;
  final List<String> timeline;
  final List<CartLine> lines;
  factory CakeOrder.fromJson(Json j, OrderPhase phase) => CakeOrder(
    id: textValue(j, 'id'),
    title: textValue(j, 'title', textValue(j, 'cakeTitle')),
    price: intValue(j, 'price', intValue(j, 'cakePrice')),
    phase: phase,
    rfqId: textValue(j, 'rfqId'),
    customer: textValue(j, 'customer', textValue(j, 'customerName')),
    bakery: textValue(j, 'vendorName', 'La Crème Pâtisserie'),
    phone: textValue(j, 'phone'),
    address: textValue(j, 'address', textValue(j, 'customerAddress')),
    date: textValue(j, 'deliveryTime'),
    image: textValue(j, 'image', textValue(j, 'cakeImage')),
    size: textValue(j, 'sizeSpec', textValue(j, 'cakeSpec')),
    note: textValue(j, 'description'),
    category: textValue(j, 'category', 'birthday'),
    urgent: j['isUrgent'] == true,
    orderType: textValue(
      j,
      'orderType',
      j['rfqId'] == null ? 'catalog' : 'bespoke',
    ),
    released: j['escrowReleased'] == true || j['escrowStatus'] == 'released',
    paid: true,
    steps: objects(j['steps'])
        .map((s) => WorkStep(textValue(s, 'name'), s['done'] == true))
        .toList(),
    timeline: objects(j['timeline'])
        .map((s) => '${s['time']} · ${s['text']}')
        .toList(),
    driver: textValue(j, 'driverName', 'Trần Minh Tâm'),
    driverPhone: textValue(j, 'driverPhone', '0918 889 900'),
    vehicle: textValue(j, 'licensePlate', '51D-921.44'),
  );
  CakeOrder copyWith({
    OrderPhase? phase,
    bool? paid,
    bool? released,
    bool? reviewed,
    String? date,
    String? message,
    String? note,
    List<WorkStep>? steps,
    List<String>? timeline,
    String? review,
    int? rating,
  }) => CakeOrder(
    id: id,
    rfqId: rfqId,
    title: title,
    price: price,
    phase: phase ?? this.phase,
    customer: customer,
    bakery: bakery,
    phone: phone,
    address: address,
    date: date ?? this.date,
    image: image,
    size: size,
    flavor: flavor,
    message: message ?? this.message,
    note: note ?? this.note,
    category: category,
    urgent: urgent,
    released: released ?? this.released,
    paid: paid ?? this.paid,
    reviewed: reviewed ?? this.reviewed,
    driver: driver,
    driverPhone: driverPhone,
    vehicle: vehicle,
    steps: steps ?? this.steps,
    timeline: timeline ?? this.timeline,
    lines: lines,
    review: review ?? this.review,
    rating: rating ?? this.rating,
    orderType: orderType,
  );
}

class ChatMessage {
  const ChatMessage(this.text, {this.mine = true});
  final String text;
  final bool mine;
}
