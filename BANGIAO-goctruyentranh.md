# Bàn giao: GocTruyenTranh báo "Không thể tải hình ảnh"

Ngày 12/09/2026. Viết cho người tiếp nhận (Gemini). Chưa sửa được, dưới đây là toàn bộ những gì
đã đo, những gì đã loại, và manh mối còn lại.

Kho: `trungkhanhduong93/trum-vbook`, nhánh `main`, nguồn `goctruyentranh/`.

---

## 1. Triệu chứng

- Người dùng mở chương trong app vBook → app hiện **"Không thể tải hình ảnh"**.
- **Tất cả** ảnh hỏng, không phải vài trang.
- Người dùng khẳng định: **trước đợt tối ưu ngày 12/09/2026 thì đọc bình thường**.
- Câu "Không thể tải hình ảnh" là chuỗi `error_load_image` của chính app. Nghĩa là **plugin đã trả
  được danh sách URL ảnh, nhưng app tải các URL đó về không nổi.** Đây KHÔNG phải lỗi logic plugin;
  nếu plugin lỗi thì app sẽ hiện chuỗi `[GTT-...]` do `Response.error` trả về.

---

## 2. ⭐ MANH MỐI SỐ MỘT — chưa ai thử

Đợt tối ưu hôm nay thêm **hai khoá này vào `goctruyentranh/plugin.json`** (commit `53169f3`):

```json
"thread": 5,
"delay": 10
```

Trước commit đó nguồn này **không khai hai khoá này**, nên app dùng thiết lập chung của người dùng.
Đây là **khác biệt hành vi duy nhất còn lại** giữa "trước tối ưu" và bây giờ mà chưa ai gỡ ra thử.

Vì sao đáng nghi: ảnh của nguồn này nằm trên `goctruyentranhvui41.com`, tức là **sau Cloudflare của
chính site**, không phải CDN ảnh riêng. Bắn 5 kết nối song song cách nhau 10 ms vào origin đó, từ
một IP di động (thường là CGNAT dùng chung), rất dễ ăn `Error 1015` hoặc challenge → **mọi ảnh hỏng
cùng lúc**, đúng triệu chứng.

Mã nguồn đã có sẵn hàm `isRateLimited(res)` bắt `Error 1015`, chứng tỏ site này **đã từng** giới
hạn tốc độ.

**Việc cần làm đầu tiên, một dòng:** xoá `"thread": 5` và `"delay": 10` khỏi
`goctruyentranh/plugin.json`, đóng gói lại, bump version, cho người dùng cập nhật rồi đọc thử.
Nếu hết lỗi thì xong. Nếu chưa, thử `"thread": 2, "delay": 500`.

Đóng gói bằng: `python tools/pack.py goctruyentranh --bump` (script này tự bump cả 3 nơi và tự
nghiệm thu zip).

---

## 3. Trạng thái mã nguồn hiện tại (v46) — đã kiểm chứng, đừng nghi ngờ chỗ này

- `goctruyentranh/src/chap.js`: **giống hệt từng ký tự** bản trước đợt tối ưu (commit `62406f3`).
- `goctruyentranh/src/config.js`: chỉ khác bản trước tối ưu đúng hai điểm, cả hai đều nhỏ:
  1. thêm `.timeout(4000)` cho **duy nhất** request dò tên miền trong `probeDomain()`;
  2. `probeDomain()` chỉ dò **lên** (`cur+1, cur+2`) thay vì `cur+1, cur-1`.
- Mọi `.timeout(8000)` ở request chính (`siteGet` / `sitePost` / `primeSession`) **đã gỡ hết** ở v46.

Đã đối chiếu bằng ba cách độc lập: `git diff`, băm SHA-256 từng file bên trong hai file zip, và tải
zip mà GitHub đang phục vụ về mở ra kiểm.

---

## 4. Đã đo và LOẠI — đừng đào lại

