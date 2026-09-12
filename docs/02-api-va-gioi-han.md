# API Vbook và giới hạn môi trường

> **Cập nhật 12/09/2026 — không cần suy đoán API nữa.** Toàn bộ định nghĩa API nằm nguyên văn
> trong chính APK. Giải nén `vBook.apk` (là file zip) rồi mở
> `assets/composeResources/com.reader.resources/files/core.js` — đó là lớp JS mà app nạp vào
> Rhino trước mọi script plugin. `files/crypto.js` là phần `Crypto`. Chuỗi giao diện tiếng Việt
> nằm ở `values-vi/strings.commonMain.cvr`, mỗi dòng dạng `version:0.string|<khoá>|<base64>`.
>
> Tài liệu này đã đối chiếu lại với core.js. Mục [9](#9-phần-còn-lại-của-api--những-thứ-corejs-có-mà-repo-chưa-dùng)
> liệt kê những thứ core.js có mà repo chưa dùng.

Mọi API dưới đây đều **đang được dùng trong plugin đã phát hành của repo này**, hoặc đã đối chiếu
với core.js trong APK. Chỗ nào chưa kiểm chứng được thì ghi rõ là chưa.

---

## 1. Http

```javascript
// GET trả về Jsoup Document
var doc = Http.get(url).headers(HEADERS).html();

// GET trả về chuỗi thô (khi cần regex hoặc parse JSON thủ công)
var s = Http.get(url).headers(HEADERS).string();

// GET trả về object JSON (dùng ở minotruyen/minohen/minomanga genre.js)
var j = Http.get(url).headers(HEADERS).json();

// POST form — dạng fetch (dùng ở truyenqq/src/search.js, luottruyen/src/toc.js)
var res = fetch(BASE_URL + "/frontend/search/search", {
    method: "POST",
    headers: HEADERS,
    body: "search=" + encodeURIComponent(key) + "&type=0"
});
```

### `.timeout(ms)` — BẮT BUỘC có, không phải tuỳ chọn

```javascript
Http.get(url).headers(H).timeout(8000).html();       // chuỗi Http
fetch(url, { headers: H, timeout: 8000 });           // dạng fetch
```

Khoá `timeout` có thật trong dex của app, cùng nhóm với `method`, `headers`, `queries`, `body`,
`charset`. **Không đặt thì mỗi host chết ăn trọn 10–11 giây** — đo 12/09/2026 trên 6 host:
`nettruyenviet10` 11,1s, `nhattruyenmoi`/`nhattruyento` 10,6s, `toptruyenzone12/13/14` 10,6s mỗi
cái, `goctruyentranhvui40` 11,07s, `cuutruyen.cc` 20s. Quy ước của repo:

| Loại request | Timeout |
|---|---|
| Request chính (trang danh sách, chi tiết, chương) | `REQ_TIMEOUT = 8000` |
| Mirror / dò domain dự phòng | `PROBE_TIMEOUT = 4000` |

Khai hai hằng này ngay đầu `config.js` để mọi script dùng chung. Xem [bẫy 27](03-bay-da-tra-gia.md#27-không-đặt-timeout--mỗi-host-chết-ăn-1011-giây).

### `fetch()` mới là hàm gốc

`Http.get`/`Http.post` chỉ là lớp bọc quanh `fetch(url, options)` — đọc core.js là thấy. `fetch`
đồng bộ, trả về object có `.status`, `.ok`, `.url`, `.headers`, `.header(k)`, `.text()`, `.html()`,
`.json()`, `.base64()`, `.blob()`, `.readLine()`. Guide cũ xếp `fetch` vào nhóm "chưa có bằng
chứng" là sai; nó là nền của cả hai đường.

`headers()` nhận object thường: `{"User-Agent": "...", "Referer": "..."}`.
**CẢNH BÁO:** Giá trị header phải là chuỗi **100% ASCII** (không dấu tiếng Việt, không ký tự đặc biệt). Nếu `Referer` chứa ký tự tiếng Việt có dấu, OkHttp Android sẽ crash `IllegalArgumentException: Unexpected char` (xem [03-bay-da-tra-gia.md](03-bay-da-tra-gia.md) bẫy 22). Luôn dùng `BASE_URL + "/"` cho Referer thay vì slug truyện thô.

**Http là đồng bộ** — không Promise, không callback. Đây là lý do harness test phải tự nạp
trước HTML rồi mới chạy script (xem `04`).

**Luôn bọc trong try/catch.** Lỗi mạng ném exception; không bắt thì cả script chết và Vbook chỉ
hiện lỗi trống trơn.

### Ưu tiên `.html()` hơn `.string()` khi scrape

`.html()` để Jsoup parse ở phía Java — nhanh. Dựng chuỗi lớn rồi regex trong Rhino thì chậm và
với trang nặng (400–700KB) có thể **chết ngầm không báo lỗi**. Đặc biệt **không** gọi
`doc.outerHtml()` chỉ để dò một chuỗi — dùng `doc.select("title").text()` là đủ.

---

## 2. Response

```javascript
return Response.success(data);              // home/genre/detail/toc/chap
return Response.success(items, nextPage);   // gen/search — nextPage là chuỗi số hoặc null
return Response.error("Thông báo cho người dùng");
```

`Response.error` hiện thẳng lên màn hình người dùng → viết câu **có ích**:
"Truyện này chưa có chương nào trên X" tốt hơn "error", và tốt hơn hẳn việc trả mảng rỗng
rồi để người dùng đoán.

Vài plugin cũ `return null` khi lỗi (tcomic, zettruyen). Vẫn chạy, nhưng `Response.error` rõ hơn — dùng nó.

---

## 3. Engine.newBrowser() — chỉ khi thật sự bị chặn

```javascript
var browser = null;
try {
    browser = Engine.newBrowser();
    try { browser.setUserAgent(UA); } catch (e) {}   // không phải bản nào cũng có
    browser.launch(url, 15000);                       // timeout ms
    var doc = browser.html();                         // Jsoup Document
    browser.close();
    browser = null;
    if (doc) return doc;
} catch (err) {
    if (browser) { try { browser.close(); } catch (e) {} }
}
```

`browser.callJs("...")` chạy JS trong trang (dùng ở luottruyen, mangak, mino* để lấy dữ liệu do
JS sinh ra sau khi tải).

**Đầy đủ các hàm của Browser (đọc từ core.js 12/09/2026):**

| Hàm | Repo đã dùng? | Ghi chú |
|---|---|---|
| `launch(url, timeout)` | có | trả về Document đã parse |
| `html(timeout)` | có | |
| `callJs(script, timeout)` | có | trả Document, **ghi đè body nếu script sửa DOM** |
| `close()` | có | |
| `setUserAgent(ua)` | có | xem cảnh báo ngay dưới |
| `block(["regex", ...])` | luottruyen, cuutruyen, nettruyen | chặn request trước khi WebView nạp — chặn ảnh/css/tracking là cách rẻ nhất để nhánh browser nhanh lên |
| `waitUrl(patterns, timeout)` | **chưa nguồn nào** | chờ đúng request cần thay vì đoán thời gian chờ |
| `urls()` | **chưa nguồn nào** | trả mảng URL mà WebView đã gọi — lấy thẳng URL ảnh mà không cần bóc DOM |
| `getVariable(name)` | **chưa nguồn nào** | đọc biến JS toàn cục của trang |
| `launchAsync(url)` | **chưa nguồn nào** | nạp không chờ |
| `loadHtml(baseUrl, html)` | **chưa nguồn nào** | nạp chuỗi HTML có sẵn |

⚠️ **`Engine.newBrowser()` TỰ GỌI `setUserAgent(UserAgent.system())`** ngay bên trong core.js,
trước khi trả browser về cho plugin. Nghĩa là lời khuyên cũ "đừng gọi `setUserAgent()` ở nhánh cần
phiên đăng nhập" **không có tác dụng** — app đã set rồi. Nếu cần UA khác thì phải gọi đè, không
phải bỏ gọi.

### Browser dùng chung cookie với WebView của app — đã kiểm 12/08/2026

`Engine.newBrowser()` **dùng chung cookie jar với WebView built-in của Vbook**. Người dùng đăng
nhập trong app một lần thì browser của plugin kế thừa luôn phiên đó.

Đây là **đường cứu duy nhất cho nguồn chặn bằng đăng nhập OAuth** (Google/Facebook — loại không có
form user/password nên plugin không thể tự POST vào). Điều kiện đủ:

1. Người dùng đăng nhập **trong WebView của app**, không phải Chrome ngoài app (khác cookie jar).
2. Đường đọc nội dung đi qua `Engine.newBrowser()`, **không** qua `fetch`/`Http` — chưa có bằng
   chứng Vbook bắc cầu cookie sang HTTP client.
3. ~~Đừng gọi `setUserAgent()` ở nhánh cần phiên đăng nhập.~~ **Bỏ luật này (12/09/2026):**
   core.js gọi `setUserAgent(UserAgent.system())` sẵn trong `Engine.newBrowser()`, không tránh được.

Ca thật: luottruyen v28 (`chap.js`) — [06-case-study-luottruyen.md](06-case-study-luottruyen.md).

### `launch()` TRẢ VỀ TRƯỚC KHI TRANG NẠP XONG — phải chờ thêm

Gọi `callJs` ngay sau `launch` là chạy JS trên **`about:blank`**, không phải trên trang. Hai triệu
chứng sinh ra từ đó, và cả hai đều dễ bị chẩn đoán nhầm:

| Thấy gì | Thực ra là |
|---|---|
| `localStorage.getItem(...)` ném lỗi → tưởng **người dùng chưa đăng nhập** | origin rỗng, chưa vào trang |
| `x.open("POST","/api/...")` ném `Failed to execute 'open' on 'XMLHttpRequest'` | URL tương đối không phân giải được trên `about:blank` |

Ca thật: goctruyentranh v26 → v27 (30/08/2026), người dùng nhận
`[GTT-EXC] WebView chưa đăng nhập. (Failed to execute 'open' on 'XMLHttpRequ)` **trong khi đã đăng nhập**.

**Khuôn đúng** (luottruyen v28 chạy thật trên máy dùng đúng khuôn này):

```javascript
browser.launch(SITE_URL + '/trang-nhe', 12);
browser.callJs('void 0;', 2500);      // chờ, KHÔNG đụng DOM
browser.callJs(jsThat, 10000);        // giờ mới chạy JS thật
```

Kèm hai lớp phòng thân trong chính JS tiêm vào:
- **Kiểm `location.href` trước tiên**, chưa đúng host thì báo đúng tên ca (`NOTLOADED`) kèm URL thật —
  đừng để nó đội lốt lỗi đăng nhập.
- **XHR dùng URL tuyệt đối** dựng từ `location.protocol + "//" + location.host`, không phụ thuộc base URI.

Và **đừng cắt thông báo lỗi quá ngắn**: v26 cắt 40 ký tự, vừa đúng chỗ tên lỗi bị đứt
(`...on 'XMLHttpRequ`) nên mất luôn manh mối. Để ~100 ký tự.

⚠️ **CHỜ LÂU HƠN KHÔNG PHẢI LÚC NÀO CŨNG CHỮA ĐƯỢC — đã đo (v27 → v28):** sau khi thêm chờ
2,5s + 4s, goctruyentranh vẫn báo `location.href = about:blank`. Tức là WebView **không hề điều
hướng**, chứ không phải nạp chậm. Cùng lúc đó nút "Trang nguồn" của app mở đúng URL ấy thì vào được.

Khi gặp `about:blank` lì như vậy, thứ tự nên thử:

1. **Đổi URL mở**: mở đúng trang người dùng đang đọc (URL mà "Trang nguồn" mở được), rồi mới tới
   trang nhẹ, rồi trang gốc `/` — bộ chặn quảng cáo của VBook có thể chặn theo **mẫu đường dẫn**.
2. **Đổi số timeout**: repo đang dùng lẫn lộn `8` (luottruyen, chạy được trên máy thật) và `15000`
   (cuutruyen). **Đơn vị chưa ai xác định được** → đừng đoán, thử cả hai.
3. **Kiểm bằng `browser.html()` chứ đừng tiêm JS để kiểm**: `about:blank` có `<title>` rỗng và
   body gần như trống. Tiêm JS sẽ ghi đè body, xoá mất nội dung cần bóc.
4. **Kiểm header `X-Frame-Options` / `Content-Security-Policy: frame-ancestors` của nguồn.**
   Đây là nguyên nhân đã tìm ra ở goctruyentranh (30/08/2026) — xem ngay dưới.
5. Nghi phạm còn lại: **bộ chặn quảng cáo của VBook** — nó từng chặn cả
   `challenges.cloudflare.com` (13/08/2026).

### `X-Frame-Options: DENY` giết luôn `Engine.newBrowser()`

`Engine.newBrowser()` nạp trang trong **khung con**. Nguồn nào trả `X-Frame-Options: DENY`
(hoặc CSP `frame-ancestors 'self'`) thì trình duyệt **từ chối render**, tài liệu nằm lại
`about:blank` — không có lỗi nào được ném ra, nên rất dễ chẩn đoán nhầm thành mạng chậm,
chưa đăng nhập, hay Cloudflare.

**Cách kiểm trong 5 giây, làm TRƯỚC khi viết nhánh browser:**
```bash
curl -sI https://nguon.com/duong-dan | grep -i "x-frame-options\|content-security-policy"
```

Đã đo 30/08/2026:

| Nguồn | XFO | Nhánh `Engine.newBrowser()` |
|---|---|---|
| luottruyen17 (root) | *không có* | chạy được trên máy thật (v28) |
| cuutruyen.cc | *không có* | chạy được |
| goctruyentranhvui41/42 — **mọi** path, kể cả `/api`, ảnh tĩnh, trang 404 | `DENY` + `frame-ancestors 'self'` | **luôn `about:blank`** |

**Không có cách lách từ phía plugin** — không thể gỡ header của site, và không có đường dẫn nào
trên nguồn đó thoát header. Gặp ca này thì **báo thẳng cho người dùng và chỉ sang nút "Trang nguồn"**
(WebView top-level, XFO không áp dụng), đừng đẻ thêm bản vá đoán mò.

⚠️ Đừng nhầm với chặn theo User-Agent: goctruyentranh trả **200 cho cả 6 UA** đã thử (Chrome,
Android WebView `wv`, `okhttp`, `VBook/1.0`, `Java/17`, không UA). Site **không** chặn app.

⚠️ **Luôn `close()` trong cả nhánh lỗi.** Browser không đóng là rò tài nguyên, app đơ dần.

⚠️ **Đừng để browser thành đường mặc định.** Nó chậm hơn HTTP nhiều lần, và một agent trước đã
đốt 3 phiên bản plugin để "fix Cloudflare" bằng browser trong khi lỗi thật chỉ là sai selector —
nhánh browser còn nuốt luôn đường HTTP đang chạy tốt. Dò challenge cho đúng, xem `03`.

---

## 4. load() và Html.parse()

```javascript
load("config.js");            // dòng đầu tiên của mọi script; nạp vào cùng scope
var doc = Html.parse(htmlString);   // parse chuỗi HTML thành Document (dùng ở suggests.js)
```

---

## 5. Jsoup trong Vbook — cái gì có, cái gì không

| Dùng được | Ghi chú |
|---|---|
| `doc.select(css)` → Elements | `.size()`, `.get(i)`, `.text()` |
| `el.select(css)` | select lồng trong một Element — cách an toàn nhất để đi xuống |
| `el.attr("name")` | trả `null` nếu không có → luôn `String(... \|\| "")` |
| `el.text()` | Jsoup đã chuẩn hoá khoảng trắng |
| `els.first()` | có plugin phát hành dùng (mangak, zettruyen, mino*) — chạy được |

| **KHÔNG dùng** | Vì sao |
|---|---|
| `selectFirst()` | Không tồn tại trong Rhino-Jsoup của Vbook. **Đã sai 3 lần** — dùng helper `selFirst()` |
| `.parent()` | Ném TypeError trong Vbook (ghi chú tại `zettruyen/src/search.js:23`). Luôn đi **từ khối cha xuống**, đừng đi từ con ngược lên |
| `doc.outerHtml()` trên trang nặng | Chậm, dễ chết ngầm |

Helper bắt buộc có trong mọi `config.js`:

```javascript
function selFirst(el, css) {
    if (!el) return null;
    var items = el.select(css);
    return (items && items.size() > 0) ? items.get(0) : null;
}
```

### Selector: cái gì an toàn

An toàn (đã chạy production): `div.chapter-item` · `img.manga-cover` · `a.tag-btn` ·
`#classic-reader img[data-src]` · `a[href*='/chapters/']` · `img[src*='.256.jpg']` ·
`div.truncate.flex-grow` (nhiều class) · `h2.font-head`.

Tránh: child combinator `>` (có nguồn ghi nhận hỏng; `.mt-2 > .mb-2` chỉ thấy ở `suggests.js`
chạy qua `Html.parse`, đừng suy ra là an toàn cho đường Jsoup thường).

---

## 6. ES5 hay ES6?

**Mặc định viết ES5** — `var`, `function`, nối chuỗi bằng `+`. Toàn bộ nguồn mới nên theo.

Thực tế trong repo: `minotruyen`, `minohen`, `minomanga`, `zettruyen` đang phát hành với
`let/const`, arrow function, template literal, `.forEach` và vẫn chạy → Rhino của Vbook nuốt
được ES6 ở mức đó. Nghĩa là guide cũ ghi *"Rhino không hỗ trợ ES6 let/const/=>"* là **không đúng
với thực tế repo này**.

Vẫn khuyến nghị ES5 vì: nó chạy trên **mọi** bản Vbook đã gặp, đồng nhất với đa số file, và không
đánh đổi gì cả. Đừng dùng ES6 chỉ cho gọn tay.

Riêng những thứ sau thì **chưa có bằng chứng** hoạt động — đừng dùng: `String.prototype.includes`,
`startsWith`, `Object.assign`, spread `...`, `Promise`, `fetch`, `async/await`.

---

## 7. Bảy script và chữ ký hàm

```javascript
home.js    execute()            -> Response.success([{title, input, script}])
genre.js   execute()            -> Response.success([{title, input, script}])
gen.js     execute(url, page)   -> Response.success(items, nextPage)
search.js  execute(key, page)   -> Response.success(items, nextPage)
detail.js  execute(url)         -> Response.success(detailObject)
toc.js     execute(url)         -> Response.success([{name, url, host}])
chap.js    execute(url)         -> Response.success([urlAnh, ...])
```

`items`:
```javascript
{ name: "Tên truyện", link: "URL trang chi tiết", cover: "URL ảnh bìa",
  description: "Chương mới nhất / thời gian", host: SITE_URL }
```

`detailObject`:
```javascript
{ name, cover, host, author, description,
  detail: "Tác giả: X<br>Số chương: 99",     // chuỗi HTML ngắn, phân cách bằng <br>
  ongoing: true,                              // false = đã hoàn thành
  genres: [{title, input, script: "gen.js"}] }
```

`toc`: **chương đầu đứng trước**. Site thường liệt kê mới nhất trước → nhớ `chapters.reverse()`.

`nextPage`: chuỗi số trang kế (`"2"`) hoặc `null` khi hết. Trả sai chỗ này thì app cuộn vô tận
hoặc mất trang — luôn test trang cuối.

Script phụ (không bắt buộc): `suggests.js` — `execute(input)` nhận **chuỗi HTML**, parse bằng
`Html.parse()`, trả gợi ý tìm kiếm. Chỉ thêm khi site có endpoint gợi ý riêng.

---

## 8. Khung `config.js` chuẩn

Chép nguyên từ [`cuutruyen/src/config.js`](../cuutruyen/src/config.js) — nó có đủ và đã qua
kiểm tra thật:

- `SITE_URL`, `HOST`, `HEADERS` (UA Android Chrome + `Referer` = trang chủ)
- `selFirst(el, css)`
- `absUrl(url)` — xử lý `//host`, `/path`, `path`
- `isChallenge(doc)` — dò qua `<title>`, không dựng chuỗi lớn
- `fetchDoc(url)` — HTTP trước, browser fallback sau
- `withPage(url, page)` — nối `?page=` hoặc `&page=`
- `parseCards(doc)` — parse card danh sách, có nhánh dự phòng
- `nextPage(doc, page)` — dò link trang kế bằng regex trên `href`
- `REQ_TIMEOUT` / `PROBE_TIMEOUT` — hai hằng timeout, khai ngay đầu file

**`Referer` trong `headers()` của request HTML là bình thường và nên có.** Cấm là cấm nối
`|Referer=` vào **URL ảnh** trả về cho app — hai chuyện khác nhau. Đồng thời, header `Referer`
trong request phải đảm bảo 100% ASCII (dùng `BASE_URL + "/"`), không nhét slug truyện tiếng Việt vào (xem bẫy 22).


---

## 9. Phần còn lại của API — những thứ core.js có mà repo chưa dùng

Liệt kê từ `assets/composeResources/com.reader.resources/files/core.js` trong `vBook.apk`
(12/09/2026). Cột cuối là mức độ đã kiểm chứng trong repo này.

| Đối tượng | Hàm | Repo dùng chưa |
|---|---|---|
| `Crypto` | `md5` `sha1` `sha256` `sha512` `hmacMd5` `hmacSha1` `hmacSha256` `hmacSha512` `base64Encode` `base64Decode` `aesEncrypt` `aesDecrypt` `aesGcmEncrypt` `aesGcmDecrypt` `desEncrypt` `desDecrypt` `tripleDesEncrypt` `tripleDesDecrypt` `rc4Encrypt` `rc4Decrypt` `pbkdf2` `evpKdf` | chỉ tcomic |
| `localStorage` | `getItem` `setItem` `removeItem` `clear` | goctruyentranh (gián tiếp) |
| `cacheStorage` | như trên | **chưa** — bộ nhớ đệm riêng, hợp để nhớ domain hiện hành giữa các lần chạy |
| `localCookie` | `getCookie` `setCookie` | luottruyen, goctruyentranh |
| `localConfig` | `getItem(key)` | **chưa** — đọc cài đặt người dùng đặt cho chính tiện ích |
| `localBook` | `getInfo` `getTableOfContent` `getChapterContent` `getNames` `addName` `getQtNames` `addQtName` `getQtVietPhrases` `addQtVietPhrase` | **chưa** |
| `Graphics` | `createCanvas` `createImage`, canvas có `drawImage` `capture` | **chưa** — ghép/cắt ảnh ngay trong plugin |
| `WebSocket` | `connect` `send` `message` `close` | **chưa** |
| `Qt` | `translate(text, to, extras)` | **chưa** |
| `Script` | `execute(script, name, input)` | **chưa** |
| `ai` | `getToolList` `executeTool` `emitToken` `emitStatus` | **chưa** |
| `Blob` | `fromBase64(base64, type)` | **chưa** |
| toàn cục | `sleep(ms)` | **chưa** — dùng thay mẹo `callJs('void 0;', 2500)` để chờ |
| `UserAgent` | `system()` `chrome()` `android()` `ios()` | gián tiếp qua `Engine.newBrowser()` |

`_HtmlElement` có đúng: `select` `attr` `text` `html` `remove` `attributes` `toString`.
`_HtmlElements` có thêm: `size` `length` `isEmpty` `get` `first` `last` `forEach` `map` `select`
`attr` `text` `html` `remove`. **Không có `selectFirst`, không có `parent`** — đúng như mục 5.

---

## 10. Năm nút chỉnh tốc độ nằm trong app, không nằm trong plugin

Đọc từ chuỗi giao diện trong APK. Đây là chỗ ăn tiền nhất khi người dùng kêu "tải ảnh chậm",
và plugin **không** điều khiển được (trừ khi khai báo được `thread`/`delay`, xem dưới):

| Cài đặt | Dải giá trị | Ảnh hưởng |
|---|---|---|
| Kết nối song song | 1–5 luồng | đo 12/09/2026: 4 luồng nhanh gấp **5,3–6,5×** so với 1 luồng |
| Giãn cách kết nối | 10ms – 30 giây | đặt cao là tự bóp mình: 50 ảnh × 500ms = +25 giây |
| Số lần thử lại | 0 / 1 / 3 / 5 | nhân số lần chờ trên host đã chết |
| Kết nối bằng Cronet | bật/tắt | bật HTTP/3 + QUIC; 6/12 host ảnh của repo có `alt-svc: h3` |
| DNS qua HTTPS | Google / Cloudflare / … | đường thoát khi ISP chặn DNS (xem bẫy 13) |

### `thread` và `delay` khai được trong `plugin.json` — đã kiểm trên máy thật

Mỗi tiện ích có mục **Kết nối** riêng, hiện dòng "Kết nối tối đa N luồng, thời gian chờ tối thiểu
M ms". Hai giá trị đó khai ngay trong `metadata` của `plugin.json`:

```json
{
  "metadata": {
    "name": "Tcomic",
    "version": 6,
    "thread": 5,
    "delay": 10
  }
}
```

Thử trước ở `tcomic` v6 (12/09/2026), Trum xác nhận nguồn nạp và chạy bình thường → đã áp cho
toàn bộ 16 nguồn. `thread` tối đa là **5**, đúng bằng trần của cài đặt "Kết nối song song" trong
app; `delay` tính bằng mili giây, 10 là mức thấp nhất app cho chọn.

Đây là **cách duy nhất plugin can thiệp được vào tốc độ tải ảnh** — mọi thứ còn lại (số byte ảnh,
CDN) đều nằm ngoài tầm với. Nguồn mới phải có hai khoá này ngay từ v1.
