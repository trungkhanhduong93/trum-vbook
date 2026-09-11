var BASE_URL = "https://vinahentai.click";
var HOST = "https://vinahentai.click";

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
    if (u.indexOf("http://") === 0 || u.indexOf("https://") === 0) return u;
    if (u.indexOf("//") === 0) return "https:" + u;
    if (u.indexOf("/") === 0) return BASE_URL + u;
    return BASE_URL + "/" + u;
}

function imgSrc(el) {
    if (!el) return "";
    var s = el.attr("src") || "";
    if (!s || s.indexOf("data:image") === 0) {
        var srcset = el.attr("srcset") || el.attr("imageSrcSet") || "";
        if (srcset) {
            var parts = srcset.split(",");
            if (parts.length > 0) {
                var first = parts[0].trim().split(" ")[0];
                if (first) s = first;
            }
        }
    }
    if (!s || s.indexOf("data:image") === 0) {
        s = el.attr("data-src") || el.attr("data-original") || el.attr("data-lazy-src") || "";
    }
    return resolveUrl(s);
}

function fetchRetry(url, maxRetries) {
    if (typeof maxRetries === "undefined") maxRetries = 1;
    var lastResp = null;
    for (var i = 0; i <= maxRetries; i++) {
        var resp = fetch(url, FETCH_OPTIONS);
        if (resp && resp.ok) return resp;
        lastResp = resp;
    }
    return lastResp;
}

function parseItems(doc) {
    var items = [];
    if (!doc) return items;

    var links = doc.select("a[href*='/truyen-hentai/']");
    var seen = {};

    for (var i = 0; i < links.size(); i++) {
        var a = links.get(i);
        var href = a.attr("href") || "";

        if (href.indexOf("/chuong-") >= 0 || href.indexOf("/chap-") >= 0) continue;
        var m = href.match(/\/truyen-hentai\/([^\/\?#]+)/);
        if (!m) continue;

        var slug = m[1];
        var fullUrl = BASE_URL + "/truyen-hentai/" + slug;
        if (seen[fullUrl]) continue;

        var imgEl = selFirst(a, "img");
        var cover = imgSrc(imgEl);

        var titleEl = selFirst(a, "div[title]");
        var title = "";
        if (titleEl) {
            title = titleEl.attr("title");
        }
        if (!title && imgEl) {
            title = imgEl.attr("alt");
        }
        if (!title) {
            title = txt(a);
        }
        if (!title) continue;

        var chapEl = selFirst(a, "span[title], span.font-semibold");
        var chap = "";
        if (chapEl) {
            chap = chapEl.attr("title") || txt(chapEl);
        }

        seen[fullUrl] = true;
        items.push({
            name: title,
            link: fullUrl,
            cover: cover,
            description: chap,
            host: HOST
        });
    }

    return items;
}
