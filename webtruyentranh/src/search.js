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
        if (!doc) {
            return Response.success([{
                name: "DEBUG: fetchRetry null. url=" + fetchUrl,
                link: fetchUrl,
                cover: "https://raw.githubusercontent.com/trungkhanhduong93/trum-vbook/main/webtruyentranh/icon.png",
                description: "fetch failed",
                host: BASE_URL
            }]);
        }

        let htmlLen = 0;
        try { htmlLen = doc.html().length; } catch (e) {}

        let data = [];
        let added = {};
        let allCards = doc.select("a[href*='/truyen-tranh/']");
        let totalLinks = allCards.size();
        let h3Count = 0;
        let imgCount = 0;

        for (let i = 0; i < allCards.size(); i++) {
            let a = allCards.get(i);
            let link = a.attr("href");
            if (!link) continue;
            if (link.indexOf("/truyen-tranh/") === -1) continue;
            if (added[link]) continue;

            let imgEl = a.selectFirst("img");
            if (!imgEl) continue;
            imgCount++;

            let h3El = a.selectFirst("h3");
            if (h3El) h3Count++;

            added[link] = true;

            let title = "";
            if (h3El) title = h3El.attr("title") || h3El.text().trim();
            if (!title) title = (imgEl.attr("alt") || "").replace(/^Truyện tranh\s+/i, "").trim();
            if (!title) title = a.attr("title") || "";
            title = title.trim();
            if (!title) continue;

            let img = imgEl.attr("src") || imgEl.attr("data-src") || "";
            if (img.indexOf(" ") > 0) img = img.split(" ")[0];
            if (img.startsWith("/")) img = BASE_URL + img;
            if (!img) continue;

            data.push({ name: title, link: link, cover: img, description: "", host: BASE_URL });
        }

        if (data.length === 0) {
            return Response.success([{
                name: "DEBUG: 0 items. links=" + totalLinks + " img=" + imgCount + " h3=" + h3Count + " html=" + htmlLen,
                link: fetchUrl,
                cover: "https://raw.githubusercontent.com/trungkhanhduong93/trum-vbook/main/webtruyentranh/icon.png",
                description: "filter loại hết",
                host: BASE_URL
            }]);
        }

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
        return Response.success([{
            name: "EXCEPTION: " + (err && err.message ? err.message : String(err)),
            link: "https://www.webtruyentranh.com",
            cover: "https://raw.githubusercontent.com/trungkhanhduong93/trum-vbook/main/webtruyentranh/icon.png",
            description: "uncaught error in search.js",
            host: BASE_URL
        }]);
    }
}
