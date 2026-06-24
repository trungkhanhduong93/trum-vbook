load("config.js");

function execute(url) {
    if (url.indexOf("/") === 0) url = BASE_URL + url;
    url = url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);
    if (url.indexOf("/truyen-tranh/") !== -1) {
        url = url.replace("/truyen-tranh/", "/");
        url = url.replace(/\/$/, "");
        url = url.replace(/-\d+$/, "");
    }

    // MỞ BROWSER 1 LẦN DUY NHẤT Ở TRANG CHI TIẾT ĐỂ LẤY COOKIE CLOUDFLARE CHO TOÀN BỘ ẢNH BÊN TRONG
    var doc = null;
    var browser = null;
    try {
        browser = Engine.newBrowser();
        browser.launch(url, 10000); // 10s là đủ nhả Cookie
        var html = browser.html();
        if (html) {
            doc = html;
        }
    } catch(e) {}
    if (browser) { try { browser.close(); } catch(e){} }

    // Fallback nếu browser lỗi
    if (!doc) doc = fetchRetry(url);
    if (!doc) return Response.error("Không tải được chi tiết truyện");

    // Title
    var titleEl = doc.select("h1[itemprop=name]").first();
    if (!titleEl) titleEl = doc.select("h1").first();
    var title = titleEl ? trimText(titleEl.text()) : "";

    // Cover
    var coverEl = doc.select("div.poster img[itemprop=image]").first();
    if (!coverEl) coverEl = doc.select("div.poster img").first();
    var cover = coverEl ? resolveUrl(coverEl.attr("src") || coverEl.attr("data-src") || "") : "";

    // Description
    var descEl = doc.select("div[itemprop=description]").first();
    var description = descEl ? trimText(descEl.text()) : "";

    // Author - find the line with fa-user icon
    var author = "Đang cập nhật";
    var lines = doc.select("div.book-meta div.line");
    for (var i = 0; i < lines.size(); i++) {
        var line = lines.get(i);
        var icon = line.select("i.fa-user").first();
        if (icon) {
            var resultEl = line.select("span.result").first();
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
