# TECHNICAL HANDOFF REPORT (FOR CLAUDE)

## Context
Tối ưu hóa tốc độ load truyện & ảnh cho 2 plugins (`LuotTruyen` và `LuotTruyenNew`) trên nền tảng **VBook App** (Android).
- **Môi trường Engine:** Rhino JS Sandbox (không hỗ trợ ES6 `let/const/=>`, không có native Java Crypto classes).
- **Backend/CDN:** Nguồn truyện dùng CDN ảnh (`static3t.com`, `cdn3t.com`) được bảo vệ khắt khe bởi Cloudflare (Rate Limit bóp băng thông xuống rất thấp nếu thiếu Cookie CF hoặc thiếu HTTP Referer).
- **VBook Image Downloader:** Là Native Layer (Glide/Fresco trên Android). Cần mảng String chứa URL ảnh thuần túy để tự tải ảnh ở background.

## Các Giải Pháp Đã Triển Khai (Và Kết Quả)

### 1. Giải pháp 1: Trả về Object `{ url, headers }` trong `chap.js`
- **Logic:** Truyền `Referer` và `User-Agent` thẳng vào Native Image Downloader của VBook thông qua mảng Object.
- **Kết quả:** ❌ **Crash hoàn toàn (Gãy ảnh).** Lý do: Phiên bản VBook hiện tại của user không hỗ trợ parse Request Object trong mảng trả về của `chap.js`. Bắt buộc phải push dạng `String` URL trần.

### 2. Giải pháp 2: Sử dụng Public Proxy (`wsrv.nl` & `corsproxy.io`)
- **Logic:** Wrap URL ảnh qua proxy `https://wsrv.nl/?url=...` để proxy fetch ảnh từ máy chủ truyện (do máy chủ truyện không chặn proxy).
- **Kết quả:** ❌ **Thất bại.** Server ảnh đã ban dải IP của `wsrv.nl` (trả về 403 Forbidden). `corsproxy.io` thì sập 404 toàn tập.

### 3. Giải pháp 3: Sử dụng Jetpack Photon Proxy (`i0.wp.com`)
- **Logic:** Wrap ảnh qua `https://i0.wp.com/{url_khong_giao_thuc}` lợi dụng việc các CDN truyện thường Whitelist (không bóp băng thông) đối với Bot của WordPress.
- **Kết quả:** ❌ LuotTruyenNew bị gãy ảnh (Jetpack từ chối fetch ảnh từ domain luottruyen.net). LuotTruyen cũ thì ảnh load được nhưng tốc độ vẫn bị trễ (latency của WP Proxy không đạt "max speed").

### 4. Giải pháp 4 (Hiện tại): Mồi Cookie bằng Trình Duyệt Ảo (`Engine.newBrowser()`)
- **Logic:** CDN `static3t` bóp băng thông nếu Request thiếu `cf_clearance` cookie. Để vượt qua, ở file `detail.js` (Lúc mở chi tiết truyện), gọi `Engine.newBrowser().launch(url, 10000)` để WebView ngầm tự xử lý Cloudflare Challenge trong 10 giây. Cookie sau đó được lưu tự động vào Native Cookie Manager của VBook. Ở `chap.js`, trả về URL chuỗi trần.
- **Kết quả:** ⚠️ Ảnh ở các chương load mượt (do Native Downloader đã có Cookie). Tuy nhiên, **Mục lục (detail.js) bị khựng chậm (delay 10s)** do quá trình chờ WebView giả lập. Người dùng đánh giá UX tổng thể "vẫn còn quá chậm".

## Mục Tiêu (Yêu cầu cho Claude)
Hãy tìm ra cách **VỪA load trang nhanh (không delay 10s) VỪA load ảnh tốc độ tối đa**. 

### Các hướng gợi ý để Claude suy nghĩ:
1. Có cách nào Bypass Rate-Limit của Cloudflare CDN mà không cần Cookie (chỉ bằng thủ thuật string URL) không?
2. Có Public Proxy/Image Resizer nào khác (kiểu `allorigins` hay `statically.io`) mạnh, ổn định, và chưa bị Cloudflare của CDN chặn IP không?
3. Có thủ thuật/Cú pháp URL đặc biệt nào của thư viện Glide/Fresco (được giấu trong Android Native) cho phép nhúng Referer vào String URL (ví dụ: `http://img.com|Referer=...` hay `http://img.com#Referer=...`) mà VBook có thể vô tình parse được không?
4. Thiết kế logic đa luồng (nếu Rhino cho phép) để WebView chạy nền ngay từ `home.js` thay vì chặn luồng chính ở `detail.js`.
