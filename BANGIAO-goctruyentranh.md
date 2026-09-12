# BÀI HỌC VÀ POST-MORTEM: GocTruyenTranh — Giải phẫu sự cố "Không thể tải hình ảnh" (v42 - v49)

> **Dành cho:** Claude Opus/Sonnet và các Agent tiếp nhận bảo trì nguồn `goctruyentranh`.  
> **Thời gian sự cố:** 12/09/2026 - 13/09/2026.  
> **Trạng thái:** Đã điều tra tận gốc rễ qua Reverse-Engineering vBook APK và sửa triệt để ở **v49** (commit `90afb1d`). Người dùng đã test thực tế trên điện thoại xác nhận thành công 100%.

---

## 1. Tóm tắt sự cố (Incident Summary)

- **Hiện tượng:** Sau các đợt tối ưu từ v42/v43 đến v48, người dùng mở bất kỳ truyện nào (kể cả truyện mới mở, chương 1 không khoá) đều bị lỗi **"Không thể tải hình ảnh"**. Toàn bộ ảnh trong chương đều hỏng cùng lúc.
- **Biểu hiện giao diện:** App vào màn hình đọc truyện nhưng toàn bộ ô ảnh báo lỗi, **hoàn toàn không có nút "Trang nguồn"**.
- **Hệ quả:** Claude đã mất rất nhiều phiên xử lý loanh quanh các giả thuyết sai: nghi ngờ token/UID hết hạn, nghi ngờ WebView hỏng/trắng trang, nghi ngờ DNS/timeout 8s, nghi ngờ Referer không gửi được... mà không tìm ra nguyên nhân thực sự.

---

## 2. Giải mã triệu chứng trên App thật (Gỡ bỏ 2 ngộ nhận giao diện)

### 2.1. "Không thể tải hình ảnh" là gì?
- Đây là chuỗi `error_load_image` từ chính ImageLoader của app vBook (sử dụng thư viện **Coil 3 / OkHttp** trên nền Android Kotlin).
- Chuỗi này xuất hiện khi ImageLoader gửi HTTP request tải file ảnh từ URL về máy nhưng nhận mã phản hồi **HTTP 403 Forbidden**, **HTTP 429 Too Many Requests**, hoặc nhận về **Trang HTML Cloudflare Challenge / Turnstile** thay vì luồng byte nhị phân ảnh (JPEG/WebP).
- **Ý nghĩa sống còn:** Khi app hiện thông báo này, có nghĩa là **`chap.js` của plugin đã chạy hoàn toàn thành công** và đã trả về danh sách URL ảnh (`Response.success(imgs)`). Vấn đề **100% nằm ở tầng kết nối mạng của ImageLoader native**, KHÔNG PHẢI lỗi cú pháp JS hay logic bóc tách của plugin!

### 2.2. "Tại sao không hiện nút Trang nguồn?"
- Trong app vBook, nút **"Trang nguồn"** CHỈ XUẤT HIỆN khi plugin chủ động ném lỗi:
  ```javascript
  Response.error("Thông báo lỗi...");
  ```
- Khi `chap.js` trả về `Response.success(imgs)`, vBook đóng màn hình chờ và chuyển hẳn sang giao diện **Reader UI**.
- Ở Reader UI, nếu từng ảnh tải thất bại, Coil chỉ hiển thị icon ảnh lỗi hoặc text `error_load_image`. **Ở màn hình Reader UI theo thiết kế của vBook KHÔNG BAO GIỜ có nút "Trang nguồn".**
- *Bài học:* Đừng bao giờ thấy không có nút "Trang nguồn" mà nghi ngờ giao diện app bị đơ hay plugin chưa trả kết quả!

---

## 3. Cơ chế hoạt động của vBook ImageLoader (Reverse-engineered từ `vBook.apk`)

Bằng cách phân tích mã nguồn bytecode Smali của `vBook.apk` (class `La31;->a` trong pipeline nạp ảnh Coil), cơ chế tải ảnh của vBook được giải mã như sau:

1. **Gắn Header Referer tự động:**
   - Khi chuẩn bị request nạp ảnh, vBook **TỰ ĐỘNG** gắn header `Referer`.
   - Giá trị `Referer` được lấy từ: `chapter.host + "/"` (trường `host` mà `toc.js` hoặc `detail.js` trả về cho từng chương).
   - Nếu `chapter.host` rỗng, vBook fallback lấy từ: `plugin.source + "/"`.
2. **vBook KHÔNG BAO GIỜ lấy host của chính URL ảnh làm Referer:**
   - Trong quá khứ (v35 - commit `ab449fc`), Claude đã suy đoán sai: *"Nếu loader đặt Referer theo host của chính URL ảnh thì để trên CDN vn3.gtt-bk.pro sẽ chết"*.
   - **Thực tế:** Dù URL ảnh trỏ tới `https://vn3.gtt-bk.pro/...`, vBook vẫn gắn `Referer: https://goctruyentranhvui41.com/` (từ `chapter.host`).
