load("config.js");

function execute(url) {
    if (url.indexOf("/") === 0) url = BASE_URL + url;
    url = url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);
    if (url.indexOf("/truyen-tranh/") !== -1) {
        url = url.replace("/truyen-tranh/", "/");
        url = url.replace(/\/$/, "");
        url = url.replace(/-\d+$/, "");
    }

    // Tải trực tiếp (không chặn 10s). fetchRetry tự fallback Browser nếu gặp
    // Cloudflare challenge. Ảnh dùng Referer (hotlink), không cần mồi cookie.
    var doc = fetchRetry(url);
    if (!doc) return Response.error("Không tải được chi tiết truyện");

    // Title
    var titleEl = selFirst(doc, "h1[itemprop=name]");
    if (!titleEl) titleEl = selFirst(doc, "h1");
    var title = titleEl ? trimText(titleEl.text()) : "";

    // Cover
    var coverEl = selFirst(doc, "div.poster img[itemprop=image]");
    if (!coverEl) coverEl = selFirst(doc, "div.poster img");
    var cover = coverEl ? resolveUrl(coverEl.attr("src") || coverEl.attr("data-src") || "") : "";

    // Description
    var descEl = selFirst(doc, "div[itemprop=description]");
    var description = descEl ? trimText(descEl.text()) : "";

    // Author - find the line with fa-user icon
    var author = "Đang cập nhật";
    var lines = doc.select("div.book-meta div.line");
    for (var i = 0; i < lines.size(); i++) {
        var line = lines.get(i);
        var icon = selFirst(line, "i.fa-user");
        if (icon) {
            var resultEl = selFirst(line, "span.result");
            if (resultEl) {
                author = trimText(resultEl.text());
            }
            break;
        }
    }

    // Genres
    var genres = [];
    var genreEls = doc.select("div.book-meta a[href*='/the-loai/']");
    for (var j = 0; j < genreEls.size(); j++) {
        var g = trimText(genreEls.get(j).text());
        if (g && genres.indexOf(g) === -1) genres.push(g);
    }

    return Response.success({
        name: title,
        cover: cover,
        author: author,
        description: description,
        detail: "Thể loại: " + genres.join(", "),
        host: BASE_URL
    });
}
