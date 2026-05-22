var BASE_URL = "https://www.toptruyenzone2.com";
var HOST = "https://www.toptruyenzone2.com";

var FETCH_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.5",
    "Referer": BASE_URL + "/"
};
var FETCH_OPTIONS = { headers: FETCH_HEADERS };

// ─── Helper functions ──────────────────────────────────────────────

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
    var res = fetch(url, FETCH_OPTIONS);
    if (!res) return res;
    if (!res.ok && !(res.status >= 400 && res.status < 500)) {
        res = fetch(url, FETCH_OPTIONS);
    }
    return res;
}

// ─── Parse story cards from listing pages ──────────────────────────
// Structure: div.items > div.row > div.item > figure
//   .image > a > img  (cover)
//   figcaption > h3 > a  (title + link)
//   figcaption > ul > li.chapter > a  (latest chapter)
function parseItems(doc) {
    var items = [];
    var cards = doc.select(".item");
    if (cards.size() === 0) {
        cards = doc.select("div.items div.item");
    }
    for (var i = 0; i < cards.size(); i++) {
        var card = cards.get(i);

        // Title & link
        var titleA = selFirst(card, ".caption h3 a");
        if (!titleA) titleA = selFirst(card, "figcaption h3 a");
        if (!titleA) continue;
        var name = titleA.text().trim();
        var href = titleA.attr("href") || "";
        if (!name || !href) continue;
        var link = resolveUrl(href);

        // Cover image
        var img = selFirst(card, ".image-item a img");
        if (!img) img = selFirst(card, "div.image a img");
        var cover = "";
        if (img) {
            cover = img.attr("data-original") || img.attr("data-src") || img.attr("src") || "";
            if (cover && cover.indexOf("http") !== 0) {
                if (cover.indexOf("//") === 0) {
                    cover = "https:" + cover;
                } else {
                    cover = resolveUrl(cover);
                }
            }
        }

        // Status
        var status = "Đang Ra";
        var fullLabel = selFirst(card, "span.label-full, span.full, i.icon-full");
        if (fullLabel) {
            status = "Full";
        }

        // Latest chapter
        var chapA = selFirst(card, ".chapter-detail a.chapter");
        if (!chapA) chapA = selFirst(card, "figcaption ul li.chapter a");
        var chapText = chapA ? chapA.text().trim() : "";

        // Time
        var timeEl = selFirst(card, ".chapter-detail i.time");
        if (!timeEl) timeEl = selFirst(card, "figcaption ul li.chapter i.time");
        var timeText = timeEl ? timeEl.text().trim() : "";

        // Build description: Tình trạng • Chapter • Thời gian
        var desc = status;
        if (chapText) desc += " • " + chapText;
        if (timeText) desc += " • " + timeText;

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

// ─── Pagination: find next page link ───────────────────────────────
function getNextPage(doc, currentPage) {
    var nextPage = String(currentPage + 1);
    // Look for pagination links containing page=N
    var pageLinks = doc.select("ul.pagination a[href]");
    for (var j = 0; j < pageLinks.size(); j++) {
        var ph = pageLinks.get(j).attr("href") || "";
        if (ph.indexOf("page=" + nextPage) >= 0) return nextPage;
    }
    return null;
}
