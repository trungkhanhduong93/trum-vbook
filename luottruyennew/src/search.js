load("config.js");

function execute(url, page) {
    var p = page ? parseInt(page) : 1;
    var fetchUrl = "";

    if (url.indexOf("http") === 0) {
        // Trang duyệt (/truyen-moi, /truyen-hot) 302-redirect khi gặp ?page=1.
        // Chỉ thêm tham số page từ trang 2 trở đi để tránh redirect làm rỗng list.
        fetchUrl = (p > 1) ? (url + (url.indexOf("?") >= 0 ? "&" : "?") + "page=" + p) : url;
    } else {
        fetchUrl = BASE_URL + "/tim-kiem?s=" + encodeURIComponent(url) + (p > 1 ? "&page=" + p : "");
    }

    var doc = fetchRetry(fetchUrl);
    if (!doc) return Response.error("Không tải được danh sách truyện");

    var items = [];
    var added = {};

    // Homepage listing: div#contentstory div.inner div.item
    var cards = doc.select("div.inner > div.item");
    for (var i = 0; i < cards.size(); i++) {
        var card = cards.get(i);

        // Get cover link
        var coverA = card.select("div.cover a").first();
        if (!coverA) coverA = card.select("a").first();
        if (!coverA) continue;

        var link = coverA.attr("href");
        if (!link) continue;
        link = resolveUrl(link);

        // Skip duplicates
        if (added[link]) continue;
        added[link] = true;

        // Get cover image
        var imgEl = card.select("img").first();
        var cover = "";
        if (imgEl) {
            cover = imgEl.attr("src") || imgEl.attr("data-src") || "";
            if (cover.indexOf("placeholder") >= 0 || cover.indexOf("loading") >= 0) {
                cover = imgEl.attr("data-src") || imgEl.attr("src") || "";
            }
            cover = resolveUrl(cover);
        }

        // Skip logos/icons
        if (cover && (cover.indexOf("logo") !== -1 || cover.indexOf("/icon") !== -1)) continue;

        // Get title
        var name = "";
        var nameEl = card.select("h3.name a").first();
        if (!nameEl) nameEl = card.select("h3 a").first();
        if (!nameEl) nameEl = card.select("div.info h3 a").first();
        if (nameEl) {
            name = trimText(nameEl.text());
        } else {
            // Fallback: caption h3 or img alt
            var captionH3 = card.select("div.caption h3").first();
            if (captionH3) {
                name = trimText(captionH3.text());
            } else if (imgEl) {
                name = imgEl.attr("alt") || "";
            }
            if (!name) {
                name = coverA.attr("title") || "";
            }
        }

        // Get latest chapter
        var chap = "";
        var chapEl = card.select("a.chapter-name").first();
        if (!chapEl) chapEl = card.select("div.caption p").first();
        if (chapEl) chap = trimText(chapEl.text());

        if (name && link) {
            items.push({
                name: name,
                link: link,
                cover: cover,
                description: chap,
                host: BASE_URL
            });
        }
    }

    // Pagination
    var next = "";
    var pageLinks = doc.select("div.pagination a");
    for (var j = 0; j < pageLinks.size(); j++) {
        var href = pageLinks.get(j).attr("href");
        var m = href.match(/page=(\d+)/);
        if (m && parseInt(m[1]) > p) {
            next = m[1];
            break;
        }
    }
    // Fallback: if items exist and no explicit next, check if page had full results
    if (!next && items.length >= 20) {
        next = String(p + 1);
    }

    return Response.success(items, next);
}
