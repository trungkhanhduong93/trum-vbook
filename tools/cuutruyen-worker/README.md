# Máy chủ giải xáo trộn ảnh Cứu Truyện

Ảnh chương của `cuutruyen.net` bị cắt thành dải ngang rồi đảo thứ tự. Web tự ghép lại bằng canvas trong trình duyệt. vBook không làm được như vậy, nên phải có một máy chủ đứng giữa: tải ảnh gốc, hoán vị dải, trả về ảnh JPEG hoàn chỉnh cho app.

Dựng xong thì dán tên miền vào biến `DESCRAMBLER` trong `cuutruyen/src/config.js`, đóng lại `plugin.zip`, bump version.

---

## 1. Vì sao bắt buộc phải có máy chủ

vBook đọc ảnh chương bằng Coil ZoomImage, **chỉ nhận URL http/https**. Bốn phiên bản v14–v17 đã thử đưa ảnh tự dựng vào trình đọc theo cả ba kiểu (`data:image/png;base64,…`, `base64:…`, chuỗi base64 trần) — app đều báo "Không thể tải hình ảnh". Khâu ghép bằng `Graphics` của vBook chạy đúng, nhưng không có cửa nào giao byte ảnh cho trình đọc.

Xem thêm: `docs/02-api-va-gioi-han.md`.

## 2. ⛔ Cloudflare Workers gói miễn phí KHÔNG chạy được

Đã deploy thật và đo ngày 12/09/2026:

| Cách chạy | Kết quả |
|---|---|
| 5 luồng song song, 12 ảnh mới | 8 ảnh qua, 4 ảnh trả `error code: 1102` |
| **1 luồng tuần tự**, 10 ảnh mới | **3 ảnh qua, 7 ảnh trả `error code: 1102`** |

`1102` là "Worker exceeded CPU time limit". Giải nén rồi nén lại một ảnh 2048×1470 tốn 1,5–3 giây CPU; hạn mức gói free tính bằng chục mili giây. Giảm luồng không cứu được vì đây là hạn mức mỗi lần gọi, không phải hạn mức đồng thời. Đổi sang WebAssembly cũng không cứu được: WASM nhanh hơn vài lần chứ không nhanh hơn trăm lần.

Đúng triệu chứng "tải được 1–2 ảnh đầu rồi đứt".

`worker.js` vẫn để lại trong thư mục này, nhưng **chỉ dùng được khi nâng Cloudflare Workers lên gói trả phí** (5 USD/tháng, hạn mức CPU 30 giây).

## 3. ✅ Cách khuyến nghị: Vercel, miễn phí

Vercel gói Hobby cho hàm chạy tối đa 30 giây và 100 GB băng thông mỗi tháng. Một ảnh mất khoảng 300 ms. Đọc khoảng 6.000 chương/tháng mới hết hạn mức.

**Các bước:**

1. Vào <https://vercel.com>, đăng nhập bằng GitHub.
2. **Add New… → Project → Import** kho `trungkhanhduong93/trum-vbook`.
3. Ở màn hình cấu hình, mở **Root Directory** và chọn `tools/cuutruyen-worker`.
4. Bấm **Deploy**, chờ khoảng 1 phút.
5. Vercel cấp một tên miền dạng `https://trum-vbook-xxxx.vercel.app`. Mở thẳng tên miền đó trên trình duyệt, thấy dòng chữ `CuuTruyen descrambler dang chay.` là xong.
6. Dán tên miền đó vào `DESCRAMBLER` trong `cuutruyen/src/config.js` (**không có dấu `/` ở cuối**).

Vùng máy chủ đã đặt sẵn `sin1` (Singapore) trong `vercel.json` — gần Việt Nam nhất trong các vùng Vercel cho gói Hobby.

## 4. Cách khác: máy chủ Node thường

Dùng khi có VPS, hoặc deploy lên Render / Fly / Railway / Docker.

```bash
cd tools/cuutruyen-worker
npm install
node server.js
```

Nghe cổng `3000`, hoặc cổng trong biến môi trường `PORT`. Có sẵn `/health`.

Lưu ý: Render gói miễn phí ngủ sau 15 phút không ai gọi, lần đọc đầu tiên phải chờ khoảng 50 giây. Chấp nhận được thì dùng, không thì chọn Vercel.

## 5. Cách gọi

```
GET /?p=<đường-dẫn-ảnh>&d=<drm_data>[&q=85][&w=0]
```

| Tham số | Ý nghĩa |
|---|---|
| `p` | Đường dẫn ảnh, bắt đầu bằng `/file/cuutruyen/…`. Máy chủ tự ghép với gương còn sống. |
| `d` | Chuỗi `drm_data` lấy nguyên từ API, đã bỏ xuống dòng. Thiếu `d` thì trả nguyên ảnh gốc. |
| `q` | Chất lượng JPEG, 40–95, mặc định 85. |
| `w` | Thu nhỏ về tối đa bấy nhiêu pixel chiều ngang. 0 hoặc bỏ trống thì giữ nguyên. |

Cũng nhận `url=<URL đầy đủ>` và `drm=` như bản cũ, nhưng chỉ với các host trong danh sách cho phép.

Ảnh trả về kèm `Cache-Control: public, max-age=31536000, immutable`. Ảnh đã giải không bao giờ đổi, nên lần đọc lại cùng một chương lấy thẳng từ CDN, không gọi tới hàm nữa.

## 6. Cấu trúc

| Tệp | Vai trò |
|---|---|
| `descramble.js` | Lõi dùng chung: giải chuỗi DRM, tải ảnh gốc theo gương, hoán vị dải, nén lại. |
| `api/index.js` | Vỏ cho Vercel. |
| `server.js` | Vỏ cho máy chủ Node thường. |
| `worker.js` | Vỏ cho Cloudflare Workers — **chỉ gói trả phí**. |

Lõi dùng `sharp` (libvips, mã máy) nếu cài được, không thì tự rơi về `jpeg-js` thuần JS. `sharp` nhanh hơn khoảng 5 lần.

## 7. Chi tiết thuật toán

1. `drm_data` là base64. Giải base64 rồi XOR từng byte với khoá cố định `3141592653589793`.
2. Kết quả có dạng `#v4|300-150|1050-150|750-150|…`.
3. Dải thứ *i* **đếm từ trên xuống của ảnh tải về** đặt vào toạ độ `y = dy_i` của ảnh đúng. Chiều ngược lại ra ảnh vỡ khung — đã dựng thử cả hai chiều bằng PIL rồi nhìn tận mắt, đừng đoán.
4. Dải cao 150 px, dải cuối lẻ (95 hoặc 120 px). 150 không chia hết cho 8 hay 16 nên **không thể** hoán vị ở mức khối JPEG để khỏi giải nén; bắt buộc giải nén ra pixel thô.

---

## 8. Trạng thái: nguồn cuutruyen đã gỡ khỏi repo (12/09/2026)

Trum chọn gỡ nguồn thay vì dựng máy chủ. Thư mục này giữ lại vì hai lý do:

1. Nó là bản mẫu chạy được cho **mọi nguồn xáo trộn ảnh** sau này, không riêng Cứu Truyện.
   `descramble.js` tách riêng phần giải DRM nên chỉ cần thay hàm đó là dùng cho site khác.
2. Nó là bằng chứng đo được cho hai bẫy đã ghi trong `docs/03-bay-da-tra-gia.md` mục 32 và 33.

Muốn bật lại nguồn: `git show fcfb6f9:cuutruyen` có toàn bộ mã ở v23.
