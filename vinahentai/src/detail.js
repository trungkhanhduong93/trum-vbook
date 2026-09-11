function execute(url) {
    var resp = fetchRetry(url);
    if (!resp || !resp.ok) {
        return Response.error("Không thể tải thông tin truyện");
    }

    var doc = resp.html();
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
        var gName = txt(genreEls.get(k));
        if (gName && !genreSeen[gName]) {
            genreSeen[gName] = true;
            genres.push(gName);
        }
    }

    // Description
    var descEl = selFirst(doc, "meta[name='description'], meta[property='og:description']");
    var desc = descEl ? descEl.attr("content") : "";
    if (group) {
        desc = "Dịch giả: " + group + "\n\n" + desc;
    }

    // Status
    var status = "Đang tiến hành";
    var textAll = doc.text();
    if (textAll.indexOf("Hoàn thành") >= 0 || textAll.indexOf("Đã hoàn thành") >= 0) {
        status = "Hoàn thành";
    }

    return Response.success({
        name: title,
        cover: cover,
        author: author,
        description: desc,
        genres: genres,
        status: status,
        host: HOST
    });
}
