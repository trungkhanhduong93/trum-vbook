var BASE_URL = "https://vivicomic.com";
var HOST = BASE_URL;
try { if (CONFIG_URL) { BASE_URL = String(CONFIG_URL).replace(/\/+$/, ""); HOST = BASE_URL; } } catch (e) {}

var FETCH_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.5",
    "Referer": BASE_URL + "/"
};

function selFirst(el, css) {
    var items = el.select(css);
    return items.size() > 0 ? items.get(0) : null;
}

function resolveUrl(url) {
    if (!url) return BASE_URL;
    url = String(url).trim();
    if (url.indexOf("http") === 0) return url;
    if (url.indexOf("//") === 0) return "https:" + url;
    return BASE_URL + (url.charAt(0) === "/" ? url : "/" + url);
}

function fetchRetry(url) {
    var doc = null;
    try {
        doc = Http.get(url).headers(FETCH_HEADERS).html();
    } catch (e) {}

    if (doc) {
        var title = doc.select("title").text();
        if (title.indexOf("Just a moment") === -1 && title.indexOf("Cloudflare") === -1) {
            return doc;
        }
    }

    var browser = null;
    try {
        browser = Engine.newBrowser();
        browser.launch(url, 15000);
        var bdoc = browser.html();
        browser.close();
        return bdoc;
    } catch (e2) {
        if (browser) { try { browser.close(); } catch (e3) {} }
        return doc;
    }
}

// Card listing: div.comic-card > a.comic-card-thumb[href=/truyen-tranh/{slug}] > img[src][alt]
function parseItems(doc) {
    var items = [];
    var seen = {};
    var cards = doc.select(".comic-card");
    for (var i = 0; i < cards.size(); i++) {
        var card = cards.get(i);

        var a = selFirst(card, "a.comic-card-thumb");
        if (!a) a = selFirst(card, "a[href*='/truyen-tranh/']");
        if (!a) continue;
        var href = a.attr("href") || "";
        if (!href || href.indexOf("/truyen-tranh/") < 0) continue;
        var link = resolveUrl(href);
        if (seen[link]) continue;
        seen[link] = true;

        var img = selFirst(card, "img");
        var cover = "";
        var name = "";
        if (img) {
            cover = img.attr("src") || img.attr("data-src") || "";
            if (cover && cover.indexOf("http") !== 0) cover = resolveUrl(cover);
            name = (img.attr("alt") || "").trim();
        }
        if (!name) {
            var t = selFirst(card, ".comic-card-title") || selFirst(card, ".comic-title") || selFirst(card, "h3");
            if (t) name = t.text().trim();
        }
        if (!name) continue;

        // Số chương mới nhất (≈ tổng số chap) hiển thị dưới tên
        var chapEl = selFirst(card, ".comic-card-stats .chap-link") || selFirst(card, ".chap-link");
        var desc = chapEl ? chapEl.text().trim() : "";

        items.push({ name: name, cover: cover, link: link, description: desc, host: HOST });
    }
    return items;
}

// Phân trang ?page=N
function withPage(url, page) {
    page = parseInt(page) || 1;
    if (page <= 1) return url;
    var sep = (url.indexOf("?") >= 0) ? "&" : "?";
    return url + sep + "page=" + page;
}

function getNextPage(doc, currentPage) {
    var next = (parseInt(currentPage) || 1) + 1;
    var html = doc.html();
    if (html.indexOf("page=" + next + "\"") >= 0 || html.indexOf("page=" + next + "&") >= 0 || html.indexOf("page=" + next + "'") >= 0) {
        return String(next);
    }
    return null;
}
