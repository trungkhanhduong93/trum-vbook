# Bẫy đã trả giá — đọc trước khi viết, và lần nữa trước khi push

Mỗi mục ở đây tương ứng với ít nhất một bản phát hành đã hỏng thật. Sắp theo mức độ hay lặp lại.

## Tra ngược từ triệu chứng

| Người dùng báo | Đọc mục |
|---|---|
| "Không tải được ảnh" / ảnh vỡ | [1](#1-url-ảnh--đã-sai-2-lần), [2](#2-referer-nối-vào-url-ảnh), [12](#12-ảnh-avif-không-decode-được), [17](#17-fetch-trả-response-không-phải-document), [19](#19-cdn-ảnh-có-token-hmac--không-được-bọc-photon-proxy), [23](#23-wordpress-photon-chỉ-có-3-node-sharding-i0-i1-i2--không-có-i3), [34](#34-goctruyentranh--origin-cdn-cấm-ép-url-ảnh-về-domain-site-và-cấm-khai-threaddelay-vào-origin-cloudflare) |
| Ảnh tải cực chậm / đơ nghẽn | [18](#18-selector-img-quét-trúng-ảnh-rác-làm-nghẽn-connection-pool), [19](#19-cdn-ảnh-có-token-hmac--không-được-bọc-photon-proxy), [25](#25-tối-ưu-dung-lượng-webtoon-qua-photon-w600quality65stripall) |
| Lỗi crash Unexpected char / Unicode | [20](#20-url-chứa-ký-tự-unicode-tiếng-việt-làm-okhttp-crash), [22](#22-okhttp-crash-khi-header-referer-chứa-unicode--ký-tự-tiếng-việt) |
| Bấm vào mục lục rất lâu / delay 10-15s mới hiện hoặc trắng trơn | [22](#22-okhttp-crash-khi-header-referer-chứa-unicode--ký-tự-tiếng-việt) |
| Mục lục trống trên truyện oneshot / chapter lạ | [21](#21-slug-mục-lục-không-chỉ-có-chap-và-chuong) |
| Chương mở được nhưng không có ảnh nào | [24](#24-chương-truyện-rỗng-trên-các-site-auto-leech-madara) |
| Màn hình trống, lỗi trống trơn không có thông báo | [17](#17-fetch-trả-response-không-phải-document), [5](#5-selectfirst-và-parent) |
| "Đăng nhập rồi mà vẫn không đọc được" | [17](#17-fetch-trả-response-không-phải-document) + [06 case study](06-case-study-luottruyen.md) |
| "Cài xong không chạy gì cả" | [3](#3-zip-thiếu-entry-src), [4](#4-version-không-bump-đủ-3-chỗ) |
| "Sửa rồi mà vẫn y như cũ" | [4](#4-version-không-bump-đủ-3-chỗ) |
| Danh sách trống, tìm kiếm trống | [5](#5-selectfirst-và-parent), [7](#7-tham-số-tìm-kiếm-sai--site-trả-danh-sách-mặc-định) |
| Cuộn mãi không hết trang | [9](#9-phân-trang-trang-cuối-phải-trả-null) |
| Thể loại của truyện sai bét | [6](#6-fallback-quét-toàn-trang) |
| Ảnh bị lặp đôi | [10](#10-trang-chương-có-2-trình-đọc) |
| Vào web được, app thì không | [13](#13-không-vào-được--thường-là-isp-chặn-dns) |
| "Quay lâu quá trời mới lên danh sách / mục lục" | [26](#26-dò-domain-dự-phòng-đi-xuống-số-cũ-đã-chết), [27](#27-không-đặt-timeout--mỗi-host-chết-ăn-1011-giây) |
| Nguồn lúc được lúc không, tải lại thì chạy | [28](#28-hàm-tên-retry-nhưng-không-hề-thử-lại) |
| Chương thiếu ảnh sau khi "siết bộ lọc rác" | [29](#29-lọc-ảnh-rác-bằng-chuỗi-con-ads-khớp-luôn-uploads) |
| Ảnh đầu chương là banner / watermark của site | [30](#30-ảnh-watermark-của-site-nằm-ở-đầu-và-cuối-chương) |
| Ảnh 404 sau khi thêm `safeEncodeUrl` | [31](#31-encodeuri-nhân-đôi-mã-hoá-url-đã-có-25) |
| Chương tải được 1–3 ảnh đầu rồi đứt hẳn | [32](#32-cloudflare-workers-gói-miễn-phí-không-xử-lý-nổi-ảnh) |
| "Không thể tải hình ảnh" với ảnh plugin tự dựng | [33](#33-trình-đọc-chỉ-nhận-url-http--ảnh-tự-dựng-phải-đi-qua-máy-chủ) |
| "Không thể tải hình ảnh" nhưng không hiện nút Trang nguồn | [34](#34-goctruyentranh--origin-cdn-cấm-ép-url-ảnh-về-domain-site-và-cấm-khai-threaddelay-vào-origin-cloudflare) |

---


## Ca kiểm ảnh phải TẢI THẬT, không chỉ nhìn URL

Kiểm `chap.js` mà chỉ khẳng định "URL tuyệt đối, không có `|Referer`" là **chưa kiểm gì cả**. URL
đúng hình dạng vẫn có thể trả 403 cho mọi ảnh.

Ca thật (goctruyentranh v22 → v32, 31/08/2026): bản vá đổi host ảnh về domain site có từ v14, mất
khi dựng lại nguồn ở v22, và **không ai phát hiện suốt 10 phiên bản** vì harness chỉ soi chuỗi URL.
Người dùng báo "cả hai nguồn không xem được ảnh" mới lòi ra — đo lại thì CDN trả **403 cho 8/8 ảnh**.

Ca kiểm tối thiểu: lấy 3 ảnh (đầu / giữa / cuối) của mỗi chương đã test, tải thật, và **giả lập
đúng Referer mà app gửi** — image loader đặt Referer theo **host của chính URL ảnh**:

```javascript
const origin = new URL(u).origin + '/';
const r = await fetch(u, { headers: { 'User-Agent': UA, 'Referer': origin } });
// dat: status 200 VA body > 1000 byte (trang loi 403 cung la 200 o vai CDN)
```

Xem `tools/vbook-harness` — hàm `thuTaiAnh()` trong bộ chạy của goctruyentranh.


## 1. URL ảnh — đã sai 2 lần

**Luật: giữ nguyên URL ảnh mà chính trang web dùng.** Site bọc proxy nghĩa là site có lý do.

- **luottruyen v11→v13:** THÊM proxy `wsrv.nl` để nén ảnh. `curl` trả 200 sạch, app vẫn vỡ ảnh → phải revert.
- **cuutruyen v3→v4:** GỠ proxy `dex.cdn-07077.workers.dev` của site để trả thẳng URL
  `mangadex.network`. Đo cold-vs-cold hai vòng đảo thứ tự: trực tiếp nhanh hơn **1,9–4,4 lần**.
  Trên điện thoại thật **ảnh không tải được** — mạng di động VN chặn `mangadex.network`,
  worker Cloudflare thì không.

**Vì sao đo vẫn sai:** số đo trả lời *tải bao lâu*, không trả lời *có tải được không*. Câu thứ hai
mới quyết định, và nó **không đo được từ máy dev** (wifi nhà + PowerShell ≠ 4G nhà mạng + OkHttp).

**Nếu vẫn muốn đổi:** phải test trong app Vbook thật trên điện thoại **trước khi** push. Không test
được thì không đổi. Và khi đo tốc độ, đừng gọi **cùng một ảnh** hai lần — lần hai luôn nhanh hơn
do cache, số đo vô nghĩa. Chia hai nhóm ảnh rời nhau, đảo thứ tự giữa hai vòng.

## 2. Referer nối vào URL ảnh

Không bao giờ trả `"https://cdn.../a.jpg|Referer=https://site.com"`. Chỉ URL trần.
(`Referer` trong `headers()` của request HTML thì bình thường — khác chuyện.)

## 3. Zip thiếu entry `src/`

`Compress-Archive` của PowerShell không tạo directory entry → **Vbook cài xong im lặng, không chạy,
không báo lỗi**. Phải đóng bằng Python và verify namelist (xem `01` bước 6). Sau mỗi lần build,
in `namelist()` ra và nhìn — mất 1 giây, cứu cả buổi.

## 4. Version không bump đủ 3 chỗ

Sửa code thì phải: bump `<nguồn>/plugin.json` **+** bump entry trong `plugin.json` gốc **+**
repack zip. Thiếu bất kỳ cái nào → máy người dùng vẫn chạy bản cũ, và mọi giả thuyết debug sau đó
đều sai hướng.

Người dùng báo "vẫn lỗi như cũ" → **kiểm mtime của zip so với source trước khi sửa thêm dòng nào.**

## 5. `selectFirst()` và `.parent()`

- `selectFirst()` **không tồn tại** trong Rhino-Jsoup của Vbook. Đã sai 3 lần. Dùng `selFirst()`.
- `.parent()` ném TypeError (ghi tại `zettruyen/src/search.js:23`). Luôn đi **từ khối cha xuống**
  bằng `el.select(...)`, đừng bắt phần tử con rồi ngược lên.

Cái bẫy độc ở chỗ: harness test dùng cheerio **hỗ trợ** cả hai → test xanh mượt, app vỡ trắng.
Grep trước khi push là cách duy nhất bắt được.

## 6. Fallback quét toàn trang

Viết `if (size === 0) doc.select("img")` hay `doc.select("a[href*=...]")` là **tái tạo đúng cái bug
vừa sửa**: selector rỗng thường nghĩa là *dữ liệu thật sự không có*, không phải *DOM đổi*.

- fastscan: có truyện không gắn thể loại nào → fallback gán nhầm **62 thể loại** của cả site.
- fastscan: có chương rỗng thật → fallback trả logo + favicon + gif tracking ra làm "trang truyện".

Chỉ fallback **trong cùng họ container** (`.chapter_content .page-chapter` → `.page-chapter`), hoặc
trong cùng họ dữ liệu (`div.snap-start` → `a[href*='/mangas/']`). Rỗng thì `Response.error` báo
tử tế cho người dùng.

## 7. Tham số tìm kiếm sai → site trả danh sách mặc định

Nhiều site **bỏ qua** tham số lạ và trả trang mặc định 24 truyện → nhìn qua tưởng chạy đúng.

- fastscan: `?keyword=` bị bỏ qua, đúng phải là `?q=`.
- cuutruyen: ngược lại — `?q=` trả trang rỗng, đúng là `?keyword=`, dù JSON-LD của site quảng cáo `?q=`.

**Cách kiểm duy nhất đáng tin:** tìm một từ khoá vô nghĩa (`zzzzkhongcotruyennao`). Ra 0 kết quả
là tham số đúng; vẫn ra 24 truyện là tham số sai.

## 8. Đổ lỗi Cloudflare khi thật ra sai selector

Một agent trước đốt 3 phiên bản plugin (v3→v5) để "fix Cloudflare": thêm browser fallback, nới regex
bắt chuỗi challenge, ép `needBrowser = true` khi selector không match. Lỗi thật chỉ là sai tham số
và sai selector phân trang.

**Đo trước khi kết luận:** gửi request với UA `okhttp/4.9.0` và với **không** UA. HTML về đủ và
không chứa `Just a moment` / `challenge-platform` / `cf-browser-verification` → không có challenge,
`Http.get()` là đủ.

Dò challenge qua `doc.select("title").text()`, **không** qua `doc.outerHtml()`: trang chi tiết
400–700KB, dựng nguyên chuỗi đó trong Rhino vừa chậm vừa dễ chết ngầm.

## 9. Phân trang: trang cuối phải trả `null`

- `href.indexOf("page=2")` sẽ dính nhầm `page=206` → **luôn dùng regex** `/[?&]page=(\d+)/` rồi so số.
- Test **trang cuối** của một danh mục ít truyện. `next` không về `null` thì app cuộn vô tận và
  lặp lại trang cuối mãi.
- Test trang 1 vs trang 2 **có khác nhau không** — giống nhau nghĩa là site phớt lờ tham số trang.

## 10. Trang chương có 2 trình đọc

cuutruyen render cùng bộ ảnh hai lần (`#classic-reader` và `#zen-reader`) → `img.lazy-load` ra
36 phần tử cho chương 18 trang. Bám đúng một khối, và luôn dedupe bằng `seen{}`.

## 11. Chuỗi trong DOM chứa cả nhãn bị CSS ẩn

cuutruyen ghi số chương thành `<span class="hidden md:inline">Chương</span><span class="md:hidden">C.</span><span>89.5</span>`
— cả hai nhãn đều **có trong DOM**, chỉ ẩn bằng CSS. `text()` sẽ ra `"Chương C. 89.5"`.
Lấy `<span>` cuối thay vì text cả khối.

Cùng họ bẫy: ảnh bìa có nhiều mức kích thước. cuutruyen có `.jpg.256.jpg` (~70KB),
`.jpg.512.jpg` (~250KB) và **bản gốc không hậu tố nặng 12MB** — chọn nhầm bản gốc là chương nào
cũng treo. Danh sách dùng bản nhỏ, trang chi tiết dùng bản vừa.

## 12. Ảnh AVIF không decode được

Nhiều nguồn trả `.avif`; Android cũ / image loader của Vbook không đọc được → ảnh vỡ.
**Không phải lỗi referer** — kiểm bằng request có/không referer trước khi kết luận.
Cách xử lý đã chạy được: route qua Photon `https://i{0|1|2}.wp.com/{url-bỏ-scheme}?w=1000&quality=80`
(2ten). **weserv thì KHÔNG chạy trong app** dù curl 200 (luottruyen) — proxy khác nhau, kết quả
khác nhau, phải test từng cái trong app thật.

## 13. "Không vào được" — thường là ISP chặn DNS

Trước khi sửa code: thử domain trên máy khác/mạng khác. luottruyen từng bị quy là lỗi plugin trong
khi thật ra ISP chặn DNS — cách khắc phục là đặt Private DNS `1.1.1.1` trên điện thoại. Cũng nhóm
nguyên nhân này: `mangadex.network` bị chặn ở mạng di động (mục 1).

Nhóm site hay đổi số domain (`luottruyen8` → `luottruyen11`) thì `config.js` nên tự dò domain qua
redirector thay vì hardcode.

## 14. Môi trường Windows / PowerShell

- `Compress-Archive` → xem mục 3.
- `Set-Content`/`Add-Content` mặc định ANSI → **hỏng tiếng Việt**. Luôn `-Encoding utf8`.
- `New-Item -Force` lên file đã tồn tại → **truncate** nội dung.
- `2>&1` trên native exe → `$?` báo sai dù exit code 0. Đừng redirect.
- Không có `&&`, `||`, `head`, `tail`, `which`, `mkdir -p`.
- **Bash/curl trong môi trường agent có thể bị sandbox chặn mạng và trả rỗng không báo lỗi** —
  thấy output rỗng thì chuyển sang PowerShell `Invoke-WebRequest`, đừng kết luận "site chặn".

## 15. Đừng ghi đè cả file `plugin.json` gốc

Registry gốc còn vài entry bị mojibake tiếng Việt từ lịch sử. Ghi đè cả file (hoặc "sửa lại cho đẹp")
sẽ phá thêm và tạo diff không review nổi. **Chỉ sửa đúng entry của mình bằng edit tại chỗ.**

## 16. Harness xanh không có nghĩa là app chạy

Harness (`04`) chạy trên Node + cheerio: nó xác nhận **logic parse** đúng trên HTML thật.
Nó **không** xác nhận: Rhino có nuốt cú pháp không · `.parent()`/`selectFirst()` có ném không ·
ảnh có tải nổi trên mạng di động không · image loader có hiển thị được định dạng đó không.

Báo cáo phải nói rõ mức đã verify. "Đã test xong" khi mới chạy harness là **báo cáo sai sự thật**.

---

## 17. fetch() trả Response, không phải Document

`fetch(url, opts)` và `Http.get(url)` trả về **Response**, không phải Jsoup Document. Phải
`.html()` mới ra Document:

```javascript
var res = fetchRetry(url);
if (!res || !res.ok) return Response.error("Không tải được trang");
var doc = res.html();          // ← BƯỚC NÀY. Quên là chết.
```

Quên `.html()` thì `doc.select(...)` ném `TypeError: doc.select is not a function`. Vbook **không
hiện stack trace** — người dùng chỉ thấy màn hình trống hoặc lỗi trống trơn, y hệt triệu chứng
của sai selector. Rất dễ chẩn đoán nhầm.

**Đã trả giá thật (luottruyen v25→v27, 12/08/2026):** `chap.js` quên `.html()`, `execute()` chết
ngay dòng đầu → **nhánh browser fallback phía dưới không bao giờ chạy tới**. Ba bản vá liên tiếp
sửa đúng vào nhánh đó (thêm fallback, bỏ `setUserAgent`, thêm scroll lazyload) mà không bản nào
có tác dụng, vì code chưa từng chạy tới đó. Đóng gói 3 lần vô ích. Toàn bộ ca:
[06-case-study-luottruyen.md](06-case-study-luottruyen.md) mục 7.

**Hai luật rút ra:**

- Sửa hàm dùng chung (`fetchRetry`, `fetchDoc`…) thì **grep ngược mọi call site**, đừng tin là
  script nào cũng theo cùng một khuôn. Ở luottruyen, 5/6 script làm `res.html()` đúng — đúng cái
  script thứ 6 là chỗ hỏng.
- **Nhánh fallback phải có ca test chứng minh nó CHẠY TỚI.** Fallback không bao giờ chạy thì
  giống hệt fallback không tồn tại, nhưng đọc code lại thấy rất yên tâm.

---

## 18. Selector `img` quét trúng ảnh rác làm nghẽn Connection Pool

Khi viết `chap.js`, dùng fallback quét rộng kiểu `doc.select("img")` hoặc selector vùng đọc không chặt chẽ (ví dụ dính cả phần comment, related stories, footer) sẽ cào trúng:
- Hàng chục emoji/pepe sticker (`/img/pepe2/20.png`)
- Ảnh bìa truyện gợi ý với đường dẫn tiếng Việt thô
- Icon, avatar, banner quảng cáo

**Hậu quả thực tế (SayHentai v26→v27):**
Mỗi chương truyện chỉ có 16 trang thật nhưng `chap.js` trả về tới **46 URL ảnh**. Trong đó có 30 URL là emoji và ảnh rác.
Trên Android, OkHttp duy trì một connection pool có giới hạn (mặc định 5 connection đồng thời trên mỗi host). 30 request ảnh rác vô nghĩa này tranh chấp socket với ảnh truyện thật, gây ra hiện tượng **Head-of-Line blocking**, timeout, và nghẽn toàn bộ tiến trình tải chương truyện.

**Luật phòng tránh:**
- Luôn khóa chặt container đọc truyện: `doc.select("div.reading-content img, div.page-break img, img.chapter-img")`.
- Có danh sách loại trừ (blacklist) bắt buộc: `logo`, `banner`, `avatar`, `icon`, `ads`, `button`, `pepe`, `/cover/`.
- Luôn kiểm tra số lượng ảnh trả về: nếu truyện tranh thông thường trả về >50 ảnh trong khi chương chỉ có 15 trang, chắc chắn selector đang bị overreach.

---

## 19. CDN ảnh có Token HMAC — không được bọc Photon Proxy

Khi gặp tình trạng ảnh tải chậm, suy nghĩ đầu tiên thường là "bọc qua WordPress Photon (`i0.wp.com`...) hoặc Image Proxy để nén và tăng tốc".

**Đã trả giá thật (SayHentai & VinaHentai, 11/09/2026):**
- SayHentai sử dụng CDN riêng (`pubtranxzyzz.store`) có gắn token bảo vệ trên query string: `?token=...&expires=...`. Khi đẩy qua Jetpack Photon, máy chủ Photon hoặc strip mất query, hoặc gửi request từ IP datacenter khiến CDN từ chối và trả về **403 Forbidden**.
- VinaHentai sử dụng CDN `vnht.vinahentai.click` trên nền tảng Cloudflare Edge Singapore. Khi request hàng loạt qua Photon, Photon trả về **400 Bad Request** hoặc timeout.
- Cả hai CDN nguồn vốn đã đặt tại Cloudflare Edge Singapore (`CF-RAY: ...-SIN`) có kết nối peering trực tiếp đến VNPT/Viettel/FPT với độ trễ < 30ms và hỗ trợ HTTP/2. Bọc thêm proxy chỉ làm tăng thêm một chặng trung gian (hop) và có nguy cơ bị chặn IP.

**Luật phòng tránh:**
- Xem lại [Luật 1](#1-url-ảnh--đã-sai-2-lần): **Luôn giữ nguyên URL ảnh gốc của site.**
- Không bao giờ bọc CDN ảnh có chứa query token (`token=`, `sign=`, `expires=`) vào các dịch vụ proxy công cộng.

---

## 20. URL chứa ký tự Unicode tiếng Việt làm OkHttp Crash

Android OkHttp tuân thủ nghiêm ngặt RFC 7230/RFC 3986. Mọi ký tự trong Request URL phải nằm trong bảng mã ASCII hợp lệ (`\u0020` đến `\u007E`).
Nếu một URL từ web chứa ký tự tiếng Việt có dấu (ví dụ `/tai-thiet-đoi-bong-chuyen-hang-bet` hoặc tên file ảnh có dấu cách, dấu tiếng Việt):
- Browser trên máy tính tự động encode thành `%C4%91...`.
- Nhưng trong Rhino JS của Vbook, chuỗi URL được truyền thẳng xuống Java OkHttp `Request.Builder().url(u)`. Khi đó OkHttp sẽ ném ngoại lệ:
  `IllegalArgumentException: Unexpected char %#x at ...`
- Kết quả: Vbook crash hoặc báo "Không thể tải nội dung" mà không có bất kỳ thông tin lỗi chi tiết nào.

**Luật phòng tránh:**
- Luôn chuẩn hóa URL qua một hàm an toàn trước khi gọi `fetch()` hoặc trả về cho Vbook:
  ```javascript
  function safeEncodeUrl(u) {
      if (!u) return "";
      try {
          return encodeURI(u);
      } catch (e) {
          return u;
      }
  }
  ```
- Tích hợp `safeEncodeUrl()` vào hàm `resolveUrl()` dùng chung trong `config.js`.

---

## 21. Slug mục lục không chỉ có `chap-` và `chuong-`

Khi phân tích link chương trong `toc.js`, dev thường viết regex hoặc filter đơn giản:
```javascript
// SAI: Chỉ bắt được chap và chuong
if (href.indexOf("/chap-") >= 0 || href.indexOf("/chuong-") >= 0)
```

**Thực tế đa dạng hơn rất nhiều (VinaHentai v5→v6):**
Nhiều web truyện tranh 18+/hentai/manhwa có các định dạng chương rất đặc thù:
- Truyện Oneshot: `/1shot-1`, `/oneshot`, `/full`
- Truyện tập: `/tap-1`, `/vol-1`
- Truyện viết tắt: `/chapter-1`
- Hơn nữa, trên trang chi tiết thường có các nút bấm điều hướng như "Đọc từ đầu", "Đọc mới nhất", "Xem ngay" cũng trỏ tới link chương đầu tiên. Nếu chỉ bắt theo selector link chương thì danh sách mục lục sẽ bị trùng lặp hoặc chứa các nút action không mong muốn.

**Luật phòng tránh:**
- Khảo sát ít nhất 3 loại truyện: truyện dài tập nhiều chương, truyện oneshot 1 chương, và truyện có nhiều vol/tập.
- Bắt link chương dựa trên tiền tố của slug truyện:
  ```javascript
  // Lấy link là con của slug truyện: /truyen-hentai/<slug>/<subpath>
  var sub = href.substring(prefix.length); // ví dụ: chapter-1, 1shot-1, tap-1
  ```
- Loại trừ rõ ràng các nút CTA điều hướng đầu trang (kiểm tra class, text "Đọc ngay", "Đọc từ đầu").

---

## 22. OkHttp Crash khi Header `Referer` chứa Unicode / ký tự tiếng Việt

Khác với [Bẫy 20](#20-url-chứa-ký-tự-unicode-tiếng-việt-làm-okhttp-crash) (về Request URL), bẫy này xảy ra ngay trong **Request Headers** — cụ thể là header `"Referer"`.

**Đã trả giá thật (DamCoNuong v4→v5, 11/09/2026):**
- Trên các web WordPress / Madara theme, mục lục thường được nạp động qua AJAX POST: `/wp-admin/admin-ajax.php` với `action=manga_get_chapters`.
- Để giả lập đúng nguồn gốc request, dev thường truyền URL truyện vào header `"Referer"`:
  ```javascript
  // NGUY HIỂM: url chứa slug tiếng Việt thô hoặc ký tự đặc biệt
  var res = fetch(ajaxUrl, {
      method: "POST",
      headers: {
          "Referer": url, // url = https://site.com/truyen/〖-không-che-〗-co-giao...
          "Content-Type": "application/x-www-form-urlencoded"
      },
      body: "action=manga_get_chapters&manga=" + mangaId
  });
  ```
- Khi URL truyện chứa ký tự Unicode có dấu tiếng Việt hoặc dấu ngoặc đặc biệt, Java OkHttp ném ngay ngoại lệ:
  `IllegalArgumentException: Unexpected char %#x at ... in Referer value`
- Hậu quả dây chuyền:
  1. Nếu hàm AJAX không bọc `try/catch`, toàn bộ script ném lỗi.
  2. Nếu có fallback tĩnh `fetchRetry(url)`, Vbook phải tốn 10–15s tải toàn bộ trang HTML tĩnh nặng nề. Nhưng trên giao diện Madara, trang tĩnh **không hề chứa chapter trong DOM** (chỉ có container rỗng chờ JS client gọi AJAX).
  3. Kết quả: Người dùng bấm vào truyện bị khựng xoay vòng 10–15s, sau đó mục lục trắng tinh không có chương nào!

**Luật phòng tránh:**
1. Header `Referer` trong request HTTP chỉ cần gán domain gốc sạch chuẩn ASCII:
   ```javascript
   headers: {
       "Referer": BASE_URL + "/",
       "Content-Type": "application/x-www-form-urlencoded"
   }
   ```
   WordPress và hầu hết backend chỉ kiểm tra Referer có cùng Origin/Domain hay không để chống CSRF cơ bản, tuyệt đối không yêu cầu đúng slug chi tiết.
2. Mọi request mạng chuyên biệt (AJAX POST, API) **bắt buộc bọc `try { ... } catch (e) {}`**, đặt timeout hợp lý (5000–7000ms), và luôn truyền `body: ""` nếu POST không có payload.

---

## 23. WordPress Photon chỉ có 3 node sharding: `i0`, `i1`, `i2` — KHÔNG CÓ `i3`

Khi cần route ảnh qua Jetpack Photon để nén hoặc giải mã WebP/AVIF, dev thường dùng kỹ thuật domain sharding để vượt qua giới hạn 5 kết nối đồng thời per-host của OkHttp.

**Đã trả giá thật (DamCoNuong v4→v5, 11/09/2026):**
- Dev viết chia dư theo 4 host:
  ```javascript
  // SAI: Giả định Photon có 4 cụm máy chủ i0..i3
  var hostIndex = idx % 4; // -> Sinh ra i0, i1, i2, i3.wp.com
  ```
- Trên thực tế hạ tầng Automattic / WordPress Jetpack Photon **chỉ có 3 máy chủ công khai**: `i0.wp.com`, `i1.wp.com`, và `i2.wp.com`. Subdomain `i3.wp.com` không hề tồn tại (trả về lỗi DNS `NXDOMAIN` hoặc SSL handshake failure).
- Hậu quả: Đúng **25% tổng số ảnh trong chương** (tất cả các ảnh rơi vào `idx % 4 === 3`) bị gãy hoàn toàn. Người dùng mở chương lên thấy cứ cách 3 ảnh lại có 1 ảnh báo lỗi không tải được.

**Luật phòng tránh:**
- Chỉ shard qua 3 node: `((idx || 0) % 3)`:
  ```javascript
  var hostIndex = (idx || 0) % 3; // Luôn ra 0, 1, 2
  var proxyUrl = "https://i" + hostIndex + ".wp.com/" + rawUrl.replace(/^https?:\/\//, "");
  ```

---

## 24. Chương truyện rỗng trên các site Auto-Leech (Madara WordPress)

Nhiều web truyện tranh tự động cào bài (như dùng plugin KDN Auto Leech trên nền WordPress) có cơ chế tạo bản ghi bài viết trong cơ sở dữ liệu (`wp_posts`) và sinh URL chương trước khi tiến trình tải ảnh hoàn tất.

**Đã trả giá thật (DamCoNuong v4, 11/09/2026):**
- Trang chương vẫn có DOM hoàn chỉnh: có title, có input `<input id="wp-manga-current-chap">`, nhưng bên trong `div.reading-content` **hoàn toàn không có thẻ `<img>` nào**.
- Nếu dev viết fallback cẩu thả kiểu `if (imgs.length === 0) doc.select("img")`, Vbook sẽ cào toàn bộ logo, banner quảng cáo, avatar comment làm ảnh truyện (xem lại [Bẫy 6](#6-fallback-quét-toàn-trang)).
- Nếu trả mảng rỗng `[]`, Vbook báo "không có trang nào" làm người dùng tưởng plugin bị hỏng.

**Luật phòng tránh:**
- Kiểm tra rõ ràng nếu chương không có ảnh nội dung, trả về thông báo có ý nghĩa bằng `Response.error()`:
  ```javascript
  if (!imgs || imgs.length === 0) {
      return Response.error("Chương này đang được cập nhật hoặc nguồn chưa tải ảnh lên!");
  }
  ```
- Tuyệt đối không fallback quét toàn trang khi bộ container đọc truyện đã được xác định chính xác.

---

## 25. Tối ưu dung lượng Webtoon qua Photon (`w=600&quality=65&strip=all`)

Truyện Webtoon / Manhwa hiện đại thường cắt một chương thành 80–140 lát ảnh dọc (slices).

**Đã trả giá thật (DamCoNuong v4→v6, 11/09/2026):**
- Khi dùng Photon proxy để chuyển đổi ảnh sang JPEG (cho tương thích Glide), nếu để chất lượng cao mặc định như `w=800&quality=75`:
  - Mỗi lát ảnh nặng ~145 KB.
  - Cả chương 90–100 lát ảnh nặng tới **~14 MB**.
  - Việc tải 90–100 ảnh nặng 14 MB qua 4G/WiFi yếu làm connection pool nghẽn, máy nóng, tiêu hao nhiều RAM để decode bitmap, và cuộn trang bị khựng giật.
- Phân tích thực tế trên màn hình smartphone:
  - Bề rộng hiển thị truyện dọc (webtoon reader) trên điện thoại thông thường chỉ chiếm từ 400px đến 720px chiều ngang màn hình.
  - Đo đạc thực tế:
    * `w=800, quality=75`: ~145 KB/ảnh (tổng ~13.5 MB/chương)
    * `w=600, quality=65, strip=all`: ~55–65 KB/ảnh (tổng ~5.5 MB/chương — **giảm 55%–60% dung lượng!**)
  - Tham số `strip=all` loại bỏ triệt để thông tin EXIF, ICC Color Profile và metadata máy ảnh thừa thãi trong từng lát cắt.
  - Ở độ phân giải `w=600&quality=65`, thoại chữ trong khung tranh trên màn hình Full HD vẫn giữ nguyên 100% độ sắc nét và tương phản, nhưng tốc độ tải và render của Glide tăng gấp **2–3 lần**.

**Công thức chuẩn tối ưu Webtoon:**
```javascript
var clean = rawUrl.replace(/^https?:\/\//, "");
var hostIndex = (idx || 0) % 3;
return "https://i" + hostIndex + ".wp.com/" + clean + "?w=600&quality=65&strip=all";
```



---

## 26. Dò domain dự phòng đi xuống số cũ đã chết

**LỖI LẶP LẠI LẦN 2.** luottruyen v28 mắc rồi, goctruyentranh v41 mắc lại y hệt.

Domain nguồn vừa bỏ thường **vẫn còn bản ghi DNS** trỏ Cloudflare. Request tới nó không fail
nhanh mà **treo 10–15 giây** rồi mới lỗi. Domain chưa từng tồn tại thì NXDOMAIN ~0,05s, rẻ.

Ca goctruyentranh v41 (đo 12/09/2026):

```javascript
var order = [cur + 1, cur - 1];   // SAI
```

`vui42` trả 301 về `vui41` nên phép kiểm tên miền trong body trượt, hàm đi tiếp xuống `vui40` —
đã chết — và **treo đúng 11,07 giây**. Đo được nguyên chuỗi request của một lần mở danh sách:

```
412ms   /lien-he                 200
236ms   /api/v2/home/filter      200 nhưng chỉ 107 byte: "Phiên làm việc đã hết hạn"
526ms   vui42/lien-he            200 (301 về vui41 -> phép kiểm trượt)
10569ms vui40/lien-he            treo, bỏ cuộc
261ms   /api/v2/home/filter      200, 38 KB — thành công
------- 12,0 giây
```

**Đúng:**

```javascript
var order = [cur + 1, cur + 2];   // CHỈ dò LÊN, tối đa 2 ứng viên
...
Http.get(cand + '/lien-he').headers(H).timeout(PROBE_TIMEOUT).string();
```

Kèm luật đã có từ luottruyen: **chỉ dò domain khi chính request hỏng**, không dò khi request
thành công mà dữ liệu rỗng. Xem [06-case-study-luottruyen.md](06-case-study-luottruyen.md).

---

## 27. Không đặt timeout — mỗi host chết ăn 10–11 giây

Trước 12/09/2026 chỉ 6/18 nguồn đặt timeout. 12 nguồn còn lại để mặc định, và mặc định là
**chờ tới khi socket tự bỏ**. Đo thật:

| Host chết | Thời gian treo |
|---|---|
| `nettruyenviet10.com` | 11,1 s |
| `nhattruyenmoi.com`, `nhattruyento.com` | 10,6 s mỗi cái |
| `toptruyenzone12/13/14.com` | 10,6 s mỗi cái (3 cái = 32 s) |
| `goctruyentranhvui40.com` | 11,07 s |
| `cuutruyen.cc` (site sập) | 20 s |

Cộng dồn: toptruyen từng mất **39,2 giây** chỉ để lên trang danh sách.

**Luật:** mọi request đều có timeout. `REQ_TIMEOUT = 8000` cho request chính,
`PROBE_TIMEOUT = 4000` cho mirror và dò domain. Khai hai hằng ở đầu `config.js`.
Cú pháp: `Http.get(u).headers(H).timeout(REQ_TIMEOUT).html()` hoặc
`fetch(u, { headers: H, timeout: REQ_TIMEOUT })`.

---

## 28. Hàm tên `retry` nhưng không hề thử lại

`2ten/src/src/config.js` trước v6:

```javascript
function fetchRetry(url) {          // tên hứa retry
    try {
        var res = fetch(url, FETCH_OPTIONS);
        if (res && res.ok) return res;
        return res;                 // gọi đúng MỘT lần
    } catch (e) {
        return null;
    }
}
```

Đo 12/09/2026: `www.2tenvn.com` hỏng khoảng **50 % số lần gọi** (`ECONNRESET`, connect timeout)
rồi lần sau lại 200. Với một lần gọi, một nửa số lần mở nguồn ra danh sách trống. Sửa thành vòng
2 lần thì nguồn chạy lại bình thường (25 truyện).

**Bài học rộng hơn:** đừng tin tên hàm. Cả 8 nguồn trong repo đều có hàm tên `fetchRetry`, chỉ
vài cái thật sự thử lại. Đọc thân hàm trước khi kết luận nguồn "đã có cơ chế dự phòng".

---

## 29. Lọc ảnh rác bằng chuỗi con: `"ads"` khớp luôn `"uploads"`

Bản vá tháng 9/2026 thêm danh sách chặn vào 7 nguồn:

```javascript
var junkWords = ["logo", "favicon", "avatar", "icon", "banner", "button", "ads", ...];
if (lower.indexOf(junkWords[j]) >= 0) continue;
```

`"uploads"` chứa `"ads"`. Bất kỳ CDN nào phục vụ ảnh dưới `/uploads/` — WordPress, Madara,
phần lớn site tự host — sẽ bị **xoá sạch toàn bộ ảnh chương** mà không báo lỗi gì, chỉ ra
"Không tìm thấy ảnh chương". Cùng họ: `"icon"` khớp `silicon`, `"thumb"` khớp `thumbnail` hợp lệ.

Ở thời điểm vá, CDN của 7 nguồn đó chưa dùng `/uploads/` nên chưa nổ. Đã đổi thành `"/ads"`.

**Luật:** chuỗi lọc rác phải có dấu phân cách đường dẫn (`"/ads"`, `"/icon"`) hoặc là tên file
đầy đủ. Sau khi siết bộ lọc, **đếm lại số ảnh** của một chương đã biết trước số lượng.

---

## 30. Ảnh watermark của site nằm ở ĐẦU và CUỐI chương

Không phải ảnh rác nào cũng có chữ "logo" hay "banner" trong URL. Đo 12/09/2026:

| Nguồn | Ảnh rác | Vị trí |
|---|---|---|
| tcomic | `banner/banner-introduce.webp`, `banner_last_introduce.webp` | ảnh **đầu** và ảnh **cuối** |
| zettruyen | `www.zettruyen1.com/images/zettruyen-wp.webp` | ảnh **đầu** |
| doctruyen3q | `s2.anhvip.xyz/3qhub3.jpg` | ảnh **đầu** và ảnh **cuối** |

Hậu quả nặng hơn số lượng: **trang đầu tiên người đọc nhìn thấy khi mở chương là quảng cáo**,
không phải truyện. Hai dấu hiệu nhận ra nhanh:

1. Ảnh đầu tiên nằm trên **host khác** với các ảnh còn lại (site chính thay vì CDN ảnh).
2. Số ảnh lệch 1–2 so với nguồn khác cùng đăng đúng truyện đó.

Cách kiểm: in ra ảnh `[0]`, `[1]`, `[n-2]`, `[n-1]` của một chương và nhìn bằng mắt, đừng chỉ
đếm tổng.

---

## 31. `encodeURI` nhân đôi mã hoá URL đã có `%xx`

`safeEncodeUrl()` thêm vào 16 nguồn tháng 9/2026 dùng `encodeURI(u)`. `encodeURI` **không** bỏ qua
escape sẵn có — nó mã hoá luôn dấu `%`:

```javascript
encodeURI("https://a.com/a%20b.jpg")
// -> "https://a.com/a%2520b.jpg"   -> 404
encodeURI("https://a.com/x?u=https%3A%2F%2Fb.com%2Fc.jpg")
// -> "...u=https%253A%252F%252Fb.com%252Fc.jpg"   -> proxy nhận sai URL
```

Kiểm 12/09/2026: chưa nguồn nào trong repo sinh URL ảnh có sẵn `%xx` nên chưa nổ. Nhưng URL đi
qua proxy (`?url=` + `encodeURIComponent`) và tên file tiếng Việt trên WordPress đều có `%xx`.

**Luật:** chỉ encode khi chuỗi **chưa** được encode. Nếu URL đã chứa `%` theo sau 2 ký tự hex thì
trả nguyên, đừng đụng vào.


---

## 32. Cloudflare Workers gói miễn phí không xử lý nổi ảnh

Nguồn cuutruyen cần một máy chủ đứng giữa để ghép lại ảnh bị xáo trộn. Bản đầu đặt trên
Cloudflare Workers gói miễn phí. Người dùng báo: **"tải được 1–2 ảnh đầu rồi đứt hoàn toàn"**.

Đo trên chính worker đã deploy (12/09/2026):

| Cách gọi | Kết quả |
|---|---|
| 5 luồng song song, 12 ảnh mới | 8 qua, 4 trả `error code: 1102` |
| **1 luồng tuần tự**, 10 ảnh mới | **3 qua, 7 trả `error code: 1102`** |

`1102` = "Worker exceeded CPU time limit". Giải nén rồi nén lại một ảnh JPEG 2048×1470 tốn
**1,5–3 giây CPU**; hạn mức gói free tính bằng **chục mili giây**.

Hai kết luận sai mà ai cũng dễ mắc:

- **"Giảm luồng xuống 1 là qua."** Không. Hạn mức tính theo **mỗi lần gọi**, không phải theo mức
  đồng thời. Chạy tuần tự còn tệ hơn: 3/10.
- **"Đổi sang WebAssembly là qua."** Không. WASM nhanh hơn `jpeg-js` vài lần, trong khi khoảng
  cách cần bù là **trăm lần**.

**Luật:** Cloudflare Workers hợp với việc sửa header, đổi hướng, ghép JSON. Đụng tới **giải nén
hoặc nén lại ảnh** thì phải là nền chạy có CPU thật: Vercel / Netlify serverless, hoặc container
Node. Bản dùng được nằm ở `tools/cuutruyen-worker/` (Vercel + `sharp`, đo 53/53 trang trong 13 giây).

---

## 33. Trình đọc chỉ nhận URL http — ảnh tự dựng phải đi qua máy chủ

`Graphics` của vBook ghép ảnh được thật: `createImage` nhận base64, `drawImage` vẽ đúng,
`capture()` trả base64 PNG. Nhưng **không có cách nào giao ảnh đó cho trình đọc**. Đã thử cả ba
kiểu cho cùng một trang (cuutruyen v14→v17): `data:image/png;base64,…`, `base64:…`, và chuỗi
base64 trần. App đều báo đúng một câu "Không thể tải hình ảnh" (chuỗi `error_load_image`).

Trình đọc là Coil ZoomImage, chỉ mở được stream **http/https**.

Thêm nữa PNG từ `capture()` phình 3,7 lần so với JPEG gốc: 365 KB → 1,4 MB mỗi trang, một chương
58 trang thành ~80 MB.

**Luật:** nguồn nào phải xử lý pixel mới ra được ảnh đúng thì việc xử lý nằm ở **máy chủ**, plugin
chỉ trả URL http trỏ tới đó. Đừng viết lại nhánh `Graphics` lần thứ năm.

Đừng suy rộng thành "không đọc được trong vBook": **đọc được**, miễn là URL trả về ảnh thật —
cuutruyen v22 chạy đúng như vậy.

---

## 34. GocTruyenTranh & Origin CDN: Cấm ép URL ảnh về domain site và cấm khai thread/delay vào origin Cloudflare

### Triệu chứng
- Người dùng mở chương mới trong app vBook $\rightarrow$ app hiện **"Không thể tải hình ảnh"** (`error_load_image` của vBook), toàn bộ ảnh trong chương hỏng cùng lúc.
- **Không hiện nút "Trang nguồn":** Vì `chap.js` đã chạy thành công và trả về `Response.success(imgs)`, vBook lập tức chuyển sang Reader UI để nạp ảnh. Ở Reader UI **không có nút "Trang nguồn"** (nút này chỉ hiện khi `Response.error`).

### Hai sai lầm chí mạng liên tiếp (v44 - v48, ngày 12-13/09/2026)
1. **Sai lầm 1 (Khai thread/delay làm nghẽn/WAF):** Khai `"thread": 5, "delay": 10` trong `goctruyentranh/plugin.json`. Nguồn này ảnh nằm sau Cloudflare. Bắn dồn dập 5 kết nối song song cách nhau 10ms từ IP 3G/4G di động (CGNAT) kích hoạt ngay Cloudflare Rate Limiting (Error 1015 / Turnstile Challenge), khiến 100% request ảnh nhận HTTP 403 / HTML challenge.
2. **Sai lầm 2 (Ép URL ảnh về domain web frontend):** Trong `chap.js`, thay vì trả URL CDN gốc do site cấp (`https://vn*.gtt-bk.pro/image/...`), code lại dùng `replace(/^https?:\/\/vn\d*\.gtt-bk\.pro/i, SITE_URL)`. Việc này ép toàn bộ request ảnh đi qua domain web frontend (`goctruyentranhvui41.com`), nơi có WAF / bot-protection cực gắt của Cloudflare chặn IP mạng di động. Trong khi đó, CDN gốc `vn*.gtt-bk.pro` là máy chủ ảnh chuyên dụng, khi app gửi `Referer: https://goctruyentranhvui41.com/` (từ trường `host` trong `toc.js`) thì CDN chấp nhận và trả về ảnh HTTP 200 đầy đủ.

### Luật cứng
1. **Tuyệt đối không khai `"thread"` và `"delay"` trong `goctruyentranh/plugin.json`** để app dùng cấu hình an toàn mặc định (1-2 luồng tuần tự).
2. **Giữ nguyên URL ảnh CDN gốc `vn*.gtt-bk.pro` trong `chap.js`**, chỉ chuẩn hóa URL giao thức tương đối (`//`) và đường dẫn tương đối (`/`). CẤM dùng regex replace ép CDN về `SITE_URL`.
3. Trường `host` trong `toc.js` phải luôn là `SITE_URL` (`https://goctruyentranhvui41.com`) để ImageLoader của vBook đính kèm đúng `Referer` mà CDN yêu cầu.
4. **Không cần xin Token hay UID mới:** Token cá nhân trong `config.js` (`GTT_TOKEN`) dùng để đọc các chương khoá (TRIPLE). Chương thường không cần token. Token không bao giờ hết hạn tự động nếu không chủ động đổi mật khẩu.

