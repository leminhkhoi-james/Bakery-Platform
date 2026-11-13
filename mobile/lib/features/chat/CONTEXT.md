# Chat live

REST conversation list/create/detail/close và message cursor/send/read/delete; không có WebSocket/SSE được tích hợp. Public origins và authentication dùng shared client, không có service secret trong Flutter.

Send multipart dùng JSON part `metadata` và `files`; clientMessageId/payload bất biến khi retry. Pending journal ghi trước HTTP vào tệp AES-256-GCM trong app-support directory; khóa nằm trong secure storage riêng, không chứa token/session. Mỗi scope gồm Identity origin + Chat origin + user ID, tối đa một pending mỗi conversation, 20 conversation/200 MiB ciphertext. Attachment bytes được mã hóa cùng record; atomic write/flush/rename. Lỗi khóa/ciphertext/dung lượng chặn gửi và giữ dữ liệu, không reset key.

Cold restart chỉ load journal sau xác thực thật. Mở conversation đối soát clientMessageId/sender/content/attachment metadata bằng history/cursor, tối đa năm trang; không thấy trong cửa sổ hữu hạn vẫn giữ uncertain. ACK/reconciliation mới xóa record; retry thủ công dùng cùng ID/payload, không tự POST. Đổi phiên cách ly RAM; đăng nhập lại đúng scope có thể khôi phục. Explicit logout đợi xóa journal của account trước khi xóa session; không áp record hoặc response của account cũ lên account mới.

Message history newest-first opaque cursor; UI hợp nhất theo server message ID và hiển thị thời gian tăng dần. Poll 15 giây chỉ khi route hiện tại, app foreground và không có lỗi lịch sử. Sau dispose không tạo lượt polling mới; response cũ bị chặn theo epoch/session. Mark read là thao tác rõ ràng, không giả trạng thái delivered/read cho mỗi message.

403 của history được mô tả trung tính vì server có thể che lỗi xử lý. 403 khi send được xử lý bảo thủ như chưa xác nhận để giữ logical ID. Attachment JPEG/PNG/WEBP/PDF tối đa 10 MiB, picker/save dialog phạm vi hẹp; signed GET không kèm Bearer và không log URL. Local signed origin dùng loopback cần adb reverse đúng cổng storage; launcher nhận ChatStorageUrl, HTTPS public không cần reverse. Happy path phải dùng conversation hợp lệ do Backend cho phép.
