var BASE_URL = "https://www.toptruyenzone2.com";
var HOST = "https://www.toptruyenzone2.com";

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
    var doc = null;
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

    var title = doc ? doc.select("title").text() : "";

    if (doc && title.indexOf("Just a moment") === -1 && title.indexOf("Cloudflare") === -1) {
        return doc;
    }

    // Fallback to browser
    var browser = Engine.newBrowser();
    browser.launch(url, 15000);
    var browserDoc = browser.html();
    browser.close();
    return browserDoc;
}

// Story card parser supporting both old and new layout
function parseItems(doc) {
    var items = [];
    var seen = {};

    var cards = doc.select("div.item-manga");
    if (!cards || cards.size() === 0) {
        cards = doc.select("div.comic-item");
    }

    for (var i = 0; i < cards.size(); i++) {
        var card = cards.get(i);

        var titleA = selFirst(card, "h3 a.title-manga");
        if (!titleA) titleA = selFirst(card, ".caption h3 a");
        if (!titleA) titleA = selFirst(card, ".comic-meta .comic-title a");
        if (!titleA) titleA = selFirst(card, "a.comic-link");
        if (!titleA) titleA = selFirst(card, "a.title-manga");
        if (!titleA) titleA = selFirst(card, "a");
        if (!titleA) continue;

        var name = titleA.attr("title") || titleA.text().trim();
        var href = titleA.attr("href") || "";
        if (!name || !href) continue;
        var link = resolveUrl(href);
        if (seen[link]) continue;
        seen[link] = true;

        var img = selFirst(card, ".image-item img");
        if (!img) img = selFirst(card, ".comic-poster img.thumbnail");
        if (!img) img = selFirst(card, "img");
        var cover = "";
        if (img) {
            cover = img.attr("data-lazy-src") || img.attr("data-src") || img.attr("src") || "";
            if (cover && cover.indexOf("http") !== 0) {
                if (cover.indexOf("//") === 0) cover = "https:" + cover;
                else cover = resolveUrl(cover);
            }
        }

        var chapEl = selFirst(card, "ul li.chapter-detail a.chapter");
        if (!chapEl) chapEl = selFirst(card, ".comic-chapter-last a");
        var chapText = chapEl ? chapEl.text().trim() : "";

        var timeEl = selFirst(card, "ul li.chapter-detail i.time");
        var timeText = timeEl ? timeEl.text().trim() : "";

        var desc = "";
        if (chapText) desc = chapText;
        if (timeText) desc += (desc ? " • " : "") + timeText;

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

// Handles query params correctly like ?page=N or ?s=kw&page=N
function withPage(url, page) {
    if (page <= 1) return url;
    if (url.indexOf("?") >= 0) {
        var u = url.replace(/([\?&])page=\d+/, "");
        u = u.replace(/[&?]$/, "");
        return u + (u.indexOf("?") >= 0 ? "&" : "?") + "page=" + page;
    }
    return url + "?page=" + page;
}

function getNextPage(doc, currentPage) {
    var next = String(currentPage + 1);
    var pageLinks = doc.select(".pagination a, .page-link, .page-item a");
    for (var i = 0; i < pageLinks.size(); i++) {
        var a = pageLinks.get(i);
        var h = a.attr("href") || "";
        var t = a.text().trim();
        if (t === next || h.indexOf("page=" + next) >= 0) {
            return next;
        }
    }
    return null;
}
