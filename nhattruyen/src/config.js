var DEFAULT_BASE = "https://nhattruyenqq.com";
var BASE_URL = DEFAULT_BASE;
var HOST = DEFAULT_BASE;

var MIRRORS = [
    "https://nhattruyenqq.com",
    "https://nhattruyenmoi.com",
    "https://nhattruyento.com"
];

var FETCH_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.8",
    "Referer": BASE_URL + "/"
};

function setBase(origin) {
    if (!origin) return;
    BASE_URL = origin;
    HOST = origin;
    FETCH_HEADERS["Referer"] = origin + "/";
}

function syncBaseFromUrl(url) {
    if (!url) return;
    var m = String(url).match(/^https?:\/\/((?:www\.)?nhattruyen[a-z0-9-]*\.[a-z]+)/i);
    if (m) {
        var origin = "https://" + m[1].toLowerCase();
        if (origin !== BASE_URL) setBase(origin);
    }
}

function swapDomainTo(url, targetDomain) {
    if (!url) return targetDomain;
    if (url.indexOf("http") !== 0) {
        return targetDomain + (url.charAt(0) === "/" ? url : "/" + url);
    }
    return String(url).replace(/^https?:\/\/(?:www\.)?nhattruyen[a-z0-9-]*\.[a-z]+/i, targetDomain);
}

function fetchRetry(url) {
    syncBaseFromUrl(url);
    var currentUrl = swapDomainTo(url, BASE_URL);
    var doc = null;

    try {
        doc = Http.get(currentUrl).headers({
            "User-Agent": FETCH_HEADERS["User-Agent"],
            "Accept": FETCH_HEADERS["Accept"],
            "Accept-Language": FETCH_HEADERS["Accept-Language"],
            "Referer": BASE_URL + "/"
        }).html();
    } catch (e) {}

    var title = doc ? doc.select("title").text() : "";
    if (doc && title && title.indexOf("Just a moment") === -1 && title.indexOf("Cloudflare") === -1 && title.indexOf("404") === -1) {
        return doc;
    }

    for (var i = 0; i < MIRRORS.length; i++) {
        var mirror = MIRRORS[i];
        if (mirror === BASE_URL) continue;
        var mirrorUrl = swapDomainTo(url, mirror);
        try {
            var res = Http.get(mirrorUrl).headers({
                "User-Agent": FETCH_HEADERS["User-Agent"],
                "Accept": FETCH_HEADERS["Accept"],
                "Accept-Language": FETCH_HEADERS["Accept-Language"],
                "Referer": mirror + "/"
            }).html();
            if (res) {
                var t = res.select("title").text();
                if (t && t.indexOf("Just a moment") === -1 && t.indexOf("Cloudflare") === -1 && t.indexOf("404") === -1) {
                    setBase(mirror);
                    return res;
                }
            }
        } catch (err) {}
    }

    try {
        var browser = Engine.newBrowser();
        browser.launch(currentUrl, 10000);
        var browserDoc = browser.html();
        browser.close();
        if (browserDoc) return browserDoc;
    } catch (err) {}

    return doc;
}

function selFirst(el, css) {
    if (!el) return null;
    var items = el.select(css);
    return items && items.size() > 0 ? items.get(0) : null;
}

function resolveUrl(url) {
    if (!url) return BASE_URL;
    if (url.indexOf("http") === 0) return url;
    if (url.indexOf("//") === 0) return "https:" + url;
    return BASE_URL + (url.charAt(0) === "/" ? url : "/" + url);
}

function parseItems(doc) {
    var items = [];
    var seen = {};

    // Xóa bỏ slider/carousel truyện đề cử ở đầu trang để chỉ lấy danh sách cập nhật mới nhất
    try {
        doc.select(".items-slide, .owl-carousel, .top-comics, #ctl00_divAlt1").remove();
    } catch (e) {}

    var cards = doc.select("div.item, div.item-manga");
    for (var i = 0; i < cards.size(); i++) {
        var card = cards.get(i);

        var titleA = selFirst(card, "h3 a, .image a, a.title-manga");
        if (!titleA) titleA = selFirst(card, "a");
        if (!titleA) continue;

        var name = titleA.attr("title") || titleA.text().trim();
        var href = titleA.attr("href") || "";
        if (!name || !href) continue;
        var link = resolveUrl(href);
        if (seen[link]) continue;
        seen[link] = true;

        var img = selFirst(card, "img");
        var cover = "";
        if (img) {
            cover = img.attr("data-original") || img.attr("data-src") || img.attr("src") || "";
            if (cover) cover = resolveUrl(cover);
        }

        var chapEl = selFirst(card, ".chapter a, li.chapter a");
        var chapText = chapEl ? chapEl.text().trim() : "";

        var timeEl = selFirst(card, "i.time, .time");
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
