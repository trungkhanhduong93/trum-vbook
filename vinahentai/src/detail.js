load("config.js");

function execute(url) {
    var doc = fetchDoc(url);
    if (!doc) {
        return Response.error("Không thể tải thông tin truyện");
    }

    var h1 = selFirst(doc, "h1");
    var title = txt(h1);
    if (!title) {
        var metaTitle = selFirst(doc, "meta[property='og:title']");
        if (metaTitle) title = metaTitle.attr("content");
    }
    if (!title) title = "Không rõ tiêu đề";

    // Cover
    var coverEl = selFirst(doc, "img[src*='manga-posters'], img[src*='poster'], img[src*='story-images'], img[srcset*='manga-posters']");
    var cover = imgSrc(coverEl);
    if (!cover) {
        var metaImg = selFirst(doc, "meta[property='og:image']");
        if (metaImg) cover = resolveUrl(metaImg.attr("content"));
    }

    // Author
    var authorEls = doc.select("a[href*='/authors/']");
    var authors = [];
    for (var i = 0; i < authorEls.size(); i++) {
        var aTxt = txt(authorEls.get(i));
        if (aTxt) authors.push(aTxt);
    }
    var author = authors.length > 0 ? authors.join(", ") : "Đang cập nhật";

    // Translator / Group
    var groupEls = doc.select("a[href*='/translators/']");
    var groups = [];
    for (var j = 0; j < groupEls.size(); j++) {
        var gTxt = txt(groupEls.get(j));
        if (gTxt) groups.push(gTxt);
    }
    var group = groups.length > 0 ? groups.join(", ") : "";

    // Genres
    var genreEls = doc.select("a[href*='/genres/']");
    var genres = [];
    var genreSeen = {};
    for (var k = 0; k < genreEls.size(); k++) {
        var gEl = genreEls.get(k);
        var gName = txt(gEl);
        var gHref = gEl.attr("href") || "";
        if (gName && !genreSeen[gName]) {
            genreSeen[gName] = true;
            genres.push({
                title: gName,
                input: resolveUrl(gHref),
                script: "gen.js"
            });
        }
    }

    // Description
    var descEl = selFirst(doc, "meta[name='description'], meta[property='og:description']");
    var desc = descEl ? descEl.attr("content") : "";

    // Status
    var status = "Đang tiến hành";
    var ongoing = true;
    var textAll = doc.text();
    if (textAll.indexOf("Hoàn thành") >= 0 || textAll.indexOf("Đã hoàn thành") >= 0) {
        status = "Hoàn thành";
        ongoing = false;
    }

    var detailParts = [];
    if (author) detailParts.push("Tác giả: " + author);
    if (group) detailParts.push("Nhóm dịch: " + group);
    detailParts.push("Tình trạng: " + status);
    var detail = detailParts.join("<br>");

    return Response.success({
        name: title,
        cover: cover,
        author: author,
        description: desc,
        detail: detail,
        genres: genres,
        ongoing: ongoing,
        host: HOST
    });
}
