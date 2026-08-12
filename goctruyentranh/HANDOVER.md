# HANDOVER REPORT - GOCTRUYENTRANH (GÓC TRUYỆN TRANH)

> **File này được tổng hợp bởi Gemini Agent dành cho Claude Agent tiếp tục xử lý.**
> **Phiên bản hiện tại trên Git:** `v9` (Commit `cca6af2`)
> **Repository:** `trungkhanhduong93/trum-vbook` (`main`)

---

## 1. Trạng Thái Hiện Tại (Version 9)

| Component | File | Trạng thái / Thay đổi đã làm |
|---|---|---|
| **Chap (Tải ảnh)** | `src/chap.js` | Đã chuyển sang ưu tiên gọi **`POST /api/chapter/loadAll`** sau khi tải HTML để lấy session cookie (`usid`, `X-TOKEN`). Fallback về `Engine.newBrowser().launch()`. |
| **Mục lục (TOC)** | `src/toc.js` | **Đã fix bug Ghost Chapters (Chương ma)**: Đã bỏ vòng lặp `for (c=1; c<=maxNum; c++)` tự sinh chương ảo (gây 302/500 redirect). Hiện tại map 100% chương thực tế từ API `/api/comic/{slug}`. |
| **Phân trang** | `src/gen.js` | Đã sửa điều kiện `next = (list.length > 0)` thay vì `>= 15`, cho phép chuyển qua Trang 2, 3... |
| **Config & Cards** | `src/config.js` | Đã chuẩn hóa `parentHref` (bỏ `/` thừa) trong `parseHtmlCards()` để giữ số chương ngoài danh sách truyện. |
| **Plugin Package** | `plugin.json` & `plugin.zip` | Đã bump version **9**, đóng gói `plugin.zip` bằng Python `zipfile` với thư mục entry `src/`. |

---

## 2. Phân Tích Sâu Lỗi "Kẹt Xác Minh Con Người" (Cloudflare Turnstile Loop)

### 🔴 Triệu chứng
User mở truyện / mở "Trang nguồn" trong VBook app bị popup Cloudflare Turnstile "xác minh con người". Nhấp vào xác minh thì bị lặp lại liên tục không bao giờ xong, dẫn tới không tải được ảnh.

### 🔍 Nghiên cứu kỹ thuật của Gemini về Server `goctruyentranhvui41.com`
1. **Hành vi Chuyển hướng (Redirect Loop) của Server**:
   - Khi request không có cookie `usid`, server trả về `302 Found`: `https://goctruyentranhvui41.com/truyen/one-piece/chuong-1090` ➔ `http://goctruyentranhvui41.com/truyen/one-piece;usid=XXX`.
   - **Lưu ý cực kỳ quan trọng**: Server hạ cấp `https` ➔ `http`, đồng thời **tẩy xóa mất phần `/chuong-1090`** trên URL redirect, nối thêm `;usid=XXX` vào sau tên truyện!
   - `http://...` sau đó lại trả về `301 Moved Permanently` về `https://...`.
   - Trình duyệt nhúng Android WebView (dùng trong VBook `Engine.newBrowser()` và "Trang nguồn") gặp việc downgrade HTTP/HTTPS và rewrite URL `;usid=` này sẽ khiến widget Cloudflare Turnstile JS **bị lỗi xác minh và lặp vô tận (infinite loop)**.

2. **Khám phá API `POST /api/chapter/loadAll`**:
   - Trong `view_addition.js` của site có API endpoint: `POST /api/chapter/loadAll`.
   - Payload `application/x-www-form-urlencoded`:
     - `comicId`: ID truyện (lấy từ `/api/comic/{slug}` -> `result.id`, ví dụ `'0001100684'`)
     - `chapterNumber`: Số chương (ví dụ `'56'`)
     - `nameEn`: Slug truyện (ví dụ `'duong-mon-truyen-ky'`)
   - Yêu cầu Session: Phải thực hiện 1 request `GET` đến trang HTML chương trước (`/truyen/{slug}/chuong-{num}`) để lấy header `Set-Cookie` (`usid`, `X-TOKEN`).
   - Kết quả thành công: Trả về JSON chứa mảng URL ảnh trực tiếp:
     `{"status":true, "code":200, "result":{"data":["https://vn3.gtt-bk.pro/image/...", ...]}}`

