load("config.js");

function execute(url) {
    var doc = fetchRetry(url);
    if (!doc) return Response.error("Không tải được chi tiết truyện");
    
    var html = doc.html();
    
    var name = "";
    var author = "Đang cập nhật";
    var cover = "";
    var desc = "";
    var genres = [];

    var nameMatch = html.match(/\\"name\\":\\"([^\\"]+)\\",\\"origin_name\\":.*?\\"slug\\":\\"[^\\"]+\\",\\"content\\":\\"(.*?)\\",\\"thumbnail\\":\\"([^\\"]+)\\"/);
    if (nameMatch) {
        name = nameMatch[1];
        desc = nameMatch[2].replace(/<[^>]+>/g, "");
        cover = nameMatch[3];
    } else {
        var titleEl = doc.selectFirst("h1");
        if (titleEl) name = titleEl.text();
        
        var coverEl = doc.selectFirst("img[src*=thumbnail]");
        if (coverEl) cover = coverEl.attr("src");
        
        var descEl = doc.selectFirst(".summary");
        if (descEl) desc = descEl.text();
    }
    
    var genreMatch = html.match(/\\"genres\\":\\\[(.*?)\\\]/);
    if (genreMatch) {
        var gPattern = /\\"name\\":\\"([^\\"]+)\\"/g;
        var gm;
        while ((gm = gPattern.exec(genreMatch[1])) !== null) {
            genres.push(gm[1]);
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
