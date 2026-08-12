# Quy trình tạo một nguồn truyện mới — 8 bước

Đầu vào: một link site truyện. Đầu ra: plugin đã push, cài được trong Vbook.
Làm đúng thứ tự. Bước khảo sát chiếm ~40% thời gian và **không được rút gọn** — mọi lần
nguồn gãy trong lịch sử repo này đều bắt nguồn từ việc đoán cấu trúc site thay vì đo nó.

---

## Bước 1 — Khảo sát site bằng request thật

Trên Windows dùng **PowerShell** (`Invoke-WebRequest`). Bash/curl trong môi trường agent có thể
bị sandbox chặn mạng và **trả rỗng không báo lỗi** — thấy output rỗng thì đổi sang PowerShell ngay,
đừng kết luận "site chặn".

```powershell
$sp = "<thư mục scratchpad>"
$r = Invoke-WebRequest -Uri "https://example.com/" -UseBasicParsing -TimeoutSec 30
$r.Content | Out-File "$sp\home.html" -Encoding utf8
"code=" + $r.StatusCode + " len=" + $r.Content.Length
```

Lưu HTML ra file rồi soi bằng regex/`IndexOf`, đừng đọc bằng mắt trên terminal.

**Phải xác định đủ 8 thứ, mỗi thứ kèm bằng chứng là một request thật:**

| Cần biết | Cách đo |
|---|---|
| Có API JSON không | Thử `/api/...` mà site gọi (xem trong HTML/JS). Có API → dùng API, bỏ qua phần scrape |
| URL trang danh sách + tham số phân trang | Mở trang 1, 2, 3 — so số truyện và nội dung có khác nhau không |
| Selector của card truyện | Tìm chuỗi lặp lại 24 lần (hoặc bằng số truyện/trang) trong HTML |
| Tham số tìm kiếm thật | Thử `?q=`, `?keyword=`, `?s=`, `?search=` — **so kết quả với từ khoá vô nghĩa** |
| Trang chi tiết: tên/tác giả/mô tả/thể loại/trạng thái | Soi HTML, ghi lại selector từng trường |
| Mục lục nằm ở đâu | Trong trang chi tiết hay endpoint riêng |
| Ảnh chương: selector + host | `data-src`? `src`? có proxy `?url=` không? |
| Cloudflare challenge | Gửi thử với UA `okhttp/4.9.0` và **không UA** |

### Bẫy tham số tìm kiếm — kiểm bằng từ khoá vô nghĩa

Nhiều site **bỏ qua tham số sai và trả về danh sách mặc định**. Nếu chỉ nhìn "có 24 kết quả" thì
tưởng đúng. Cách kiểm:

```powershell
# tham so dung -> 0 ket qua; tham so sai -> van 24 ket qua (danh sach mac dinh)
(Invoke-WebRequest "https://example.com/search?q=zzzzkhongcotruyennao" -UseBasicParsing).Content -match 'card-class' 
```

Đã dính 2 lần trong repo: fastscan (`?keyword=` sai, `?q=` mới đúng) và cuutruyen (ngược lại,
`?q=` sai dù chính JSON-LD của site quảng cáo `?q=`).

### Kiểm Cloudflare cho đúng

```powershell
$h = @{ "User-Agent" = "okhttp/4.9.0" }
$r = Invoke-WebRequest -Uri "https://example.com/danh-sach" -UseBasicParsing -Headers $h
$r.Content -match 'Just a moment|challenge-platform|cf-browser-verification'
```

`False` cả với UA okhttp lẫn không UA → site **không** bật challenge, `Http.get()` là đủ.
Vẫn giữ nhánh browser fallback trong `fetchDoc()` vì OkHttp thật của Vbook có TLS fingerprint khác
PowerShell và đã từng bị chặn — nhưng **đừng đi đường browser làm mặc định**, nó chậm và nuốt luôn
đường HTTP đang chạy tốt.

---

## Bước 2 — Dựng khung plugin

```
<tenguon>/
  icon.png          # lấy favicon/logo của site, ~3-30KB, PNG
  plugin.json
  src/
    config.js  home.js  gen.js  genre.js  detail.js  toc.js  chap.js
```

`plugin.json`:

