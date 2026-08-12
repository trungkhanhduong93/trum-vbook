# Case study: nguồn `luottruyen` — kiến trúc và kinh nghiệm sửa lỗi

Nguồn phức tạp nhất repo này. Không phải vì HTML khó parse, mà vì nó gom đủ **ba loại rắc rối
cùng lúc**: đổi domain liên tục, mục lục nằm sau API POST, và từ 12/08/2026 thì chương bị khoá
sau đăng nhập Google.

Đọc mục [2](#2-ba-ràng-buộc-phải-biết-trước-khi-đụng-code) và [6](#6-quy-trình-chẩn-đoán-khi-không-tải-được-ảnh)
trước là đủ cho 90% ca sửa lỗi. Phần còn lại đọc khi cần.

---

## 1. Nguồn này là gì

| | |
|---|---|
| Thư mục | `luottruyen/` (đừng nhầm `luottruyennew/` — **site khác hẳn**, `luottruyen.net`) |
| Stack site | ASP.NET MVC 5 + WebForms, sau Cloudflare (`X-AspNetMvc-Version: 5.2`) |
| Domain | `luottruyen16.com` (tính tới 12/08/2026), đổi số liên tục |
| Redirector | `luottruyen.com` — không số, luôn về mirror mới nhất (đo: ~5,1s, chậm gấp 9 lần domain thẳng) |
| Kiểu parse | Scrape HTML, **trừ mục lục** dùng API POST trả HTML fragment |
| Bản mới nhất | v28 |

**Cloudflare ở đây chưa bao giờ là vấn đề.** Không có challenge, không cần mồi cookie. Nếu ai đó
định thêm browser "để vượt Cloudflare" ở nguồn này thì đó là chẩn đoán sai — xem `03` mục 8.

---

## 2. Ba ràng buộc phải biết trước khi đụng code

### 2.1. Chương bị khoá sau đăng nhập Google (từ 12/08/2026) — ràng buộc lớn nhất

**Mọi** URL chương đều `302 → /Account/Login`. Đã đo cả chương mới nhất lẫn chương 1 của truyện cũ:
không phải kiểu "khoá N chương mới nhất" như goctruyentranh, mà là **khoá sạch**.

```
/truyen-tranh/<slug>-<id>            → 200   (trang truyện: mở)
POST /Story/ListChapterByStoryID     → 200   (mục lục: mở)
/truyen-tranh/<slug>/chapter-N/<id>  → 302 → /Account/Login   (chương: KHOÁ)
```

Đăng nhập **chỉ có Google OAuth** (`/Account/Google` → `accounts.google.com`), **không có form
user/password**. Nghĩa là:

> **Plugin không thể tự đăng nhập bằng code.** Không có endpoint nào để POST vào. Đường duy nhất
> là người dùng đăng nhập Gmail **trong WebView của app**, rồi `Engine.newBrowser()` dùng lại
> cookie phiên đó. Đăng nhập bằng Chrome ngoài app **vô ích** — khác cookie jar.

Nhận diện tường đăng nhập bằng 3 dấu, đã kiểm là **chỉ** xuất hiện trên trang bị chặn (home và
detail đều 0 lần):

```javascript
selFirst(doc, ".login-page-wrapper")
selFirst(doc, "a[href*='/Account/Google']")
selFirst(doc, "a[href*='/Account/Login']")
```

⚠️ **Luôn bóc ảnh trước, xét tường đăng nhập sau.** Nếu trang thật (đã đăng nhập) vẫn còn link
`/Account/Login` đâu đó ở header thì kiểm tường trước sẽ **bỏ nhầm cả trang có ảnh**. Đây là ca
`F` trong bộ test ở mục 6.

### 2.2. Domain đổi số liên tục

luottruyen5 → 6 → 7 → 8 → 10 → 11 → 16 → … Config đã có 3 tầng tự chữa, **không cần sửa code khi
đổi số** (chi tiết mục 4). Nhưng đã đo 12/08/2026: **luottruyen17..31 đều timeout, không domain
nào sống ngoài 16**. Nên nhánh dò domain là đường **rất đắt** — đừng để nó bị kích nhầm.

### 2.3. "Không vào được" thường là ISP chặn DNS, không phải lỗi code

Plugin dùng DNS của điện thoại nên không tự vượt được. Giải pháp là device-side: Private DNS =
`one.one.one.one`. Xem `03` mục 13. Đừng sửa code cho triệu chứng này.

---

## 3. Kiến trúc — 8 script

```
                    ┌──────────────┐
                    │  config.js   │  BASE_URL · FETCH_HEADERS · selFirst
                    │ (load ở đầu  │  parseItems · getNextPage · resolveUrl
                    │  MỌI script) │  syncBaseFromUrl · autoProbeDomains · fetchRetry
                    └──────┬───────┘
      ┌───────────┬────────┼─────────┬───────────┬──────────┐
   home.js     genre.js  gen.js   search.js   detail.js   toc.js ──→ chap.js
   (tĩnh)      (scrape)  (list)    (list)     (scrape)   (POST API)  (HTTP→WebView)
                                                                       comment.js
                                                                       (WebView)
```

| Script | Đường lấy dữ liệu | Selector / endpoint xương sống |
|---|---|---|
| `home.js` | Không gọi mạng — 10 mục dựng sẵn | `/tim-truyen?status=&sort=` (sort 10/11/12/13 = BXH tổng/tháng/tuần/ngày) |
| `genre.js` | HTTP `/tim-truyen` | `ul.dropdown-menu.megamenu a[href*='/tim-truyen/']`, gỡ số đếm trong `span` |
| `gen.js` | HTTP, nối `?page=`/`&page=` | `parseItems()` + `getNextPage()` dùng chung với search |
| `search.js` | HTTP `/tim-truyen?keyword=` | như trên. Từ khoá đi qua `encodeURIComponent` |
| `detail.js` | HTTP 1 request | `h1.title-detail` · `div.col-image div.avatar img` |
| `toc.js` | **POST** `/Story/ListChapterByStoryID` | body `StoryID=<id>`, id = đoạn sau dấu `-` cuối của URL |
| `chap.js` | HTTP → **WebView** | `#view-chapter img` + 6 selector dự phòng |
| `comment.js` | **WebView** (comment render bằng JS) | `.journalItems .journalrow`, phân trang qua `story.getPagingCmt(n, 15)` |

Card danh sách (`parseItems`) đi theo `div.items div.item` → `figcaption h3 a` (tên+link),
`div.image a img` (bìa, ưu tiên `data-original`), `figcaption ul li.chapter a` (chương mới nhất).

**`toc.js` không parse trang detail** mà gọi thẳng API POST — nhanh hơn nhiều và không phụ thuộc
JS. Nhớ `chapters.reverse()`: API trả mới nhất trước, Vbook cần cũ nhất trước.

> Đã ghi nhận 12/08/2026: API mục lục trả URL **sai slug truyện** —
> `/truyen-tranh/chapter-7/chapter-7/1611235` thay vì `/truyen-tranh/chung-ta-la-da-thu/chapter-7/…`.
> Vô hại: route bám ID cuối, cả hai URL đều vào đúng cùng một chương (kiểm được vì cả hai cùng
> 302 về `/Account/Login` với đúng `ReturnUrl` của mình). Đừng "sửa" nó nếu chưa có bằng chứng gãy.

---

## 4. Tầng domain tự chữa trong `config.js`

Bốn cơ chế, xếp theo thứ tự **rẻ → đắt**. Hiểu thứ tự này rồi mới được sửa `fetchRetry`.

| # | Hàm | Tốn gì | Khi nào chạy |
|---|---|---|---|
| 1 | `syncBaseFromUrl(url)` | **0 request** | Đầu `detail`/`toc`/`chap`/`gen`. Lấy domain ngay từ URL user đang xem |
| 2 | `DEFAULT_BASE` | 0 request | Mặc định `luottruyen16.com` |
| 3 | `resolveBaseUrl()` | 1 request (~5,1s) | Hỏi redirector `luottruyen.com`, đọc `<link rel=canonical>` |
| 4 | `autoProbeDomains(url)` | **tới 16 request, mỗi cái timeout** | Rà `luottruyen16` → `31` tuần tự |

⛔ **Cơ chế 4 là cái bẫy.** `fetchRetry()` kích nó bất cứ khi nào `res.ok` sai — mà `res.ok` sai
vì **rất nhiều lý do không liên quan tới domain**: tường đăng nhập, 302, 403, 404. Đã đo: một lần
kích nhầm = **19 request qua 17 domain**, gần như toàn bộ là timeout.

Vì vậy `chap.js` **cố ý không dùng `fetchRetry()`**, mà tự fetch rồi chỉ rà domain khi **không lấy
nổi HTML nào về** — lấy được HTML (kể cả HTML trang login) nghĩa là domain còn sống:

```javascript
function fetchChapterDoc(url) {
    var doc = null;
    try {
        var res = fetch(url, FETCH_OPTIONS);
        if (res) doc = res.html();
    } catch (e) {}
    if (doc) return doc;                    // domain sống → KHÔNG rà

    var probed = autoProbeDomains(url);     // chỉ khi mất mạng thật
    ...
}
```

---

## 5. `chap.js` — hai đường và lý do tồn tại của từng đường

```
execute(url)
  │
  ├─ 1. fetchChapterDoc(url) ─── bóc ảnh ──→ có ảnh? → Response.success
  │      (HTTP, rẻ)                             │
  │                                             ↓ không
  ├─ 2. chapDocViaBrowser(url) ── bóc ảnh ──→ có ảnh? → Response.success
  │      WebView giữ cookie phiên đã            │
  │      đăng nhập trong app                    ↓ không
  │      + scroll để kích lazysizes             └→ isLoginWall? → báo cách đăng nhập
  │
  └─ 3. isLoginWall(doc từ bước 1)? → báo cách đăng nhập
        ngược lại → "không tìm thấy ảnh chương"
```

Vì sao giữ cả đường HTTP dù chương đang bị khoá: **chưa biết** Vbook có bắc cầu cookie từ WebView
sang HTTP client hay không. Nếu có, đường 1 ăn ngay và rẻ hơn nhiều. Nếu không, nó chỉ tốn đúng
**1 request** rồi nhường cho WebView — chi phí chấp nhận được để không phải đoán.

Hai chi tiết ở nhánh WebView, **đừng gỡ**:

- **Không** gọi `browser.setUserAgent(...)`. Đổi UA giữa chừng có nguy cơ làm WebView không dùng
  lại đúng phiên. (`toc.js` và `comment.js` có set UA — hai script đó không cần phiên đăng nhập.)
- `browser.callJs("window.scrollTo(0, document.body.scrollHeight);", 3000)` — site dùng
  `lazysizes.js`, ảnh nằm ở `data-src` cho tới khi cuộn tới. Không cuộn thì bóc ra rỗng.

`extractImagesFromDoc()` thử `#view-chapter img` rồi 6 selector dự phòng, và với mỗi `img` thì đi
qua `src` → `data-original` → `data-src` → `data-cdn` → `data-url` → `data-lazy-src` → `data-img`
→ `data-path`. Trả **URL trần**, tuyệt đối không nối `|Referer=` (xem `03` mục 2).

---

## 6. Quy trình chẩn đoán khi "không tải được ảnh"

Làm **đúng thứ tự**. Ba bước đầu tốn 30 giây và loại được hầu hết giả thuyết sai.

**Bước 1 — chương có bị khoá không?** (nghi phạm số 1 từ 12/08/2026)

```bash
curl -s -o /dev/null -w "%{http_code} -> %{redirect_url}\n" "https://luottruyen16.com/truyen-tranh/<slug>/chapter-1/<id>"
```
Thấy `302 -> .../Account/Login` → **dừng, không phải lỗi selector.** Sang bước 5.

**Bước 2 — domain còn sống không?**

```bash
curl -s -o /dev/null -w "%{http_code} %{time_total}s -> %{url_effective}\n" -L "https://luottruyen.com/"
```
Redirector luôn chỉ về mirror mới nhất. Khác `DEFAULT_BASE` thì bump `config.js` cho nhanh (không
bắt buộc — tầng tự chữa lo được, chỉ là chậm hơn).

**Bước 3 — trang chương có `#view-chapter` không?**

```bash
curl -s -L "<url-chuong>" -o chap.html && grep -c "view-chapter" chap.html && grep -o '<img[^>]*>' chap.html | head
```
Chỉ thấy logo + `<img width="1" height="1">` → nội dung do JS sinh hoặc bị chặn, **không phải sai
selector**. Đếm luôn dấu tường đăng nhập: `grep -c 'login-page-wrapper' chap.html`.

**Bước 4 — chạy thật `chap.js` trên HTML vừa tải.** Đọc code không bắt được lỗi runtime.
Dựng harness mô phỏng Response của Vbook (`.ok` / `.html()` / `.url`) + `Engine.newBrowser()`, rồi
chạy **cả bản đang phát hành lẫn bản vừa sửa** trên cùng bộ ca:

| Ca | Kịch bản |
|---|---|
| A | Chưa đăng nhập, HTTP trả trang login (200) |
| B | Chưa đăng nhập, HTTP trả body 302 (`ok = false`) |
| C | **Đã đăng nhập trong WebView**, HTTP vẫn bị chặn ← ca của người dùng |
| D | Đã đăng nhập ở cả HTTP |
| E | Mất mạng hoàn toàn (`fetch` ném lỗi) |
| F | Trang thật có ảnh **nhưng header còn link `/Account/Login`** ← bẫy dương tính giả |
| G | HTTP 200 nhưng trang rỗng, không login wall, không ảnh |

Đếm luôn **số request** mỗi ca — đó là cách phát hiện nhánh dò domain bị kích nhầm.

**Bước 5 — nếu là tường đăng nhập:** không có gì để sửa ở phía parse. Việc của code chỉ còn là
(a) không crash, (b) không rà domain vô ích, (c) **báo đúng cách đăng nhập**: mở chương bằng
WebView **trong app**, đăng nhập Gmail tại đó. Nói rõ là Chrome ngoài app không dùng được — người
dùng sẽ làm sai nếu không nói.

---

## 7. Ca 12/08/2026 — bốn bản vá cho một triệu chứng

Người dùng báo: *"không tải được ảnh dù đã bấm vào trang nguồn để đăng nhập gmail"*.

| Bản | Chẩn đoán lúc đó | Kết quả |
|---|---|---|
| v25 | "Tối ưu domain + siết `fetchRetry` cho toàn bộ script" | **Gieo mầm lỗi**: `chap.js` bắt đầu dùng `fetchRetry()` như thể nó trả Document |
| v26 | "Ảnh mã hoá bằng WebAssembly" → thêm browser fallback | Fallback đúng hướng nhưng **không bao giờ chạy tới** |
| v27 | "WebView mất cookie" → bỏ `setUserAgent`, thêm scroll | Hai sửa này đúng, vẫn **không bao giờ chạy tới** |
| v28 | Chạy thật mới lộ: **crash ngay bước 1** | Sửa được |

**Lỗi thật:** `chap.js` gọi `fetchRetry(url)` rồi dùng thẳng kết quả như Jsoup Document —
nhưng `fetchRetry` trả về **Response**. Mọi script khác đều `.html()` trước; riêng `chap.js` quên.

```javascript
var doc = fetchRetry(url);          // ← Response, KHÔNG phải Document
var images = extractImagesFromDoc(doc);   // doc.select(...) → TypeError, không ai bắt
```

`execute()` chết ngay dòng đó → **nhánh WebView phía dưới không bao giờ chạy** — đúng cái nhánh
duy nhất đọc được chương khi đã đăng nhập. Chạy A/B trên HTML thật:

```
                                        v25→v27                    v28
A. chưa login, trang login (200)   NÉM EXCEPTION            báo lỗi có hướng dẫn, 1 request
B. chưa login, body 302            NÉM EXCEPTION (19 req)   báo lỗi có hướng dẫn, 1 request
C. đã login trong WebView          NÉM EXCEPTION            success, ra ảnh
D. đã login ở HTTP                 NÉM EXCEPTION            success, ra ảnh
E. mất mạng                        NÉM EXCEPTION            báo lỗi, có rà domain (đúng ý đồ)
F. trang thật + link login ở header    —                    success, ra ảnh (không bỏ nhầm)
G. 200 nhưng rỗng                      —                    báo lỗi tử tế
```

### Ba bài học rút ra

1. **Ba bản vá liên tiếp sửa đúng hướng mà không ai chạy thử.** v26 và v27 sửa những thứ thật sự
   cần thiết — nhưng chưa từng có ca test nào chứng minh nhánh đó *chạy tới*. Một lần chạy thật ở
   v26 đã tiết kiệm được ba lần đóng gói. **Sửa xong phải chạy, đọc code không tính là đã kiểm.**

2. **Đổi hàm dùng chung thì phải soi ngược mọi call site.** v25 siết `fetchRetry` cho cả nguồn,
   nhưng `chap.js` là script duy nhất không theo khuôn `res.html()`. Không ai grep lại `fetchRetry`
   sau khi sửa. Đây chính là pha P2 của `pre-push-qa`.

3. **Triệu chứng người dùng mô tả thường là hệ quả, không phải nguyên nhân.** "Đăng nhập gmail rồi
   vẫn không được" nghe như lỗi cookie/phiên; hoá ra code chết trước khi kịp dùng phiên. Ràng buộc
   site (khoá login) và lỗi code là **hai chuyện tách rời** — phải tách ra rồi mới sửa được cái nào.

---

## 8. Đã thử và đã loại — đừng làm lại

| Từng làm | Vì sao bỏ |
|---|---|
| Proxy ảnh qua `wsrv.nl` / Photon | Gãy ảnh trong app. Đã thêm-gỡ **2 lần** vì "đo thấy nhanh hơn ở máy dev". Số đo ở máy dev không đại diện cho image loader của app |
| Nối `|Referer=` vào URL ảnh | Vbook engine không nhận; trả URL trần |
| Browser trong `detail.js` để mồi cookie Cloudflare | Nguồn này không có challenge — tốn 10s mỗi lần mở truyện. Đã gỡ ở v21 |
| Nén ảnh WebP q80/q85 qua weserv | Revert 30/05/2026, cùng lý do với proxy |
| `resolveBaseUrl()` làm đường mặc định | Redirector ~5,1s vs domain thẳng ~0,57s. Chỉ dùng làm fallback |
| Đổi `setUserAgent` trong `chap.js` | Bỏ từ v27 để WebView giữ đúng phiên đăng nhập |

---

## 9. Đã xác nhận trên máy thật (12/08/2026, v28)

✅ **`Engine.newBrowser()` DÙNG CHUNG cookie jar với WebView built-in của Vbook.** Người dùng đăng
nhập Gmail trong app → v28 hiện ảnh bình thường. Giả định mà cả v27 lẫn v28 đặt cược **là đúng**.

Đây là **một API fact dùng được cho mọi nguồn khác**, không riêng luottruyen: nguồn nào chặn bằng
đăng nhập mà không có form user/password (OAuth Google/Facebook) thì vẫn cứu được, miễn là
(a) người dùng đăng nhập **trong WebView của app**, và (b) đường đọc nội dung đi qua
`Engine.newBrowser()` chứ không phải HTTP client. Xem `02` mục 3.

Mức verify của v28: **M4** — ảnh hiện thật trong app, không phải chỉ harness xanh.

### Còn treo

- **Chưa có mẫu HTML chương lúc đã đăng nhập.** Bộ selector trong `extractImagesFromDoc` vẫn là đồ
  kế thừa từ Tachiyomi + các bản cũ; nó *chạy được*, nhưng chưa ai đối chiếu với HTML thật sau khi
  site đổi sang bắt đăng nhập — không biết selector nào đang thật sự ăn, selector nào đã chết. Lần
  tới mở chương trong app, lưu lại một bản HTML làm mẫu test thì bộ 7 ca ở mục 6 mới đủ ca "đường
  hạnh phúc" bằng dữ liệu thật.
- **Đường HTTP (bước 1 của `chap.js`) chưa biết có bao giờ ăn không.** Nếu Vbook không bắc cầu
  cookie sang HTTP client thì nó vĩnh viễn trượt và tốn thừa 1 request mỗi chương. Chưa đủ bằng
  chứng để gỡ — gỡ nhầm là mất đường nhanh khi Vbook có bắc cầu.
