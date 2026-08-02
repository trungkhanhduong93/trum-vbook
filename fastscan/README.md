# FastScan — ghi chép nguồn truyện

Plugin VBook cho `https://fastscan.org`. Trạng thái: **v10**, đang chạy.
Cập nhật 2026-08-02. Mọi con số dưới đây là **đo thật**, không suy đoán.

---

## 1. Đặc điểm site

| Hạng mục | Thực tế |
|---|---|
| Backend | Laravel + MySQL, HTML render sẵn phía server |
| CDN trang | Cloudflare — **KHÔNG bật challenge** |
| CDN ảnh | `anhtruyen.site` và `imgvip.site` → origin **Backblaze B2** sau Cloudflare |
| Ảnh | JPEG, rộng 720–900px. Không có bản `.webp`/`.avif`, không content-negotiation |
| Mục lục | Chỉ render server-side, **không có endpoint AJAX** |

### ⛔ Huyền thoại Cloudflare — ĐÃ BÁC BỎ, đừng điều tra lại
`curl` tới `/danh-sach/truyen-moi-cap-nhat` trả **200 + HTML đầy đủ 42 truyện** với cả ba trường hợp:
UA `okhttp/4.9.0`, UA Android Chrome, và **không gửi UA nào**. HTML không chứa
`Just a moment` / `challenge-platform` / `cf-browser-verification` / `cdn-cgi/challenge`.

Agent trước (Gemini) đốt 3 phiên bản (v3→v5) để "bypass Cloudflare": thêm `Engine.newBrowser()`,
nới regex bắt chuỗi challenge, ép `needBrowser = true` khi selector không match. Sai hoàn toàn —
và nhánh browser còn **cướp luôn đường HTTP đang chạy tốt**. `Http.get()` là đủ.

---

## 2. Selector & tham số đúng (verify trên HTML sống)

| Việc | Selector / tham số |
|---|---|
| Danh sách truyện | `.list_grid li` → tên `.book_name a`, ảnh `.book_avatar img[data-src]`, chương mới `.last_chapter a` |
| Phân trang | `.page_redirect a` — **KHÔNG phải** `.pagination` |
| Tìm kiếm | `/tim-kiem?q=` — **KHÔNG phải** `?keyword=` |
| Mục lục | `.list_chapter a[href*='/chuong-']` (dự phòng `.works-chapter-item`) |
| Ảnh chương | `.chapter_content .page-chapter img` (dự phòng `.page-chapter img`) |
| Tình trạng | `li.status` — trang ghi **"Hoàn Thành"** (T hoa), phải `.toLowerCase()` |
| Thể loại | `.list01 a[href*='/the-loai/']` |

### Vì sao từng sai
- `?keyword=` bị server **bỏ qua** → trả danh sách mặc định. Tìm "quản gia" ra "Vị Hôn Thê Khế Ước Của Công Tước".
- `.pagination` không tồn tại → `next` luôn `null`, chỉ load được trang 1.
- Quét toàn trang `a[href*='/chuong-']` → dính **13 link chương của truyện khác** ở sidebar "đề cử".
- Quét toàn bộ `<img>` → lọt avatar `lh3.googleusercontent.com` (blacklist không bắt vì URL **không chứa** chữ "avatar") và gif tracking blogspot.
- So `"Hoàn thành"` (t thường) → **không bao giờ khớp**.
- Lấy mọi `a[href*='/the-loai/']` → nuốt cả mega-menu **62 thể loại** của site.
- Phân trang khớp bằng `indexOf("page=" + n)` → `page=2` **dính nhầm** `page=206`. Phải regex `[?&]page=(\d+)`.

---

## 3. ⛔ Bẫy fallback — đừng thêm lại

Viết `if (size === 0) → nới selector ra toàn trang` là **tái tạo đúng cái bug vừa sửa**.
Selector rỗng ở site này thường nghĩa là *dữ liệu thật sự không có*, không phải *DOM đổi*:

| Ca thật | Fallback sẽ gây ra |
|---|---|
| `em-san-long-lam-ban-gai-thu-hai-7619` — truyện **không gắn thể loại nào** | gán nhầm 62 thể loại của site |
| `/tuyet-the-vo-than/chuong-1136` — chương **rỗng thật** (0 ảnh trong HTML gốc) | trả logo + favicon + gif tracking ra làm "trang truyện" |

Chỉ fallback **trong cùng họ container** (`.chapter_content .page-chapter` → `.page-chapter`).
Rỗng thì để `Response.error` báo tử tế.

---

## 4. "Lỗi mục lục" — KHÔNG phải lỗi plugin

Quét 84 truyện, 14 truyện gãy. Cả 14 đều là lỗi phía site:

| Số | Nguyên nhân | Nhận biết |
|---|---|---|
| 13 | Site **chưa đăng chương nào** (Naruto, Doubt, Rainbow, Distant Sky…) | `div.works-chapter-list` rỗng; ngoài danh sách ghi `last_chapter = "Đang cập nhật"` |
| 1 | Site **trả 500** (`trong-khai-di-the-...-4113`) | Laravel `Missing required parameter [Route: showAuthor]` — truyện không có tác giả thì trang detail crash |

`toc.js` phân biệt ba ca và báo đúng nguyên nhân, để khỏi tưởng plugin hỏng rồi cài đi cài lại.

---

## 5. Icon

