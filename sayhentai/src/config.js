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
var FETCH_OPTIONS = { headers: FETCH_HEADERS, timeout: 10000 };

function selFirst(el, css) {
    if (!el) return null;
    var it = el.select(css);
    return it.size() > 0 ? it.get(0) : null;
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

function fetchRetry(url, extraHeaders) {
    try {
        var opts = { headers: FETCH_HEADERS, timeout: 10000 };
        if (extraHeaders) {
            for (var k in extraHeaders) {
                opts.headers[k] = extraHeaders[k];
            }
        }
        var res = fetch(url, opts);
        if (res && res.ok) return res;
        return res;
    } catch (e) {
        return null;
    }
}

// Parse thẻ truyện ở trang listing (.item)
function parseItems(doc) {
    var items = [];
    if (!doc) return items;
    var cards = doc.select(".item");
    for (var i = 0; i < cards.size(); i++) {
        var c = cards.get(i);
        
        var a = selFirst(c, ".info-item .line-2 a");
        if (!a) a = selFirst(c, ".img-item a");
        if (!a) a = selFirst(c, "a[href*='/truyen-']");
        if (!a) continue;

        var name = txt(a);
        var href = a.attr("href") || "";
        if (!href) continue;

        var img = selFirst(c, ".img-item img");
        if (!img) img = selFirst(c, "img");
        if (!name && img) name = img.attr("alt") || img.attr("title") || "";
        if (!name) continue;

        var cover = imgSrc(img);
        var chap = selFirst(c, ".chapter a");
        if (!chap) chap = selFirst(c, ".list-chapter");

        items.push({
            name: name,
            cover: resolveUrl(cover),
            link: resolveUrl(href),
            description: chap ? txt(chap) : "",
            host: HOST
        });
    }
    return items;
}
