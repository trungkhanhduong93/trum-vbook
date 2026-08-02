var BASE_URL = "https://fastscan.org";
var HOST = "https://fastscan.org";

var FETCH_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.5",
    "Referer": BASE_URL + "/"
};

function selFirst(el, css) {
    if (!el) return null;
    var items = el.select(css);
    return (items && items.size() > 0) ? items.get(0) : null;
}

function resolveUrl(url) {
    if (!url) return "";
    url = url.trim();
    if (url.indexOf("http") === 0) return url;
    if (url.indexOf("//") === 0) return "https:" + url;
    if (url.indexOf("/") === 0) return BASE_URL + url;
    return BASE_URL + "/" + url;
}

function withPage(url, page) {
    if (!page || page === 1) return url;
    if (url.indexOf("?") >= 0) {
        return url + "&page=" + page;
    }
    return url + "?page=" + page;
}

// Chỉ nhận diện challenge qua <title> — KHÔNG dùng outerHtml(): trang detail
// nặng ~700KB, dựng nguyên chuỗi trong Rhino vừa chậm vừa dễ chết ngầm.
function isChallenge(doc) {
    if (!doc) return true;
    var title = "";
    try { title = doc.select("title").text(); } catch (e) {}
    return title.indexOf("Just a moment") !== -1 ||
           title.indexOf("Cloudflare") !== -1 ||
           title.indexOf("Attention Required") !== -1;
}

function fetchRetry(url) {
    var doc = null;
    try {
        doc = Http.get(url).headers(FETCH_HEADERS).html();
    } catch (e) {}

    if (doc && !isChallenge(doc)) return doc;

    // Browser chỉ chạy khi thật sự bị chặn. Đã đo: fastscan.org trả HTML sạch
    // cho request thường (kể cả không User-Agent), nên nhánh này gần như không dùng.
    var browser = null;
    try {
        browser = Engine.newBrowser();
        try { browser.setUserAgent(FETCH_HEADERS["User-Agent"]); } catch (e2) {}
        browser.launch(url, 15000);
        var bdoc = browser.html();
        browser.close();
        browser = null;
        if (bdoc) return bdoc;
    } catch (err) {
        if (browser) { try { browser.close(); } catch (e3) {} }
    }

    return doc;
}

function parseItems(doc) {
    var items = [];
    if (!doc) return items;
    var seen = {};

    var storyEls = doc.select(".list_grid li, ul.list_grid li, .list-stories li, ul.list-stories li");
    if (!storyEls || storyEls.size() === 0) {
        storyEls = doc.select("li");
    }

    for (var i = 0; i < storyEls.size(); i++) {
        var li = storyEls.get(i);

        var aName = selFirst(li, ".book_name a");
        if (!aName) aName = selFirst(li, "h3 a");
        if (!aName) aName = selFirst(li, ".book_avatar a");
        if (!aName) continue;

        var name = aName.attr("title") || aName.text().trim();
        var link = aName.attr("href") || "";
        if (!name || !link) continue;

        link = resolveUrl(link);
        if (link.indexOf("/the-loai/") >= 0 || link.indexOf("/danh-sach/") >= 0 || link.indexOf("/tim-kiem") >= 0 || link.indexOf("/thong-bao") >= 0 || link === BASE_URL || link === BASE_URL + "/") continue;

        var imgEl = selFirst(li, ".book_avatar img");
        if (!imgEl) imgEl = selFirst(li, "img");

        var cover = "";
        if (imgEl) {
            cover = imgEl.attr("data-src") || imgEl.attr("data-original") || imgEl.attr("src") || "";
            cover = resolveUrl(cover);
        }

        var chapEl = selFirst(li, ".last_chapter a");
        var lastChap = chapEl ? chapEl.text().trim().replace(/\s+/g, ' ') : "";

        if (seen[link]) continue;
        seen[link] = true;

        items.push({
            name: name,
            link: link,
            cover: cover,
            description: lastChap,
            host: HOST
        });
    }

    return items;
}

// Phân trang của fastscan nằm trong div.page_redirect (KHÔNG phải .pagination).
function getNextPage(doc, currentPage) {
    if (!doc) return null;
    var nextPage = currentPage + 1;
    var pageLinks = doc.select(".page_redirect a");
    for (var i = 0; i < pageLinks.size(); i++) {
        var a = pageLinks.get(i);
        var href = String(a.attr("href") || "");
        // So khớp đúng số trang: indexOf("page=2") sẽ dính nhầm "page=206".
        var m = href.match(/[?&]page=(\d+)/);
        if (m && parseInt(m[1], 10) >= nextPage) {
            return nextPage.toString();
        }
    }
    return null;
}
