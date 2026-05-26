load("config.js");

function execute(url) {
    var doc = fetchRetry(url);
    if (!doc) return Response.error("Không tải được chi tiết truyện");
    
    var html = doc.html();
    
    var name = "";
    var titleEl = doc.selectFirst("h1");
    if (titleEl) name = titleEl.text();
    else {
        var match = doc.html().match(/<h1[^>]*>(.*?)<\/h1>/i);
        if (match) name = match[1];
    }
    
    var cover = "";
    var coverEl = doc.selectFirst(".info-manga img, .thumbnail img, img[src*=thumbnail], img[alt*='" + name + "']");
    if (coverEl) cover = coverEl.attr("src") || coverEl.attr("data-src");
    if (!cover) {
        var mCover = doc.html().match(/"thumbnail"\s*:\s*"([^"]+)"/);
        if (mCover) cover = mCover[1];
    }
    
    var desc = "";
    var descEl = doc.selectFirst(".summary, .description, .detail-content, .info-desc");
    if (descEl) desc = descEl.text();
    if (!desc) {
        var mDesc = doc.html().match(/"content"\s*:\s*"(.*?)"/);
        if (mDesc) desc = mDesc[1].replace(/<[^>]+>/g, "");
    }
    
    var author = "Đang cập nhật";
    var authorEl = doc.selectFirst(".author, .info-manga .author");
    if (authorEl) author = authorEl.text();
    
    var genres = [];
    var genreEls = doc.select(".genres a, .list-tags a, .tags a");
    for (var i = 0; i < genreEls.size(); i++) {
        genres.push(trimText(genreEls.get(i).text()));
    }
    if (genres.length === 0) {
        var genreMatch = doc.html().match(/"genres":\[(.*?)\]/);
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
