// ─── Domain (tự dò khi luottruyen đổi link) ─────────────────────────
// luottruyen17.com là domain mặc định mới (30/08/2026 — luottruyen16.com
// đã chết nhưng DNS vẫn phân giải nên fetch treo ~15s). Khi link bị đổi/
// không truy cập được, autoProbeDomains() rà tăng dần 18->19->20...
var DEFAULT_BASE = "https://luottruyen17.com";
var REDIRECTOR = "https://luottruyen.com";

var BASE_URL = DEFAULT_BASE;
var HOST = DEFAULT_BASE;

var FETCH_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.5",
    "Referer": BASE_URL + "/"
};
var REQ_TIMEOUT = 8000;    // do 12/09/2026: host chet an 10-11s neu khong dat
var PROBE_TIMEOUT = 4000;
var FETCH_OPTIONS = { headers: FETCH_HEADERS, timeout: REQ_TIMEOUT };

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
    if (!origin) return;
    var originNum = extractDomainNumber(origin);
    var baseNum = extractDomainNumber(BASE_URL);
    // Chỉ cập nhật nếu domain từ URL lớn hơn hoặc bằng BASE_URL hiện tại,
    // tránh trường hợp URL cũ kéo lùi BASE_URL về domain đã chết.
    if (originNum >= baseNum && origin !== BASE_URL) {
        setBase(origin);
    }
}

// Trích xuất số domain từ URL hoặc origin (vd luottruyen16.com -> 16)
function extractDomainNumber(originOrUrl) {
    if (!originOrUrl) return 17;
    var m = String(originOrUrl).match(/luottruyen(\d+)\.com/i);
    return m ? parseInt(m[1], 10) : 17;
}

// Thay thế domain luottruyenXX.com trong URL thành targetDomain
function swapDomainTo(url, targetDomain) {
    if (!url) return targetDomain;
    if (url.indexOf("http") !== 0) {
        return targetDomain + (url.charAt(0) === "/" ? url : "/" + url);
    }
    return String(url).replace(/^(https?:\/\/)luottruyen\d*\.com/i, targetDomain);
}

// Tự dò domain thật qua redirector luottruyen.com.
function resolveBaseUrl(force) {
    if (__LT_RESOLVED && !force) return;
    __LT_RESOLVED = true;

    var doc = null;
    var finalUrl = null;
    try {
        var res = fetch(REDIRECTOR + "/", FETCH_OPTIONS);
        if (res) {
            finalUrl = res.url;
            doc = res.html();
        }
    } catch (e1) {}

    if (!doc) {
        try {
            if (typeof Http !== "undefined" && Http.get) {
                doc = Http.get(REDIRECTOR + "/").headers(FETCH_HEADERS).timeout(PROBE_TIMEOUT).html();
            }
        } catch (e2) {}
    }

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

    var fromFinal = luotOrigin(finalUrl);
    if (fromFinal) { setBase(fromFinal); return; }
}

// Rà soát domain khi domain hiện hành hỏng.
// Ưu tiên redirector luottruyen.com trước (Cloudflare redirect siêu tốc, không bị treo DNS).
// Fallback rà số kế tiếp nếu redirector không phân giải được.
function autoProbeDomains(url) {
    var oldBase = BASE_URL;

    // 1. Thử qua redirector luottruyen.com trước (Cloudflare redirect siêu tốc, không bị treo DNS)
    try {
        resolveBaseUrl(true);
        if (BASE_URL !== oldBase) {
            var resRedir = fetch(swapDomain(url), FETCH_OPTIONS);
            if (resRedir && resRedir.ok) return resRedir;
        }
    } catch (eRedir) {}

    // 2. Fallback: rà soát lũy tiến số kế tiếp nếu redirector không phân giải được
    var failedNum = extractDomainNumber(BASE_URL);
    if (failedNum < 17) failedNum = 17;
    var startNum = failedNum + 1;
    var maxNum = startNum + 1; // Chỉ thử tối đa 1 số kế tiếp, tránh DNS freeze 45s

    for (var n = startNum; n <= maxNum; n++) {
        var targetDomain = "https://luottruyen" + n + ".com";
        var testUrl = swapDomainTo(url, targetDomain);
        try {
            var opts = {
                timeout: PROBE_TIMEOUT,
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

    return null;
}

// Lấy cookie phiên đăng nhập từ WebView qua localCookie của vBook
function getLocalCookie(url) {
    var target = url || BASE_URL;
    var c = "";
    try {
        if (typeof localCookie !== "undefined" && localCookie.getCookie) {
            c = localCookie.getCookie(target);
            if (!c) c = localCookie.getCookie();
        }
    } catch (e1) {
        try {
            if (typeof localCookie !== "undefined" && localCookie.getCookie) {
                c = localCookie.getCookie();
            }
        } catch (e2) {}
    }
    return c || "";
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
    // fetch nem exception khi loi mang; khong bat thi ca script chet cam.
    var res = null;
    try {
        res = fetch(url, FETCH_OPTIONS);
    } catch (e) {}
    if (res && res.ok) return res;

    // Link không truy cập được / lỗi → rà soát domain kế tiếp rồi tới redirector
    var probedRes = autoProbeDomains(url);
    if (probedRes) return probedRes;

    return res;
}

// ─── Ảnh bìa: nén qua Cloudflare Image Resizing của CHÍNH CDN nguồn ─
// img*.dichvucdn.com trả ảnh bìa rất nặng và rất không đều — đo 30/08/2026
// trên 8 bìa thật: 20 KB đến 935 KB, một trang 54 truyện ≈ 8,6 MB. CDN này
// đang bật /cdn-cgi/image/ nên thu về 240px + q72 ngay trên CÙNG HOST đó
// (≈1,09 MB/trang). Cùng host là điểm mấu chốt: proxy weserv/Photon từng làm
// gãy ảnh nguồn này 2 lần vì kéo host lạ vào — xem docs/06 mục 8.
// Cloudflare KHÔNG phóng to ảnh nhỏ hơn 240px (đã đo: bìa 190px trả nguyên).
var THUMB_OPTS = "width=240,quality=72";

function thumbUrl(url) {
    if (!url) return url;
    if (url.indexOf("/cdn-cgi/image/") >= 0) return url;
    var m = String(url).match(/^https:\/\/(img\d*\.dichvucdn\.com)\/(.+)$/i);
    if (!m) return url;
    return "https://" + m[1] + "/cdn-cgi/image/" + THUMB_OPTS + "/" + m[2];
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
            cover = thumbUrl(cover);
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

