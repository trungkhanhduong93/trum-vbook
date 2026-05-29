// 2tenVN — WordPress + Madara theme (HTML scraping, không signing, không Cloudflare)
var BASE_URL = "https://www.2tenvn.com";
var HOST = "https://www.2tenvn.com";
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
var FETCH_OPTIONS = { headers: FETCH_HEADERS };

// ─── Helpers ────────────────────────────────────────────────────────
function selFirst(el, css) {
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

// Lấy src ảnh (ưu tiên data-src lazy-load nếu có)
function imgSrc(img) {
    if (!img) return "";
    var s = img.attr("data-src") || img.attr("data-lazy-src") || img.attr("src") || "";
    return s.trim();
}

// 1 retry khi lỗi mạng/5xx (4xx không retry) — đường bình thường vẫn 1 request
function fetchRetry(url) {
    var res = fetch(url, FETCH_OPTIONS);
    if (res && res.ok) return res;
    if (!res || (!res.ok && !(res.status >= 400 && res.status < 500))) {
        var r2 = fetch(url, FETCH_OPTIONS);
        if (r2) return r2;
    }
    return res;
}

// Madara phân trang: chèn /page/N/ trước query string
//   /truyen-tranh/?m_orderby=latest  →  /truyen-tranh/page/2/?m_orderby=latest
//   /the-loai/manhwa/                →  /the-loai/manhwa/page/2/
function buildPageUrl(input, page) {
    if (!page || page <= 1) return input;
    var qIdx = input.indexOf("?");
    var path = qIdx >= 0 ? input.slice(0, qIdx) : input;
    var qs = qIdx >= 0 ? input.slice(qIdx) : "";
    if (path.charAt(path.length - 1) !== "/") path += "/";
    return path + "page/" + page + "/" + qs;
}

// ─── Parse thẻ truyện ở trang listing (.page-item-detail) ───────────
function parseItems(doc) {
    var items = [];
    var cards = doc.select("div.page-item-detail");
    for (var i = 0; i < cards.size(); i++) {
        var c = cards.get(i);

        var a = selFirst(c, "div.item-summary .post-title a");
        if (!a) a = selFirst(c, ".post-title a");
        if (!a) continue;

        var name = txt(a);
        var href = a.attr("href") || "";
        if (!name || !href) continue;

        var img = selFirst(c, "div.item-thumb img");
        if (!img) img = selFirst(c, "img");
        var cover = imgSrc(img);

        var chap = selFirst(c, ".list-chapter .chapter a");
        if (!chap) chap = selFirst(c, ".chapter a");

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

// ─── Parse kết quả tìm kiếm (.c-tabs-item__content) ─────────────────
function parseSearchItems(doc) {
    var items = [];
    var rows = doc.select("div.c-tabs-item__content");
    for (var i = 0; i < rows.size(); i++) {
        var c = rows.get(i);

        var a = selFirst(c, ".post-title a");
        if (!a) a = selFirst(c, ".tab-summary .post-title a");
        if (!a) continue;

        var name = txt(a);
        var href = a.attr("href") || "";
        if (!name || !href) continue;

        var img = selFirst(c, ".tab-thumb img");
        if (!img) img = selFirst(c, "img");
        var cover = imgSrc(img);

        var chap = selFirst(c, ".chapter-item .chapter a");

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

// ─── Parse danh sách chương (li.wp-manga-chapter) ───────────────────
function parseChapters(doc) {
    var out = [];
    var li = doc.select("li.wp-manga-chapter");
    for (var i = 0; i < li.size(); i++) {
        var a = selFirst(li.get(i), "a");
        if (!a) continue;
        var name = txt(a);
        var href = a.attr("href") || "";
        if (!name || !href) continue;
        out.push({ name: name, url: resolveUrl(href), host: HOST });
    }
    return out;
}
