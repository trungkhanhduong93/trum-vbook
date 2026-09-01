load("config.js");

function execute(url) {
    var doc = fetchRetry(url);
    if (!doc) return Response.error("Không tải được thông tin truyện");

    // Title
    var titleEl = selFirst(doc, "h1.title-manga, h1.title-detail, h1.title, h1");
    var name = titleEl ? titleEl.text().trim() : "";

    // Cover
    var cover = "";
    var coverEl = selFirst(doc, ".image-info img, img.image-comic, .col-image img, .book_avatar img");
    if (coverEl) {
        cover = coverEl.attr("data-original") || coverEl.attr("data-src") || coverEl.attr("src") || "";
        if (cover) cover = resolveUrl(cover);
    }

    // Metadata
    var author = "";
    var statusText = "";
    var views = "";
    var likes = "";

    var rows = doc.select("ul.info-detail-comic li, .list-info li, ul.list-info li");
    for (var i = 0; i < rows.size(); i++) {
        var row = rows.get(i);
        var txt = row.text().trim();
        var lower = txt.toLowerCase();

        if (lower.indexOf("tác giả") >= 0) {
            var valEl = selFirst(row, ".detail-info, .col-sm-8, .col-xs-8, p");
            author = valEl ? valEl.text().trim() : "";
        } else if (lower.indexOf("tình trạng") >= 0) {
            var valEl = selFirst(row, ".detail-info, .col-sm-8, .col-xs-8, span, p");
            statusText = valEl ? valEl.text().trim() : "";
        } else if (lower.indexOf("lượt xem") >= 0) {
            var valEl = selFirst(row, ".detail-info, .col-sm-8, .col-xs-8, p");
            views = valEl ? valEl.text().trim() : "";
        } else if (lower.indexOf("yêu thích") >= 0 || lower.indexOf("thích") >= 0) {
            var valEl = selFirst(row, ".detail-info, .col-sm-8, .col-xs-8, p");
            likes = valEl ? valEl.text().trim() : "";
        }
    }

    var ongoing = true;
    if (statusText && (statusText.indexOf("Hoàn") >= 0 || statusText.indexOf("Full") >= 0 || statusText.indexOf("Đã hoàn") >= 0)) {
        ongoing = false;
    }

    // Genres
    var genres = [];
    var gLinks = doc.select("li.category a, a[href*='/tim-truyen/']");
    var gSeen = {};
    for (var g = 0; g < gLinks.size(); g++) {
        var gl = gLinks.get(g);
        var gn = gl.text().trim();
        var gh = gl.attr("href") || "";
        if (!gn || !gh) continue;
        if (gh.indexOf("?") >= 0) continue;
        if (gSeen[gh]) continue;
        gSeen[gh] = true;
        genres.push({
            title: gn,
            input: resolveUrl(gh),
            script: "gen.js"
        });
    }

    // Description
    var description = "";
    var descEl = selFirst(doc, ".summary-content p.detail-summary, .summary-content, p.detail-summary, .detail-content");
    if (descEl) description = descEl.text().trim();

    var detailParts = [];
    if (statusText) detailParts.push("Tình trạng: " + statusText);
    if (author) detailParts.push("Tác giả: " + author);
    if (views) detailParts.push("👁 Lượt xem: " + views);
    if (likes) detailParts.push("❤ Thích: " + likes);
    var detail = detailParts.join("<br>");

    return Response.success({
        name: name,
        cover: cover,
        author: author || "Đang cập nhật",
        description: description,
        detail: detail,
        ongoing: ongoing,
        genres: genres,
        host: HOST
    });
}
