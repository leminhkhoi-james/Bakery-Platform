typedef Json = Map<String, Object?>;

String textValue(Json j, String key, [String fallback = '']) =>
    j[key]?.toString() ?? fallback;
int intValue(Json j, String key, [int fallback = 0]) =>
    (j[key] as num?)?.round() ?? fallback;
List<Json> objects(Object? value) => (value as List? ?? [])
    .map((e) => Map<String, Object?>.from(e as Map))
    .toList();
List<String> strings(Object? value) =>
    (value as List? ?? []).map((e) => e.toString()).toList();

class CakeSize {
  const CakeSize(this.label, this.price, {this.guests = '', this.cost = 0});
  final String label;
  final int price;
  final String guests;
  final int cost;
  factory CakeSize.fromJson(Json j) => CakeSize(
    textValue(j, 'size', textValue(j, 'label')),
    intValue(j, 'price'),
    guests: textValue(j, 'guests'),
    cost: intValue(j, 'cost'),
  );
}

class Cake {
  const Cake({
    required this.id,
    required this.title,
    required this.price,
    this.image = '',
    this.description = '',
    this.vendor = '',
    this.category = '',
    this.flavor = '',
    this.sweetness = '30%',
    this.delivery = 'fast',
    this.theme = '',
    this.occasion = '',
    this.color = '',
    this.rating = 0,
    this.reviews = 0,
    this.sold = 0,
    this.sizes = const [],
    this.badges = const [],
    this.open = true,
    this.gift = true,
    this.calligraphy = true,
    this.flowers = false,
  });
  final String id,
      title,
      image,
      description,
      vendor,
      category,
      flavor,
      sweetness;
  final String delivery, theme, occasion, color;
  final int price, reviews, sold;
  final double rating;
  final List<CakeSize> sizes;
  final List<String> badges;
  final bool open, gift, calligraphy, flowers;
  factory Cake.fromJson(Json j) {
    final sizes = objects(j['sizes']).map(CakeSize.fromJson).toList();
    return Cake(
      id: textValue(j, 'id'),
      title: textValue(j, 'title'),
      price: intValue(j, 'price', sizes.isEmpty ? 0 : sizes.first.price),
      image: textValue(j, 'image'),
      description: textValue(j, 'description'),
      vendor: textValue(j, 'vendor', 'La Crème Pâtisserie'),
      category: textValue(j, 'category'),
      flavor: textValue(j, 'flavor'),
      sweetness: textValue(j, 'sweetness', '30%'),
      delivery: textValue(
        j,
        'deliveryTime',
        textValue(j, 'prepTimeCategory', 'fast'),
      ),
      theme: textValue(j, 'theme'),
      occasion: textValue(j, 'occasion'),
      color: textValue(j, 'color'),
      rating: (j['rating'] as num?)?.toDouble() ?? 5,
      reviews: intValue(j, 'reviewCount', intValue(j, 'reviewsCount')),
      sold: intValue(j, 'soldCount'),
      sizes: sizes,
      badges: strings(j['badges']),
      open: j['isOpenForSale'] != false,
      gift: j['complimentaryGift'] != false,
      calligraphy: j['freeCalligraphy'] != false,
      flowers: j['freshFlowersAddon'] == true,
    );
  }
  Cake copyWith({
    String? id,
    String? title,
    String? category,
    String? flavor,
    String? sweetness,
    List<CakeSize>? sizes,
    bool? open,
    bool? gift,
    bool? calligraphy,
    bool? flowers,
  }) => Cake(
    id: id ?? this.id,
    title: title ?? this.title,
    price: sizes?.firstOrNull?.price ?? price,
    image: image,
    description: description,
    vendor: vendor,
    category: category ?? this.category,
    flavor: flavor ?? this.flavor,
    sweetness: sweetness ?? this.sweetness,
    delivery: delivery,
    theme: theme,
    occasion: occasion,
    color: color,
    rating: rating,
    reviews: reviews,
    sold: sold,
    sizes: sizes ?? this.sizes,
    badges: badges,
    open: open ?? this.open,
    gift: gift ?? this.gift,
    calligraphy: calligraphy ?? this.calligraphy,
    flowers: flowers ?? this.flowers,
  );
}

class Store {
  Store.fromJson(Json j)
    : id = textValue(j, 'id'),
      name = textValue(j, 'name'),
      location = textValue(j, 'location'),
      chef = textValue(j, 'chef'),
      specialty = textValue(j, 'specialty'),
      image = textValue(j, 'image');
  final String id, name, location, chef, specialty, image;
}

class Choice {
  const Choice(
    this.id,
    this.name,
    this.price, {
    this.description = '',
    this.selected = false,
  });
  final String id, name, description;
  final int price;
  final bool selected;
  factory Choice.fromJson(Json j) => Choice(
    textValue(j, 'id'),
    textValue(j, 'name'),
    intValue(j, 'price', intValue(j, 'basePrice')),
    description: textValue(j, 'desc'),
    selected: j['defaultChecked'] == true || j['checked'] == true,
  );
}

class CartLine {
  const CartLine({
    required this.id,
    required this.title,
    required this.price,
    required this.size,
    this.image = '',
    this.flavor = '',
    this.bakery = '',
    this.message = '',
    this.delivery = '',
    this.sweetness = '',
    this.quantity = 1,
  });
  final String id,
      title,
      size,
      image,
      flavor,
      bakery,
      message,
      delivery,
      sweetness;
  final int price, quantity;
  CartLine withQuantity(int quantity) => CartLine(
    id: id,
    title: title,
    price: price,
    size: size,
    image: image,
    flavor: flavor,
    bakery: bakery,
    message: message,
    delivery: delivery,
    sweetness: sweetness,
    quantity: quantity,
  );
  factory CartLine.fromJson(Json j) => CartLine(
    id: textValue(j, 'id'),
    title: textValue(j, 'title'),
    price: intValue(j, 'price'),
    size: textValue(j, 'sizeSpec'),
    image: textValue(j, 'image'),
    flavor: textValue(j, 'flavor'),
    bakery: textValue(j, 'bakery'),
    quantity: intValue(j, 'quantity', 1),
  );
}

class Voucher {
  Voucher.fromJson(Json j)
    : code = textValue(j, 'code'),
      minimum = intValue(j, 'minOrderValue'),
      value = intValue(j, 'discountValue'),
      maximum = intValue(j, 'maxDiscount'),
      percent = j['discountType'] == 'percent';
  final String code;
  final int minimum, value, maximum;
  final bool percent;
  int discount(int subtotal) {
    if (subtotal < minimum) return 0;
    final raw = percent ? (subtotal * value / 100).round() : value;
    final capped = percent && maximum > 0 && raw > maximum ? maximum : raw;
    return capped > subtotal ? subtotal : capped;
  }
}
