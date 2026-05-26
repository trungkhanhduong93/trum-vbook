load("config.js");

function execute(url) {
    var doc = fetchRetry(url);
    if (!doc) return Response.error("Không tải được chi tiết truyện");

    var html = doc.html();

    var name = "";
    var titleEls = doc.select("h1");
    if (titleEls.size() > 0) {
        name = titleEls.get(0).text();
    } else {
        var match = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
        if (match) name = match[1];
    }

    var cover = "";
    var coverEls = doc.select(".info-manga img, .thumbnail img, img[src*=thumbnail]");
    if (coverEls.size() > 0) {
        var coverEl = coverEls.get(0);
        cover = coverEl.attr("src") || coverEl.attr("data-src");
    }
    if (!cover) {
        var mCover = html.match(/"thumbnail"\s*:\s*"([^"]+)"/);
        if (mCover) cover = mCover[1];
    }

    var desc = "";
    var descEls = doc.select(".summary, .description, .detail-content, .info-desc");
    if (descEls.size() > 0) desc = descEls.get(0).text();
    if (!desc) {
        var mDesc = html.match(/"content"\s*:\s*"(.*?)"/);
        if (mDesc) desc = mDesc[1].replace(/<[^>]+>/g, "");
    }

    var author = "Đang cập nhật";
    var authorEls = doc.select(".author, .info-manga .author");
    if (authorEls.size() > 0) author = authorEls.get(0).text();

    var genres = [];
    var genreEls = doc.select(".genres a, .list-tags a, .tags a");
    var ng = genreEls.size();
    for (var i = 0; i < ng; i++) {
        genres.push(trimText(genreEls.get(i).text()));
    }
    if (genres.length === 0) {
        var genreMatch = html.match(/"genres":\[(.*?)\]/);
        if (genreMatch) {
            var gPattern = /"name":"([^"]+)"/g;
            var gm;
            while ((gm = gPattern.exec(genreMatch[1])) !== null) {
                genres.push(gm[1]);
            }
        }
    }

    return Response.success({
        name: trimText(name),
        cover: resolveUrl(cover),
        author: author,
        description: trimText(desc),
        detail: "Thể loại: " + genres.join(", "),
        host: BASE_URL
    });
}
