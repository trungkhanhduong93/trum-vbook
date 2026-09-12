# CuuTruyen DRM Descrambler Worker

Worker trung gian giải mã ảnh DRM v4 của Cứu Truyện (`cuutruyen.net`), giúp các ứng dụng đọc truyện như **vBook** có thể tải và xem ảnh trực tiếp mà không bị lỗi giao diện (`error_load_image`).

## 1. Cách thức hoạt động
1. Web `cuutruyen.net` lưu ảnh trên CDN bị cắt thành dải ngang và xáo trộn vị trí (`scrambled-xxx.jpg`).
2. Kèm theo mỗi trang là chuỗi `drm_data` (Base64 XOR với khóa `3141592653589793`) chứa layout giải mã `#v4|dy-h|...`.
3. Worker nhận request HTTP:
   `GET /?url=<scrambled_url>&drm=<drm_data>`
4. Worker tải ảnh từ CDN gốc (`storage-bravo.cuutruyen.net`), giải mã và hoán vị lại các dải pixel, sau đó trả về ảnh JPEG hoàn chỉnh kèm `Cache-Control` dài hạn trên Edge CDN.
5. vBook nạp URL này qua `CoilZoomAsyncImage`, hỗ trợ đọc mượt mà, zoom đa điểm và tải offline.

## 2. Cách triển khai lên Cloudflare Workers (Miễn phí 100.000 req/ngày)
```bash
cd tools/cuutruyen-worker
npm install
npx wrangler deploy
```
Sau khi deploy xong, Cloudflare sẽ cấp một URL dạng:
`https://cuutruyen-descrambler.<tên-subdomain>.workers.dev`

Điền URL này vào biến `DESCRAMBLER_WORKER` trong `cuutruyen/src/config.js`.

## 3. Chạy Server cục bộ hoặc deploy Docker / Render
```bash
node server.js
```
Server sẽ lắng nghe tại cổng `3000` (hoặc biến môi trường `PORT`).
