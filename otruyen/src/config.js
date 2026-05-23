var BASE_URL = "https://nettruyen.guru";
var HOST = "https://nettruyen.guru";

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

function trimText(value) {
    if (!value) return "";
    return String(value).replace(/\s+/g, " ").trim();
}

function resolveUrl(url) {
    if (!url) return BASE_URL;
    if (url.indexOf("http") === 0) return url;
    if (url.indexOf("//") === 0) return "https:" + url;
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

function parsePositiveInt(text) {
    if (!text) return 0;
    var match = String(text).match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
}

function extractChapterCount(doc) {
    var spans = doc.select("div.meta span");
    for (var i = 0; i < spans.size(); i++) {
        var value = trimText(spans.get(i).text());
        var count = parsePositiveInt(value);
        if (count > 0) return count;
    }
    return 0;
}

function extractStoryBase(url) {
    if (!url) return "";
    return String(url).replace(/\.html\/?$/, "").replace(/\/$/, "");
}

function buildPagedUrl(url, page) {
    var p = page ? parseInt(page, 10) : 1;
    if (!p || p <= 1) return url;
    return url + (url.indexOf("?") >= 0 ? "&" : "?") + "page=" + p;
}

function buildSearchUrl(keyword, page) {
    var kw = encodeURIComponent(trimText(keyword)).replace(/%20/g, "+");
    var url = BASE_URL + "/?s=" + kw;
    return buildPagedUrl(url, page);
}

function getNextPage(doc, currentPage) {
    var nextPage = String(currentPage + 1);
    var pageLinks = doc.select("a[href*='?page=']");
    for (var i = 0; i < pageLinks.size(); i++) {
        var href = pageLinks.get(i).attr("href") || "";
        if (href.indexOf("?page=" + nextPage) >= 0 || href.indexOf("&page=" + nextPage) >= 0) {
            return nextPage;
        }
    }
    return null;
}

function pushItem(items, seen, name, cover, link, description) {
    var finalName = trimText(name);
    var finalLink = resolveUrl(link);
    if (!finalName || !finalLink || seen[finalLink]) return;
    seen[finalLink] = true;
    items.push({
        name: finalName,
        cover: cover ? resolveUrl(cover) : "",
        link: finalLink,
        description: trimText(description),
        host: HOST
    });
}

function parseItems(doc) {
    var items = [];
    var seen = {};

    var blockCards = doc.select("div.grid div.card");
    for (var i = 0; i < blockCards.size(); i++) {
        var card = blockCards.get(i);
        var titleA = selFirst(card, "a.title");
        var thumbA = selFirst(card, "a.thumb");
        var coverEl = selFirst(card, "img");
        var name = titleA ? titleA.text() : "";
        var link = titleA ? titleA.attr("href") : "";
        if (!link && thumbA) link = thumbA.attr("href") || "";
        var cover = coverEl ? (coverEl.attr("src") || coverEl.attr("data-src") || "") : "";
        pushItem(items, seen, name, cover, link, "");
    }

    var anchorCards = doc.select("div.grid a.card");
    for (var j = 0; j < anchorCards.size(); j++) {
        var a = anchorCards.get(j);
        var tEl = selFirst(a, "div.t");
        var imgEl = selFirst(a, "img");
        var tName = tEl ? tEl.text() : a.attr("title");
        if (!tName && imgEl) tName = imgEl.attr("alt") || "";
        var tCover = imgEl ? (imgEl.attr("src") || imgEl.attr("data-src") || "") : "";
        pushItem(items, seen, tName, tCover, a.attr("href") || "", "");
    }

    return items;
}
