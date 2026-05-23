var BASE_URL = "https://toptruyen.cc";
var HOST = "https://toptruyen.cc";

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
    let doc = null;
    try {
        doc = Http.get(url).headers({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
            "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.8",
            "Referer": BASE_URL + "/"
        }).html();
    } catch (e) {
        // Ignore and fallback
    }

    let title = doc ? doc.select("title").text() : "";

    if (doc && title.indexOf("Just a moment") === -1 && title.indexOf("Cloudflare") === -1) {
        return doc;
    }

    // Fallback to browser
    let browser = Engine.newBrowser();
    browser.launch(url, 15000);
    let browserDoc = browser.html();
    browser.close();
    return browserDoc;
}

// Story card: div.comic-item > .comic-poster a.comic-link + .comic-meta h3.comic-title a
function parseItems(doc) {
    var items = [];
    var seen = {};

    var cards = doc.select("div.comic-item");
    for (var i = 0; i < cards.size(); i++) {
        var card = cards.get(i);

        var titleA = selFirst(card, ".comic-meta .comic-title a");
        if (!titleA) titleA = selFirst(card, "a.comic-link");
        if (!titleA) continue;

        var name = titleA.attr("title") || titleA.text().trim();
        var href = titleA.attr("href") || "";
        if (!name || !href) continue;
        var link = resolveUrl(href);
        if (seen[link]) continue;
        seen[link] = true;

        // Cover is lazy-loaded; placeholder src is a data: URI, real src in data-lazy-src.
        var img = selFirst(card, ".comic-poster img.thumbnail");
        if (!img) img = selFirst(card, ".comic-poster img");
        var cover = "";
        if (img) {
            cover = img.attr("data-lazy-src") || img.attr("data-src") || "";
            if (!cover) {
                var s = img.attr("src") || "";
                if (s.indexOf("data:image") !== 0) cover = s;
            }
            if (cover && cover.indexOf("http") !== 0) {
                if (cover.indexOf("//") === 0) cover = "https:" + cover;
                else cover = resolveUrl(cover);
            }
        }

        var chapEl = selFirst(card, ".comic-chapter-last a");
        if (!chapEl) chapEl = selFirst(card, ".comic-chapter-last");
        var chapText = chapEl ? chapEl.text().trim() : "";

        var viewsEl = selFirst(card, ".metric-box .views-count");
        var viewsText = viewsEl ? viewsEl.text().trim() : "";

        var desc = "";
        if (chapText) desc = chapText;
        if (viewsText) desc += (desc ? " • 👁 " : "👁 ") + viewsText;

        items.push({
            name: name,
            cover: cover,
            link: link,
            description: desc,
            host: HOST
        });
    }

    return items;
}

// WordPress paging: /page/N/
function withPage(url, page) {
    if (page <= 1) return url;
    var u = url.replace(/\/$/, "");
    if (u.indexOf("/page/") >= 0) {
        return u.replace(/\/page\/\d+/, "/page/" + page);
    }
    // Search URL has ?s=...; insert /page/N/ before query string.
    var qIdx = u.indexOf("?");
    if (qIdx >= 0) {
        return u.substring(0, qIdx) + "/page/" + page + "/" + u.substring(qIdx);
    }
    return u + "/page/" + page + "/";
}

function getNextPage(doc, currentPage) {
    var next = String(currentPage + 1);
    var pageLinks = doc.select("nav.pagination a, ul.pagination a, .page-numbers a");
    for (var i = 0; i < pageLinks.size(); i++) {
        var h = pageLinks.get(i).attr("href") || "";
        if (h.indexOf("/page/" + next + "/") >= 0 || h.indexOf("/page/" + next) >= 0) return next;
    }
    return null;
}
