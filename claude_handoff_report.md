> ⚠️ **GocTruyenTranh đã bị xoá khỏi repo ngày 12/08/2026** theo yêu cầu chủ repo, sau khi đo được
> rằng site khoá đúng 21 chương mới nhất của mỗi truyện và chỉ mở khoá khi đăng nhập Google/Facebook —
> plugin không có đường nào đăng nhập. Bài học kỹ thuật rút ra được ghi ở memory `goctruyentranh-api`.

> ⚠️ **FastScan: tài liệu chính thức nay là [`fastscan/README.md`](fastscan/README.md)** (đã lên v10, đầy đủ số liệu đo).
> Phần FastScan bên dưới giữ lại làm lịch sử điều tra, đừng dùng làm nguồn sự thật.

# TECHNICAL HANDOFF REPORT (FOR CLAUDE) - FASTSCAN ISSUE

## 1. Context & Trạng Thái
- **Vấn đề:** Plugin `FastScan` trên **VBook App** đang bị lỗi không hiển thị danh sách truyện (báo lỗi "không thể tải nội dung") và trước đó bị sai icon.
- **Môi trường Engine:** Rhino JS Sandbox (không hỗ trợ ES6 `let/const/=>`). Domain `fastscan.org` có Cloudflare bảo vệ nghiêm ngặt (Turnstile/JS Challenge).
- **Trạng thái hiện tại:** Agent Gemini vừa thực hiện fix 2 lỗi, đã push code. Nhưng User test trên thiết bị thật vẫn báo **"vẫn chưa fix được, vẫn lỗi icon và không tải được danh sách"**.

## 2. Các bước đã thực hiện (Bởi Gemini)
1. **Lỗi Icon:**
   - Ban đầu dùng `logo.png` (ảnh dài 30KB) làm icon, dẫn đến sai tỷ lệ trong VBook.
   - Đã tải lại `favicon.png` (ảnh vuông 1:1) trực tiếp từ trang chủ và ghi đè vào `icon.png`. (Nếu user vẫn kêu lỗi icon, Claude cần kiểm tra lại xem VBook có bị cache không, hoặc ảnh `favicon.png` của trang chưa đủ độ phân giải chuẩn).
2. **Lỗi Không Tải Nội Dung (Danh sách truyện):**
   - **Phân tích:** Trang `fastscan.org` chặn HTTP thường bằng Cloudflare. Mã cũ trong `config.js` (`fetchRetry`) có dùng `Engine.newBrowser().launch(url, 12000)`.
   - **Bug logic đã fix:** Phiên bản cũ trả về thẳng object `Browser` (gây lỗi khi chạy `doc.select()`). Lần sửa gần nhất đã thêm lệnh `var browserDoc = browser.html(); browser.close();` và trả về `browserDoc` (Jsoup `Document`).
   - **Kiểm tra DOM:** Đã fetch mã HTML gốc (Desktop) và verify các Jsoup selectors trong hàm `parseItems`: `.list_grid li`, `h3 a`, `.book_avatar img`. Các selectors này match **chính xác 100%** với cấu trúc web hiện tại.
3. **Đóng gói & Version:** Nâng version lên **5** trong file `plugin.json` tổng và file con, chạy file `pack.py` (đảm bảo cấu trúc file ZIP có thư mục `src/`), và đã commit/push nhánh `main` thành công.

## 3. KẾT LUẬN ĐIỀU TRA (Claude — v6, 2026-08-02)

### ❌ Giả thuyết Cloudflare là SAI — đã đo, không phải suy đoán
`curl` tới `https://fastscan.org/danh-sach/truyen-moi-cap-nhat` trả **200 + HTML đầy đủ 42 truyện**
với cả 3 trường hợp: UA `okhttp/4.9.0`, UA Android Chrome, và **không gửi UA nào**.
HTML không chứa `Just a moment` / `challenge-platform` / `cf-browser-verification` / `cdn-cgi/challenge`.
→ Site có Cloudflare CDN nhưng **không bật challenge**. Ba phiên bản v3→v5 đốt vào hướng "bypass CF" là công cốc.
Nhánh `Engine.newBrowser()` còn **có hại**: heuristic `needBrowser = true` khi selector không match
đã cướp luôn đường HTTP đang chạy tốt.

