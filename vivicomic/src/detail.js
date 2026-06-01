load("config.js");

function metaContent(doc, prop) {
    var el = selFirst(doc, "meta[property='" + prop + "']");
    if (!el) el = selFirst(doc, "meta[name='" + prop + "']");
    return el ? (el.attr("content") || "").trim() : "";
}

function execute(url) {
    var doc = fetchRetry(url);
    if (!doc) return Response.error("Không tải được trang truyện");

    // Title
    var name = "";
    var h1 = selFirst(doc, "h1.comic-title") || selFirst(doc, "h1");
    if (h1) name = h1.text().trim();
    if (!name) name = metaContent(doc, "og:title").replace(/\s*\|.*$/, "").trim();

    // Cover
    var cover = "";
    var cimg = selFirst(doc, ".comic-detail-cover img");
    if (cimg) cover = cimg.attr("src") || cimg.attr("data-src") || "";
    if (!cover) cover = metaContent(doc, "og:image");
    if (cover && cover.indexOf("http") !== 0) cover = resolveUrl(cover);

    // Description
    var description = "";
    var descEl = selFirst(doc, ".comic-description") || selFirst(doc, ".comic-detail-desc") || selFirst(doc, ".comic-content") || selFirst(doc, ".description");
    if (descEl) description = descEl.text().trim();
    if (!description) description = metaContent(doc, "og:description");

    // Status
    var ongoing = true;
    var stEl = selFirst(doc, ".status-completed") || selFirst(doc, ".meta-value.status-completed");
    var stText = "";
    var stOng = selFirst(doc, ".status-ongoing");
    if (stEl) { stText = stEl.text().trim(); ongoing = false; }
    else if (stOng) { stText = stOng.text().trim(); ongoing = true; }
    if (stText && (stText.indexOf("Hoàn") >= 0 || stText.indexOf("hoàn") >= 0)) ongoing = false;

    // Genres — chỉ lấy trong vùng comic-detail (tránh quét menu/footer toàn site)
    var genres = [];
    var gSeen = {};
    var scope = selFirst(doc, ".comic-detail-info") || selFirst(doc, ".comic-detail");
    var gLinks = scope ? scope.select("a[href*='/the-loai/']") : doc.select(".no-such-genre");
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

    var detailParts = [];
    if (stText) detailParts.push("Tình trạng: " + stText);
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
