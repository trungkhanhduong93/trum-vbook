load("config.js");

function execute(url) {
    if (url.indexOf("/") === 0) url = BASE_URL + url;
    var doc = fetchRetry(url);
    if (!doc) return Response.error("Không tải được chương truyện");

    var images = [];
    var seen = {};

    // Selector chính: .page-chapter img (đúng cấu trúc truyenggvn)
    var imgEls = doc.select(".page-chapter img");

    // Fallback: .chapter_content img
    if (imgEls.size() === 0) {
        imgEls = doc.select(".chapter_content img");
    }

    for (var i = 0; i < imgEls.size(); i++) {
        var el = imgEls.get(i);
        var src = el.attr("data-original") || el.attr("src") || el.attr("data-src") || el.attr("data-cdn") || "";
        src = trimText(src);

        if (!src || src.indexOf("data:") === 0) continue;

        // Loại bỏ logo, banner quảng cáo
        if (src.indexOf("logo") !== -1 || src.indexOf("icon") !== -1 || src.indexOf("banner") !== -1 || src.indexOf("no_image") !== -1) {
            continue;
        }

        var finalSrc = resolveUrl(src);
        if (seen[finalSrc]) continue;
        seen[finalSrc] = true;
        images.push(finalSrc);
    }

    if (images.length === 0) return Response.error("Không tìm thấy ảnh chương");
    return Response.success(images);
}
