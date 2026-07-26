// ─── Domain (tự dò khi TopTruyen đổi link) ─────────────────────────
// www.toptruyenzone9.com là domain mặc định mới. Khi link bị đổi/không truy
// cập được, autoProbeDomains() sẽ tự động rà soát tăng dần từ zone9 -> zone10 -> zone11...
var DEFAULT_BASE = "https://www.toptruyenzone9.com";

var BASE_URL = DEFAULT_BASE;
var HOST = DEFAULT_BASE;

var FETCH_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.5",
    "Referer": BASE_URL + "/"
};
var FETCH_OPTIONS = { headers: FETCH_HEADERS };

// Lấy origin "https://www.toptruyenzoneN.com" từ 1 URL TopTruyen bất kỳ
function topOrigin(url) {
    if (!url) return null;
    var m = String(url).match(/^https?:\/\/((?:www\.)?toptruyenzone\d*\.com)/i);
    return m ? "https://" + m[1].toLowerCase() : null;
}

// Áp domain mới vào BASE_URL/HOST/Referer
function setBase(origin) {
    if (!origin) return;
    BASE_URL = origin;
    HOST = origin;
    FETCH_HEADERS["Referer"] = origin + "/";
}

// Đồng bộ BASE_URL từ URL người dùng truyền vào (nếu khớp pattern)
function syncBaseFromUrl(url) {
    var origin = topOrigin(url);
    if (origin && origin !== BASE_URL) setBase(origin);
}

// Trích xuất số domain từ URL hoặc origin (vd toptruyenzone9.com -> 9)
function extractDomainNumber(originOrUrl) {
    if (!originOrUrl) return 9;
    var m = String(originOrUrl).match(/toptruyenzone(\d+)\.com/i);
    return m ? parseInt(m[1], 10) : 9;
}

// Thay thế domain toptruyenzoneN.com trong URL thành targetDomain
function swapDomainTo(url, targetDomain) {
    if (!url) return targetDomain;
    if (url.indexOf("http") !== 0) {
        return targetDomain + (url.charAt(0) === "/" ? url : "/" + url);
    }
    return String(url).replace(/^https?:\/\/(www\.)?toptruyenzone\d*\.com/i, targetDomain);
}

// Tự rà soát lũy tiến các domain toptruyenzone9.com, 10, 11... khi link hiện tại không truy cập được.
function autoProbeDomains(url) {
    var startNum = extractDomainNumber(BASE_URL);
    if (startNum < 9) startNum = 9;
    var maxNum = startNum + 15; // Rà soát đến 15 số tiếp theo (vd 9 -> 24)

    for (var n = startNum; n <= maxNum; n++) {
        var targetDomain = "https://www.toptruyenzone" + n + ".com";
        var testUrl = swapDomainTo(url, targetDomain);
        try {
            var opts = {
                headers: {
                    "User-Agent": FETCH_HEADERS["User-Agent"],
                    "Accept": FETCH_HEADERS["Accept"],
                    "Accept-Language": FETCH_HEADERS["Accept-Language"],
                    "Referer": targetDomain + "/"
                }
            };
            var res = Http.get(testUrl).headers(opts.headers);
            if (res) {
                var doc = res.html();
                if (doc) {
                    var title = doc.select("title").text();
                    if (title && title.indexOf("Just a moment") === -1 && title.indexOf("Cloudflare") === -1) {
                        setBase(targetDomain);
                        return doc;
                    }
                }
            }
        } catch (e) {}
    }
    return null;
}

function fetchRetry(url) {
    syncBaseFromUrl(url);
    var currentUrl = swapDomainTo(url, BASE_URL);
    var doc = null;
    try {
        doc = Http.get(currentUrl).headers({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
            "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.8",
            "Referer": BASE_URL + "/"
        }).html();
    } catch (e) {}

    var title = doc ? doc.select("title").text() : "";
    if (doc && title && title.indexOf("Just a moment") === -1 && title.indexOf("Cloudflare") === -1) {
        return doc;
    }

    // Auto probe next domain numbers if failed
    var probeDoc = autoProbeDomains(url);
    if (probeDoc) return probeDoc;

    // Fallback to browser
    try {
        var browser = Engine.newBrowser();
        browser.launch(currentUrl, 12000);
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
    return BASE_URL + (url.charAt(0) === "/" ? url : "/" + url);
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
            cover = img.attr("data-original") || img.attr("data-lazy-src") || img.attr("data-src") || img.attr("src") || "";
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