3. **Phản hồi của CDN `vn*.gtt-bk.pro`:**
   - Khi có `Referer: https://goctruyentranhvui41.com/`: CDN `vn*.gtt-bk.pro` trả về **HTTP 200 (kèm toàn bộ nội dung ảnh đầy đủ ~80KB - 150KB)**.
   - Khi không có `Referer` (như khi test bằng lệnh `curl` trần trên máy tính): CDN trả về **HTTP 403**.

---

## 4. Giải phẫu Hai Sai Lầm Kỹ Thuật Chí Mạng của Claude

Hai sai lầm độc lập đã kết hợp lại tạo thành một cái bẫy hoàn hảo ("cộng hưởng") làm hỏng 100% ảnh:

```
[Sai lầm 2: Rewrite CDN sang Origin] ──┐
                                       ├──> [Dội dập 5 req/10ms vào Web Origin trên IP 4G] ──> [Cloudflare WAF 403 Chặn sạch 100%]
[Sai lầm 1: Thêm thread:5, delay:10] ──┘
```

### Sai lầm 1: Thêm `"thread": 5, "delay": 10` vào `plugin.json` (Commit `53169f3`)
- Để "tối ưu tốc độ", Claude đã thêm cấu hình tải song song 5 luồng cách nhau 10ms.
- **Điểm mù thực tế:** Mạng di động 3G/4G/5G của các nhà mạng (Viettel, VinaPhone, MobiFone) đều dùng công nghệ **CGNAT** (hàng ngàn thuê bao dùng chung một địa chỉ IP Public ra Internet).
- Một chương truyện tranh có từ 30 đến 60 ảnh. Khi app mở 5 kết nối song song cách nhau 10ms dội vào domain có Cloudflare từ một IP CGNAT, Cloudflare WAF lập tức kích hoạt cơ chế chống DDoS: **Rate Limiting (Error 1015)** hoặc **Turnstile Challenge**.
- Hậu quả: 100% request ảnh nhận về HTTP 403 Forbidden hoặc trang HTML xác minh bot.

### Sai lầm 2: Ép URL ảnh từ CDN gốc về Web Origin (`chap.js` từ v35)
- Trong `chap.js`, Claude đặt hàm:
  ```javascript
  function siteImage(u) {
      var url = String(u).trim().replace(/^https?:\/\/vn\d*\.gtt-bk\.pro/i, SITE_URL);
      ...
  }
  ```
- **Tại sao Claude làm vậy?** Vì Claude dùng `curl` trên máy tính thấy CDN trả 403 (do thiếu Referer), nên tưởng nhầm CDN bị chết và vội vã rewrite toàn bộ URL ảnh về domain chính `SITE_URL` (`goctruyentranhvui41.com`).
- **Điểm mù tai hại:**
  - `goctruyentranhvui41.com` là **Web Origin (frontend web)**, được Cloudflare dựng hàng rào bảo vệ chống bot cực gắt (TLS fingerprinting, IP reputation, WAF, bot challenge).
  - `vn*.gtt-bk.pro` là **CDN lưu trữ tĩnh chuyên dụng**, firewall của nó chỉ kiểm tra duy nhất: `Referer` có đúng là domain truyện không. Ngoài ra nó KHÔNG chặn request dồn dập như web origin!
  - Khi Claude ép URL ảnh về `goctruyentranhvui41.com`, toàn bộ request ảnh của app bị điều hướng từ một CDN thông thoáng sang một Web Origin đang dựng sẵn khiên WAF!
- Kết hợp với Sai lầm 1, web origin lập tức chặn đứng mọi request ảnh từ app điện thoại.

---

## 5. Những "Ngõ Cụt" Claude đã đi lạc (Đừng bao giờ lặp lại!)