Icon cũ là **favicon 32×32, chữ "F" đen nền trong suốt** → chìm trên theme sáng, mất hẳn trên theme tối.
`logo.png` gốc cũng là chữ trắng viền cam nền trong suốt, dán vào đâu cũng chìm.

Hiện dùng **256×256 nền đặc** (slate đậm + wordmark FASTSCANS trắng).

> **VBook cache icon theo URL.** Đổi ảnh mà giữ nguyên tên `icon.png` thì push xong máy vẫn hiện ảnh cũ.
> Phải đổi tên file (đang là `icon_v6.png`) trong `plugin.json` tổng.

---

## 6. Tốc độ ảnh — đã đo hết, đã chạm trần

### Nút thắt
Ảnh nằm trên Backblaze B2 sau Cloudflare, `Cache-Control: max-age=14400`:

| Trạng thái edge | TTFB | Tổng |
|---|---|---|
| `cf-cache-status: MISS` | **1,5–2,5s** | ~2–4s/ảnh |
| `HIT` (đọc lại lần 2) | **0,16–0,2s** | ~0,25s/ảnh |

Chênh 8–10 lần. Một chương ~6MB, dù là 30–88 ảnh thường hay 5 ảnh **strip dọc 900×29180px**.

### Các phương án đã thử và LOẠI

| Phương án | Kết quả |
|---|---|
| Bản `.webp`/`.avif` ở origin | ❌ 404 |
| Content-negotiation (`Accept: image/webp`) | ❌ vẫn trả JPEG |
| Photon `i0.wp.com` | ❌ HTTP 400 |
| wsrv.nl `output=webp` không chặn kích thước | ❌ `libvips: image too large` trên strip (WebP trần 16383px) |
| Host ảnh dự phòng / nút đổi server | ❌ không có — mỗi chương chỉ nằm trên đúng 1 host, hai host không phục vụ chéo |
| Endpoint AJAX cho mục lục | ❌ site không có → `toc.js` buộc phải tải cả trang 690KB–1.1MB |
| **Proxy nén qua wsrv.nl (v7→v9)** | ❌ **đã gỡ ở v10** — xem dưới |

### Vì sao gỡ proxy (v10)
Đo 4 chương (49/48/81/89 ảnh), mỗi nhánh 7 ảnh thuộc dải chỉ số riêng, đảo thứ tự giữa các vòng:

| | URL trần | Qua proxy | |
|---|---|---|---|
| Wifi không bóp | **20,1s** | 24,7s | trần nhanh hơn **23%** |
| 4G yếu ~240KB/s | 34,8s | **31,6s** | proxy nhanh hơn 9% |

Đổi 9% trên 4G yếu không đáng: mất 23% trên wifi, ảnh phải nén lại lần hai, và ôm thêm điểm chết đơn lẻ.

**Bài học:** lợi thế proxy ở v8 lớn hơn nhiều (17–34% trên 4G) — nhưng đó là nhờ thu ảnh xuống 720px,
và **chính việc thu nhỏ đó gây mờ**. Ảnh gốc chỉ rộng 800–900px mà màn hình ~1080px, thu xuống 720
là kéo giãn. Sửa mờ (v9, giữ nguyên độ phân giải) đẩy dung lượng từ 45% lên 66% → ăn gần hết phần lợi.
**Không thể vừa nét vừa nhẹ ở nguồn này.**

> Khi so chất lượng ảnh, phải **dán lên đúng bề rộng màn hình (~1080px)**. Tôi từng so ở 900px
> nên không phát hiện v8 bị mờ, để user báo lại.

### Đòn bẩy còn lại (không nằm trong plugin)
Đo được **6 luồng song song nhanh gấp 2,5 lần tuần tự** (152 KB/s vs 80 KB/s) — vì TTFB 2s/ảnh gần
như là thời gian *chờ*, chờ song song thì gần miễn phí. Số luồng do **app VBook** quyết.
Chỉnh mức tải trước / số ảnh tải đồng thời trong cài đặt trình đọc ăn hơn mọi thứ làm được trong code.

---

## 7. Luật đóng gói (chung cho mọi plugin repo này)

- Repack **bằng Python**, không `Compress-Archive` — zip phải có directory entry `src/`, thiếu là cài fail im lặng.
- Bump version **đủ 3 chỗ**: `fastscan/plugin.json`, `plugin.json` tổng, và repack lại `plugin.zip`.
- Rhino-Jsoup: **KHÔNG** `selectFirst()` → dùng helper `selFirst()`. Tránh child combinator `>`. Không ES6.
- `chap.js` chỉ trả **URL trần** — không nối `|Referer=`.
- Verify namelist sau mỗi build.

## 8. Lịch sử phiên bản

| v | Nội dung |
|---|---|
| 3–5 | (Gemini) đuổi theo Cloudflare — sai hướng, không sửa được gì |
| 6 | Sửa selector/param thật + icon 256×256 nền đặc + đổi tên file phá cache icon |
| 7 | Thêm proxy wsrv.nl, JPEG q65 @720px |
| 8 | Đổi sang WebP + chốt `h=16000&fit=inside`; `toc.js` báo đúng nguyên nhân lỗi site |
| 9 | Sửa mờ — giữ nguyên độ phân giải gốc; probe nhẹ thay probe nặng (3,16s → 0,27s) |
| **10** | **Gỡ hẳn proxy, trả URL trần** — ảnh nguyên bản, nhanh hơn trên wifi, hết điểm chết đơn lẻ |
