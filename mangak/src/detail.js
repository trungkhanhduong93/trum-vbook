load('config.js');
function execute(url) {
    url = url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);
    var doc = fetchRetry(url);
    if (doc) {
        var imgEl = doc.select("div[class*=row-span] img").first();
        if (!imgEl) {
            imgEl = doc.select("img[src*=/uploads/]").first();
        }
        var cover = imgEl ? (imgEl.attr("src") || imgEl.attr("data-src") || "") : "";
        if (cover && cover.startsWith("//")) {
            cover = "https:" + cover;
        }

        var genres = [];
        var genreNames = {};
        doc.select("a[href*=/the-loai/]").forEach(e => {
            var href = e.attr("href");
            if (href.indexOf("/the-loai/all") === -1) {
                var gTitle = e.text().replace(/[›»\s]+/g, ' ').trim();
                if (gTitle && gTitle.length > 1 && gTitle.length < 30 && !genreNames[gTitle]) {
                    genreNames[gTitle] = true;
                    genres.push({
                        title: gTitle,
                        input: href.replace(BASE_URL, ""),
                        script: "gen.js"
                    });
                }
            }
        });

        var author = "Đang cập nhật";
        var status = "Đang tiến hành";
        var view = "0";

        doc.select("p, div, li").forEach(e => {
            var text = e.clone().children().remove().end().text().trim();
            if (text.indexOf("Tác giả:") >= 0) {
                author = text.replace("Tác giả:", "").trim();
            } else if (text.indexOf("Trạng thái:") >= 0) {
                status = text.replace("Trạng thái:", "").trim();
            } else if (text.indexOf("Lượt xem:") >= 0) {
                view = text.replace("Lượt xem:", "").trim();
            }
        });

        var descEl = doc.select("#story-description").first();
        var description = descEl ? descEl.html() : "";

        const infoBook = [
            "Tác giả: " + author,
            "Trạng thái: " + status,
            "Lượt xem: " + view
        ];

        return Response.success({
            name: doc.select("h1").first().text().trim(),
            cover: cover,
            host: BASE_URL,
            author: author,
            description: description,
            detail: infoBook.join("<br>"),
            ongoing: status.indexOf("Đang tiến hành") >= 0 || status.indexOf("OnGoing") >= 0,
            genres: genres
        });
    }

    return null;
}