| Ngõ cụt | Nhận định sai lầm của Claude | Sự thật kỹ thuật |
|---|---|---|
| **Token / UID** | Nghi ngờ token trong `config.js` (`GTT_TOKEN`) bị hết hạn hoặc sai UID nên ảnh bị khoá. | `GTT_TOKEN` là token của Trum, còn sống 100%. Token này **chỉ dùng để mở chương VIP khoá (TRIPLE)**. Các chương thường (như chương 1) hoàn toàn **không cần token**! Nếu chương thường cũng lỗi ảnh thì chắc chắn 100% không liên quan đến token. |
| **Timeout 8s / probeDomain** | Nghi ngờ `timeout(8000)` làm rớt mạng hoặc `probeDomain` sai. | Timeout trong Rhino JS chỉ quản lý request của plugin khi lấy dữ liệu JSON. Khâu tải ảnh do Android native (Coil) thực hiện độc lập, không chịu ảnh hưởng của timeout trong script. |
| **WebView trắng trang / X-Frame-Options** | Nghi ngờ WebView bị lỗi, HTML trắng trang hoặc bị chặn iframe. | API `/api/chapter/loadAll` của web vẫn trả JSON danh sách ảnh hoàn toàn đầy đủ. Nhánh WebView chỉ là phương án dự phòng khi API sập. Lỗi ảnh xảy ra ngay ở nhánh API, không hề liên quan đến WebView. |
| **curl máy dev** | Thấy `curl` không gửi Referer bị 403 nên vội kết luận CDN chặn app. | `curl` trên máy dev không phản ánh môi trường app thật. vBook luôn tự động gửi header `Referer` chuẩn xác. |

---

## 6. Giải pháp Chuẩn mực đã nghiệm thu ở v49

### 1. File `goctruyentranh/src/chap.js`
Giữ nguyên URL CDN gốc `vn*.gtt-bk.pro`, tuyệt đối **không rewrite** sang `SITE_URL`:
```javascript
// TRẢ URL TRẦN CDN GỐC: vBook tự động gửi Referer = chapter.host (goctruyentranhvui*.com),
// CDN vn*.gtt-bk.pro chấp nhận và trả HTTP 200 trực tiếp.
function siteImage(u) {
    var url = String(u).trim();
    if (GTT_IMG_PROXY) return GTT_IMG_PROXY + encodeURIComponent(url);
    return url;
}
```

### 2. File `goctruyentranh/plugin.json`
Gỡ bỏ hoàn toàn `"thread"` và `"delay"`. Để app vBook dùng cấu hình mặc định:
```json
{
  "metadata": {
    "name": "GocTruyenTranh",
    "author": "tkd1793",
    "version": 49,
    "source": "https://goctruyentranhvui41.com",
    "regexp": "goctruyentranhvui\d*\.com\/truyen\/[a-z0-9-]+\/?$",
    "description": "Đọc truyện tranh trên GocTruyenTranh",
    "locale": "vi_VN",
    "language": "javascript",
    "type": "comic"
  },
  ...
}
```

### 3. File `tools/qa_prepush_gate.py`
Đã trang bị 2 chốt chặn bảo vệ vĩnh viễn:
- **Chốt 1:** Rà soát regex cấm tuyệt đối việc ép CDN `gtt-bk.pro` về `SITE_URL`, và cấm metadata `thread`/`delay` cho `goctruyentranh`.
- **Chốt 4:** Live runtime test: tự động tải thử ảnh thật từ cả CDN `vn3.gtt-bk.pro` và Origin `goctruyentranhvui41.com` với Referer giả lập.

---

## 7. 4 Nguyên Tắc Vàng cho Claude (Bỏ túi vĩnh viễn)

1. **Hiểu rõ cơ chế ImageLoader của vBook:**
   - vBook luôn gắn header `Referer` bằng `chapter.host + "/"` (từ `toc.js`) hoặc `plugin.source + "/"`.
   - Nếu CDN ảnh yêu cầu Referer từ trang truyện, **vBook đã đáp ứng sẵn điều đó**. Tuyệt đối không tự ý rewrite URL ảnh từ CDN chuyên dụng về Web Origin!
2. **Cấm khai `thread` và `delay` dồn dập vào domain sau Cloudflare:**
   - Tuyệt đối không tự ý nhét `"thread": 5, "delay": 10` vào các nguồn truyện tranh có Cloudflare. Trên mạng di động IP CGNAT, việc dồn request sẽ kích hoạt WAF Rate Limiting giết chết toàn bộ ảnh.
3. **Phân biệt rạch ròi 2 lớp lỗi:**
   - Lỗi plugin (Rhino JS): App hiện popup thông báo đỏ `Response.error` và có nút "Trang nguồn".
   - Lỗi tải ảnh (Android native Coil): App vào Reader bình thường, từng ảnh báo "Không thể tải hình ảnh", KHÔNG CÓ nút "Trang nguồn". Khi gặp lỗi này, hãy soi **HTTP Status của URL ảnh và cơ chế WAF**, đừng lục lọi sửa logic JS!
4. **Không tin tưởng `curl` trần trên máy dev:**
   - Khi kiểm tra CDN ảnh, luôn luôn gửi kèm `Referer` tương ứng của site để mô phỏng chính xác hành vi của vBook:
     ```bash
     curl -sI -H "Referer: https://goctruyentranhvui41.com/" "https://vn3.gtt-bk.pro/image/..."
     ```
