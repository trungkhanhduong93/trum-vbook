var BASE_URL = "https://www.damconuong.xyz";
var HOST = "https://www.damconuong.xyz";
try {
    if (typeof CONFIG_URL !== "undefined" && CONFIG_URL) {
        BASE_URL = String(CONFIG_URL).replace(/\/+$/, "");
        HOST = BASE_URL;
    }
} catch (e) {}

var FETCH_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.5",
    "Referer": BASE_URL + "/"
};
var FETCH_OPTIONS = { headers: FETCH_HEADERS, timeout: 10000 };

function selFirst(el, css) {
    if (!el) return null;
    var it = el.select(css);
    return it.size() > 0 ? it.get(0) : null;
}

function txt(el) {
    return el ? el.text().trim() : "";
}

function safeEncodeUrl(u) {
    if (!u) return "";
    try {
        return encodeURI(u);
    } catch (e) {
        return u;
    }
}

function resolveUrl(u) {
    if (!u) return BASE_URL;
    u = String(u).trim();
    if (u.indexOf("//") === 0) u = "https:" + u;
    else if (u.indexOf("http") !== 0) u = BASE_URL + (u.charAt(0) === "/" ? u : "/" + u);
    return safeEncodeUrl(u);
}

function imgSrc(img) {
    if (!img) return "";
    var s = img.attr("data-src") || img.attr("data-lazy-src") || img.attr("src") || "";
    return s.trim();
}

function toPhoton(url, idx, isCover) {
    if (!url) return "";
    url = String(url).trim();
    if (url.indexOf("//") === 0) url = "https:" + url;
    var isAvif = url.indexOf(".avif") >= 0 || url.indexOf("wsrvnl") >= 0;
    if (!isAvif) return url;
    var bare = url.replace(/^https?:\/\//i, "");
    var host = "i" + ((idx || 0) % 3) + ".wp.com/";
    var sep = bare.indexOf("?") >= 0 ? "&" : "?";
    var params = isCover ? "w=300&quality=70&strip=all" : "w=600&quality=65&strip=all";
    return "https://" + host + bare + sep + params;
}

function fetchRetry(url) {
    try {
        var res = fetch(safeEncodeUrl(url), FETCH_OPTIONS);
        if (res && res.ok) return res;
        return res;
    } catch (e) {
        return null;
    }
}

function buildPageUrl(input, page) {
    if (!page || page <= 1) return input;
    var qIdx = input.indexOf("?");
    var path = qIdx >= 0 ? input.slice(0, qIdx) : input;
    var qs = qIdx >= 0 ? input.slice(qIdx) : "";
    if (path.charAt(path.length - 1) !== "/") path = path + "/";
    return path + "page/" + page + "/" + qs;
}

function parseItems(doc) {
    var items = [];
    if (!doc) return items;
    var cards = doc.select("div.page-item-detail");
    if (cards.size() === 0) {
        cards = doc.select(".related-reading-wrap, .c-tabs-item__content");
    }
    for (var i = 0; i < cards.size(); i++) {
        var c = cards.get(i);
        var a = selFirst(c, ".post-title a, .widget-title a, h5 a, h3 a, a[title]");
        if (!a) continue;

        var name = txt(a);
        if (!name) name = a.attr("title") || "";
        var href = a.attr("href") || "";
        if (!name || !href) continue;

        var img = selFirst(c, "img");
        var cover = toPhoton(imgSrc(img), i, true);

        var chA = selFirst(c, ".chapter-item a, .list-chapter a");
        var desc = txt(chA);

        items.push({
            name: name,
            link: resolveUrl(href),
            cover: cover,
            description: desc,
            host: HOST
        });
    }
    return items;
}
