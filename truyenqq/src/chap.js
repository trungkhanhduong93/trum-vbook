load("config.js");

function execute(url) {
    var res = fetchRetry(url);
    if (!res || !res.ok) return Response.error("Không tải được chương: " + (res ? res.status : "null"));

    var doc = res.html();
    if (!doc) return Response.error("Không parse được HTML");

    var images = [];
    var seen = {};

    var imgEls = doc.select("div.page-chapter img");
    if (!imgEls || imgEls.size() === 0) {
        imgEls = doc.select(".chapter_content img");
    }
    if (!imgEls || imgEls.size() === 0) {
        imgEls = doc.select("img.lazy");
    }

    for (var i = 0; i < imgEls.size(); i++) {
        var img = imgEls.get(i);

        var src = img.attr("data-original") || img.attr("data-src") || img.attr("src") || "";
        if (!src) src = img.attr("data-cdn") || "";
        if (!src) continue;
        src = src.trim();

        if (src.indexOf("data:image") >= 0) continue;
        if (src.indexOf("logo") >= 0) continue;
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

    if (images.length === 0) return Response.error("Không tìm thấy ảnh chương");
    return Response.success(images);
}
