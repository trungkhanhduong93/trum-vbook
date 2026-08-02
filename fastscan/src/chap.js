load("config.js");

// ─── KHÔNG proxy ảnh. Trả URL trần. ─────────────────────────────────────────
// v7-v9 từng đẩy ảnh qua wsrv.nl để nén. Đã đo lại tử tế (4 chương 49/48/81/89
// ảnh, mỗi nhánh 7 ảnh thuộc dải chỉ số riêng, đảo thứ tự giữa các vòng):
//
//   wifi không bóp : URL trần 20,1s  vs  proxy 24,7s  -> TRẦN nhanh hơn 23%
//   4G yếu 240KB/s : URL trần 34,8s  vs  proxy 31,6s  -> proxy nhanh hơn 9%
//
// Đổi 9% trên 4G yếu không đáng: mất 23% trên wifi, ảnh phải nén lại lần hai,
// và ôm thêm một điểm chết đơn lẻ (wsrv sập hoặc bị CDN ảnh chặn IP là gãy
// toàn bộ ảnh). Lợi thế của proxy vốn lớn hơn ở v8, nhưng bản sửa mờ v9 phải
// giữ nguyên độ phân giải nên dung lượng lên 66% — ăn gần hết phần lợi đó.
//
// Đã thử và loại hết các đường khác: bản .webp/.avif ở origin (404) ·
// content-negotiation (không có) · Photon i0.wp.com (400) · host ảnh dự phòng
// (không có). Phần chờ còn lại là TTFB 1,5-2,5s/ảnh của Backblaze B2 sau
// Cloudflare lúc edge chưa nóng — nằm ngoài tầm plugin.
//
// Nhắc lại luật cứng: chỉ trả URL trần, KHÔNG nối "|Referer=" vào URL ảnh.

function execute(url) {
    var doc = fetchRetry(url);
    if (!doc) return Response.error("Không tải được chương");

    var images = [];
    var seen = {};

    // Ảnh chương nằm trong .chapter_content .page-chapter. Quét toàn bộ <img>
    // sẽ lọt avatar googleusercontent (URL không chứa chữ "avatar") và gif quảng cáo.
    // KHÔNG fallback về doc.select("img"): có chương rỗng thật (vd
    // /tuyet-the-vo-than/chuong-1136), fallback sẽ trả logo + favicon + gif
    // tracking ra làm "trang truyện" thay vì báo lỗi tử tế.
    var imgEls = doc.select(".chapter_content .page-chapter img");
    if (!imgEls || imgEls.size() === 0) imgEls = doc.select(".page-chapter img");

    for (var i = 0; i < imgEls.size(); i++) {
        var img = imgEls.get(i);

        var src = img.attr("data-src") || img.attr("src") || img.attr("data-original") || "";
        if (!src) continue;
        src = src.trim();

        if (src.indexOf("data:image") >= 0) continue;
        if (src.indexOf("logo") >= 0) continue;
        if (src.indexOf("avatar") >= 0) continue;
        if (src.indexOf("favicon") >= 0) continue;
        if (src.indexOf("user.jpg") >= 0) continue;
        if (src.indexOf("follow") >= 0) continue;

        if (src.indexOf("//") === 0) src = "https:" + src;
        else if (src.indexOf("http") !== 0) src = resolveUrl(src);

        if (seen[src]) continue;
        seen[src] = true;
        images.push(src);
    }

    if (images.length === 0) return Response.error("Không tìm thấy ảnh chương");
    return Response.success(images);
}