Mọi số đo dưới đây làm trên máy dev (Windows, mạng cáp, Việt Nam), ngày 12/09/2026.

| Giả thuyết | Cách đo | Kết quả |
|---|---|---|
| Chữ ký URL ảnh hết hạn giữa chừng | tải lại cùng URL sau 0/60/180/420 giây | 200 cả 4 lần — **sống ≥ 7 phút** |
| Máy chủ chặn khi tải nhiều luồng | cả chương 42 ảnh ở 5 luồng/10ms, 2 luồng/200ms, 1 luồng | **42/42 đều 200** ở cả ba mức |
| Tủ truyện lưu tên miền cũ nên Referer sai | gửi Referer vui40 (đã chết), vui42, http:// | **200 hết** — server không soi Referer là gì |
| Thiếu chuỗi `?exp=&verify=` | bỏ hẳn query, và thử `?code=gtt-yes` kiểu cũ | **200 cả hai** |
| Tên miền chính đã chết | `curl` vui40..vui44 | vui41 trả 200, vui42 trả 301, còn lại chết. **vui41 vẫn đúng** |
| Chốt "BLANK" tôi thêm ở v44 | đã revert ở v45 | đúng là bug của tôi, nhưng **không phải bug hiện tại** |
| Hạn 8 giây ở request chính | đã gỡ ở v46 | **vẫn lỗi** → giả thuyết này SAI |

**Cách duy nhất làm ảnh 403:** không gửi header `Referer`. Đã kiểm: có Referer → 200 (87 KB),
không Referer → 403 (4 KB). Bất kỳ giá trị Referer nào cũng qua.

---

## 5. Manh mối thứ hai: vì sao app lại không gửi Referer

Nếu manh mối số một không trúng thì đây là hướng tiếp theo, vì 403-do-thiếu-Referer là **cơ chế
hỏng duy nhất tìm được**.

vBook tự gắn Referer cho ảnh chương dựa trên trường `host` trong kết quả `toc.js` / `detail.js`.
Đã kiểm cả ba nơi đều có `host: HOST`:
- `config.js` → `mapComicCard()` dòng ~397
- `detail.js` dòng ~53
- `toc.js` dòng ~59

Việc cần làm: xác minh trên **máy thật** rằng app có gửi Referer khi tải ảnh nguồn này không.
Nếu không thì tìm xem `HOST` bị rỗng ở đường nào (ví dụ mở truyện từ tủ đã lưu từ lâu, hay từ
kết quả tìm kiếm).

⛔ **Tuyệt đối không nối `|Referer=URL` vào URL ảnh trong `chap.js`.** Đó là lỗi đã lặp lại trong
kho này, xem `docs/03-bay-da-tra-gia.md` mục 2.

---

## 6. Manh mối thứ ba: nhánh WebView trả URL ảnh không dùng được

Trong `chap.js`, khi API `/api/chapter/loadAll` không trả ảnh thì mã rơi xuống `loadAllViaBrowser()`.
Nhánh đó có bước `imagesFromDoc(browser.html())` — bóc thẳng thẻ `<img>` từ DOM.

URL bóc từ DOM có thể là ảnh chờ (lazy placeholder) hoặc thiếu tham số, khác với URL do API cấp.
Nếu nhánh này chạy thì app nhận được URL nhưng tải không nổi → **đúng triệu chứng**.

Cách xác minh: cho `imagesFromDoc` ghi tạm số ảnh và URL đầu tiên vào thông báo lỗi, rồi xem trên
máy thật.

⛔ **Cảnh báo đã trả giá:** đừng thêm chốt "thoát sớm nếu trang trắng" vào nhánh WebView này.
Tôi làm đúng thế ở v44 và **làm gãy nguồn ngay** (phải revert ở v45). Hai lý do:
1. Tôi đọc `browser.html()` **trước** dòng `callJs('void 0;', 2)` — mà dòng đó chính là 2 giây chờ
   trang render. Đọc sớm thì trang nào cũng ra "trắng".
