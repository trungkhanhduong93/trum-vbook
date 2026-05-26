load("config.js");

function execute(url) {
    if (url.charAt(0) === "/") url = BASE_URL + url;
    var doc = fetchRetry(url);
    if (!doc) return Response.error("Không tải được chương truyện");

    var imgEls = doc.select(".page-chapter img");
    var n = imgEls.size();
    if (n === 0) {
        imgEls = doc.select(".chapter_content img");
        n = imgEls.size();
    }

    var images = [];
    var seen = {};
    for (var i = 0; i < n; i++) {
        var el = imgEls.get(i);
        var src = el.attr("data-original") || el.attr("src") || el.attr("data-src") || el.attr("data-cdn") || "";
        if (!src) continue;
        src = trimText(src);
        if (!src || src.indexOf("data:") === 0) continue;
        if (src.indexOf("logo") !== -1 || src.indexOf("icon") !== -1 || src.indexOf("banner") !== -1 || src.indexOf("no_image") !== -1) continue;

        var finalSrc = resolveUrl(src);
        if (seen[finalSrc]) continue;
        seen[finalSrc] = true;
        images.push(finalSrc);
    }

    if (images.length === 0) return Response.error("Không tìm thấy ảnh chương");
    return Response.success(images);
}
