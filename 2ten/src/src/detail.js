load("config.js");

function execute(url) {
    var res = fetchRetry(url);
    if (!res || !res.ok) return Response.error("Không tải được trang truyện");
    var doc = res.html();
    if (!doc) return Response.error("Không parse được HTML");

    // Tên
    var name = txt(selFirst(doc, ".post-title h1"));
    if (!name) name = txt(selFirst(doc, "h1"));

    // Ảnh bìa
    var img = selFirst(doc, ".summary_image img");
    var cover = img ? resolveUrl(imgSrc(img)) : "";

    // Thông tin (author / status) từ các block .post-content_item
    var author = "";
    var statusText = "";
    var ongoing = true;
    var blocks = doc.select(".post-content_item");
    for (var i = 0; i < blocks.size(); i++) {
        var b = blocks.get(i);
        var head = txt(selFirst(b, ".summary-heading"));
        var content = selFirst(b, ".summary-content");
        if (head.indexOf("Tác giả") >= 0) {
            author = txt(content);
        } else if (head.indexOf("Trạng thái") >= 0) {
            statusText = txt(content);
            if (statusText.indexOf("Hoàn") >= 0 || statusText.indexOf("hoàn") >= 0) {
                ongoing = false;
            }
        }
    }

    // Thể loại
    var genres = [];
    var gEl = doc.select(".genres-content a");
    for (var j = 0; j < gEl.size(); j++) {
        var ga = gEl.get(j);
        var gn = txt(ga);
        var gh = ga.attr("href") || "";
        if (!gn || !gh) continue;
        genres.push({ title: gn, input: resolveUrl(gh), script: "gen.js" });
    }

    // Mô tả
    var description = txt(selFirst(doc, ".summary__content"));
    if (!description) description = txt(selFirst(doc, ".description-summary"));

    // Thông tin gộp
    var detailParts = [];
    if (statusText) detailParts.push("Tình trạng: " + statusText);
    if (author && author !== "Updating" && author !== "Đang cập nhật") {
        detailParts.push("Tác giả: " + author);
    }
    var detail = detailParts.join("<br>");

    return Response.success({
        name: name,
        cover: cover,
        host: HOST,
        author: author,
        description: description,
        detail: detail,
        ongoing: ongoing,
        genres: genres
    });
}
