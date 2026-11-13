import '../../../core/api/contracts.dart';
import '../../../core/widgets/live_form.dart';
import '../../../core/widgets/structured_form.dart';

const bakeryFields = [
  FormFieldSpec('name', 'Tên tiệm', required: true, maximum: 180),
  FormFieldSpec('phoneNumber', 'Số điện thoại', required: true, maximum: 30),
  FormFieldSpec('email', 'Email', kind: FieldKind.email, maximum: 320),
  FormFieldSpec('description', 'Giới thiệu', maximum: 4000),
];
const categoryFields = [
  FormFieldSpec('name', 'Tên danh mục', required: true, maximum: 120),
  FormFieldSpec('slug', 'Đường dẫn danh mục', required: true, maximum: 140),
  FormFieldSpec('displayOrder', 'Thứ tự hiển thị', kind: FieldKind.integer),
  FormFieldSpec('active', 'Đang sử dụng', kind: FieldKind.boolean),
];
const productFields = [
  FormFieldSpec('name', 'Tên bánh', required: true, maximum: 180),
  FormFieldSpec('slug', 'Đường dẫn bánh', required: true, maximum: 200),
  FormFieldSpec('description', 'Mô tả bánh', maximum: 4000),
  FormFieldSpec(
    'basePrice',
    'Giá cơ bản (VND)',
    required: true,
    kind: FieldKind.money,
  ),
  FormFieldSpec(
    'defaultServingSize',
    'Số người ăn',
    kind: FieldKind.integer,
    minimum: 1,
  ),
  FormFieldSpec(
    'minimumNoticeHours',
    'Số giờ đặt trước',
    kind: FieldKind.integer,
  ),
  FormFieldSpec('customizable', 'Cho phép tùy chỉnh', kind: FieldKind.boolean),
];
const addOnFields = [
  FormFieldSpec('name', 'Tên phụ kiện', required: true, maximum: 160),
  FormFieldSpec('description', 'Mô tả', maximum: 4000),
  FormFieldSpec('category', 'Nhóm phụ kiện', required: true, maximum: 80),
  FormFieldSpec('price', 'Giá (VND)', required: true, kind: FieldKind.money),
  FormFieldSpec('active', 'Đang sử dụng', kind: FieldKind.boolean),
];
const operationsSchema = [
  CollectionSpec(
    'addresses',
    'Địa chỉ',
    [
      FormFieldSpec('addressLine', 'Đường / khu vực', required: true),
      FormFieldSpec('ward', 'Phường / xã', maximum: 120),
      FormFieldSpec('district', 'Quận / huyện', required: true, maximum: 120),
      FormFieldSpec('city', 'Thành phố', required: true, maximum: 120),
      FormFieldSpec(
        'latitude',
        'Vĩ độ',
        help: 'Từ −90 đến 90; có thể để trống',
      ),
      FormFieldSpec(
        'longitude',
        'Kinh độ',
        help: 'Từ −180 đến 180; có thể để trống',
      ),
      FormFieldSpec('isPrimary', 'Địa chỉ chính', kind: FieldKind.boolean),
    ],
    defaults: {'isPrimary': false},
  ),
  CollectionSpec(
    'serviceAreas',
    'Khu vực giao hàng',
    [
      FormFieldSpec('city', 'Thành phố', required: true, maximum: 120),
      FormFieldSpec('district', 'Quận / huyện', required: true, maximum: 120),
      FormFieldSpec(
        'deliveryFee',
        'Phí giao hàng',
        required: true,
        kind: FieldKind.money,
      ),
      FormFieldSpec(
        'minimumOrder',
        'Giá trị tối thiểu',
        required: true,
        kind: FieldKind.money,
      ),
      FormFieldSpec('active', 'Đang phục vụ', kind: FieldKind.boolean),
    ],
    defaults: {'active': true},
  ),
  CollectionSpec(
    'businessHours',
    'Giờ mở cửa',
    [
      FormFieldSpec(
        'dayOfWeek',
        'Ngày trong tuần (1 = Thứ hai, 7 = Chủ nhật)',
        required: true,
        kind: FieldKind.integer,
        minimum: 1,
      ),
      FormFieldSpec('opensAt', 'Giờ mở (HH:mm)', kind: FieldKind.time),
      FormFieldSpec('closesAt', 'Giờ đóng (HH:mm)', kind: FieldKind.time),
      FormFieldSpec('closed', 'Đóng cửa cả ngày', kind: FieldKind.boolean),
    ],
    defaults: {'closed': false},
  ),
];
const optionsSchema = [
  CollectionSpec(
    'groups',
    'Nhóm tùy chọn',
    [
      FormFieldSpec('name', 'Tên nhóm', required: true, maximum: 120),
      FormFieldSpec(
        'selectionType',
        'Kiểu chọn',
        kind: FieldKind.choice,
        required: true,
        choices: ['SINGLE', 'MULTIPLE'],
      ),
      FormFieldSpec('required', 'Bắt buộc chọn', kind: FieldKind.boolean),
      FormFieldSpec(
        'minimumSelections',
        'Số lựa chọn tối thiểu',
        kind: FieldKind.integer,
        required: true,
      ),
      FormFieldSpec(
        'maximumSelections',
        'Số lựa chọn tối đa',
        kind: FieldKind.integer,
        required: true,
      ),
      FormFieldSpec('displayOrder', 'Thứ tự', kind: FieldKind.integer),
    ],
    defaults: {
      'selectionType': 'SINGLE',
      'required': false,
      'minimumSelections': 0,
      'maximumSelections': 1,
      'displayOrder': 0,
    },
    children: [
      CollectionSpec(
        'values',
        'Giá trị tùy chọn',
        [
          FormFieldSpec('name', 'Tên giá trị', required: true, maximum: 120),
          FormFieldSpec('description', 'Mô tả', maximum: 4000),
          FormFieldSpec(
            'priceAdjustment',
            'Giá điều chỉnh',
            required: true,
            kind: FieldKind.signedMoney,
          ),
          FormFieldSpec('active', 'Đang sử dụng', kind: FieldKind.boolean),
          FormFieldSpec('displayOrder', 'Thứ tự', kind: FieldKind.integer),
        ],
        defaults: {'active': true, 'priceAdjustment': '0', 'displayOrder': 0},
      ),
    ],
  ),
];

