# GOCTRUYENTRANH — ghi chú nguồn

> Cập nhật 12/08/2026, bản `v10`. Bản trước (`v9`) có một báo cáo chẩn đoán lỗi là do
> Cloudflare chặn OkHttp — **chẩn đoán đó sai**, đã đo lại và thay bằng nội dung dưới đây.

---

## 1. Site hoạt động thế nào

Site là Spring app, dữ liệu đi qua REST API, **không** phải scrape HTML.

| Việc | Endpoint | Cần cookie? |
|---|---|---|
| Danh sách mới cập nhật | `GET /truyen-cap-nhat?p=N` (HTML, 32 truyện/trang) | không |
| Danh sách / lọc thể loại | `GET /api/v2/search?p=0&categories=ACT&orders=viewCount` (30/trang, `result.next`) | không |
| Tìm kiếm | `GET /api/comic/search?name=...` (trả tất cả, không phân trang) | không |
| Chi tiết truyện | `GET /api/comic/{slug}` | không |
| **Chương còn lại** | `GET /api/comic/{comicId}/chapter?offset={limit}&limit=-1` | **có** |
| **Ảnh chương** | `POST /api/chapter/loadAll` — form `comicId`, `chapterNumber`, `nameEn` | **có** |

Cookie `usid` lấy bằng một `GET /lien-he` (55KB — nhẹ nhất trong các trang có `Set-Cookie`;
`/trang-chu` là 600KB). Cookie sống ~13 giờ. Thiếu nó, API trả
`{"status":false,...,"Phiên làm việc đã hết hạn, vui lòng tải lại."}`.

Nguồn sự thật cho hai endpoint cuối: `/contents/v2/js/detail.js` và
`/contents/v2/js/view_addition.js` của chính site (file sau bị obfuscate, phải giải mã mới đọc được).

---

## 2. Hai giới hạn của site — phải biết trước khi sửa

**`/api/comic/{slug}` luôn chỉ trả 21 chương mới nhất** (`result.limit = 21`, hardcode phía server;
truyền `limit=1000`, `all=true` đều vô ích). Võ Luyện Đỉnh Phong 3860 chương vẫn chỉ trả 21.
Phần còn lại nằm ở `/api/comic/{comicId}/chapter?offset=21&limit=-1` — `offset` **phải** bằng
`result.limit`; để `offset=0` thì trả về rỗng.

**Một số chương bị site khoá, phải đăng nhập mới đọc được — và API đánh dấu sẵn bằng
`type == "TRIPLE"` trong danh sách chương.** Đây là cờ chính xác, đừng suy từ vị trí chương
(bản v12 từng đoán "21 chương mới nhất" và đoán sai).

Đối chiếu `type` với `loadAll` — khớp tuyệt đối:

| Truyện | TRIPLE | Kiểm bằng loadAll |
|---|---|---|
| dai-quan-gia (895 ch) | 81 chương, rải rác 775–894 | 775/800/850/873 khoá · **870 (NORMAL) → 48 ảnh** |
| dao-quy-di-tien (92 ch) | 18 chương, rải rác 52–92 | 52/92 khoá · **60/71/91 (NORMAL) → có ảnh** |
| toan-chuc-phap-su, dai-vuong-tha-mang, cau-be-shotgun (đã hoàn thành) | **0** | đọc được toàn bộ |

Nghĩa là chương khoá **nằm rải rác, chiếm thiểu số** (Đạo Quỷ 18/92, Đại Quản Gia 81/895), và
truyện đã hoàn thành thì không khoá chương nào. `/api/user/performSkipAds` (cơ chế xem quảng cáo
để mở khoá của site) trả *"Bạn cần đăng nhập để dùng chức năng này"* → plugin không lách được.

`loadAll` trả `codeState` theo `handleOutput()` của site:

| codeState | Nghĩa |
|---|---|
| `00` | OK, `result.data` là mảng URL ảnh |
| `01` | Bắt đăng nhập (site gọi là `requiredAuth`) |
| `02` | Hết lượt đọc |
| `03` | Phiên hỏng, site tự gọi `/api/cleanSession` |

