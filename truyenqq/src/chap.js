load("config.js");

function execute(url) {
    var doc = fetchRetry(url);
    if (!doc) return Response.error("Không tải được chương");

    var images = [];
    var seen = {};

    var imgEls = doc.select("div.page-chapter img");
    if (!imgEls || imgEls.size() === 0) {
        imgEls = doc.select(".chapter_content div.page-chapter img");
    }
    if (!imgEls || imgEls.size() === 0) {
        imgEls = doc.select(".chapter_content img");
    }

    var junkWords = ["logo", "avatar", "icon", "banner", "button", "ads", "pepe", "follow", "facebook", "thumb", "placeholder", "loading"];

    for (var i = 0; i < imgEls.size(); i++) {
        var img = imgEls.get(i);

        var src = img.attr("data-original") || img.attr("data-src") || img.attr("data-cdn") || img.attr("src") || "";
        if (!src) continue;
        src = src.trim();

        if (src.indexOf("data:image") >= 0) continue;

        var lower = src.toLowerCase();
        var isJunk = false;
        for (var j = 0; j < junkWords.length; j++) {
            if (lower.indexOf(junkWords[j]) >= 0) {
                isJunk = true;
                break;
            }
        }
        if (isJunk) continue;

        var finalUrl = resolveUrl(src);
        if (!finalUrl || seen[finalUrl]) continue;
        seen[finalUrl] = true;
        images.push(finalUrl);
    }

    if (images.length === 0) return Response.error("Không tìm thấy ảnh chương");
    return Response.success(images);
}
