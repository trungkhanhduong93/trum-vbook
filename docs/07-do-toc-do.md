# Đo tốc độ một nguồn — phương pháp và số nền

Viết sau đợt rà toàn bộ 18 nguồn ngày **12/09/2026**. Mục đích: lần sau ai nói "nguồn X chậm"
thì có cách đo thay vì đoán, và có số nền để so.

---

## 1. Chia đúng hai phần trước khi đo

Một lần đọc truyện gồm hai phần **rất khác nhau về bản chất**, đừng gộp:

| Phần | Gồm gì | Ai quyết định tốc độ |
|---|---|---|
| **Dữ liệu** | home → danh sách → chi tiết → mục lục → danh sách URL ảnh | plugin và máy chủ nguồn |
| **Ảnh** | app tải từng URL ảnh mà `chap.js` trả về | CDN ảnh, dung lượng ảnh, và **số luồng cài trong app** |

Số nền 12/09/2026: phần **dữ liệu** của 14/18 nguồn xong trong **0,5–2,0 giây**. Phần **ảnh** là
5–41 MB mỗi chương. Nghĩa là **tối ưu parse, gộp request, đổi selector gần như không đem lại gì**
— đừng đốt thời gian ở đó nữa trừ khi đo ra nguồn đó thật sự nằm ngoài dải 2 giây.

---

## 2. Ba script trong `tools/vbook-harness/`

Cần `cheerio` (`npm i cheerio`, hoặc đặt `NODE_PATH` trỏ tới nơi đã cài).

```bash
node tools/vbook-harness/measure.js  <nguon> [file-ket-qua.json]
node tools/vbook-harness/imgbench.js <nguon> [so-anh]
node tools/vbook-harness/overlap.js  <nguon1> <nguon2> ...
```

- **`runtime.js`** — mô phỏng `core.js` lấy từ chính `vBook.apk`: `Http`, `fetch`, `Html`,
  `Response`, `Crypto`, `localStorage`, `sleep`… Jsoup dựng bằng cheerio, **cố ý không cài**
  `selectFirst()` và `.parent()` để script sai vỡ ngay trên máy dev.
- **`measure.js`** — chạy thật cả chuỗi home → gen → detail → toc → chap của một nguồn, đếm số
  request, cộng thời gian mạng từng chặng, rồi tải thử 5 ảnh đầu để suy ra dung lượng cả chương.
- **`imgbench.js`** — tải 12 ảnh ở 1 luồng và 12 ảnh **khác** ở 4 luồng, đúng dải "Kết nối song
  song" của app.
- **`overlap.js`** — so danh mục trang 1 giữa nhiều nguồn để phát hiện nguồn trùng.

### Hai chỗ harness dễ nói dối, phải biết trước

1. **Mỗi vòng chỉ được khám phá ĐÚNG MỘT request.** `Http` của Vbook đồng bộ, Node thì không, nên
   harness chạy script nhiều vòng: thiếu URL thì ném, tải về, chạy lại. Nếu cho phép nhiều request
   mỗi vòng, mọi `try/catch` trong plugin sẽ tưởng request đầu hỏng rồi nhảy sang mirror — và bảng
   đo đầy những request **app thật không bao giờ gọi**. Bản đầu của đợt đo này mắc đúng lỗi đó:
   nhattruyen hiện 3 request 22 giây, sửa xong còn 1 request 0,3 giây.
2. **Khoá cache không được gồm headers.** tcomic ký request bằng timestamp nên headers đổi mỗi
   vòng, cache không bao giờ trúng, script chạy vô hạn (đo ra 200 request / 24,7 giây).

Và như mọi lần: harness **không** chạy `Engine.newBrowser()`. Nguồn nào phải đi qua WebView
(luottruyen) sẽ ra 0 ảnh ở đây mà vẫn chạy tốt trong app.

---

## 3. Số nền 12/09/2026

Máy dev, mạng cáp. **Không đại diện cho 4G** — trên 4G phần ảnh giãn ra nhiều lần.

### Phần dữ liệu (tổng thời gian mạng cả chuỗi, 2 lượt cách nhau ~20 phút)

