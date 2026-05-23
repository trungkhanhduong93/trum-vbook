load("config.js");

function execute(url) {
    var doc = fetchRetry(url);
    if (!doc) return Response.error("Không tải được trang truyện");

    // Title
    var titleEl = selFirst(doc, "h1.title-detail");
    if (!titleEl) titleEl = selFirst(doc, "h1");
    if (!titleEl) titleEl = selFirst(doc, ".title-detail");
    var name = titleEl ? titleEl.text().trim() : "";

    // Original / alt title
    var altEl = selFirst(doc, ".name-other p.detail-info");
    var alt = altEl ? altEl.text().trim() : "";

    // Cover
    var cover = "";
    var coverEl = selFirst(doc, ".image-info img");
    if (!coverEl) coverEl = selFirst(doc, "img.image-manga");
    if (!coverEl) coverEl = selFirst(doc, ".detail-info img");
    if (coverEl) {
        cover = coverEl.attr("data-lazy-src") || coverEl.attr("data-src") || coverEl.attr("src") || "";
        if (cover && cover.indexOf("http") !== 0) {
            if (cover.indexOf("//") === 0) cover = "https:" + cover;
            else cover = resolveUrl(cover);
        }
    }

    // Meta details
    var authorEl = selFirst(doc, ".author p.detail-info");
    var author = authorEl ? authorEl.text().trim() : "";

    var statusEl = selFirst(doc, ".status p.detail-info");
    var statusText = statusEl ? statusEl.text().trim() : "";

    var viewsEl = selFirst(doc, ".view-total p.detail-info");
    var views = viewsEl ? viewsEl.text().trim() : "";

    var genres = [];
    var genreLinks = doc.select(".category p.detail-info a");
    var gSeen = {};
    for (var i = 0; i < genreLinks.size(); i++) {
        var gl = genreLinks.get(i);
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

    var ongoing = true;
    if (statusText && (statusText.indexOf("Hoàn") >= 0 || statusText.indexOf("Full") >= 0)) {
        ongoing = false;
    }

    // Description (Summary)
    var description = "";
    var descEl = selFirst(doc, ".detail-content");
    if (!descEl) descEl = selFirst(doc, ".summary-content");
    if (!descEl) descEl = selFirst(doc, ".comic-summary");
    if (descEl) description = descEl.text().trim();

    // Detail block (shown in detail tab)
    var detailParts = [];
    if (alt && alt !== "Đang cập nhật") detailParts.push("Tên khác: " + alt);
    if (statusText) detailParts.push("Tình trạng: " + statusText);
    if (author) detailParts.push("Tác giả: " + author);
    if (views) detailParts.push("👁 Lượt xem: " + views);
    var detail = detailParts.join("<br>");

    // Suggests (same author search link)
    var suggests = [];
    if (author && author !== "Đang cập nhật") {
        var authorLinkEl = selFirst(doc, ".author p.detail-info a");
        if (authorLinkEl) {
            var ah = authorLinkEl.attr("href") || "";
            if (ah) {
                suggests.push({
                    title: "Cùng tác giả: " + author,
                    input: resolveUrl(ah),
                    script: "gen.js"
                });
            }
        }
    }

    return Response.success({
        name: name,
        cover: cover,
        host: HOST,
        author: author,
        description: description,
        detail: detail,
        ongoing: ongoing,
        genres: genres,
        suggests: suggests
    });
}
