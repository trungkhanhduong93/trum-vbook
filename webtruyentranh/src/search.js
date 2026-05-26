load('config.js');

function execute(url, page) {
    if (!page) page = '1';

    let fetchUrl = "";
    if (url.startsWith("http")) {
        fetchUrl = url + (url.indexOf("?") >= 0 ? "&" : "?") + "page=" + page;
    } else {
        fetchUrl = BASE_URL + "/tim-kiem?keyword=" + encodeURIComponent(url) + "&page=" + page;
    }

    let doc = fetchRetry(fetchUrl);
    if (!doc) return Response.error("Không tải được danh sách truyện");

    let data = [];
    let added = {};
    let cards = doc.select("a[href*='/truyen-tranh/']");

    for (let i = 0; i < cards.size(); i++) {
        let a = cards.get(i);
        let link = a.attr("href");
        if (!link || added[link]) continue;
        if (link.indexOf("/truyen-tranh/") === -1) continue;
        added[link] = true;

        let imgEl = a.select("img").first();
        let img = "";
        if (imgEl) {
            img = imgEl.attr("src") || imgEl.attr("data-src") || "";
            if (img.indexOf(" ") > 0) img = img.split(" ")[0];
            if (img.startsWith("/")) img = BASE_URL + img;
        }

        let title = a.attr("title") || "";
        if (!title && imgEl) title = imgEl.attr("alt") || imgEl.attr("title") || "";
        if (!title) {
            let titleEl = a.selectFirst("h2, h3, span.font-bold, .font-semibold");
            if (titleEl) title = titleEl.text().trim();
        }
        title = title.trim();

        let chapEl = a.selectFirst("span.text-xs, .text-gray-400, .text-sm");
        let chap = chapEl ? chapEl.text().trim() : "";

        if (link && title && img && img.indexOf("logo") === -1) {
            data.push({ name: title, link: link, cover: img, description: chap, host: BASE_URL });
        }
    }

    let next = "";
    let pageLinks = doc.select("a[href*='page=']");
    for (let i = 0; i < pageLinks.size(); i++) {
        let href = pageLinks.get(i).attr("href");
        let m = href.match(/page=(\d+)/);
        if (m && parseInt(m[1]) > parseInt(page)) {
            next = m[1];
            break;
        }
    }

    return Response.success(data, next);
}
