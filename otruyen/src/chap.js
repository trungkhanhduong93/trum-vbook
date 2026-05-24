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
        return Response.error("Khong tai duoc trang chuong: " + (res ? res.status : "null"));
    }

    var doc = res.html();
    if (!doc) return Response.error("Khong parse duoc HTML");

    var images = [];
    var seen = {};
    var imgEls = doc.select("div.imgs img");
    if (!imgEls || imgEls.size() === 0) {
        imgEls = doc.select("img[src*='/uploads/']");
    }

    for (var i = 0; i < imgEls.size(); i++) {
        var img = imgEls.get(i);
        var src = img.attr("src") || img.attr("data-src") || "";
        src = trimText(src);
        if (!src) continue;

        var finalSrc = resolveUrl(src);
        if (seen[finalSrc]) continue;
        seen[finalSrc] = true;
        images.push(finalSrc);
    }

    if (images.length === 0) {
        return Response.error("Khong tim thay anh chuong");
    }

    return Response.success(images);
}
