load("config.js");

function execute(url) {
    var doc = fetchRetry(url);
    if (!doc) return Response.error("Không tải được thông tin truyện");

    // Title
    var titleEl = selFirst(doc, "h1.title-detail, h1.title, h1[itemprop='name'], h1");
    var name = titleEl ? titleEl.text().trim() : "";

    // Cover
    var cover = "";
    var coverEl = selFirst(doc, ".detail-info img, .col-image img, .book_avatar img, .image-info img");
    if (coverEl) {
        cover = coverEl.attr("data-original") || coverEl.attr("data-src") || coverEl.attr("src") || "";
        if (cover) cover = resolveUrl(cover);
    }

    // Metadata from list-info
    var author = "";
    var statusText = "";
    var views = "";
    var followers = "";

    var rows = doc.select(".list-info li, ul.list-info li, .detail-info .row");
    for (var i = 0; i < rows.size(); i++) {
        var row = rows.get(i);
        var txt = row.text().trim();
        var lower = txt.toLowerCase();

        if (lower.indexOf("tác giả") >= 0) {
            var valEl = selFirst(row, ".col-xs-8, .col-xs-9, p, a");
            author = valEl ? valEl.text().trim() : txt.replace(/.*tác giả[:\s]*/i, "").trim();
        } else if (lower.indexOf("tình trạng") >= 0) {
            var valEl = selFirst(row, ".col-xs-8, .col-xs-9, p, a");
            statusText = valEl ? valEl.text().trim() : txt.replace(/.*tình trạng[:\s]*/i, "").trim();
        } else if (lower.indexOf("lượt xem") >= 0 || lower.indexOf("xem") >= 0) {
            var valEl = selFirst(row, ".col-xs-8, .col-xs-9, p");
            views = valEl ? valEl.text().trim() : "";
        } else if (lower.indexOf("theo dõi") >= 0) {
            var valEl = selFirst(row, ".col-xs-8, .col-xs-9, p");
            followers = valEl ? valEl.text().trim() : "";
        }
    }

    var ongoing = true;
    if (statusText && (statusText.indexOf("Hoàn") >= 0 || statusText.indexOf("Full") >= 0 || statusText.indexOf("Đã hoàn") >= 0)) {
        ongoing = false;
    }

    // Genres
    var genres = [];
    var gLinks = doc.select(".list-info li.kind a, .list01 a, .genres a, a[href*='/the-loai/']");
    var gSeen = {};
    for (var g = 0; g < gLinks.size(); g++) {
        var gl = gLinks.get(g);
        var gn = gl.text().trim();
        var gh = gl.attr("href") || "";
        if (!gn || !gh) continue;
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
    var descEl = selFirst(doc, ".detail-content p, .detail-content, .story-detail-info, .shortened");
    if (descEl) description = descEl.text().trim();

    var detailParts = [];
    if (statusText) detailParts.push("Tình trạng: " + statusText);
    if (author) detailParts.push("Tác giả: " + author);
    if (views) detailParts.push("👁 Lượt xem: " + views);
    if (followers) detailParts.push("🔖 Theo dõi: " + followers);
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
