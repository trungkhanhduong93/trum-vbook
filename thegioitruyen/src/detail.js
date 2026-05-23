load("config.js");

function execute(url) {
    var res = fetchRetry(url);
    if (!res || !res.ok) return Response.error("Không tải được trang truyện");
    var doc = res.html();
    if (!doc) return Response.error("Không parse được HTML");

    // Title
    var titleEl = selFirst(doc, "h1.tgt-info-title");
    var name = titleEl ? titleEl.text().trim() : "";

    // Cover
    var cover = "";
    var coverEl = selFirst(doc, "div.tgt-info-thumb img");
    if (coverEl) {
        cover = coverEl.attr("src") || "";
        if (cover && cover.indexOf("http") !== 0) cover = resolveUrl(cover);
    }

    // Meta table: th -> td
    var author = "";
    var statusText = "";
    var updateText = "";
    var chapterCount = "";
    var genres = [];

    var rows = doc.select("table.tgt-meta-table tr");
    for (var i = 0; i < rows.size(); i++) {
        var row = rows.get(i);
        var thEl = selFirst(row, "th");
        var tdEl = selFirst(row, "td");
        if (!thEl || !tdEl) continue;
        var th = thEl.text().trim().toLowerCase();
        var td = tdEl.text().trim();

        if (th.indexOf("tác giả") >= 0) {
            author = td;
        } else if (th.indexOf("tình trạng") >= 0) {
            statusText = td;
        } else if (th.indexOf("cập nhật") >= 0) {
            updateText = td;
        } else if (th.indexOf("số chapter") >= 0) {
            chapterCount = td;
        } else if (th.indexOf("thể loại") >= 0) {
            var gLinks = tdEl.select("a.tgt-genre-tag");
            for (var g = 0; g < gLinks.size(); g++) {
                var gl = gLinks.get(g);
                var gn = gl.text().trim();
                var gh = gl.attr("href") || "";
                if (!gn || !gh) continue;
                genres.push({
                    title: gn,
                    input: resolveUrl(gh),
                    script: "gen.js"
                });
            }
        }
    }

    var ongoing = true;
    if (statusText && (statusText.indexOf("Hoàn thành") >= 0 || statusText.indexOf("Full") >= 0)) {
        ongoing = false;
    }

    // Description
    var description = "";
    var descEl = selFirst(doc, "div.tgt-desc");
    if (descEl) description = descEl.text().trim();

    // Detail block
    var detailParts = [];
    if (statusText) detailParts.push("Tình trạng: " + statusText);
    if (author && author !== "Đang cập nhật") detailParts.push("Tác giả: " + author);
    if (chapterCount) detailParts.push("Số chapter: " + chapterCount);
    if (updateText) detailParts.push("Cập nhật: " + updateText);
    var detail = detailParts.join("<br>");

    // Suggests by author
    var suggests = [];
    if (author && author !== "Đang cập nhật") {
        suggests.push({
            title: "Cùng tác giả: " + author,
            input: BASE_URL + "/search/" + encodeURIComponent(author) + "/",
            script: "gen.js"
        });
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
