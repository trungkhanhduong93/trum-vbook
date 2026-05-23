var BASE_URL = "https://thegioitruyen.vn";
var HOST = "https://thegioitruyen.vn";

var FETCH_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.5",
    "Referer": BASE_URL + "/"
};
var FETCH_OPTIONS = { headers: FETCH_HEADERS };

function selFirst(el, css) {
    var items = el.select(css);
    return items.size() > 0 ? items.get(0) : null;
}

function resolveUrl(url) {
    if (!url) return BASE_URL;
    if (url.indexOf("http") === 0) return url;
    return BASE_URL + (url.charAt(0) === "/" ? url : "/" + url);
}

function fetchRetry(url) {
    var res = fetch(url, FETCH_OPTIONS);
    if (!res) return res;
    if (!res.ok && !(res.status >= 400 && res.status < 500)) {
        res = fetch(url, FETCH_OPTIONS);
    }
    return res;
}

// Parse story cards from .tgt-grid > .tgt-card
function parseItems(doc) {
    var items = [];
    var cards = doc.select("div.tgt-grid div.tgt-card");
    for (var i = 0; i < cards.size(); i++) {
        var card = cards.get(i);
        var titleA = selFirst(card, "a.tgt-card-title");
        if (!titleA) continue;
        var name = titleA.text().trim();
        var href = titleA.attr("href") || "";
        if (!name || !href) continue;

        var img = selFirst(card, "a.tgt-card-thumb img");
        var cover = "";
        if (img) {
            cover = img.attr("src") || img.attr("data-src") || "";
            if (cover && cover.indexOf("http") !== 0) cover = resolveUrl(cover);
        }

        var status = "";
        var badge = selFirst(card, "span.tgt-badge");
        if (badge) status = badge.text().trim();

        var chapEl = selFirst(card, "span.tgt-card-chap span");
        var chapText = chapEl ? chapEl.text().trim() : "";
        var timeEl = selFirst(card, "span.tgt-card-time");
        var timeText = timeEl ? timeEl.text().trim() : "";

        var desc = "";
        if (status) desc = status;
        if (chapText) desc += (desc ? " • " : "") + chapText;
        if (timeText) desc += (desc ? " • " : "") + timeText;

        items.push({
            name: name,
            cover: cover,
            link: resolveUrl(href),
            description: desc,
            host: HOST
        });
    }

    // Search result layout (WordPress default): pair covers + titles via URL map
    if (items.length === 0) {
        var coverMap = {};
        var figs = doc.select("figure.wp-block-post-featured-image");
        for (var k = 0; k < figs.size(); k++) {
            var f = figs.get(k);
            var fa = selFirst(f, "a");
            var fimg = selFirst(f, "img");
            if (!fa || !fimg) continue;
            var furl = fa.attr("href") || "";
            var fsrc = fimg.attr("src") || "";
            if (furl && fsrc) coverMap[furl] = fsrc;
        }

        var seen = {};
        var posts = doc.select("h2.wp-block-post-title a");
        for (var j = 0; j < posts.size(); j++) {
            var a = posts.get(j);
            var nm = a.text().trim();
            var hf = a.attr("href") || "";
            if (!nm || !hf) continue;
            if (hf.indexOf("/truyen/") < 0) continue;
            if (seen[hf]) continue;
            seen[hf] = true;

            items.push({
                name: nm,
                cover: coverMap[hf] || "",
                link: resolveUrl(hf),
                description: "",
                host: HOST
            });
        }
    }

    return items;
}

function getNextPage(doc, currentPage) {
    var nextPage = String(currentPage + 1);
    var pageLinks = doc.select("a[href*='/page/']");
    for (var j = 0; j < pageLinks.size(); j++) {
        var ph = pageLinks.get(j).attr("href") || "";
        if (ph.indexOf("/page/" + nextPage + "/") >= 0 || ph.indexOf("/page/" + nextPage) >= 0) {
            return nextPage;
        }
    }
    return null;
}