| Nguồn | Lượt 1 | Lượt 2 | Nguồn | Lượt 1 | Lượt 2 |
|---|---|---|---|---|---|
| minomanga | 534 ms | 593 ms | doctruyen3q | 1 413 ms | 1 625 ms |
| vinahentai | 554 ms | 798 ms | goctruyentranh | 1 327 ms | 3 298 ms |
| minohen | 673 ms | 691 ms | toptruyen | 2 020 ms | 1 494 ms |
| tcomic | 694 ms | 693 ms | truyenqq | 1 832 ms | 1 836 ms |
| mimimoe | 721 ms | 1 582 ms | zettruyen | 2 000 ms | 885 ms |
| nettruyen | 794 ms | 1 572 ms | minotruyen | 9 687 ms | 536 ms |
| luottruyen | 1 134 ms | 1 032 ms | 2ten | site chập chờn |  |
| luottruyennew | 1 215 ms | 1 177 ms | cuutruyen | site sập | |

Chênh lệch giữa hai lượt (minotruyen 9,7 s → 0,5 s) là dao động của máy chủ nguồn. **Luôn đo ít
nhất 2 lượt** trước khi kết luận một nguồn chậm.

### Phần ảnh

| Nguồn | Ảnh/chương | KB/ảnh | Cả chương | Host ảnh |
|---|---|---|---|---|
| vinahentai | 46 | 906 | 40,7 MB | vnht.vinahentai.click |
| nettruyen | 50 | 757 | 36,9 MB | cdn3.cloud-zzz.com |
| mimimoe | 46 | 601 | 27,0 MB | moe-cdn.net |
| minohen | 19 | 662 | 12,3 MB | p21-ad-sg.ibyteimg.com |
| zettruyen | 102 | 111 | 11,2 MB | cdn1.zetimage.com |
| goctruyentranh | 34–188 | 54–308 | 9,8–10,2 MB | goctruyentranhvui41.com |
| truyenqq | 102–311 | 103 | 10,2 MB | i178.truyenvua.com |
| minomanga | 40 | 242 | 9,4 MB | phinf.pstatic.net |
| minotruyen | 4 | 1 889 | 7,4 MB | p21-ad-sg.ibyteimg.com |
| doctruyen3q | 102 | 67 | 6,8 MB | i0.wp.com → anhvip.xyz |
| tcomic | 29 | 204 | 5,8 MB | wasabisys.com |
| toptruyen | 34 | 153 | 5,1 MB | s12.anhvip.xyz |
| luottruyennew | 4 | 353 | 1,4 MB | s76.cc3t.net |

**9/15 nguồn trả 403 cho ảnh nếu thiếu header `Referer`** (goctruyentranh, nettruyen, truyenqq,
toptruyen, doctruyen3q, zettruyen, luottruyennew…). App tự gắn Referer từ trường `host` trong kết
quả `toc`/`detail` — **đừng bỏ hay đổi `host`**, và vẫn tuyệt đối không nối `|Referer=` vào URL ảnh.

### 1 luồng so với 4 luồng (12 ảnh mỗi lượt, hai tập ảnh rời nhau để không ăn cache)

| Nguồn | 1 luồng | 4 luồng | Nhanh gấp |
|---|---|---|---|
| doctruyen3q | 4,4 s | 0,7 s | 6,5× |
| zettruyen | 8,9 s | 1,6 s | 5,7× |
| nettruyen | 3,2 s | 0,6 s | 5,5× |
| goctruyentranh | 6,7 s | 1,3 s | 5,3× |
| truyenggvn | 2,5 s | 0,8 s | 2,9× |
| toptruyen | 4,3 s | 2,0 s | 2,2× |
| minohen | 2,3 s | 1,2 s | 1,9× |
| vinahentai | 3,7 s | 2,6 s | 1,4× |
| truyenqq | 11,9 s | 12,8 s | 0,9× |

Hai ngoại lệ cần nhớ để không hứa nhầm với người dùng:

- **Nguồn ảnh to thì tăng luồng không cứu được.** vinahentai gần 1 MB/ảnh — nghẽn băng thông,
  không phải nghẽn độ trễ.
- **Có CDN bóp băng thông theo IP.** `i178.truyenvua.com` (truyenqq) có lượt 4 luồng còn chậm hơn
  1 luồng; lượt khác 12 ảnh chỉ mất 0,8 s. Nguồn này dao động rất mạnh, đo một lần là không đủ.

### Số nền phần ảnh, đo lại 12/09/2026 sau khi gỡ cuutruyen (15 nguồn)

Cùng máy, cùng mạng, một lượt mỗi nguồn. Cột cuối là con số sau khi đã tối ưu.

