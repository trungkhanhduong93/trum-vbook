load('config.js');
function execute(key, page) {
    if (!page) page = '1';
    
    var url = "/search?keyword=" + encodeURIComponent(key) + "&page=" + page;
    var doc = fetchRetry(BASE_URL + url);
    if (doc) {
        var novelList = [];
        var cards = doc.select("div.grid-cols-2 > div");
        
        cards.forEach(e => {
            var aEl = e.select("a").first();
            var link = aEl ? aEl.attr("href") : "";
            if (link) {
                link = link.replace(BASE_URL, "");
            }
            
            var imgEl = aEl ? aEl.select("img").first() : null;
            var cover = imgEl ? (imgEl.attr("src") || imgEl.attr("data-src") || "") : "";
            if (cover && cover.startsWith("//")) {
                cover = "https:" + cover;
            }
            
            var titleEl = e.select("h5").first();
            var name = titleEl ? titleEl.text().trim() : "";
            
            var lastChapEl = e.select("span:contains(Chap), span:contains(Chương)").first();
            var description = lastChapEl ? lastChapEl.text().trim() : "";
            if (!description) {
                var spans = e.select("span");
                if (spans.size() > 0) {
                    description = spans.first().text().trim();
                }
            }
            
            if (name && link) {
                novelList.push({
                    name: name,
                    link: link,
                    description: description,
                    cover: cover,
                    host: BASE_URL
                });
            }
        });
        
        var next = (novelList.length === 24) ? (parseInt(page) + 1).toString() : "";
        return Response.success(novelList, next);
    }
    return null;
}
