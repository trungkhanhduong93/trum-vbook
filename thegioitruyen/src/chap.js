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
        images.push(toPhoton(src, images.length));
    }

    if (images.length === 0) return Response.error("Không tìm thấy ảnh chương");
    return Response.success(images);
}

// Ảnh gốc img1.thegioitruyen.vn nặng (~216KB/trang). Route qua Photon (i*.wp.com)
// để nén còn ~120KB (giảm ~43% data, ảnh vẫn JPEG mọi máy đọc được), xoay i0/i1/i2
// cho tải song song. Photon là proxy ảnh công khai của Automattic (như 2ten dùng).
function toPhoton(url, idx) {
    var bare = url.replace(/^https?:\/\//i, "");
    var host = "i" + (idx % 3) + ".wp.com/";
    return "https://" + host + bare + "?w=800&quality=80";
}