| Nguồn | KB/ảnh | MB/chương | Host ảnh | Ghi chú |
|---|---|---|---|---|
| truyenqq | 489 | 20,5 | i178.truyenvua.com | CDN không nhận tham số nào |
| vinahentai | 851 | 18,3 | vnht.vinahentai.click | CDN không nhận tham số nào |
| minotruyen | 569 → **302** | 16,1 → **8,6** | ibyteimg | WebP, v32 |
| nettruyen | 72 | 11,0 | cdn4.cloud-zzz.com | ảnh vốn đã nhỏ, chương 158 trang |
| minohen | 735 → **408** | 10,8 → **6,0** | ibyteimg | WebP, v32 |
| zettruyen | 68 | 10,4 | cdn4.zetimage.com | ảnh vốn đã nhỏ |
| doctruyen3q | 158 | 9,0 | s10.anhvip.xyz | CDN tự trả WebP theo `Accept` |
| minomanga | 253 | 7,7 | phinf.pstatic.net | ảnh chương không đổi được, bìa đã WebP |
| goctruyentranh | 148 | 4,8 | gtt-bk.pro | |
| tcomic | 198 | 4,7 | wasabisys.com | |
| toptruyen | 150 | 4,6 | img.topcdnv1.art | |
| luottruyennew | 226 | 3,5 | s76.cc3t.net | |
| mimimoe | 75 | 2,1 | moe-cdn.net | |
| 2ten | 49 | 0,67 | i0.wp.com → wsrvnl | đã qua Photon `w=600&quality=65` |
| luottruyen | — | — | s34.cc3t.net | chương khoá sau đăng nhập Google |

Ảnh bìa một trang danh sách, đo 10 bìa rồi suy ra cả trang:

| Nguồn | Thẻ/trang | KB/bìa | MB/trang |
|---|---|---|---|
| mimimoe | 24 | 73 | 1,72 |
| toptruyen | 36 | 41 | 1,45 |
| doctruyen3q | 36 | 38 | 1,35 |
| luottruyen | 54 | 23 | 1,20 |
| truyenqq | 42 | 29 | 1,20 |
| 2ten | 24 | 48 | 1,12 |
| nettruyen | 36 | 29 | 1,03 |
| zettruyen | 44 | 22 | 0,95 |

Không nguồn nào vượt 1,8 MB cho một trang danh sách — **phần bìa đã hết chỗ tối ưu**.

⚠️ Độ trễ từng ảnh trên máy dev **không dùng được**: cùng một file 18 KB của truyenqq đo 3 lần
liên tiếp ra 850 ms — 14 882 ms — 1 360 ms. Chỉ tin số **dung lượng**, đừng tin số **thời gian**
của phần ảnh.

### Điều duy nhất plugin làm được cho tốc độ ảnh — và cái giá của nó

Khai `"thread": 5` và `"delay": 10` trong `metadata` của `plugin.json`. Có tác dụng thật, đã kiểm
trên máy Trum. Xem [02 mục 10](02-api-va-gioi-han.md).

⛔ **Nhưng đừng mặc định khai 5/10 cho mọi nguồn.** Ngày 12/09/2026 áp cho cả 16 nguồn và
**goctruyentranh chết ngay**: ảnh nguồn đó khi ấy bị ép về domain site nằm sau Cloudflare, 5 luồng
dồn từ IP di động CGNAT làm hỏng 100% ảnh cả chương. Phải gỡ hai khoá ở v47 mới sống lại, và QA
gate nay **cấm** khai chúng cho nguồn đó.

**Luật:** chỉ khai `thread`/`delay` khi ảnh nằm trên **CDN riêng, tách khỏi domain site**. Ảnh nằm
trên chính domain site (sau WAF) thì để app dùng mặc định. Áp cho một nguồn, để Trum đọc thử một
chương trên máy thật, rồi mới áp sang nguồn khác. Xem [mục 34](03-bay-da-tra-gia.md).

---

## 4. Giảm MB ảnh: chỉ trên CHÍNH CDN nguồn, và phải nghiệm thu bằng mắt

