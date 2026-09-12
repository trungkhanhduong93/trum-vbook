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

### Điều duy nhất plugin làm được cho tốc độ ảnh

Khai `"thread": 5` và `"delay": 10` trong `metadata` của `plugin.json`. Đã kiểm trên máy thật ở
tcomic v6 rồi áp cho cả 16 nguồn. Xem [02 mục 10](02-api-va-gioi-han.md). Ngoài khoá này ra,
plugin không điều khiển được gì thêm ở phần ảnh.

---

## 4. Đừng đụng URL ảnh để "giảm MB"

Đã thử tham số resize trên **chính CDN của nguồn** — `moe-cdn.net`, `p21-ad-sg.ibyteimg.com`,
`phinf.pstatic.net`, `vnht.vinahentai.click` — với `?w=600`, `?width=600`, `?type=w600`,
`~tplv-*`, `?x-tos-process=image/resize,w_600`. **Không cái nào đổi kích thước**, đều trả file
gốc hoặc 404.

Nghĩa là muốn nhẹ hơn thì buộc phải kéo host lạ vào, và đó đúng là chỗ repo này đã gãy ảnh 3 lần.
Luật giữ nguyên: **không thêm, không gỡ, không đổi proxy ảnh chỉ vì số đo trên máy dev**. Xem
[03 mục 1](03-bay-da-tra-gia.md#1-url-ảnh--đã-sai-2-lần) và
[03 mục 19](03-bay-da-tra-gia.md#19-cdn-ảnh-có-token-hmac--không-được-bọc-photon-proxy).

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
