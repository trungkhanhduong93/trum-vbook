load("config.js");

// ─── Ảnh chương: bỏ proxy worker, trả thẳng URL CDN gốc ─────────────────────
// Site bọc mọi ảnh qua https://dex.cdn-07077.workers.dev/?url={URL đã encode}.
// Đo tại VN, hai vòng cold-vs-cold trên hai nhóm ảnh rời nhau (đảo thứ tự giữa
// hai vòng để loại ảnh hưởng của cache):
//     vòng 1: 6 ảnh qua worker 2636ms  |  6 ảnh trực tiếp  603ms
//     vòng 2: 6 ảnh trực tiếp  459ms   |  6 ảnh qua worker 857ms
// Trực tiếp nhanh hơn 1,9-4,4 lần và bỏ được một điểm chết (worker sập/hết quota
// là mất sạch ảnh). Chỉ bỏ proxy khi đích là CDN MangaDex — đã kiểm hotlink
// không cần Referer; host lạ thì giữ nguyên URL worker cho chắc.
//
// Luật cứng: chỉ trả URL trần, KHÔNG nối "|Referer=" vào URL ảnh.
function unwrapProxy(src) {
    var i = src.indexOf("?url=");
    if (i < 0) return src;

    var target = "";
    try { target = decodeURIComponent(src.substring(i + 5)); } catch (e) { return src; }
    if (!target || target.indexOf("http") !== 0) return src;
    if (target.indexOf("mangadex.network") < 0) return src;

    return target;
}

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

        src = unwrapProxy(absUrl(src));
        if (seen[src]) continue;
        seen[src] = true;
        images.push(src);
    }

    if (images.length === 0) return Response.error("Chương này chưa có ảnh trên Cứu Truyện");
    return Response.success(images);
}