```json
{
  "metadata": {
    "name": "TenNguon",
    "author": "tkd1793",
    "version": 1,
    "source": "https://example.com",
    "regexp": "(www\\.)?example\\.com\\/truyen\\/[a-z0-9-]+\\/?$",
    "description": "Đọc truyện trên trang Tên Nguồn",
    "locale": "vi_VN",
    "language": "javascript",
    "type": "comic"
  },
  "script": {
    "home": "home.js", "genre": "genre.js", "detail": "detail.js",
    "search": "search.js", "toc": "toc.js", "chap": "chap.js"
  }
}
```

`regexp` là để Vbook nhận link chia sẻ từ trình duyệt → phải khớp **đúng dạng URL trang chi tiết
truyện**, không phải trang chủ. Test bằng chính URL thật đã lấy ở bước 1.

Lấy icon:
```powershell
$r = Invoke-WebRequest "https://example.com/favicon-192.png" -UseBasicParsing
[IO.File]::WriteAllBytes("<tenguon>\icon.png", $r.Content)
```

---

## Bước 3 — Viết `config.js` trước, mọi thứ khác dùng lại

`config.js` là nơi đặt: hằng số site, headers, `selFirst`, `absUrl`, `fetchDoc`, `parseCards`,
`nextPage`, `withPage`. Bảy script còn lại chỉ `load("config.js")` rồi gọi.

Khung tối thiểu — chép từ [`cuutruyen/src/config.js`](../cuutruyen/src/config.js) rồi sửa selector.
Chi tiết từng hàm và vì sao viết như vậy: [02-api-va-gioi-han.md](02-api-va-gioi-han.md).

---

## Bước 4 — Viết 7 script

Thứ tự viết nên là: `gen.js` → `home.js` → `search.js` → `detail.js` → `toc.js` → `chap.js` → `genre.js`.
Lý do: `gen.js` chỉ vài dòng nhưng buộc `parseCards` + `nextPage` phải đúng, mà hai hàm đó nuôi
cả home/search/genre.

Signature (Vbook gọi đúng như vậy):

```javascript
home.js    execute()                 -> Response.success([{title, input, script}])
genre.js   execute()                 -> Response.success([{title, input, script}])
gen.js     execute(url, page)        -> Response.success(items, nextPageOrNull)
search.js  execute(key, page)        -> Response.success(items, nextPageOrNull)
detail.js  execute(url)              -> Response.success({name, cover, host, author, description, detail, ongoing, genres})
toc.js     execute(url)              -> Response.success([{name, url, host}])   // chương đầu đứng trước
chap.js    execute(url)              -> Response.success([urlAnh1, urlAnh2, ...])
```

`items` của `gen`/`search` là mảng `{name, link, cover, description, host}`.

---

## Bước 5 — Test thật, KHÔNG đọc code rồi kết luận

Dựng harness Node theo [04-test-harness.md](04-test-harness.md), rồi chạy đủ **9 ca**:

1. Home — mọi mục đều ra truyện (không mục nào rỗng).
2. Danh sách trang 1 và trang 2 — **không trùng nhau** (trùng = phân trang không ăn tham số).
3. Trang **cuối** của một danh mục ít truyện — `next` phải là `null`, nếu không app cuộn vô tận.
4. Tìm kiếm bình thường + **từ khoá vô nghĩa phải ra 0 kết quả**.
5. Tìm kiếm tiếng Việt có dấu.
6. Chi tiết truyện nhiều chương (~100) — đủ tên/tác giả/mô tả/thể loại.
7. Mục lục — đúng thứ tự (chương 1 trước), không trùng URL, có tiêu đề chương.
8. Chương đầu / chương giữa / chương cuối — số ảnh > 0, URL không trùng.
9. URL truyện không tồn tại — báo lỗi tử tế, không ném exception.

Ghi lại kết quả thật. "Đã test" mà không có số liệu thì coi như chưa test.

---

## Bước 6 — Đóng gói zip bằng Python

⛔ **Không dùng `Compress-Archive`** — nó không tạo directory entry `src/`, Vbook cài xong im lặng
không chạy, cực khó chẩn đoán.

```python
import zipfile, os
os.chdir("<tenguon>")
with zipfile.ZipFile("plugin.zip", "w", zipfile.ZIP_DEFLATED) as z:
    z.write("icon.png", "icon.png")
    z.write("plugin.json", "plugin.json")
    entry = zipfile.ZipInfo("src/")            # BẮT BUỘC
    entry.external_attr = 0o040755 << 16
    z.writestr(entry, "")
    for f in sorted(os.listdir("src")):
        if f.endswith(".js"):
            z.write("src/" + f, "src/" + f)

archive = zipfile.ZipFile("plugin.zip")
print(archive.namelist())
for n in archive.namelist():                    # đối chiếu zip với source
    if not n.endswith("/"):
        assert archive.read(n) == open(n, "rb").read(), "LECH: " + n
```

