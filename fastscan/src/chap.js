load("config.js");

// ─── Nén ảnh qua wsrv.nl ────────────────────────────────────────────────────
// Ảnh gốc nằm trên Backblaze B2 sau Cloudflare, không có bản webp/avif, không
// content-negotiation, không host dự phòng. Đo được: thu về 720px + JPEG q65
// còn ~55% dung lượng, mắt thường trên điện thoại không phân biệt được.
// Trên 4G yếu (~240KB/s) nhanh hơn ~36%, mạng nghẽn (~90KB/s) nhanh hơn ~60%.
// Trên wifi mạnh thì hoà (TTFB của proxy ăn đúng phần tiết kiệm) — không hại.
var IMG_PROXY = "https://wsrv.nl/?url=";
var IMG_OPTS = "&w=720&output=jpg&q=65";

function stripScheme(u) {
    return String(u).replace(/^https?:\/\//, "");
}

function proxyUrl(u) {
    return IMG_PROXY + stripScheme(u) + IMG_OPTS;
}

// wsrv.nl từng bị CDN khác ban IP (xem memory vbook-avif-photon). Nếu nó chết mà
// vẫn trả URL proxy thì GÃY ẢNH TOÀN BỘ — nên ping thử một ảnh 16px (≈414B) trước.
// Chết hoặc lỗi -> trả URL trần, chậm hơn nhưng luôn xem được.
function proxyAlive(sampleUrl) {
    try {
        var res = fetch(IMG_PROXY + stripScheme(sampleUrl) + "&w=16&output=jpg&q=20", {
            headers: { "User-Agent": FETCH_HEADERS["User-Agent"] }
        });
        return !!(res && res.ok);
    } catch (e) {
        return false;
    }
}

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

    if (proxyAlive(images[0])) {
        for (var j = 0; j < images.length; j++) {
            images[j] = proxyUrl(images[j]);
        }
    }

    return Response.success(images);
}
