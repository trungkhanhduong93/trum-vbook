var BASE_URL = "https://truyenggvn.com";
var HOST = BASE_URL;
var REFERER = BASE_URL + "/";

var REQ_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,*/*;q=0.8",
    "Accept-Language": "vi-VN,vi;q=0.9",
    "Referer": REFERER
};

function selFirst(el, css) {
    return el.selectFirst(css);
}

function trimText(s) {
    return s ? String(s).replace(/^\s+|\s+$/g, "") : "";
}

function resolveUrl(href) {
    if (!href) return "";
    if (href.charAt(0) !== " " && href.indexOf("http") === 0) return href;
    href = trimText(href);
    if (href.indexOf("http") === 0) return href;
    if (href.indexOf("//") === 0) return "https:" + href;
    if (href.charAt(0) === "/") return BASE_URL + href;
    return BASE_URL + "/" + href;
}

function fetchRetry(url) {
    var doc = null;
    try {
        doc = Http.get(url).headers(REQ_HEADERS).html();
    } catch (e) {}

    if (doc) {
        var t = doc.selectFirst("title");
        var title = t ? t.text() : "";
        if (title.indexOf("Just a moment") === -1 && title.indexOf("Cloudflare") === -1) {
            return doc;
        }
    }

    var browser = null;
    try {
        browser = Engine.newBrowser();
        browser.launch(url, 15000);
        var browserDoc = browser.html();
        browser.close();
        return browserDoc;
    } catch (e) {
        if (browser) { try { browser.close(); } catch (err) {} }
        return null;
    }
}

function parseItems(doc) {
    var items = [];
    var cards = doc.select("li.comic-item");
    var n = cards.size();
    if (n === 0) {
        cards = doc.select("ul.list_grid li");
        n = cards.size();
    }

    var seen = {};
    for (var i = 0; i < n; i++) {
        var card = cards.get(i);

        var titleA = card.selectFirst(".book_name a");
        if (!titleA) continue;

        var href = titleA.attr("href");
        if (!href) continue;
        var link = resolveUrl(href);
        if (seen[link]) continue;

        var name = trimText(titleA.text());
        if (!name) continue;
        seen[link] = true;

        var img = card.selectFirst(".book_avatar img");
        var cover = "";
        if (img) {
            cover = img.attr("src") || img.attr("data-original") || img.attr("data-src") || "";
            if (cover && cover.indexOf("http") !== 0) {
                if (cover.indexOf("//") === 0) cover = "https:" + cover;
                else cover = resolveUrl(cover);
            }
        }

        var lastChap = card.selectFirst(".last_chapter a");
        var timeEl = card.selectFirst(".time-ago");
        var desc = "";
        if (lastChap) desc = trimText(lastChap.text());
        if (timeEl) {
            var t = trimText(timeEl.text());
            if (t) desc += (desc ? " • " : "") + t;
        }

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

function getNextPage(doc, currentPage) {
    var next = String(currentPage + 1);
    var needle1 = "trang-" + next;
    var needle2 = "page=" + next;
    var pageLinks = doc.select("div.page_redirect a, .pagination a");
    var n = pageLinks.size();
    for (var i = 0; i < n; i++) {
        var h = pageLinks.get(i).attr("href") || "";
        if (h.indexOf(needle1) >= 0 || h.indexOf(needle2) >= 0) return next;
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
