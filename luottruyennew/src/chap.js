load("config.js");

function execute(url) {
    url = url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);
    if (url.indexOf("/") === 0) url = BASE_URL + url;

    var doc = fetchRetry(url);
    if (!doc) return Response.error("Không tải được chương");

    var imgEls = doc.select("div.reading-content img");
    var images = [];
    var seen = {};

    for (var i = 0; i < imgEls.size(); i++) {
        var el = imgEls.get(i);
        var src = el.attr("data-src") || el.attr("src") || el.attr("data-original") || "";
        src = trimText(src);

        if (!src) continue;
        if (src.indexOf("data:") === 0) continue;
        if (src.indexOf("placeholder") >= 0) continue;
        if (src.indexOf("loading") >= 0) continue;
        if (src.indexOf("logo") >= 0) continue;
        if (src.indexOf("/icon") >= 0) continue;

        var finalSrc = resolveUrl(src);
        if (seen[finalSrc]) continue;
        seen[finalSrc] = true;
        images.push(finalSrc);
    }

    if (images.length === 0) return Response.error("Không tìm thấy ảnh chương");
    return Response.success(images);
}
