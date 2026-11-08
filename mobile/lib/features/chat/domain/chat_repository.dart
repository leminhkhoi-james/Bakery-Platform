import 'package:flutter/foundation.dart';

class DemoMessage {
  DemoMessage(
    this.id,
    this.text, {
    this.mine = false,
    this.attachment,
    this.deleted = false,
  });
  final String id;
  String text;
  final bool mine;
  final String? attachment;
  bool deleted;
}

class DemoConversation {
  DemoConversation(
    this.id,
    this.bakeryId,
    this.subject,
    this.messages, {
    this.unread = 0,
    this.closed = false,
  });
  final String id, bakeryId, subject;
  final List<DemoMessage> messages;
  int unread;
  bool closed;
}

class LocalChatRepository extends ChangeNotifier {
  LocalChatRepository() {
    reset();
  }
  final List<DemoConversation> conversations = [];
  int _sequence = 20;
  void reset() {
    conversations
      ..clear()
      ..addAll([
        DemoConversation('chat-01', 'bakery-01', 'Bánh sinh nhật tông hồng', [
          DemoMessage(
            'message-01',
            'Chào tiệm, mình muốn bánh ít ngọt và trang trí dâu tươi.',
            mine: true,
          ),
          DemoMessage(
            'message-02',
            'SweetCake chào An. Tiệm có thể dùng kem sữa nhẹ, bạn muốn nhận bánh lúc mấy giờ?',
          ),
          DemoMessage('message-03', 'Mình nhận vào 15 giờ nhé.', mine: true),
        ], unread: 1),
        DemoConversation('chat-02', 'bakery-02', 'Ý tưởng bánh mousse', [
          DemoMessage(
            'message-04',
            'Tiệm đã nhận ý tưởng của bạn. Mình cùng chọn hương vị nhé.',
          ),
        ]),
      ]);
    notifyListeners();
  }

  DemoConversation get(String id) =>
      conversations.firstWhere((c) => c.id == id);
  void markRead(DemoConversation conversation) {
    if (conversation.unread != 0) {
      conversation.unread = 0;
      notifyListeners();
    }
  }

  void send(DemoConversation conversation, String text, {String? attachment}) {
    if (conversation.closed) throw StateError('Hội thoại đã đóng.');
    if (text.trim().isEmpty && attachment == null) {
      throw StateError('Nhập tin nhắn hoặc chọn ảnh demo.');
    }
    conversation.messages.add(
      DemoMessage(
        'message-${_sequence++}',
        text.trim(),
        mine: true,
        attachment: attachment,
      ),
    );
    notifyListeners();
  }

  void delete(DemoMessage message) {
    if (!message.mine) throw StateError('Chỉ xóa được tin của bạn.');
    message.deleted = true;
    message.text = 'Tin nhắn đã được xóa trong demo';
    notifyListeners();
  }

  void close(DemoConversation c) {
    c.closed = true;
    notifyListeners();
  }
}
