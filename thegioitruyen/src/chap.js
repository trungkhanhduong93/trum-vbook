load("config.js");

function execute(url) {
    var res = fetch(url, {
        headers: {
            "User-Agent": FETCH_HEADERS["User-Agent"],
            "Referer": BASE_URL + "/",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.5"
        }
    });

    if (!res || !res.ok) {
        return Response.error("Không tải được trang chương: " + (res ? res.status : "null"));
    }

    var doc = res.html();
    if (!doc) return Response.error("Không parse được HTML");

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
        images.push(src);
    }

    if (images.length === 0) {
        return Response.error("Không tìm thấy ảnh chương");
    }

    return Response.success(images);
}
