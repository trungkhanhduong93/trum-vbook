# Làm nguồn truyện Vbook — bộ tài liệu vận hành

Bộ này viết cho **agent/dev nhận việc lần đầu** ở repo `trum-vbook`. Đọc xong là làm được một
nguồn mới hoàn chỉnh (home / genre / gen / detail / toc / chap / search), test được, đóng gói
được, push được — **không cần hỏi thêm chủ repo**.

## Đọc theo thứ tự này

| File | Khi nào đọc | Nội dung |
|---|---|---|
| [01-quy-trinh-tao-nguon-moi.md](01-quy-trinh-tao-nguon-moi.md) | **Luôn đọc trước tiên** | 8 bước từ "có link site" tới "đã push", kèm lệnh cụ thể |
| [02-api-va-gioi-han.md](02-api-va-gioi-han.md) | Trước khi viết dòng code đầu tiên | API Vbook, giới hạn Rhino/Jsoup, những hàm **cấm dùng** |
| [03-bay-da-tra-gia.md](03-bay-da-tra-gia.md) | Trước khi viết, và lần nữa trước khi push | Bẫy đã làm hỏng bản phát hành thật, kèm triệu chứng để nhận ra |
| [04-test-harness.md](04-test-harness.md) | Khi code xong, trước khi đóng gói | Chạy thật plugin trên HTML sống mà không cần Android |
| [05-case-study-cuutruyen.md](05-case-study-cuutruyen.md) | Khi cần một ví dụ đầy đủ để bắt chước | Toàn bộ quyết định khi làm nguồn `cuutruyen.cc`, kể cả cái sai |

Tài liệu cũ [../VBOOK_PLUGIN_DEVELOPMENT_GUIDE.md](../VBOOK_PLUGIN_DEVELOPMENT_GUIDE.md) (tiếng Anh,
1342 dòng) vẫn còn giá trị cho **nguồn kiểu API + mã hoá** (case Tcomic: reverse-engineer REST API,
ký request, AES trong Rhino). Bộ `docs/` này bổ khuyết phần nó không có: **nguồn kiểu scrape HTML**,
quy trình test, và thư viện bẫy.

## Ba câu phải trả lời được trước khi viết code

1. Site trả **HTML** hay có **API JSON**? → quyết định toàn bộ cách parse. Có API thì luôn ưu tiên API.
2. Ảnh chương nằm ở **host nào**, có đi qua **proxy của site** không? → quyết định `chap.js`,
   và đây là chỗ dễ làm gãy nguồn nhất (đọc `03` mục "URL ảnh").
3. **Mục lục** nằm trong trang chi tiết hay phải gọi riêng? → quyết định `toc.js` tốn 1 hay 2 request.

## Luật bất di bất dịch (vi phạm là hỏng, không phải là "chưa tối ưu")

- Không `selectFirst()` — dùng helper `selFirst()`. Rhino-Jsoup của Vbook không có hàm đó.
- Không `.parent()` trên Element — ném TypeError trong Vbook.
- Không nối `|Referer=...` vào URL ảnh. Chỉ trả URL trần.
- Không đóng gói zip bằng `Compress-Archive`. Phải dùng Python, và zip **bắt buộc** có entry `src/`.
- Không đổi đường đi URL ảnh (thêm/gỡ proxy) chỉ vì đo thấy nhanh hơn ở máy dev.
- Không viết fallback kiểu "selector rỗng thì quét toàn trang".
- Mặc định viết **ES5** (xem `02` mục "ES5 hay ES6" — có ngoại lệ đã kiểm chứng).

Giải thích vì sao từng luật tồn tại: [03-bay-da-tra-gia.md](03-bay-da-tra-gia.md).
