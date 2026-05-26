load('config.js');

function execute(url, page) {
    try {
        if (!page) page = '1';

        let fetchUrl = "";
        if (url && url.startsWith && url.startsWith("http")) {
            fetchUrl = url + (url.indexOf("?") >= 0 ? "&" : "?") + "page=" + page;
        } else {
            fetchUrl = BASE_URL + "/tim-kiem?keyword=" + encodeURIComponent(url || "") + "&page=" + page;
        }

        let doc = fetchRetry(fetchUrl);
        if (!doc) return Response.error("Không tải được danh sách truyện");

        let data = [];
        let added = {};
        let cards = doc.select("a[href*='/truyen-tranh/']");

        for (let i = 0; i < cards.size(); i++) {
            let a = cards.get(i);
            let link = a.attr("href");
            if (!link || link.indexOf("/truyen-tranh/") === -1) continue;
            if (added[link]) continue;

            // Real grid cards have <h3>; header nav dropdowns don't. Use .select().first()
            let h3List = a.select("h3");
            if (h3List.size() === 0) continue;

            let imgList = a.select("img");
            if (imgList.size() === 0) continue;

            added[link] = true;

            let h3El = h3List.get(0);
            let imgEl = imgList.get(0);

            let title = h3El.attr("title") || h3El.text().trim();
            if (!title) title = (imgEl.attr("alt") || "").replace(/^Truyện tranh\s+/i, "").trim();
            if (!title) continue;

            let img = imgEl.attr("src") || imgEl.attr("data-src") || "";
            if (img.indexOf(" ") > 0) img = img.split(" ")[0];
            if (img.startsWith("/")) img = BASE_URL + img;
            if (!img) continue;

            let chap = "";
            let chapList = a.select("p.text-xs");
            if (chapList.size() > 0) {
                chap = chapList.get(0).text().trim();
                let match = chap.match(/(\d+(?:\.\d+)?)/);
                if (match) {
                    title = title + " (" + match[1] + " Chương)";
                }
            }

            data.push({ name: title, link: link, cover: img, description: chap, host: BASE_URL });
        }

        if (data.length === 0) return Response.error("Không tìm thấy truyện nào");

        // Pagination
        let next = "";
        let curPage = parseInt(page);
        let pageLinks = doc.select("a[href*='page=']");
        for (let i = 0; i < pageLinks.size(); i++) {
            let href = pageLinks.get(i).attr("href");
            if (!href) continue;
            let m = href.match(/page=(\d+)/);
            if (m && parseInt(m[1]) > curPage) {
                next = String(curPage + 1);
                break;
            }
        }

        return Response.success(data, next);
    } catch (err) {
        return Response.error("Lỗi search.js: " + (err && err.message ? err.message : String(err)));
    }
}
