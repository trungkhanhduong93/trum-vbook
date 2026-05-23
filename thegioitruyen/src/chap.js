load("config.js");

function execute(url) {
    var doc = fetchRetry(url);
    if (!doc) return Response.error("Không tải được chương");

    var images = [];
    var seen = {};

    var imgEls = doc.select("div.tgt-reader-pages img.tgt-reader-page");
    if (!imgEls || imgEls.size() === 0) {
        imgEls = doc.select("div.tgt-reader-pages img");
    }
    if (!imgEls || imgEls.size() === 0) {
        imgEls = doc.select("img.tgt-reader-page");
    }

    for (var i = 0; i < imgEls.size(); i++) {
        var img = imgEls.get(i);
        var src = img.attr("src") || img.attr("data-src") || img.attr("data-original") || "";
        if (!src) continue;
        src = src.trim();

        if (src.indexOf("data:image") >= 0) continue;
        if (src.indexOf("logo") >= 0) continue;
        if (src.indexOf("icon") >= 0) continue;
        if (src.indexOf("avatar") >= 0) continue;

        if (src.indexOf("//") === 0) {
            src = "https:" + src;
        } else if (src.indexOf("http") !== 0) {
            src = resolveUrl(src);
        }

        if (seen[src]) continue;
        seen[src] = true;
        images.push(src + "|Referer=" + BASE_URL + "/");
    }

    if (images.length === 0) {
        return Response.error("Không tìm thấy ảnh chương");
    }

    return Response.success(images);
}
