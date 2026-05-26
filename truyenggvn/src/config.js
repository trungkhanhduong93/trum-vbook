var BASE_URL = "https://truyenggvn.com";
var HOST = "https://truyenggvn.com";

var FETCH_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.5",
    "Referer": BASE_URL + "/"
};

function selFirst(el, css) {
    var items = el.select(css);
    return items.size() > 0 ? items.get(0) : null;
}

function trimText(s) {
    return s ? String(s).replace(/^\s+|\s+$/g, "") : "";
}

function resolveUrl(href) {
    if (!href) return "";
    href = trimText(href);
    if (href.indexOf("http") === 0) return href;
    if (href.indexOf("//") === 0) return "https:" + href;
    if (href.indexOf("/") === 0) return BASE_URL + href;
    return BASE_URL + "/" + href;
}

function fetchRetry(url) {
    var doc = null;
    try {
        doc = Http.get(url).headers({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
            "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.8",
            "Referer": BASE_URL + "/"
        }).html();
    } catch (e) {}

    var title = doc ? doc.select("title").text() : "";
    if (doc && title.indexOf("Just a moment") === -1 && title.indexOf("Cloudflare") === -1) {
        return doc;
    }

    // Fallback sang Browser
    var browser = null;
    try {
        browser = Engine.newBrowser();
        browser.launch(url, 15000);
        var browserDoc = browser.html();
        browser.close();
        browser = null;
        return browserDoc;
    } catch (e) {
        if (browser) { try { browser.close(); } catch (err) {} }
        return null;
    }
}

// Parse danh sách truyện từ trang listing: ul.list_grid > li.comic-item
function parseItems(doc) {
    var items = [];
    var cards = doc.select("li.comic-item");
    if (!cards || cards.size() === 0) {
        cards = doc.select("ul.list_grid li");
    }

    var seen = {};
    for (var i = 0; i < cards.size(); i++) {
        var card = cards.get(i);

        var titleA = selFirst(card, ".book_info .book_name a");
        if (!titleA) titleA = selFirst(card, ".book_name a");
        if (!titleA) continue;

        var name = trimText(titleA.text());
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
        var chapText = lastChap ? trimText(lastChap.text()) : "";

        var timeEl = selFirst(card, ".time-ago");
        var timeText = timeEl ? trimText(timeEl.text()) : "";

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

// Phân trang kiểu /trang-N.html
function getNextPage(doc, currentPage) {
    var next = String(currentPage + 1);
    var pageLinks = doc.select("div.page_redirect a, .pagination a");
    for (var i = 0; i < pageLinks.size(); i++) {
        var h = pageLinks.get(i).attr("href") || "";
        if (h.indexOf("trang-" + next) >= 0 || h.indexOf("page=" + next) >= 0) return next;
    }
    return null;
}

function withPage(url, page) {
    if (page <= 1) return url;
    var u = url.replace(/\/$/, "");
    if (u.indexOf("trang-") >= 0) {
        return u.replace(/trang-\d+(\.html)?/, "trang-" + page + ".html");
    }
    return u + "/trang-" + page + ".html";
}
