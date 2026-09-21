var DEFAULT_BASE = "https://vinahentai.help";
var BASE_URL = DEFAULT_BASE;
var HOST = DEFAULT_BASE;

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

// ─── Remote config & Auto Domain Sync ──────────────────────────────
// Khi vinahentai đổi domain, chỉ cần sửa file domain.txt trên GitHub.
// Plugin tự đọc qua CDN jsdelivr (~200ms).
var __REMOTE_CHECKED = false;
var REMOTE_CONFIG_URL = "https://cdn.jsdelivr.net/gh/trungkhanhduong93/trum-vbook@main/vinahentai/domain.txt";

function setBase(origin) {
    if (!origin) return;
    origin = String(origin).replace(/\/+$/, "");
    BASE_URL = origin;
    HOST = origin;
    FETCH_HEADERS["Referer"] = origin + "/";
}

function extractOrigin(url) {
    if (!url) return null;
    var m = String(url).match(/^https?:\/\/(?:www\.)?(vinahentai\.[a-z0-9-]+)/i);
    return m ? "https://" + m[1].toLowerCase() : null;
}

function syncBaseFromUrl(url) {
    var origin = extractOrigin(url);
    if (origin && origin !== BASE_URL) {
        setBase(origin);
    }
}

function swapDomain(url) {
    if (!url) return BASE_URL;
    if (url.indexOf("http") !== 0) {
        return BASE_URL + (url.charAt(0) === "/" ? url : "/" + url);
    }
    return String(url).replace(/^(https?:\/\/)(?:www\.)?vinahentai\.[a-z0-9-]+/i, BASE_URL);
}

function resolveFromRemoteConfig() {
    if (__REMOTE_CHECKED) return;
    __REMOTE_CHECKED = true;
    try {
        var res = fetch(REMOTE_CONFIG_URL, { timeout: 4000 });
        if (res && res.ok) {
            var doc = res.html();
            if (doc) {
                var text = doc.text().trim();
                var dm = text.match(/(?:https?:\/\/)?(?:www\.)?(vinahentai\.[a-z0-9-]+)/i);
                if (dm) {
                    var newDomain = "https://" + dm[1].toLowerCase();
                    if (newDomain !== BASE_URL) {
                        setBase(newDomain);
                    }
                }
            }
        }
    } catch (e) {}
}

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
    if (!u) return "";
    u = String(u).trim();
    if (!u) return "";
    var full = u;
    if (u.indexOf("http://") === 0 || u.indexOf("https://") === 0) {
        if (/https?:\/\/(?:www\.)?vinahentai\.[a-z0-9-]+/i.test(u)) {
            full = swapDomain(u);
        } else {
            full = u;
        }
    }
    else if (u.indexOf("//") === 0) full = "https:" + u;
    else if (u.indexOf("/") === 0) full = BASE_URL + u;
    else full = BASE_URL + "/" + u;
    return safeEncodeUrl(full);
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
    if (!s || s.indexOf("data:image") === 0) return "";
    return resolveUrl(s);
}

function fetchRetry(url, maxRetries) {
    resolveFromRemoteConfig();
    if (typeof maxRetries === "undefined") maxRetries = 1;
    var cleanUrl = resolveUrl(url);
    for (var i = 0; i <= maxRetries; i++) {
        try {
            var resp = fetch(cleanUrl, FETCH_OPTIONS);
            if (resp && resp.ok) return resp;
        } catch (e) {}
    }
    return null;
}

function fetchDoc(url) {
    resolveFromRemoteConfig();
    var cleanUrl = resolveUrl(url);
    var doc = null;
    try {
        var resp = fetchRetry(cleanUrl);
        if (resp && resp.ok) {
            doc = resp.html();
        }
    } catch (e1) {}

    if (!doc) {
        try {
            if (typeof Http !== "undefined" && typeof Http.get === "function") {
                doc = Http.get(cleanUrl).headers(FETCH_HEADERS).timeout(8000).html();
            }
        } catch (e2) {}
    }

    if (doc) {
        try {
            var cano = selFirst(doc, "link[rel='canonical']");
            if (cano) {
                var cHref = cano.attr("href");
                if (cHref) syncBaseFromUrl(cHref);
            }
        } catch (eCano) {}
    }

    return doc;
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
            var h3 = selFirst(a, "h3");
            if (h3) title = txt(h3);
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
