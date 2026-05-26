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

        // Real grid cards have <h3> inside the <a>; header dropdown nav links don't.
        let h3El = a.selectFirst("h3");
        if (!h3El) continue;

        let imgEl = a.selectFirst("img");
        if (!imgEl) continue;

        added[link] = true;

        let title = h3El.attr("title") || h3El.text().trim();
        if (!title) title = (imgEl.attr("alt") || "").replace(/^Truyện tranh\s+/i, "").trim();

        let img = imgEl.attr("src") || imgEl.attr("data-src") || "";
        if (img.indexOf(" ") > 0) img = img.split(" ")[0];
        if (img.startsWith("/")) img = BASE_URL + img;

        let chapEl = a.selectFirst("p.text-xs");
        let chap = chapEl ? chapEl.text().trim() : "";

        if (link && title && img) {
            data.push({ name: title, link: link, cover: img, description: chap, host: BASE_URL });
        }
    }

    // Pagination
    let next = "";
    let curPage = parseInt(page);
    let pageLinks = doc.select("a[href*='page=']");
    for (let i = 0; i < pageLinks.size(); i++) {
        let href = pageLinks.get(i).attr("href");
        let m = href.match(/page=(\d+)/);
        if (m && parseInt(m[1]) > curPage) {
            next = String(curPage + 1);
            break;
        }
    }

    return Response.success(data, next);
}
