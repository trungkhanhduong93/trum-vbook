load("config.js");

function execute(url) {
    var doc = fetchRetry(url);
    if (!doc) return Response.error("Không tải được trang chương");

    var imgs = doc.select(".tgt-reader-pages img");
    if (!imgs || imgs.size() === 0) imgs = doc.select("img.tgt-reader-page");
    if (!imgs || imgs.size() === 0) imgs = doc.select(".tgt-reader-page img");

    var images = [];
    var seen = {};
    for (var i = 0; i < imgs.size(); i++) {
        var img = imgs.get(i);
        var src = img.attr("src") || img.attr("data-src") || img.attr("data-original") || "";
        if (!src) continue;
        src = src.trim();
        if (src.indexOf("data:image") >= 0) continue;
        if (src.indexOf("logo") >= 0) continue;
        if (src.indexOf("//") === 0) src = "https:" + src;
        else if (src.indexOf("http") !== 0) src = resolveUrl(src);
        if (seen[src]) continue;
        seen[src] = true;
        images.push(src); // URL trần (img1.thegioitruyen.vn / otruyencdn) — không cần referer
    }

    if (images.length === 0) return Response.error("Không tìm thấy ảnh chương");
    return Response.success(images);
}
