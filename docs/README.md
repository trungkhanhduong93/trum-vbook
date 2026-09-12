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
| [07-do-toc-do.md](07-do-toc-do.md) | Khi ai nói "nguồn X chậm", hoặc trước khi định tối ưu bất cứ thứ gì | Cách đo, ba script trong `tools/vbook-harness/`, và **số nền đo 12/09/2026** của cả 16 nguồn |
| 04-test-harness.md | *(chưa viết)* | Harness thật ở `tools/vbook-harness/`: `run-template.js` cho 9 ca kiểm, `measure.js`/`imgbench.js`/`overlap.js` cho đo tốc độ |
| 05-case-study-cuutruyen.md | *(chưa viết)* | — |
| [06-case-study-luottruyen.md](06-case-study-luottruyen.md) | Khi đụng `luottruyen/`, hoặc cần ví dụ chẩn đoán đầy đủ | Kiến trúc nguồn khó nhất repo + quy trình chẩn đoán "không tải được ảnh", kể cả 3 bản vá sai |

> **12/09/2026 — API không còn phải suy đoán.** Toàn bộ định nghĩa API nằm trong chính APK:
> giải nén `vBook.apk` rồi mở `assets/composeResources/com.reader.resources/files/core.js`.
> `02` đã đối chiếu lại theo file này.

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
- **Mọi request đều phải có timeout.** `REQ_TIMEOUT = 8000` cho request chính, `PROBE_TIMEOUT = 4000`
  cho mirror và dò domain. Không đặt thì mỗi host chết ăn 10–11 giây (`03` bẫy 27).
- **Dò domain dự phòng chỉ được dò LÊN**, tối đa 2 ứng viên. Dò xuống số cũ đã chết là treo
  10–15 giây vì DNS vẫn còn phân giải (`03` bẫy 26 — đã sai 2 lần).
- Chuỗi lọc ảnh rác phải có dấu phân cách đường dẫn: `"/ads"`, không phải `"ads"` — `"uploads"`
  chứa `"ads"` (`03` bẫy 29).

Giải thích vì sao từng luật tồn tại: [03-bay-da-tra-gia.md](03-bay-da-tra-gia.md).
