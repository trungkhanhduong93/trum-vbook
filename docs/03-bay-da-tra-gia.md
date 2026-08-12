# Bẫy đã trả giá — đọc trước khi viết, và lần nữa trước khi push

Mỗi mục ở đây tương ứng với ít nhất một bản phát hành đã hỏng thật. Sắp theo mức độ hay lặp lại.

## Tra ngược từ triệu chứng

| Người dùng báo | Đọc mục |
|---|---|
| "Không tải được ảnh" / ảnh vỡ | [1](#1-url-ảnh--đã-sai-2-lần), [2](#2-referer-nối-vào-url-ảnh), [12](#12-ảnh-avif-không-decode-được), [17](#17-fetch-trả-response-không-phải-document) |
| Màn hình trống, lỗi trống trơn không có thông báo | [17](#17-fetch-trả-response-không-phải-document), [5](#5-selectfirst-và-parent) |
| "Đăng nhập rồi mà vẫn không đọc được" | [17](#17-fetch-trả-response-không-phải-document) + [06 case study](06-case-study-luottruyen.md) |
| "Cài xong không chạy gì cả" | [3](#3-zip-thiếu-entry-src), [4](#4-version-không-bump-đủ-3-chỗ) |
| "Sửa rồi mà vẫn y như cũ" | [4](#4-version-không-bump-đủ-3-chỗ) |
| Danh sách trống, tìm kiếm trống | [5](#5-selectfirst-và-parent), [7](#7-tham-số-tìm-kiếm-sai--site-trả-danh-sách-mặc-định) |
| Cuộn mãi không hết trang | [9](#9-phân-trang-trang-cuối-phải-trả-null) |
| Thể loại của truyện sai bét | [6](#6-fallback-quét-toàn-trang) |
| Ảnh bị lặp đôi | [10](#10-trang-chương-có-2-trình-đọc) |
| Vào web được, app thì không | [13](#13-không-vào-được--thường-là-isp-chặn-dns) |

---

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
