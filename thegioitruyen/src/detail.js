load("config.js");

function metaContent(doc, prop) {
    var el = selFirst(doc, "meta[property='" + prop + "']");
    if (!el) el = selFirst(doc, "meta[name='" + prop + "']");
    return el ? (el.attr("content") || "").trim() : "";
}

function execute(url) {
    var doc = fetchRetry(url);
    if (!doc) return Response.error("Không tải được trang truyện");

    // Title: h1 ưu tiên, fallback og:title (bỏ hậu tố "[... Chapter]" và "| Thế Giới Truyện")
    var name = "";
    var h1 = selFirst(doc, "h1");
    if (h1) name = h1.text().trim();
    if (!name) {
        name = metaContent(doc, "og:title");
        name = name.replace(/\s*\[[^\]]*\]\s*/g, " ").replace(/\s*\|.*$/, "").replace(/^Đọc\s+/i, "").trim();
    }

    // Cover
    var cover = metaContent(doc, "og:image");
    if (!cover) {
        var cimg = selFirst(doc, ".tgt-card-thumb img") || selFirst(doc, ".tgt-detail img");
        if (cimg) cover = cimg.attr("src") || "";
    }
    if (cover && cover.indexOf("http") !== 0) cover = resolveUrl(cover);

    // Description
    var description = "";
    var descEl = selFirst(doc, "#tgt-desc-wrap") || selFirst(doc, ".tgt-desc") || selFirst(doc, ".description");
    if (descEl) description = descEl.text().trim();
    if (!description) description = metaContent(doc, "og:description");

    // Genres
    var genres = [];
    var gSeen = {};
    var gLinks = doc.select("a[href*='/the-loai/']");
    for (var g = 0; g < gLinks.size(); g++) {
        var gl = gLinks.get(g);
        var gn = gl.text().trim();
        var gh = gl.attr("href") || "";
        if (!gn || !gh || gh.indexOf("/the-loai/") < 0) continue;
        if (/\/the-loai\/?$/.test(gh)) continue;
        var gLink = resolveUrl(gh);
        if (gSeen[gLink]) continue;
        gSeen[gLink] = true;
        genres.push({ title: gn, input: gLink, script: "gen.js" });
    }

    // Status: badge "Đang phát hành" / "Hoàn thành"
    var ongoing = true;
    var badge = selFirst(doc, ".tgt-badge");
    var statusText = badge ? badge.text().trim() : "";
    if (statusText && (statusText.indexOf("Hoàn") >= 0 || statusText.indexOf("Full") >= 0)) ongoing = false;

    var detailParts = [];
    if (statusText) detailParts.push("Tình trạng: " + statusText);
    if (genres.length) {
        var gn2 = [];
        for (var k = 0; k < genres.length; k++) gn2.push(genres[k].title);
        detailParts.push("Thể loại: " + gn2.join(", "));
    }

    return Response.success({
        name: name,
        cover: cover,
        host: HOST,
        author: "",
        description: description,
        detail: detailParts.join("<br>"),
        ongoing: ongoing,
        genres: genres
    });
}
