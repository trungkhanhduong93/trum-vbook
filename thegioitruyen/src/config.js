var BASE_URL = "https://thegioitruyen.vn";
var HOST = BASE_URL;
try { if (CONFIG_URL) { BASE_URL = String(CONFIG_URL).replace(/\/+$/, ""); HOST = BASE_URL; } } catch (e) {}

var FETCH_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.5",
    "Referer": BASE_URL + "/"
};

function decodeEntities(s) {
    return String(s || "")
        .replace(/&amp;/g, "&").replace(/&#0?38;/g, "&")
        .replace(/&#0?39;/g, "'").replace(/&apos;/g, "'")
        .replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">")
        .replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

function resolveUrl(url) {
    if (!url) return BASE_URL;
    url = String(url).trim();
    if (url.indexOf("http") === 0) return url;
    if (url.indexOf("//") === 0) return "https:" + url;
    return BASE_URL + (url.charAt(0) === "/" ? url : "/" + url);
}

// Tải HTML dạng CHUỖI (nhẹ — không dựng DOM Jsoup cho trang WordPress nặng).
// Chỉ fallback browser khi gặp challenge Cloudflare (thực tế site này không challenge).
function httpGet(url) {
    var s = "";
    try { s = Http.get(url).headers(FETCH_HEADERS).string() || ""; } catch (e) { s = ""; }

    if (!s || s.indexOf("Just a moment") !== -1 || s.indexOf("challenge-platform") !== -1 || s.indexOf("cf-browser-verification") !== -1) {
        var browser = null;
        try {
            browser = Engine.newBrowser();
            browser.launch(url, 15000);
            var doc = browser.html();
            browser.close(); browser = null;
            if (doc) { try { s = doc.outerHtml(); } catch (e2) { try { s = doc.html(); } catch (e3) {} } }
        } catch (eb) { if (browser) { try { browser.close(); } catch (e4) {} } }
    }
    return s || "";
}

// Parse card listing bằng regex (tách theo class="tgt-card")
function parseItems(html) {
    var items = [];
    var seen = {};
    var parts = String(html).split('"tgt-card"');
    for (var i = 1; i < parts.length; i++) {
        var seg = parts[i].slice(0, 1500);
        var lm = seg.match(/href="(https?:\/\/[^"]*\/truyen\/[a-z0-9-]+\/)"/i);
        if (!lm) continue;
        var link = resolveUrl(lm[1]);
        if (seen[link]) continue;
        seen[link] = true;

        var cm = seg.match(/<img\s+src="([^"]+)"/i);
        var cover = cm ? resolveUrl(cm[1]) : "";
        var nm = seg.match(/alt="([^"]+)"/i);
        var name = nm ? decodeEntities(nm[1]) : "";
        if (!name) continue;

        var ch = seg.match(/tgt-card-chap"[^>]*>\s*<span>([^<]+)<\/span>/i);
        var desc = ch ? decodeEntities(ch[1]) : "";

        items.push({ name: name, cover: cover, link: link, description: desc, host: HOST });
    }
    return items;
}

// WordPress phân trang /path/page/N/ ; search /page/N/?s=key
function withPage(url, page) {
    page = parseInt(page) || 1;
    if (page <= 1) return url;
    var qi = url.indexOf("?");
    if (qi >= 0) {
        var base = url.substring(0, qi).replace(/\/+$/, "");
        var qs = url.substring(qi);
        return base + "/page/" + page + "/" + qs;
    }
    return url.replace(/\/+$/, "") + "/page/" + page + "/";
}

function getNextPage(html, currentPage) {
    var next = (parseInt(currentPage) || 1) + 1;
    if (html.indexOf("/page/" + next + "/") >= 0 || html.indexOf("/page/" + next + "?") >= 0) {
        return String(next);
    }
    return null;
}
