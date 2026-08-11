load("config.js");

// ─── Ảnh chương: GIỮ NGUYÊN URL proxy của site ──────────────────────────────
// Site bọc mọi ảnh qua https://dex.cdn-07077.workers.dev/?url={URL đã encode}.
//
// v3 đã bóc lớp proxy đó ra để trả thẳng URL cmdxd98sb0x3yprd.mangadex.network:
// đo trên máy dev (wifi nhà) thì trực tiếp nhanh hơn worker 1,9-4,4 lần. Nhưng
// trên điện thoại thật thì ẢNH KHÔNG TẢI ĐƯỢC — mạng di động VN chặn
// mangadex.network, trong khi worker nằm trên Cloudflare nên luôn vào được.
// Đó chính là lý do site bọc proxy ngay từ đầu.
//
// => Không bóc proxy nữa. Số đo tốc độ từ máy dev không đại diện cho đường mạng
// của người dùng; chạy được quan trọng hơn nhanh hơn.
// Luật cứng: chỉ trả URL trần, KHÔNG nối "|Referer=" vào URL ảnh.

function execute(url) {
    var doc = fetchDoc(url);
    if (!doc) return Response.error("Không tải được chương");

    var images = [];
    var seen = {};

    // Trang chương dựng 2 trình đọc (#classic-reader và #zen-reader) với cùng
    // bộ ảnh — bám #classic-reader để không lấy trùng gấp đôi.
    var imgs = doc.select("#classic-reader img[data-src]");
    if (!imgs || imgs.size() === 0) imgs = doc.select("img.lazy-load[data-src]");

    for (var i = 0; i < imgs.size(); i++) {
        var src = String(imgs.get(i).attr("data-src") || "").trim();
        if (!src || src.indexOf("data:image") === 0) continue;

        src = absUrl(src);
        if (seen[src]) continue;
        seen[src] = true;
        images.push(src);
    }

    if (images.length === 0) return Response.error("Chương này chưa có ảnh trên Cứu Truyện");
    return Response.success(images);
}
