load("config.js");

function execute(url) {
    var res = fetchRetry(url);
    if (!res || !res.ok) return Response.error("Không tải được trang truyện");
    var doc = res.html();
    if (!doc) return Response.error("Không parse được HTML");

    // Title
    var titleEl = selFirst(doc, "h1.comic-title-detail");
    if (!titleEl) titleEl = selFirst(doc, ".comic-info__header h1");
    var name = titleEl ? titleEl.text().trim() : "";

    // Original / alt title
    var altEl = selFirst(doc, "h2.comic-original-title");
    var alt = altEl ? altEl.text().trim() : "";

    // Cover
    var cover = "";
    var coverEl = selFirst(doc, ".comic-info img.thumbnail");
    if (!coverEl) coverEl = selFirst(doc, ".comic-poster img.thumbnail");
    if (!coverEl) coverEl = selFirst(doc, ".thumbnail");
    if (coverEl) {
        cover = coverEl.attr("data-lazy-src") || coverEl.attr("data-src") || "";
        if (!cover) {
            var s = coverEl.attr("src") || "";
            if (s.indexOf("data:image") !== 0) cover = s;
        }
        if (cover && cover.indexOf("http") !== 0) cover = resolveUrl(cover);
    }

    // Meta from tag-sections
    var author = "";
    var updateText = "";
    var views = "";
    var genres = [];
    var statusText = "";

    var sections = doc.select(".comic-info__tags .tag-section, .comic-info__tags .cast-section");
    for (var i = 0; i < sections.size(); i++) {
        var sec = sections.get(i);
        var hEl = selFirst(sec, "h3");
        if (!hEl) continue;
        var label = hEl.text().trim().toLowerCase();
        var valDivEl = selFirst(sec, "div");
        var valText = valDivEl ? valDivEl.text().trim() : "";

        if (label.indexOf("tác giả") >= 0) {
            author = valText;
        } else if (label.indexOf("cập nhật") >= 0) {
            updateText = valText;
        } else if (label.indexOf("lượt xem") >= 0) {
            views = valText;
        } else if (label.indexOf("thể loại") >= 0) {
            var gLinks = sec.select("a");
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
        } else if (label.indexOf("trạng thái") >= 0 || label.indexOf("tình trạng") >= 0) {
            statusText = valText;
        }
    }

    var ongoing = true;
    if (statusText && (statusText.indexOf("Hoàn") >= 0 || statusText.indexOf("Full") >= 0)) {
        ongoing = false;
    }

    // Rating
    var ratingEl = selFirst(doc, ".comic-info__rating .rating");
    var rating = ratingEl ? ratingEl.text().trim() : "";
    var ratingCountEl = selFirst(doc, ".rating-count");
    var ratingCount = ratingCountEl ? ratingCountEl.text().trim() : "";

    // Description (in summary tab or below)
    var description = "";
    var descEl = selFirst(doc, ".comic-info__summary");
    if (!descEl) descEl = selFirst(doc, "#comic-info-summary");
    if (!descEl) descEl = selFirst(doc, ".comic-summary");
    if (descEl) description = descEl.text().trim();

    // Detail block
    var detailParts = [];
    if (alt) detailParts.push("Tên khác: " + alt);
    if (statusText) detailParts.push("Tình trạng: " + statusText);
    if (author) detailParts.push("Tác giả: " + author);
    if (views) detailParts.push("👁 Lượt xem: " + views);
    if (rating) {
        var r = "⭐ Đánh giá: " + rating;
        if (ratingCount) r += " " + ratingCount;
        detailParts.push(r);
    }
    if (updateText) detailParts.push("Cập nhật: " + updateText);
    var detail = detailParts.join("<br>");

    // Suggests
    var suggests = [];
    if (author) {
        var aLink = selFirst(doc, ".cast-section.tag-section a, .tag-section a[href*='/director/']");
        if (aLink) {
            var ah = aLink.attr("href") || "";
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
