var BASE_URL = "https://sayhentai.cx";
var HOST = "https://sayhentai.cx";

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

function selFirst(el, css) {
    if (!el) return null;
    var items = el.select(css);
    return items.size() > 0 ? items.get(0) : null;
}

function txt(el) {
    return el ? el.text().trim() : "";
}

function resolveUrl(u) {
    if (!u) return BASE_URL;
    u = String(u).trim();
    if (u.indexOf("//") === 0) return "https:" + u;
    if (u.indexOf("http") === 0) return u;
    return BASE_URL + (u.charAt(0) === "/" ? u : "/" + u);
}

function imgSrc(img) {
    if (!img) return "";
    var s = img.attr("data-src") || img.attr("data-lazy-src") || img.attr("src") || "";
    return s.trim();
}

function copyHeaders(base, extra) {
    var h = {};
    for (var k in base) h[k] = base[k];
    if (extra) {
        for (var ex in extra) h[ex] = extra[ex];
    }
    return h;
}

function fetchRetry(url, extraHeaders) {
    try {
        var headers = copyHeaders(FETCH_HEADERS, extraHeaders);
        var opts = { headers: headers, timeout: 8000 };
        var res = fetch(url, opts);
        if (res && res.ok) return res;
        return res;
    } catch (e) {
        return null;
    }
}

function fetchDoc(url, extraHeaders) {
    try {
        var res = fetchRetry(url, extraHeaders);
        if (res && res.ok) {
            var doc = res.html();
            if (doc) return doc;
        }
    } catch (e1) {}

    try {
        if (typeof Http !== "undefined" && typeof Http.get === "function") {
            var headers = copyHeaders(FETCH_HEADERS, extraHeaders);
            var doc2 = Http.get(url).headers(headers).html();
            if (doc2) return doc2;
        }
    } catch (e2) {}

    return null;
}

// Parse thẻ truyện ở trang listing
function parseItems(doc) {
    var items = [];
    if (!doc) return items;

    var cards = doc.select(".page-item-detail, .item, .c-tabs-item__content");
    var seen = {};

    for (var i = 0; i < cards.size(); i++) {
        var c = cards.get(i);
        var titleA = selFirst(c, ".post-title h3 a, h3.line-2 a, .line-2 a, .widget-title a");
        var thumbA = selFirst(c, ".item-thumb a, .img-item a, a[href*='/truyen-']");

        var a = titleA ? titleA : thumbA;
        if (!a) continue;

        var href = "";
        if (titleA) href = titleA.attr("href");
        if (!href && thumbA) href = thumbA.attr("href");
        if (!href || href.indexOf("/truyen-") < 0 || href.indexOf("/chuong-") >= 0) continue;

        var fullUrl = resolveUrl(href);
        if (seen[fullUrl]) continue;

        var name = titleA ? txt(titleA) : "";
        if (!name || name === "Mới") {
            var h3 = selFirst(c, "h3, .post-title, .line-2");
            if (h3) name = txt(h3);
        }
        var img = selFirst(c, ".item-thumb img, .img-item img, img");
        if (!name && img) {
            name = img.attr("alt") || img.attr("title") || "";
        }
        if (!name || name === "Mới") continue;

        seen[fullUrl] = true;
        var cover = imgSrc(img);
        var chapEl = selFirst(c, ".list-chapter .chapter a, .chapter a, .list-chapter");
        var chap = chapEl ? txt(chapEl) : "";

        items.push({
            name: name,
            link: fullUrl,
            cover: cover,
            description: chap,
            host: HOST
        });
    }

    return items;
}
