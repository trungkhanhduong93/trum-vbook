// ─── Domain (tự dò khi luottruyen đổi link) ─────────────────────────
// luottruyen.com (KHÔNG số) là redirector vĩnh viễn → luôn nhảy về
// mirror mới nhất (vd hiện tại luottruyen7.com). Mặc định dưới đây chỉ
// là fallback nhanh; resolveBaseUrl() sẽ tự cập nhật domain thật.
var DEFAULT_BASE = "https://luottruyen7.com";
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

// Tự dò domain thật qua redirector (dùng cho home/search/genre — nơi
// không có sẵn URL đầu vào). Chỉ dò 1 lần / lần chạy.
function resolveBaseUrl() {
    if (__LT_RESOLVED) return;
    __LT_RESOLVED = true;

    // Cho phép override thủ công qua CONFIG_URL của vbook
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

        // 1) Ưu tiên đọc HTML trang đích: canonical/og:url luôn trỏ về
        //    domain thật mới nhất (vd luottruyen7.com), kể cả khi res.url
        //    chỉ trả về domain redirector.
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

        // 2) Cuối cùng: URL sau redirect nếu engine có expose
        var fromFinal = luotOrigin(res.url);
        if (fromFinal) { setBase(fromFinal); return; }
    } catch (e) {
        // Im lặng — giữ DEFAULT_BASE làm fallback
    }
}

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
