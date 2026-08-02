load("config.js");

function execute(url) {
    var doc = fetchRetry(url);
    if (!doc) return Response.error("Không tải được trang truyện");

    // Title
    var titleEl = selFirst(doc, "h1");
    if (!titleEl) titleEl = selFirst(doc, ".book_info h1");
    var name = titleEl ? titleEl.text().trim() : "";

    // Cover
    var cover = "";
    var coverEl = selFirst(doc, ".book_avatar img");
    if (!coverEl) coverEl = selFirst(doc, ".thumb img");
    if (!coverEl) coverEl = selFirst(doc, "img");
    if (coverEl) {
        cover = coverEl.attr("data-src") || coverEl.attr("src") || "";
        cover = resolveUrl(cover);
    }

    // Author
    var author = "";
    var authorEl = selFirst(doc, ".author a, .org_author a");
    if (!authorEl) authorEl = selFirst(doc, ".author");
    if (authorEl) author = authorEl.text().trim();

    // Status
    var statusText = "Đang cập nhật";
    var ongoing = true;
    var infoEl = selFirst(doc, ".book_info");
    if (infoEl) {
        var infoTxt = infoEl.text();
        if (infoTxt.indexOf("Hoàn thành") >= 0 || infoTxt.indexOf("Full") >= 0) {
            statusText = "Hoàn thành";
            ongoing = false;
        }
    }

    // Genres
    var genres = [];
    var genreLinks = doc.select("a[href*='/the-loai/']");
    var gSeen = {};
    for (var i = 0; i < genreLinks.size(); i++) {
        var gl = genreLinks.get(i);
        var gn = gl.text().trim();
        var gh = gl.attr("href") || "";
        if (!gn || !gh) continue;
        gh = resolveUrl(gh);
        if (gSeen[gh]) continue;
        gSeen[gh] = true;
        genres.push({
            title: gn,
            input: gh,
            script: "gen.js"
        });
    }

    // Description
    var description = "";
    var descEl = selFirst(doc, ".detail-content, .story-detail-info, .book_description");
    if (descEl) description = descEl.text().trim();

    var detailParts = [];
    if (statusText) detailParts.push("Tình trạng: " + statusText);
    if (author) detailParts.push("Tác giả: " + author);

    var chapLinks = doc.select("a[href*='/chuong-']");
    if (chapLinks) {
        var totalChaps = 0;
        var cSeen = {};
        for (var k = 0; k < chapLinks.size(); k++) {
            var chHref = chapLinks.get(k).attr("href") || "";
            var chTxt = chapLinks.get(k).text().trim();
            if (chHref && chTxt && chTxt !== "Đọc từ đầu" && chTxt !== "Đọc tiếp" && !cSeen[chHref]) {
                cSeen[chHref] = true;
                totalChaps++;
            }
        }
        if (totalChaps > 0) detailParts.push("Tổng số chương: " + totalChaps);
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