Namelist đúng phải là:
```
['icon.png', 'plugin.json', 'src/', 'src/chap.js', 'src/config.js', 'src/detail.js',
 'src/gen.js', 'src/genre.js', 'src/home.js', 'src/search.js', 'src/toc.js']
```

Repo có sẵn [`pack.py`](../pack.py) — thêm `pack_plugin('<tenguon>')` vào cuối. Lưu ý file này
đóng gói **tất cả** plugin liệt kê trong đó khi chạy; muốn gói riêng thì viết script rời.

---

## Bước 7 — Đăng ký vào registry gốc

Thêm một phần tử vào mảng `data` của [`plugin.json`](../plugin.json) ở gốc repo:

```json
{
  "name": "TenNguon",
  "author": "tkd1793",
  "path": "https://raw.githubusercontent.com/trungkhanhduong93/trum-vbook/main/<tenguon>/plugin.zip",
  "version": 1,
  "source": "https://example.com",
  "regexp": "(www\\.)?example\\.com\\/truyen\\/[a-z0-9-]+\\/?$",
  "icon": "https://raw.githubusercontent.com/trungkhanhduong93/trum-vbook/main/<tenguon>/icon.png",
  "description": "Đọc truyện trên trang Tên Nguồn",
  "type": "comic", "locale": "vi_VN"
}
```

⚠️ **`version` phải khớp** giữa `<tenguon>/plugin.json` và registry gốc. Mỗi lần sửa code là
**bump cả hai + repack zip** — thiếu một trong ba thì máy người dùng không nhận bản mới, và
"sửa rồi mà vẫn lỗi" sẽ đốt cả buổi để tìm.

File registry gốc có sẵn vài entry bị mojibake tiếng Việt từ lịch sử — **đừng ghi đè cả file**,
chỉ sửa đúng entry của mình bằng edit tại chỗ, nếu không sẽ phá thêm.

---

## Bước 8 — QA rồi commit & push

Chủ repo đã uỷ quyền: **sửa xong thì tự commit + push, không hỏi lại.** Nhưng chạy checklist
trước đã:

```powershell
git remote get-url origin      # phải là github.com/trungkhanhduong93/trum-vbook
```

Checklist bắt buộc trước push:

- [ ] `grep -n "selectFirst\|\.parent()\|\.first()" <tenguon>/src/*.js` → không hit nào ngoài comment
- [ ] `grep -n "Referer=" <tenguon>/src/chap.js` → không nối vào URL ảnh
- [ ] Không `console.log`, `TODO`, dữ liệu giả còn sót
- [ ] ES5 thuần: `grep -nE "=>|\blet\b|\bconst\b|\`" <tenguon>/src/*.js`
- [ ] Version khớp 3 chỗ (plugin.json của nguồn · registry gốc · zip đã repack sau lần sửa cuối)
- [ ] Zip namelist có `src/`, nội dung khớp bit với source
- [ ] Đã chạy đủ 9 ca ở bước 5, có số liệu

Commit message: tiếng Việt **không dấu** (đúng phong cách repo), nêu rõ đã đo được gì.

```bash
git add -A
git commit -m "TenNguon v1: them nguon moi"
git push origin main
```

Sau khi push, **verify raw URL phục vụ được** — đây là thứ Vbook thực sự tải:

```powershell
Invoke-WebRequest "https://raw.githubusercontent.com/trungkhanhduong93/trum-vbook/main/<tenguon>/plugin.zip" -UseBasicParsing | % RawContentLength
```

---

## Sau khi push: ai test trên điện thoại?

**Chủ repo.** Harness Node xác nhận được logic parse, **không** xác nhận được: ảnh có tải nổi trên
mạng di động không, Rhino có nuốt cú pháp không, image loader có hiển thị được định dạng đó không.
Nói rõ trong báo cáo là "chưa test trên app thật" và nhờ cài thử — đừng ghi "đã xong" như thể đã
verify tới mức đó.

Người dùng báo lỗi thì đọc [03-bay-da-tra-gia.md](03-bay-da-tra-gia.md) mục tương ứng **trước khi**
sửa mò: gần như mọi triệu chứng trong đó đã có nguyên nhân được ghi lại.