void validateOperations(Json value) {
  final addresses = objects(value['addresses']);
  if (addresses.where((a) => a['isPrimary'] == true).length > 1) {
    throw const ApiFailure(422, 'Chỉ chọn một địa chỉ chính.');
  }
  for (final a in addresses) {
    for (final k in ['latitude', 'longitude']) {
      if (a[k] != null) {
        final n = num.tryParse('${a[k]}'), limit = k == 'latitude' ? 90 : 180;
        if (n == null || !n.isFinite || n.abs() > limit) {
          throw const ApiFailure(422, 'Tọa độ không hợp lệ.');
        }
      }
    }
  }
  final areas = <String>{};
  for (final a in objects(value['serviceAreas'])) {
    if (!areas.add('${a['city']}:${a['district']}'.toLowerCase())) {
      throw const ApiFailure(422, 'Khu vực giao hàng bị trùng.');
    }
  }
  final days = <int>{};
  for (final h in objects(value['businessHours'])) {
    final d = h['dayOfWeek'] as int;
    if (d > 7 || !days.add(d)) {
      throw const ApiFailure(
        422,
        'Ngày mở cửa cần khác nhau và trong khoảng 1–7.',
      );
    }
    if (h['closed'] != true &&
        (h['opensAt'] == null ||
            h['closesAt'] == null ||
            (h['opensAt'] as String).compareTo(h['closesAt'] as String) >= 0)) {
      throw const ApiFailure(422, 'Giờ mở cần trước giờ đóng.');
    }
  }
}

void validateOptions(Json value) {
  for (final g in objects(value['groups'])) {
    final min = g['minimumSelections'] as int,
        max = g['maximumSelections'] as int;
    if (max < min ||
        g['required'] == true && min < 1 ||
        g['selectionType'] == 'SINGLE' && max > 1) {
      throw const ApiFailure(422, 'Số lượng chọn chưa phù hợp kiểu nhóm.');
    }
  }
}
