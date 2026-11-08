# Chat live

REST conversation list/create/detail/close và message cursor/send/read/delete; không có WebSocket/SSE được tích hợp. Public origins và authentication dùng shared client, không có service secret trong Flutter.

Send multipart dùng JSON part `metadata` và `files`; clientMessageId ổn định khi outcome chưa rõ. Pending command giữ trong repository qua navigation của cùng phiên, chặn đổi ID/payload; clear khi server xác nhận hoặc logout/đổi account. Chưa có pending journal qua process restart. Không tự gửi lại POST.

Message history newest-first opaque cursor; UI hợp nhất theo server message ID và hiển thị thời gian tăng dần. Poll 15 giây chỉ khi route hiện tại, app foreground và không có lỗi lịch sử. Sau dispose không tạo lượt polling mới; response cũ bị chặn theo epoch/session. Mark read là thao tác rõ ràng, không giả trạng thái delivered/read cho mỗi message.

403 của history được mô tả trung tính vì server có thể che lỗi xử lý. 403 khi send được xử lý bảo thủ như chưa xác nhận để giữ logical ID. Attachment JPEG/PNG/WEBP/PDF tối đa 10 MiB, picker/save dialog phạm vi hẹp; signed GET không kèm Bearer và không log URL. Happy path history/send phải có conversation hợp lệ do Backend cho phép; không đoán ID hoặc dùng mock khi không tạo được context.
