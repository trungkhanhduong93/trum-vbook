# GOCTRUYENTRANH — ghi chú nguồn

> Cập nhật 12/08/2026, bản `v17`. Bản trước (`v16`) vẫn bị lỗi không tải được ảnh
> dù đã có nhánh WebView — lý do: đường Http lãng phí 2 request trước khi chuyển sang
> WebView. Bản này ưu tiên WebView hoàn toàn cho API cần session.

---

## 1. Site hoạt động thế nào

Site là Spring app, dữ liệu đi qua REST API, **không** phải scrape HTML.

| Việc | Endpoint | Cần cookie? |
|---|---|---|
| Danh sách mới cập nhật | `GET /truyen-cap-nhat?p=N` (HTML, 32 truyện/trang) | không |
| Danh sách / lọc thể loại | `GET /api/v2/search?p=0&categories=ACT&orders=viewCount` (30/trang, `result.next`) | không |
| Tìm kiếm | `GET /api/comic/search?name=...` (trả tất cả, không phân trang) | không |
| Chi tiết truyện | `GET /api/comic/{slug}` | không |
| **Chương còn lại** | `GET /api/comic/{comicId}/chapter?offset=0&limit=-1` | **có (X-TOKEN)** |
| **Ảnh chương** | `POST /api/chapter/loadAll` — form `comicId`, `chapterNumber`, `nameEn` | **có (X-TOKEN)** |

### Cookie X-TOKEN — vấn đề cốt lõi

Server trả **2 cookie trên CÙNG MỘT `Set-Cookie` header**:
```
Set-Cookie: usid=XXX; Path=/; ..., X-TOKEN=YYY; Path=/api; ...
```

VBook Http client (OkHttp) chỉ parse được `usid`, **mất hoàn toàn** `X-TOKEN`.
Thiếu `X-TOKEN` → mọi API trên `/api/*` cần session đều trả:
```json
{"status":false, "messages":["Phiên làm việc đã hết hạn"]}
```

**WebView** tự quản cookie store riêng và giữ được cả hai cookie. Nên **tất cả API
cần session phải đi qua WebView XHR đồng bộ** (`apiGetSession`, `apiPostSession`
trong `config.js`).

Cookie lấy bằng `GET /lien-he` (55KB — nhẹ nhất trong các trang có `Set-Cookie`;
`/trang-chu` là 600KB). Cookie `X-TOKEN` sống 1 năm. Cookie `usid` sống ~13 giờ.

---

## 2. Giới hạn của site — phải biết trước khi sửa

**`/api/comic/{slug}` luôn chỉ trả 21 chương mới nhất** (`result.limit = 21`, hardcode phía server).
Toàn bộ chương nằm ở `/api/comic/{comicId}/chapter?offset=0&limit=-1` — API này cần `X-TOKEN`.

**Một số chương bị site khoá**, đánh dấu bằng `type == "TRIPLE"` trong danh sách chương.
Plugin hiện tên "(khoá - cần đăng nhập)" trong mục lục. Người dùng có thể mở "Trang nguồn"
rồi đăng nhập Google/Facebook — khi đó localStorage `Authorization` của WebView sẽ tự kèm
vào header XHR và mở khoá luôn.

`loadAll` trả `codeState`:
| codeState | Nghĩa |
|---|---|
| `00` | OK, `result.data` là mảng URL ảnh |
| `01` | Bắt đăng nhập |
| `02` | Hết lượt đọc |
| `03` | Phiên hỏng |

---

## 3. Cách plugin hoạt động (v17)

### Kiến trúc session

```
API không cần cookie          API cần cookie X-TOKEN
(detail, search, listing)     (chapter list, loadAll)
        │                              │
    Http.get()                 WebView XHR đồng bộ
        │                              │
    apiGet()                   apiGetSession() / apiPostSession()
                                       │
                                browserCallJs()
                                       │
                               ensureBrowser() ← cache _browser
                                       │
                              launch /lien-he (lần đầu)
                              callJs() (lần sau)
```

Browser instance được cache trong `_browser`. Lần đầu mở mất ~5-15 giây (load trang
`/lien-he`), nhưng các lần gọi XHR sau qua `callJs()` gần như tức thì.

### Xử lý URL ảnh

CDN `vn2/vn3.gtt-bk.pro` đòi `Referer` thuộc `goctruyentranhvui*.com`. VBook ImageLoader
đặt Referer theo host URL ảnh. Nên `siteImage()` đổi CDN URL → domain site URL để Referer
tự khớp. Ảnh trên domain site hoạt động 100% (đã đo).

---

## 4. Thay đổi v17 so với v16

| Thay đổi | Lý do |
|---|---|
| Bỏ `ensureSession()`, `resetSession()` qua Http | Http luôn hỏng vì không có X-TOKEN |
| Bỏ `_httpSessionBroken`, `markHttpSessionBroken` | Không cần fallback — WebView là chính |
| `browserCallJs()` thay `browserApi()` | Cache browser, retry khi bị hủy |
| `apiGetSession()`, `apiPostSession()` mới | API cần session đi qua WebView |
| `chap.js` đơn giản hóa — chỉ gọi `apiPostSession` | Bỏ 2 request Http lãng phí |
| `toc.js` đơn giản hóa — `fetchAllChapters()` | Bỏ 3 lớp retry/fallback |
| `genre.js` sửa mã thể loại | FAN sai, SCL/MAA sai nghĩa |
| `home.js` dùng `/api/v2/search` | `/danh-sach` render bằng JS → luôn rỗng |
| `gen.js` hỗ trợ `/api/v2/search` | Phân trang 0-indexed, `result.next` boolean |
| Bỏ debug banner `v16 - lay duoc N anh` | Không cần nữa |

---

## 5. Những chỗ dễ vấp lần sau

- **Đừng quay lại dùng Http cho API cần session.** Vấn đề là ở `Set-Cookie` header ghép
  → OkHttp mất `X-TOKEN`. Không có cách nào sửa phía plugin.
- URL ảnh (`vn2/vn3.gtt-bk.pro`) là **signed URL có `exp` + `verify`**, hết hạn theo thời
  gian — đừng cache lâu.
- `buildImage()` của site có thay `/c/code` → `/c/smp` (mobile) / `/c/web`. Nếu sau này
  ảnh 403, kiểm chỗ này trước.
- Domain đổi số thường xuyên. `detectDomain()` dò `PREFER_NUMS`.
- **Đừng bỏ thêm lại nhánh `Engine.newBrowser()` cho trang chương.** URL chương dính
  redirect `https→http;usid=` → Turnstile loop vô hạn.
