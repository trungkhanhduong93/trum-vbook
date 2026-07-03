// ─── Domain (tự dò khi luottruyen đổi link) ─────────────────────────
// luottruyen11.com là domain mặc định mới. Khi link bị đổi/không truy
// cập được, autoProbeDomains() sẽ tự động rà soát tăng dần từ 11->12->13->14...
var DEFAULT_BASE = "https://luottruyen11.com";
var REDIRECTOR = "https://luottruyen.com";

var BASE_URL = DEFAULT_BASE;
var HOST = DEFAULT_BASE;

var FETCH_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.5",
    "Referer": BASE_URL + "/"
};
var FETCH_OPTIONS = { headers: FETCH_HEADERS };

// Cờ chống dò lại nhiều lần trong cùng 1 lần chạy script
var __LT_RESOLVED = false;

// Lấy origin "https://host" từ 1 URL luottruyen bất kỳ
function luotOrigin(url) {
    if (!url) return null;
    var m = String(url).match(/^https?:\/\/(luottruyen\d*\.com)/i);
    return m ? "https://" + m[1].toLowerCase() : null;
}

// Áp domain mới vào BASE_URL/HOST/Referer
function setBase(origin) {
    if (!origin) return;
    BASE_URL = origin;
    HOST = origin;
    FETCH_HEADERS["Referer"] = origin + "/";
}

// Khi mở truyện/mục lục/chương: lấy luôn domain từ URL người dùng đang
// xem (không tốn request) → relative link luôn khớp domain hiện hành,
// không vỡ kể cả khi nguồn đang giữa kỳ đổi link.
function syncBaseFromUrl(url) {
    var origin = luotOrigin(url);
    if (origin && origin !== BASE_URL) setBase(origin);
}

// Trích xuất số domain từ URL hoặc origin (vd luottruyen11.com -> 11)
function extractDomainNumber(originOrUrl) {
    if (!originOrUrl) return 11;
    var m = String(originOrUrl).match(/luottruyen(\d+)\.com/i);
    return m ? parseInt(m[1], 10) : 11;
}

// Thay thế domain luottruyenXX.com trong URL thành targetDomain
function swapDomainTo(url, targetDomain) {
    if (!url) return targetDomain;
    if (url.indexOf("http") !== 0) {
        return targetDomain + (url.charAt(0) === "/" ? url : "/" + url);
    }
    return String(url).replace(/^(https?:\/\/)luottruyen\d*\.com/i, targetDomain);
}

// Tự dò domain thật qua redirector luottruyen.com
function resolveBaseUrl() {
    if (__LT_RESOLVED) return;
    __LT_RESOLVED = true;

    try {
        if (typeof CONFIG_URL !== "undefined" && CONFIG_URL) {
            var co = luotOrigin(CONFIG_URL) || String(CONFIG_URL).replace(/\/+$/, "");
            setBase(co);
            return;
        }
    } catch (e) {}

    try {
        var res = fetch(REDIRECTOR + "/", FETCH_OPTIONS);
        if (!res) return;

        var doc = res.html();
        if (doc) {
            var cano = selFirst(doc, "link[rel=canonical]");
            var fromCanon = cano ? luotOrigin(cano.attr("href")) : null;
            if (fromCanon) { setBase(fromCanon); return; }

            var og = selFirst(doc, "meta[property=og:url]");
            var fromOg = og ? luotOrigin(og.attr("content")) : null;
            if (fromOg) { setBase(fromOg); return; }

            var links = doc.select("a[href]");
            for (var i = 0; i < links.size(); i++) {
                var fromLink = luotOrigin(links.get(i).attr("href"));
                if (fromLink) { setBase(fromLink); return; }
            }
        }

        var fromFinal = luotOrigin(res.url);
        if (fromFinal) { setBase(fromFinal); return; }
    } catch (e) {}
}

// Tự rà soát lũy tiến các link luottruyen11.com, luottruyen12.com, 13, 14...
// khi link hiện tại không truy cập được.
function autoProbeDomains(url) {
    var startNum = extractDomainNumber(BASE_URL);
    if (startNum < 11) startNum = 11;
    var maxNum = startNum + 15; // Rà soát đến 15 số tiếp theo (vd 11 -> 26)

    for (var n = startNum; n <= maxNum; n++) {
        var targetDomain = "https://luottruyen" + n + ".com";
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
            var res = fetch(testUrl, opts);
            if (res && res.ok) {
                var doc = res.html();
                if (doc) {
                    setBase(targetDomain);
                    return res;
                }
            }
        } catch (e) {}
    }

    // Secondary fallback: thử qua redirector luottruyen.com
    try {
        resolveBaseUrl();
        var resRedir = fetch(swapDomain(url), FETCH_OPTIONS);
        if (resRedir && resRedir.ok) return resRedir;
    } catch (e) {}

    return null;
}

// ─── Helper functions ──────────────────────────────────────────────

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

// Đổi domain trong URL sang BASE_URL hiện hành
function swapDomain(url) {
    if (!url) return url;
    return swapDomainTo(url, BASE_URL);
}

function fetchRetry(url) {
    var res = fetch(url, FETCH_OPTIONS);
    if (res && res.ok) return res;

    // Link không truy cập được / lỗi → tự động rà soát qua luottruyen11, 12, 13, 14...
    var probedRes = autoProbeDomains(url);
    if (probedRes) return probedRes;

    return res;
}

// ─── Parse story cards from listing pages ──────────────────────────
// Structure: div.items > div.row > div.item > figure
//   .image > a > img  (cover)
//   figcaption > h3 > a  (title + link)
//   figcaption > ul > li.chapter > a  (latest chapter)
function parseItems(doc) {
    var items = [];
    var cards = doc.select("div.items div.item");
    for (var i = 0; i < cards.size(); i++) {
        var card = cards.get(i);

        // Title & link
        var titleA = selFirst(card, "figcaption h3 a");
        if (!titleA) continue;
        var name = titleA.text().trim();
        var href = titleA.attr("href") || "";
        if (!name || !href) continue;
        var link = resolveUrl(href);

        // Cover image
        var img = selFirst(card, "div.image a img");
        var cover = "";
        if (img) {
            cover = img.attr("data-original") || img.attr("data-src") || img.attr("src") || "";
            if (cover && cover.indexOf("http") !== 0) {
                cover = resolveUrl(cover);
            }
        }

        // Status (Full badge or default "Đang Ra")
        var status = "Đang Ra";
        var fullLabel = selFirst(card, "span.label-full, span.full, i.icon-full");
        if (fullLabel) {
            status = "Full";
        }

        // Latest chapter
        var chapA = selFirst(card, "figcaption ul li.chapter a");
        var chapText = chapA ? chapA.text().trim() : "";

        // Time
        var timeEl = selFirst(card, "figcaption ul li.chapter i.time");
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

