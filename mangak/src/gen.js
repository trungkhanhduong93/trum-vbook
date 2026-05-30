load('config.js');
function execute(url, page) {
    if (!page) page = '1';
    
    var targetUrl = BASE_URL + url;
    if (page !== '1') {
        if (targetUrl.indexOf('?') >= 0) {
            targetUrl += '&page=' + page;
        } else {
            targetUrl += '?page=' + page;
        }
    }
    
    var doc = fetchRetry(targetUrl);
    if (doc) {
        var novelList = [];
        var cards = doc.select("div.story-list__item");

        cards.forEach(e => {
            var aEl = e.select("a.story-list__title-link").first();
            if (!aEl) aEl = e.select("a.story-list__thumb-link").first();
            var link = aEl ? aEl.attr("href") : "";
            if (link) {
                link = link.replace(BASE_URL, "");
            }

            var imgEl = e.select("img.story-list__thumb").first();
            if (!imgEl) imgEl = e.select("img").first();
            var cover = imgEl ? (imgEl.attr("src") || imgEl.attr("data-src") || "") : "";
            if (cover && cover.startsWith("//")) {
                cover = "https:" + cover;
            }

            var titleEl = e.select("h5.story-list__title").first();
            if (!titleEl) titleEl = e.select("h5").first();
            var name = titleEl ? titleEl.text().trim() : "";

            var chapEl = e.select(".story-list__chapter").first();
            var description = chapEl ? chapEl.text().trim() : "";

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

        var next = (novelList.length >= 24) ? (parseInt(page) + 1).toString() : "";
        return Response.success(novelList, next);
    }
    return null;
}
