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

    var junkWords = ["logo", "icon", "banner", "avatar", "ads", "button", "follow", "pepe", "no_image", "placeholder", "loading"];

    var images = [];
    var seen = {};
    for (var i = 0; i < n; i++) {
        var el = imgEls.get(i);
        var src = el.attr("data-original") || el.attr("src") || el.attr("data-src") || el.attr("data-cdn") || "";
        if (!src) continue;
        src = trimText(src);
        if (!src || src.indexOf("data:") === 0) continue;

        var lower = src.toLowerCase();
        var isJunk = false;
        for (var j = 0; j < junkWords.length; j++) {
            if (lower.indexOf(junkWords[j]) !== -1) {
                isJunk = true;
                break;
            }
        }
        if (isJunk) continue;

        var finalSrc = resolveUrl(src);
        if (!finalSrc || seen[finalSrc]) continue;
        seen[finalSrc] = true;
        images.push(finalSrc);
    }

    if (images.length === 0) return Response.error("Không tìm thấy ảnh chương");
    return Response.success(images);
}
