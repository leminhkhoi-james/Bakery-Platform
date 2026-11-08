# Công cụ và khả năng tái lập kiểm toán

Các công cụ chỉ ghi vào `docs/backend-audit` hoặc workspace TEMP của audit. Không chạy Maven, npm hay Flutter tại ba thư mục ứng dụng được bảo vệ. Không thay source để làm bài test xanh.

Phiên đã dùng Python 3.13.7, requests 2.33.1, PyYAML 6.0.3, Java 21 và Maven Wrapper của repository. Parser ở `%TEMP%/bakery-backend-audit-20261107-parser`: `tree-sitter==0.25.2`, `tree-sitter-java==0.23.5`. Bản parser mới hơn từng gặp native GC crash trên môi trường này; [parser-run.txt](../evidence/parser-run.txt) là lỗi công cụ lịch sử, không phải lỗi ứng dụng. Kết quả AST thành công ở [source-summary.json](../evidence/source-summary.json).

Đọc lại nguồn và tái tạo tài liệu, không gọi mutation API:

```powershell
python -B docs/backend-audit/tools/source_model.py
python -B docs/backend-audit/tools/architecture_evidence.py
python -B docs/backend-audit/tools/render_reference.py
python -B docs/backend-audit/tools/render_reports.py
python -B docs/backend-audit/tools/render_final_documents.py
python -B docs/backend-audit/tools/validate_artifacts.py
```

`architecture_evidence.py` cần private manifest của stack audit đã có; chỉ xuất tên/trạng thái cấu hình. `render_reports.py` đọc Docker startup/error metadata đã lọc. Nếu Docker/TEMP manifests không còn, dùng evidence hiện tại để đọc báo cáo; không dựng credential hoặc chạy vào database khác chỉ để công cụ hết lỗi.

Build/runtime/test scripts và các phase ghi dữ liệu được mô tả tại [runtime report](../BACKEND_API_RUNTIME_VERIFICATION_VI.md). Fixture hiện đã kết thúc: product/plan ARCHIVED, RFQ accepted, order COMPLETED. Không replay toàn bộ mutation script trên fixture đó. Restart service không tạo lại secrets; private manifest mất thì guard dừng. Đây là môi trường kiểm toán disposable, chưa là deployment Gateway hoặc reboot recovery đã kiểm chứng.

Mermaid 11.17.2 và jsdom 26 được cài ngoài repo tại `%TEMP%/bakery-backend-audit-20261107-mermaid`. Parser không render ảnh:

```powershell
node docs/backend-audit/tools/validate_mermaid.mjs
```

Nếu cần tái cài parser, dùng thư mục TEMP tương ứng với `pip --target`/`npm --prefix`, không tạo `node_modules`, lockfile hoặc tool cache trong ứng dụng. Các phụ thuộc parser không phải dependencies mới của Backend.

`filesystem_guard.py` có baseline bất biến. `--verify` đọc lại toàn bộ 10.582 tệp, size/mtime/SHA-256 và cấu trúc thư mục; có thể mất hơn 5 phút trên ổ H. Không capture lại baseline để xóa dấu vết thay đổi. `validate_artifacts.py` kiểm JSON, A–K, workflow fields, liên kết, Git scope và exact-match các secrets thực trong memory; chỉ báo số lượng/match file, không in secret.
