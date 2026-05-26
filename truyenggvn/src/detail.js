load("config.js");

function execute(url) {
    if (url.charAt(0) === "/") url = BASE_URL + url;
    var doc = fetchRetry(url);
    if (!doc) return Response.error("Không tải được chi tiết truyện");

    var titleEl = doc.selectFirst("h1");
    var name = titleEl ? trimText(titleEl.text()) : "";
    var cIdx = name.indexOf(" - Chapter");
    if (cIdx > 0) name = name.substring(0, cIdx);

    var cover = "";
    var coverEl = doc.selectFirst(".book_avatar img");
    if (!coverEl) coverEl = doc.selectFirst(".book_detail img");
    if (coverEl) {
        cover = coverEl.attr("src") || coverEl.attr("data-original") || "";
        if (cover && cover.indexOf("http") !== 0) {
            if (cover.indexOf("//") === 0) cover = "https:" + cover;
            else cover = resolveUrl(cover);
        }
    }

    var author = "Đang cập nhật";
    var infoItems = doc.select(".book_info .book_other .org-size");
    var ni = infoItems.size();
    for (var i = 0; i < ni; i++) {
        var item = infoItems.get(i);
        var label = item.text();
        if (label.indexOf("Tác giả") >= 0 || label.indexOf("Author") >= 0) {
            var authorA = item.selectFirst("a");
            if (authorA) author = trimText(authorA.text());
            break;
        }
    }
    if (author === "Đang cập nhật") {
        var storyInfo = doc.select(".story-detail-info p");
        var ns = storyInfo.size();
        for (var j = 0; j < ns; j++) {
            var p = storyInfo.get(j);
            if (p.text().indexOf("Tác giả") >= 0) {
                var aEl = p.selectFirst("a");
                if (aEl) author = trimText(aEl.text());
                break;
            }
        }
    }

    var genres = [];
    var genreEls = doc.select(".book_tags_content a");
    var ng = genreEls.size();
    if (ng === 0) {
        genreEls = doc.select(".book_tags a");
        ng = genreEls.size();
    }
    for (var k = 0; k < ng; k++) {
        var gText = trimText(genreEls.get(k).text());
        if (gText) genres.push(gText);
    }

    var description = "";
    var descEl = doc.selectFirst(".detail-content") || doc.selectFirst(".story-detail-info");
    if (descEl) description = trimText(descEl.text());

    return Response.success({
        name: name,
        cover: cover,
        author: author,
        description: description,
        detail: genres.length > 0 ? "Thể loại: " + genres.join(", ") : "",
        host: HOST
    });
}
