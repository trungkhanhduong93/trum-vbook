load("config.js");

function execute(url) {
    try {
        if (!url) return Response.error("URL chương không hợp lệ");
        if (url.indexOf("/") === 0) url = BASE_URL + url;
        url = url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);

        var doc = fetchRetry(url);
        if (!doc) return Response.error("Không tải được chương (mạng chậm hoặc lỗi kết nối)");

        var imgEls = doc.select("div.reading-content img");
        if (!imgEls || imgEls.size() === 0) {
            return Response.error("Không tìm thấy ảnh chương");
        }

        var images = [];
        var seen = {};
        var junkRegex = /^(?:data:)|placeholder|loading|logo|\/icon|banner|avatar|button|follow|ads/i;

        for (var i = 0; i < imgEls.size(); i++) {
            var el = imgEls.get(i);
            var src = el.attr("data-src") || el.attr("data-original") || el.attr("src") || "";
            src = trimText(src);

            if (!src || junkRegex.test(src)) continue;

            var finalSrc = resolveUrl(src);
            if (!seen[finalSrc]) {
                seen[finalSrc] = true;
                images.push(finalSrc);
            }
        }

        if (images.length === 0) return Response.error("Không tìm thấy ảnh chương");
        return Response.success(images);
    } catch (e) {
        return Response.error("Lỗi khi tải chương: " + (e.message || e));
    }
}
