# API Vbook và giới hạn môi trường

Mọi API dưới đây đều **đang được dùng trong plugin đã phát hành của repo này** — không có món nào
suy đoán. Chỗ nào chưa kiểm chứng được thì ghi rõ là chưa.

---

## 1. Http

```javascript
// GET trả về Jsoup Document
var doc = Http.get(url).headers(HEADERS).html();

// GET trả về chuỗi thô (khi cần regex hoặc parse JSON thủ công)
var s = Http.get(url).headers(HEADERS).string();

// GET trả về object JSON (dùng ở minotruyen/minohen/minomanga genre.js)
var j = Http.get(url).headers(HEADERS).json();

// POST form (dùng ở truyenvi/src/search.js)
var html = Http.post(SITE_URL + "/")
    .headers(HEADERS)
    .body("truyen_name=" + encodeURIComponent(key))
    .contentType("application/x-www-form-urlencoded")
    .string();
```

`headers()` nhận object thường: `{"User-Agent": "...", "Referer": "..."}`.

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

Vài plugin cũ `return null` khi lỗi (truyenvi). Vẫn chạy, nhưng `Response.error` rõ hơn — dùng nó.

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

**`Referer` trong `headers()` của request HTML là bình thường và nên có.** Cấm là cấm nối
`|Referer=` vào **URL ảnh** trả về cho app — hai chuyện khác nhau.
