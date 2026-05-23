load("config.js");

function execute(url) {
    var res = fetchRetry(url);
    if (!res || !res.ok) return Response.error("Không tải được trang truyện");
    var doc = res.html();
    if (!doc) return Response.error("Không parse được HTML");

    // Title
    var titleEl = selFirst(doc, "h1[itemprop='name']");
    if (!titleEl) titleEl = selFirst(doc, ".book_other h1");
    var name = titleEl ? titleEl.text().trim() : "";

    // Cover
    var cover = "";
    var coverEl = selFirst(doc, ".book_avatar img");
    if (coverEl) {
        cover = coverEl.attr("src") || coverEl.attr("data-original") || "";
        if (cover && cover.indexOf("http") !== 0) cover = resolveUrl(cover);
    }

    // Meta from ul.list-info > li
    var author = "";
    var statusText = "";
    var totalChap = "";
    var team = "";
    var age = "";
    var followers = "";
    var likes = "";
    var views = "";

    var rows = doc.select("ul.list-info li");
    for (var i = 0; i < rows.size(); i++) {
        var row = rows.get(i);
        var cls = row.attr("class") || "";
        var label = "";
        var labelEl = selFirst(row, "p.name");
        if (labelEl) label = labelEl.text().trim().toLowerCase();
        var valEl = selFirst(row, "p.col-xs-9");
        var val = valEl ? valEl.text().trim() : "";

        if (cls.indexOf("author") >= 0 || label.indexOf("tác giả") >= 0) {
            author = val;
        } else if (label.indexOf("nhóm dịch") >= 0 || cls.indexOf("team") >= 0) {
            team = val;
        } else if (label.indexOf("tổng số chap") >= 0) {
            totalChap = val;
        } else if (cls.indexOf("status") >= 0 || label.indexOf("tình trạng") >= 0) {
            statusText = val;
        } else if (label.indexOf("độ tuổi") >= 0) {
            age = val;
        } else if (label.indexOf("lượt theo dõi") >= 0 || label.indexOf("theo dõi") >= 0) {
            followers = val;
        } else if (label.indexOf("lượt thích") >= 0 || label.indexOf("thích") >= 0) {
            likes = val;
        } else if (label.indexOf("lượt xem") >= 0 || label.indexOf("xem") >= 0) {
            views = val;
        }
    }

    var ongoing = true;
    if (statusText && (statusText.indexOf("Hoàn") >= 0 || statusText.indexOf("Full") >= 0)) {
        ongoing = false;
    }

    // Genres
    var genres = [];
    var gLinks = doc.select("ul.list01 a, ul.list01 li.li03 a");
    var gSeen = {};
    for (var g = 0; g < gLinks.size(); g++) {
        var gl = gLinks.get(g);
        var gn = gl.text().trim();
        var gh = gl.attr("href") || "";
        if (!gn || !gh) continue;
        if (gh.indexOf("/the-loai/") < 0) continue;
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
    var descEl = selFirst(doc, ".story-detail-info.detail-content");
    if (!descEl) descEl = selFirst(doc, ".story-detail-info");
    if (descEl) description = descEl.text().trim();

    // Detail block
    var detailParts = [];
    if (statusText) detailParts.push("Tình trạng: " + statusText);
    if (author) detailParts.push("Tác giả: " + author);
    if (team) detailParts.push("Nhóm dịch: " + team);
    if (totalChap) detailParts.push("Số chương: " + totalChap);
    if (age) detailParts.push("Độ tuổi: " + age);
    if (views) detailParts.push("👁 Xem: " + views);
    if (followers) detailParts.push("🔖 Theo dõi: " + followers);
    if (likes) detailParts.push("❤ Thích: " + likes);
    var detail = detailParts.join("<br>");

    // Suggests
    var suggests = [];
    if (team) {
        var teamEl = selFirst(doc, "ul.list-info li.team a");
        if (teamEl) {
            var th = teamEl.attr("href") || "";
            if (th) {
                suggests.push({
                    title: "Cùng nhóm dịch: " + team,
                    input: resolveUrl(th),
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
