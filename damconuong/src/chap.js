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

    var imgs = doc.select("div.reading-content img, div.page-break img, .entry-content img");
    var images = [];
    var seen = {};
    for (var i = 0; i < imgs.size(); i++) {
        var src = imgSrc(imgs.get(i));
        if (!src) continue;

        if (src.indexOf("data:image") >= 0) continue;
        if (src.indexOf("/wp-content/") >= 0) continue;
        if (src.toLowerCase().indexOf("logo") >= 0) continue;

        if (src.indexOf("//") === 0) src = "https:" + src;

        if (seen[src]) continue;
        seen[src] = true;
        images.push(src);
    }

    if (images.length === 0) return Response.error("Không tìm thấy ảnh chương");
    return Response.success(images);
}
