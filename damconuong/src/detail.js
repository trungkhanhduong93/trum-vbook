load("config.js");

function execute(url) {
    var res = fetchRetry(url);
    if (!res || !res.ok) return Response.error("Không tải được trang truyện");
    var doc = res.html();
    if (!doc) return Response.error("Không parse được HTML");

    var name = txt(selFirst(doc, ".post-title h1, h1"));
    if (!name) return Response.error("Không tìm thấy tên truyện");

    var cover = toPhoton(imgSrc(selFirst(doc, ".summary_image img")), 0, true);
    var author = txt(selFirst(doc, ".author-content a, .artist-content a"));
    var description = txt(selFirst(doc, ".description-summary, .summary__content, .manga-about"));

    var statusText = txt(selFirst(doc, ".post-status .summary-content"));
    var ongoing = true;
    if (statusText.toLowerCase().indexOf("complete") >= 0 || statusText.indexOf("Hoàn thành") >= 0) {
        ongoing = false;
    }

    var genreEls = doc.select(".genres-content a, .the-loai a");
    var genres = [];
    for (var i = 0; i < genreEls.size(); i++) {
        var g = genreEls.get(i);
        var gName = txt(g);
        var gHref = g.attr("href") || "";
        if (gName && gHref) {
            genres.push({
                title: gName,
                input: gHref,
                script: "gen.js"
            });
        }
    }

    return Response.success({
        name: name,
        cover: cover,
        host: HOST,
        author: author,
        description: description,
        detail: "Tình trạng: " + (statusText || (ongoing ? "Đang tiến hành" : "Hoàn thành")),
        ongoing: ongoing,
        genres: genres
    });
}
