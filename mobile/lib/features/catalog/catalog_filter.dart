import '../../models/catalog.dart';

class CatalogFilter {
  String query = '', category = 'all', delivery = 'all', sort = 'popular';
  String color = 'all', district = 'all';
  final Set<String> themes = {}, occasions = {};
  int maximum = 2500000;
  List<Cake> apply(List<Cake> input) {
    final result = input.where((c) {
      final text = '${c.title} ${c.vendor}'.toLowerCase();
      if (!text.contains(query.trim().toLowerCase()) || c.price > maximum) {
        return false;
      }
      if (category != 'all' &&
          c.category != category &&
          !(category == 'Bánh Mousse' && c.category == 'Bánh Tiramisu')) {
        return false;
      }
      if (delivery != 'all' &&
          c.delivery != delivery &&
          !(delivery == 'same_day' && c.delivery == 'fast')) {
        return false;
      }
      final tags = '${c.title} ${c.category} ${c.badges.join(' ')}';
      if (themes.isNotEmpty &&
          !themes.any((t) => c.theme == t || _matches(tags, t))) {
        return false;
      }
      if (occasions.isNotEmpty &&
          !occasions.any((t) => c.occasion == t || _matches(tags, t))) {
        return false;
      }
      if (color != 'all' && c.color != color && !_matches(c.title, color)) {
        return false;
      }
      if (district != 'all' && !_districtMatches(c.vendor)) {
        return false;
      }
      return true;
    }).toList();
    switch (sort) {
      case 'price_asc':
        result.sort((a, b) => a.price.compareTo(b.price));
      case 'price_desc':
        result.sort((a, b) => b.price.compareTo(a.price));
      case 'rating':
        result.sort((a, b) => b.rating.compareTo(a.rating));
      case 'fastest':
        result.sort(
          (a, b) => (a.delivery == 'fast' ? 0 : 1).compareTo(
            b.delivery == 'fast' ? 0 : 1,
          ),
        );
    }
    return result;
  }

  bool _districtMatches(String vendor) {
    final v = vendor.toLowerCase();
    final aliases = switch (district) {
      'q.1' => ['q.1', 'quận 1'],
      'q.3' => ['q.3', 'quận 3'],
      'q.7' => ['q.7', 'quận 7'],
      'q.10' => ['q.10', 'quận 10'],
      'thảo điền' => ['q.2', 'thảo điền', 'thủ đức'],
      'bình thạnh' => ['bình thạnh', 'phan xích long'],
      _ => [district],
    };
    return aliases.any(v.contains);
  }

  bool _matches(String title, String key) {
    const terms = {
      'korean': ['hàn quốc', 'minimalist', 'bento', 'pastel'],
      'cartoon': [
        '3d',
        'fondant',
        'pikachu',
        'khủng long',
        'gấu',
        'heo',
        'cún',
        'lân',
        'pooh',
      ],
      'vintage': ['vintage', 'pháp', 'chantilly', 'mousseline', 'velvet'],
      'abstract': ['abstract', 'hiện đại', 'trừu tượng', 'tối giản'],
      'crown': ['vương miện', 'công chúa', 'princess', 'crown'],
      'natural': [
        'hoa',
        'tulip',
        'dâu',
        'trái cây',
        'xoài',
        'bơ',
        'nho',
        'việt quất',
      ],
      'bento': ['bento', 'mini', '10cm'],
      'luxury': ['dát vàng', 'gold', 'hoàng gia', 'luxury'],
      'kids': ['bé', 'công chúa', '3d'],
      'family': ['sinh nhật', 'ông', 'bà', 'mẹ', 'bố'],
      'love': ['tình yêu', 'tim', 'love', 'kỷ niệm'],
      'wedding': ['cưới', 'wedding', '2 tầng'],
      'baby': ['thôi nôi', 'đầy tháng', 'bento', 'gấu'],
      'event': ['khai trương', 'công ty', 'bia', 'rượu', 'dát vàng'],
      'holiday': ['mother', 'mẹ', '8/3', '20/10', 'valentine'],
      'pink': ['hồng'],
      'white': ['trắng', 'white', 'kem tươi'],
      'yellow': ['vàng', 'bắp', 'xoài', 'chanh'],
      'blue': ['xanh', 'blue'],
      'red': ['đỏ', 'red', 'dâu', 'mâm xôi'],
      'purple': ['tím', 'khoai môn', 'việt quất'],
      'matcha': ['matcha', 'trà xanh'],
      'chocolate': ['cacao', 'socola', 'chocolate', 'tiramisu', 'truffle'],
      'rainbow': [
        'nhiều màu',
        'nhiệt đới',
        'hoa quả',
        'bầu trời',
        'dải ngân hà',
        'lân',
        'vũ trụ',
      ],
    };
    return (terms[key] ?? []).any(title.toLowerCase().contains);
  }
}