Luật gốc không đổi: **không thêm, không gỡ, không đổi proxy ảnh chỉ vì số đo trên máy dev** —
repo này đã gãy ảnh 3 lần vì đúng việc đó. Xem
[03 mục 1](03-bay-da-tra-gia.md#1-url-ảnh--đã-sai-2-lần) và
[03 mục 19](03-bay-da-tra-gia.md#19-cdn-ảnh-có-token-hmac--không-được-bọc-photon-proxy).

Nhưng "cùng host" thì khác hẳn "host lạ". Đo lại toàn bộ 12/09/2026:

| CDN | Nguồn | Kết quả |
|---|---|---|
| `p*.ibyteimg.com` | minohen, minotruyen, minomanga (bìa) | **✅ trả WebP, nhẹ 45-47%** |
| `s*.anhvip.xyz` | doctruyen3q, toptruyen | tự trả WebP theo header `Accept`, plugin khỏi làm gì |
| `img*.dichvucdn.com` | luottruyen | ✅ có `/cdn-cgi/image/` — bìa 9,38 → 1,09 MB/trang (v30) |
| `i178.truyenvua.com` | truyenqq | ❌ mọi tham số 404 |
| `vnht.vinahentai.click` | vinahentai | ❌ kể cả `/_next/image` |
| `img.topcdnv1.art` | toptruyen | ❌ |
| `s*.cc3t.net` | luottruyennew | ❌ không có `/cdn-cgi/image/` |
| `s3...wasabisys.com` | tcomic | ❌ S3 thuần |
| `phinf.pstatic.net` | minomanga (ảnh chương) | ❌ `?type=` trả 404 |

### Cú pháp ibyteimg — cái duy nhất còn khai thác được

`p*.ibyteimg.com` là CDN ảnh của ByteDance. Cùng một file phục vụ được qua nhánh `/img/` kèm
hậu tố `~tplv`:

```
/obj/tos-alisg-i-<sid>-sg/<hash>
-> /img/tos-alisg-i-<sid>-sg/<hash>~tplv-<sid>-image.webp
```

`<sid>` nằm ngay trong đường dẫn (`tos-alisg-i-**375lmtcpo0**-sg`) nên bóc bằng regex, đừng ghi cứng.

Đo trọn một chương 15 trang của minotruyen: **10,98 MB JPEG → 6,22 MB WebP, 0 lỗi, không cần
`Referer`**.

Hai biến thể KHÔNG dùng được:

- `~tplv-<sid>-resize:1080:0.image` — ảnh gốc chỉ rộng 720-729 px nên nó **phóng to lên** rồi nén
  lại: 857 KB thành 1 378 KB. Nặng hơn.
- `~tplv-<sid>-image.image` — vẫn JPEG, 841 KB so với 857 KB. Không đáng.

`shrink:` và `size:` trả 400.

### Chốt chặn bắt buộc trước khi áp bất kỳ biến đổi ảnh nào

1. **Cùng host** với URL site đang dùng. Khác host là quay lại đúng cái bẫy cũ.
2. **Kích thước pixel khớp tuyệt đối** từng ảnh — đọc header ảnh mà so, đừng tin content-length.
3. **So pixel một vùng giữa ảnh.** Lệch trung bình dưới ~3/255 là mức tái nén bình thường; cao hơn
   là nó đã đổi nội dung.
4. **Dựng 2 ảnh cạnh nhau rồi nhìn bằng mắt.** Bước này đã cứu một lần rồi, đừng bỏ.
5. **Thử cả khi KHÔNG gửi `Referer`** — app không phải lúc nào cũng gắn.
6. **Ngưỡng an toàn của định dạng.** WebP không mã hoá nổi cạnh quá 16383 px, mà ảnh webtoon cao
   tới 10.554 px. API cloudkk trả sẵn `width`/`height` nên `cdnWebp()` chặn ở 16000 — nguồn nào
   không biết kích thước thì đừng đổi sang WebP.

---

## 5. Phát hiện nguồn trùng

`overlap.js` chuẩn hoá tên truyện (bỏ dấu, bỏ tiền tố "truyện tranh") rồi tính phần trăm giao
nhau của trang 1 "Mới cập nhật". Kết quả 12/09/2026:

| Cặp | Trùng | Kết luận |
|---|---|---|
| nettruyen ↔ nhattruyen | **100 %** | cùng một site, đường dẫn ảnh y hệt, chỉ khác tên CDN → đã gỡ nhattruyen |
| truyenqq ↔ truyenggvn | **100 %** | cùng backend, cùng cả CDN `i178.truyenvua.com` → đã gỡ truyenggvn |
| nettruyen ↔ truyenqq | 69–81 % | hai họ khác nhau, **giữ cả hai** |
| nettruyen ↔ zettruyen | 68–83 % | chồng lấn, không trùng |
| luottruyen ↔ mọi nguồn | ≤ 9 % | danh mục độc lập |

Trùng 100 % **và** cùng cấu trúc đường dẫn ảnh mới là căn cứ để gỡ. Chồng lấn 70–80 % là bình
thường giữa các site clone NetTruyen, gỡ là mất truyện thật.