2. Tôi tin `curl -sI` thấy `x-frame-options: DENY` rồi kết luận WebView không bao giờ chạy được ở
   nguồn này. **Sai.** Header đó chỉ có nghĩa khi trang bị nhúng trong khung con, và máy thật của
   người dùng cho thấy nhánh WebView vẫn chạy.

---

## 7. Cách chạy lại các phép đo

```bash
# đo một nguồn: số request, thời gian từng bước, dung lượng ảnh
node tools/vbook-harness/measure.js goctruyentranh

# cổng QA bắt buộc trước khi push (5 chốt)
python tools/qa_prepush_gate.py goctruyentranh

# đóng gói + bump version cả 3 nơi + tự nghiệm thu zip
python tools/pack.py goctruyentranh --bump
```

Kết quả `measure.js` trên máy dev lúc viết bản này: home/gen/detail/toc/chap đều `ok=True`,
65 chương, 35 ảnh, 134 KB mỗi ảnh, tải thử 5/5 ảnh thành công.
**Nguồn hoàn toàn bình thường khi chạy từ máy dev.** Lỗi chỉ xuất hiện trên máy người dùng.

---

## 8. Luật cứng của kho này — vi phạm là gãy

1. **Không dùng `selectFirst()`** — Rhino-Jsoup của vBook không có. Dùng helper `selFirst()`.
   Không dùng `.parent()`. Tránh combinator `>`.
2. **Không nối `|Referer=...` vào URL ảnh.** Chỉ trả URL trần.
3. **Đóng gói zip bằng Python**, bắt buộc có entry thư mục `src/`. Không dùng `Compress-Archive`.
   Đã có sẵn `tools/pack.py`.
4. **Version phải khớp ở 3 nơi:** `<nguồn>/plugin.json`, `plugin.json` gốc (cả trường `version` lẫn
   đuôi `?v=` trong `path`), và bản `plugin.json` nằm trong zip. QA gate chốt điều này.
5. **Không thêm/gỡ/đổi proxy ảnh chỉ vì số đo trên máy dev.** Đã gãy ảnh 3 lần vì việc này.
   Chỉ được khai thác tham số biến đổi trên **chính CDN mà site đang dùng**.
6. **Dò tên miền dự phòng chỉ được dò LÊN**, và mọi request dò phải có `.timeout(4000)`.
   Tên miền cũ đã chết nhưng DNS còn sống sẽ treo 11 giây.
7. **Số THỜI GIAN đo phần ảnh trên máy dev là rác.** Cùng một file 18 KB đo 3 lần liên tiếp ra
   850 ms / 14 882 ms / 1 360 ms. Chỉ tin số dung lượng.
8. **Đừng cắt nhánh dự phòng vì suy luận giao thức.** Chỉ cắt khi máy thật của người dùng xác nhận.

Tài liệu đầy đủ: `docs/02-api-va-gioi-han.md` (API và giới hạn của vBook),
`docs/03-bay-da-tra-gia.md` (33 bẫy đã trả giá, có bảng tra ngược từ triệu chứng),
`docs/07-do-toc-do.md` (phương pháp đo và số nền của cả 15 nguồn).

---

## 9. Thứ tự đề nghị

1. Gỡ `thread`/`delay` khỏi `goctruyentranh/plugin.json` → bump → người dùng thử. **Làm cái này trước.**
2. Chưa được thì đặt `"thread": 2, "delay": 500` → thử tiếp.
3. Chưa được thì làm một bản dò: cho `chap.js` trả về thông báo lỗi có kèm số ảnh lấy được, URL
   đầu tiên, và nhánh nào đã chạy (API hay WebView). Xem trên máy thật.
4. Song song: xác minh app có gửi `Referer` khi tải ảnh nguồn này không.