---

## 3. Vì Sao Trên Máy User Vẫn Báo Kẹt Xác Minh Con Người? (Các Giả Thuyết Cho Claude)

 Mặc dù Gemini đã code API `POST /api/chapter/loadAll` ở `chap.js`, user vẫn bị lỗi. Claude cần kiểm tra các khả năng sau:

1. **Giả thuyết 1: Cloudflare Challenge theo TLS / JA3 Fingerprint trên OkHttp của VBook**
   - Giống như bài học ở `FastScan` / Stack 4: Request `Http.get()` của OkHttp trong VBook bị Cloudflare chặn ngay từ request GET đầu tiên (trả về HTML `Just a moment...` / Turnstile page 403/503).
   - Vì `Http.get()` bị Cloudflare chặn, `resStr` trả về HTML Turnstile chứ không có cookie `usid` ➔ API `POST /api/chapter/loadAll` tiếp theo bị trả về `Phiên làm việc đã hết hạn` hoặc fail ➔ rơi vào Fallback `Engine.newBrowser()` ➔ bị dính Turnstile Loop WebView.

2. **Giả thuyết 2: VBook Chưa Cập Nhật Bản v9 (Cache của `raw.githubusercontent.com`)**
   - GitHub Raw cache `plugin.json` 5-15 phút. Máy user có thể vẫn đang chạy v6/v7 (chưa có code API `loadAll`).
   - **Giải pháp**: Nhắc user bật Private DNS `1.1.1.1`, vào VBook xoá plugin và cài lại, hoặc bump version lên `v10` để ép VBook refetch.

3. **Giả thuyết 3: Bị Nhà Mạng Việt Nam (VNPT/Viettel/FPT) Chặn DNS / SNI**
   - Tên miền `goctruyentranhvui41.com` hoặc CDN `gtt-bk.pro` có thể bị nhà mạng chặn DNS làm OkHttp fail.
   - **Dấu hiệu**: Bật 1.1.1.1 / VPN thì tải được bình thường.

4. **Giả thuyết 4: Domain `SITE_URL` bị thay đổi**
   - Kiểm tra các tên miền phụ: `goctruyentranhvui30.com`, `goctruyentranhvui31.com`, `goctruyentranhvui42.com`, `goctruyentranhvui45.com`.

---

## 4. Hướng Đề Xuất Cho Claude Tiếp Tục Fix

1. **Kiểm tra Cloudflare Challenge trong `Http.get()`**:
   - Nếu `Http.get()` trả về chứa `cf-challenge`, `Just a moment`, `cf-browser-verification`:
   - Cần dùng `Engine.newBrowser().launch(url, 15000)` để bypass CF lấy cookie trước, hoặc tìm domain không bị CF challenge.

2. **Kiểm tra CDN Ảnh**:
   - Kiểm tra xem mảng ảnh trả về từ `vn3.gtt-bk.pro` hoặc `cdngo.goctruyentranhvui41.com` có cần Referer header hay không.
   - Nếu CDN bị chặn, thử dùng Proxy ảnh (như Jetpack Photon `https://i0.wp.com/{url-no-scheme}?w=1000&quality=80` hoặc `wsrv.nl`).

3. **Thêm logging / Error Response chi tiết**:
   - Trả về `Response.error("CF Blocked: " + title)` trong `chap.js` để user báo lại đúng vị trí bị kẹt.

---
*Báo cáo được lập bởi Gemini Agent — 2026-08-12.*
