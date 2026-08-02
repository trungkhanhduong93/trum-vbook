load("config.js");

function execute(url) {
    var doc = fetchRetry(url);
    if (!doc) return Response.error("Không tải được chương");

    var images = [];
    var seen = {};

    // Ảnh chương nằm trong .chapter_content .page-chapter. Quét toàn bộ <img>
    // sẽ lọt avatar googleusercontent (URL không chứa chữ "avatar") và gif quảng cáo.
    // KHÔNG fallback về doc.select("img"): có chương rỗng thật (vd
    // /tuyet-the-vo-than/chuong-1136), fallback sẽ trả logo + favicon + gif
    // tracking ra làm "trang truyện" thay vì báo lỗi tử tế.
    var imgEls = doc.select(".chapter_content .page-chapter img");
    if (!imgEls || imgEls.size() === 0) imgEls = doc.select(".page-chapter img");

    for (var i = 0; i < imgEls.size(); i++) {
        var img = imgEls.get(i);

        var src = img.attr("data-src") || img.attr("src") || img.attr("data-original") || "";
        if (!src) continue;
        src = src.trim();

        if (src.indexOf("data:image") >= 0) continue;
        if (src.indexOf("logo") >= 0) continue;
        if (src.indexOf("avatar") >= 0) continue;
        if (src.indexOf("favicon") >= 0) continue;
        if (src.indexOf("user.jpg") >= 0) continue;
        if (src.indexOf("follow") >= 0) continue;

        if (src.indexOf("//") === 0) src = "https:" + src;
        else if (src.indexOf("http") !== 0) src = resolveUrl(src);

        if (seen[src]) continue;
        seen[src] = true;
        images.push(src);
    }

    if (images.length === 0) return Response.error("Không tìm thấy ảnh chương");
    return Response.success(images);
}