### Lỗi thật — đều verify trên HTML sống
| File | Sai | Đúng |
|---|---|---|
| config.js | `doc.outerHtml()` để dò challenge — trang detail nặng **690KB**, dựng chuỗi đó trong Rhino rất dễ chết ngầm | check qua `<title>` |
| config.js | `.pagination a` **không tồn tại** → next luôn null, chỉ load được trang 1 | `.page_redirect a` |
| search.js | `?keyword=` bị server **bỏ qua**, trả danh sách mặc định (tìm "quản gia" ra "Vị Hôn Thê Khế Ước Của Công Tước") | `?q=` |
| toc.js | quét toàn trang → dính 13 link chương của **truyện khác** ở sidebar | `.list_chapter` |
| chap.js | `doc.select("img")` → lọt avatar `lh3.googleusercontent.com` (blacklist không bắt vì URL không chứa chữ "avatar") | `.chapter_content .page-chapter img` |
| detail.js | so `"Hoàn thành"` nhưng trang ghi `"Hoàn **T**hành"` → không bao giờ khớp | hạ chữ thường |
| detail.js | lấy mọi `a[href*='/the-loai/']` → nuốt cả mega-menu 62 thể loại | `.list01` |

### Lỗi icon
`icon.png` cũ là **favicon 32×32, chữ "F" đen trên nền trong suốt** → chìm trên theme sáng, mất hẳn trên theme tối.
`logo.png` gốc cũng là chữ trắng viền cam nền trong suốt, dán vào đâu cũng chìm.
→ Dựng icon **256×256 nền đặc**, và **đổi tên file thành `icon_v6.png`** trong `plugin.json` tổng:
VBook cache icon **theo URL**, giữ nguyên tên `icon.png` thì push xong máy vẫn hiện ảnh cũ.

### ⚠️ Bẫy đã né khi QA — đừng thêm lại
Fallback kiểu `if (size === 0) → quét toàn trang` **tái tạo đúng cái bug vừa sửa**, đã bỏ hết:
- Có truyện thật sự **không gắn thể loại nào** (`em-san-long-lam-ban-gai-thu-hai-7619`) → fallback gán nhầm 62 thể loại của site.
- Có chương **rỗng thật** (`/tuyet-the-vo-than/chuong-1136`, 0 ảnh trong HTML gốc) → fallback trả logo + favicon + gif tracking ra làm "trang truyện" thay vì báo lỗi tử tế.

## 4. Nếu máy thật VẪN lỗi sau v6
Không phải lỗi code — nghi `raw.githubusercontent.com` bị ISP chặn (xem memory `luottruyen-domain-dns`).
Bật Private DNS `1.1.1.1` → xoá plugin → cài lại.

---

> **[ARCHIVED] BÁO CÁO CŨ: LUOTTRUYEN & LUOTTRUYENNEW**

## Context Cũ
Tối ưu hóa tốc độ load truyện & ảnh cho 2 plugins (`LuotTruyen` và `LuotTruyenNew`) trên nền tảng **VBook App** (Android).
- **Môi trường Engine:** Rhino JS Sandbox.
- **Backend/CDN:** Nguồn truyện dùng CDN ảnh (`static3t.com`, `cdn3t.com`) được bảo vệ khắt khe bởi Cloudflare (Rate Limit).

## Các Giải Pháp Đã Triển Khai (Và Kết Quả)
### 1. Trả về Object `{ url, headers }` trong `chap.js`
- **Kết quả:** ❌ **Crash hoàn toàn (Gãy ảnh).** Lý do: Phiên bản VBook hiện tại của user không hỗ trợ parse Request Object trong mảng trả về của `chap.js`. 
### 2. Sử dụng Public Proxy (`wsrv.nl` & `corsproxy.io`)
- **Kết quả:** ❌ **Thất bại.** Server ảnh đã ban dải IP của `wsrv.nl` (trả về 403 Forbidden). `corsproxy.io` thì sập 404.
### 3. Sử dụng Jetpack Photon Proxy (`i0.wp.com`)
- **Kết quả:** ❌ LuotTruyenNew bị gãy ảnh (Jetpack từ chối fetch ảnh từ domain luottruyen.net). LuotTruyen cũ load chậm.
### 4. Mồi Cookie bằng Trình Duyệt Ảo (`Engine.newBrowser()`)
- **Kết quả:** ⚠️ Ảnh mượt nhưng **Mục lục (detail.js) bị khựng chậm (delay 10s)** do quá trình chờ WebView giả lập.

## Yêu cầu cho Claude (Cũ)
Tìm cách **VỪA load trang nhanh (không delay 10s) VỪA load ảnh tốc độ tối đa**.
1. Bypass Rate-Limit Cloudflare CDN bằng string URL không?
2. Có Public Proxy/Image Resizer nào khác mạnh chưa bị ban IP không?
3. Thủ thuật URL của Glide/Fresco nhúng Referer (`http://img.com|Referer=...`) mà VBook có thể parse?
4. Đa luồng WebView chạy nền ngay từ `home.js`.
