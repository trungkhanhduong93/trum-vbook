var BASE_URL = "https://truyenqqko.com";
var HOST = "https://truyenqqko.com";

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
    var res = fetch(url, FETCH_OPTIONS);
    if (!res) return res;
    if (!res.ok && !(res.status >= 400 && res.status < 500)) {
        res = fetch(url, FETCH_OPTIONS);
    }
    return res;
}

// Parse story cards from listing pages: ul.list_grid > li
function parseItems(doc) {
    var items = [];
    var cards = doc.select("ul.list_grid li");
    if (!cards || cards.size() === 0) {
        cards = doc.select(".list_grid_out li");
    }

    var seen = {};
    for (var i = 0; i < cards.size(); i++) {
        var card = cards.get(i);

        var titleA = selFirst(card, ".book_info .book_name a");
        if (!titleA) titleA = selFirst(card, ".book_name a");
        if (!titleA) continue;

        var name = titleA.text().trim();
        var href = titleA.attr("href") || "";
        if (!name || !href) continue;
        var link = resolveUrl(href);
        if (seen[link]) continue;
        seen[link] = true;

        var img = selFirst(card, ".book_avatar a img");
        var cover = "";
        if (img) {
            cover = img.attr("src") || img.attr("data-original") || img.attr("data-src") || "";
            if (cover && cover.indexOf("http") !== 0) {
                if (cover.indexOf("//") === 0) cover = "https:" + cover;
                else cover = resolveUrl(cover);
            }
        }

        var lastChap = selFirst(card, ".last_chapter a");
        var chapText = lastChap ? lastChap.text().trim() : "";

        var timeEl = selFirst(card, ".time-ago");
        var timeText = timeEl ? timeEl.text().trim() : "";

        var hotEl = selFirst(card, ".type-label.hot");
        var hotText = hotEl ? hotEl.text().trim() : "";

        var desc = "";
        if (chapText) desc = chapText;
        if (timeText) desc += (desc ? " • " : "") + timeText;
        if (hotText) desc += (desc ? " • " : "") + hotText;

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

// QQ uses /trang-N.html style pagination
function getNextPage(doc, currentPage) {
    var next = String(currentPage + 1);
    var pageLinks = doc.select("div.page_redirect a, .pagination a");
    for (var i = 0; i < pageLinks.size(); i++) {
        var h = pageLinks.get(i).attr("href") || "";
        if (h.indexOf("trang-" + next) >= 0 || h.indexOf("page=" + next) >= 0) return next;
    }
    return null;
}

// Append paged path/query to a base listing URL
function withPage(url, page) {
    if (page <= 1) return url;
    // /the-loai/{slug}-{id} → /the-loai/{slug}-{id}/trang-{p}.html
    // /truyen-moi-cap-nhat → /truyen-moi-cap-nhat/trang-{p}.html
    var u = url.replace(/\/$/, "");
    if (u.indexOf("trang-") >= 0) {
        return u.replace(/trang-\d+(\.html)?/, "trang-" + page + ".html");
    }
    return u + "/trang-" + page + ".html";
}