Plugin **không** đăng nhập được (site chỉ có `/api/login` với method google/facebook, không có API
đăng ký) — gặp `01` thì hiện trang ảnh báo lý do, không cố lách.

---

## 3. Lỗi v9 và cách đã sửa (v10)

Triệu chứng người dùng báo: *bấm vào chương không tải được ảnh; bấm "Trang nguồn" thì bị bắt xác
minh con người mãi không dừng.*

Nguyên nhân là **hai bug chồng nhau**, cả hai đều nằm trong plugin:

1. `chap.js` gọi `extractSlug()` trên URL chương → nhận `"slug/chuong-92"` chứ không phải slug.
   `/api/comic/slug/chuong-92` trả 404 → `comicId` rỗng → `loadAll` trả `"Không có dữ liệu."`
   cho **mọi** chương.
2. Thất bại đó rơi xuống nhánh `Engine.newBrowser()`. WebView mở trang chương thì dính đúng cái
   redirect quái của site: `https://.../truyen/x/chuong-N` → **302** `http://.../truyen/x;usid=XXX`
   (tụt HTTPS→HTTP, **mất luôn phần `/chuong-N`**) → 301 ngược lại HTTPS. Widget Turnstile trong
   WebView gặp chuỗi này thì lặp xác minh vô tận.

Cộng thêm: `toc.js` chỉ liệt kê 21 chương từ `/api/comic/{slug}` — mà trong nhóm đó có nhiều chương
`TRIPLE`. Nên kể cả khi sửa được bug 1, người dùng vẫn dễ bấm trúng chương khoá.

Đã sửa: `comicSlug()` cắt đúng slug · ghép hai API để ra đủ chương · **bỏ hẳn nhánh
`Engine.newBrowser()`** · đọc `codeState` và báo lỗi bằng tiếng người · `ensureSession()` lấy cookie
qua `/lien-he` · retry một lần khi cookie hết hạn · `extractSlug()` cắt `;usid=...`.

Kết quả đo lại: mục lục 21 → **3820 mục**, ảnh chương tải bình thường, không còn đường nào gọi browser.

---

## 4. Những chỗ dễ vấp lần sau

- **Đừng đổ tại Cloudflare khi chưa đo.** `Http.get`/`Http.post` gọi API site này bình thường,
  không hề bị challenge. Cái bị Turnstile là **WebView**, và chỉ khi ta đẩy nó vào đó.
- URL ảnh (`vn2/vn3.gtt-bk.pro`) là **signed URL có `exp` + `verify`**, hết hạn theo thời gian —
  đừng kỳ vọng cache lâu. CDN đòi header `Referer`, nhưng **không** được nối `|Referer=` vào URL
  ảnh; trả URL trần, Vbook tự lo.
- `buildImage()` của site có thay `/c/code` → `/c/smp` (mobile) / `/c/web`. Quét 3 truyện chưa gặp
  URL nào dạng đó nên plugin chưa xử lý — nếu sau này ảnh 403, kiểm chỗ này trước.
- Domain đổi số thường xuyên. `detectDomain()` dò `PREFER_NUMS`; lúc viết bản này `vui41` và `vui42`
  sống, `43/44/45` chết.

## 5. Còn nợ

`genre.js` và hai mục "Truyện Mới" / "Đang Hot" trong `home.js` đang trỏ vào `/danh-sach?...`, mà
trang đó render bằng JS nên HTML không có card nào → **luôn rỗng**. Phải chuyển sang
`/api/v2/search`. Mã thể loại hiện tại cũng sai: `FAN` không tồn tại, `SCL` là *Học Đường* chứ
không phải Sci-Fi (đúng là `SCF`), `MAA` là *Võ Thuật* chứ không phải Manhua (đúng là `MAU`).
Bảng mã đầy đủ lấy được từ `data-code` trong HTML `/danh-sach`.
