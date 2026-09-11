load("config.js");

function execute(url) {
    var fullUrl = resolveUrl(url);
    var res = fetchRetry(fullUrl);
    if (!res || !res.ok) return Response.error("Không tải được trang truyện");
    var doc = res.html();
    if (!doc) return Response.error("Không parse được HTML");

    // Title
    var name = txt(selFirst(doc, ".post-title h1"));
    if (!name) name = txt(selFirst(doc, "h1"));

    // Cover
    var img = selFirst(doc, ".summary_image img");
    if (!img) img = selFirst(doc, ".author-avatar img");
    if (!img) img = selFirst(doc, ".img-item img");
    var cover = img ? resolveUrl(imgSrc(img)) : "";

    // Metadata items from .post-content_item
    var author = "";
    var otherName = "";
    var translator = "";
    var views = "";
    var updatedAt = "";
    var ongoing = true;

    var items = doc.select(".post-content_item");
    for (var i = 0; i < items.size(); i++) {
        var it = items.get(i);
        var heading = txt(selFirst(it, ".summary-heading"));
        var content = txt(selFirst(it, ".summary-content"));
        if (!content) {
            var fullTxt = txt(it);
            if (fullTxt.indexOf("Tác giả") >= 0) author = fullTxt.replace("Tác giả", "").trim();
            else if (fullTxt.indexOf("Tên khác") >= 0) otherName = fullTxt.replace("Tên khác", "").trim();
            else if (fullTxt.indexOf("Nhóm dịch") >= 0) translator = fullTxt.replace("Nhóm dịch", "").trim();
            else if (fullTxt.indexOf("View") >= 0) views = fullTxt.replace("View", "").trim();
            else if (fullTxt.indexOf("Cập nhật") >= 0) updatedAt = fullTxt.replace("Cập nhật", "").trim();
        } else {
            if (heading.indexOf("Tác giả") >= 0) author = content;
            else if (heading.indexOf("Tên khác") >= 0) otherName = content;
            else if (heading.indexOf("Nhóm dịch") >= 0) translator = content;
            else if (heading.indexOf("View") >= 0) views = content;
            else if (heading.indexOf("Cập nhật") >= 0) updatedAt = content;
        }
    }

    if (fullUrl.indexOf("/completed") >= 0) {
        ongoing = false;
    }

    // Genres
    var genres = [];
    var gEls = doc.select(".genres-content a, a[href*='/genre/']");
    var addedG = {};
    for (var j = 0; j < gEls.size(); j++) {
        var ga = gEls.get(j);
        var gn = txt(ga);
        var gh = ga.attr("href") || "";
        if (!gn || !gh || gh.indexOf("/genre/") < 0) continue;
        if (!addedG[gn]) {
            addedG[gn] = true;
            genres.push({ title: gn, input: resolveUrl(gh), script: "gen.js" });
        }
    }

    // Description
    var description = txt(selFirst(doc, ".summary__content"));
    if (!description) description = txt(selFirst(doc, ".description-summary"));

    // Detail string
    var detailParts = [];
    if (author) detailParts.push("Tác giả: " + author);
    if (translator) detailParts.push("Nhóm dịch: " + translator);
    if (otherName) detailParts.push("Tên khác: " + otherName);
    if (views) detailParts.push("Lượt xem: " + views);
    if (updatedAt) detailParts.push("Cập nhật: " + updatedAt);
    var detail = detailParts.join("<br>");

    return Response.success({
        name: name,
        cover: cover,
        host: HOST,
        author: author || "Đang cập nhật",
        description: description,
        detail: detail,
        ongoing: ongoing,
        genres: genres
    });
}
