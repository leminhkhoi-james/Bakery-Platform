import 'package:flutter/foundation.dart';

class DesignDraft {
  DesignDraft(
    this.id,
    this.prompt, {
    this.color = 'Hồng pastel',
    this.tiers = 1,
    this.flavor = 'Vani dâu',
    this.image = 'assets/demo/cake_01.jpg',
    this.moderation = 'PENDING',
  });
  final String id;
  String prompt, color, flavor, image, moderation;
  int tiers;
  final List<String> revisions = [];
}

class LocalDesignRepository extends ChangeNotifier {
  LocalDesignRepository() {
    reset();
  }
  final List<DesignDraft> drafts = [];
  void reset() {
    drafts
      ..clear()
      ..add(
        DesignDraft(
          'design-01',
          'Bánh sinh nhật kem hồng, dâu tươi và những bông hoa nhỏ.',
        ),
      );
    notifyListeners();
  }

  void save(DesignDraft draft) {
    if (draft.prompt.trim().length < 10) {
      throw StateError('Hãy mô tả ý tưởng ít nhất 10 ký tự.');
    }
    if (!drafts.contains(draft)) drafts.add(draft);
    draft.revisions.add(draft.prompt);
    notifyListeners();
  }

  void moderate(DesignDraft draft, String value) {
    if (!['APPROVED', 'REJECTED'].contains(value)) {
      throw StateError('Trạng thái kiểm duyệt không hợp lệ.');
    }
    draft.moderation = value;
    notifyListeners();
  }
}
