// thegioitruyen.vn là MIRROR của OTruyen (cùng slug, cùng CDN ảnh otruyencdn).
// → Lấy dữ liệu qua API otruyenapi.com (JSON ~0.3s) thay vì scrape trang
//   WordPress chậm (~1.1s TTFB). Giữ nhận diện thegioitruyen.vn ở link detail.
//   Có fallback scrape WP cho detail/toc/chap phòng khi slug lệch / link dán ngoài.

var BASE_URL = "https://thegioitruyen.vn";
var HOST = BASE_URL;
var API_BASE = "https://otruyenapi.com/v1/api";
var CDN_IMAGE = "https://img.otruyenapi.com";
try { if (CONFIG_URL) { BASE_URL = String(CONFIG_URL).replace(/\/+$/, ""); HOST = BASE_URL; } } catch (e) {}

var JSON_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36",
    "Accept": "application/json,*/*;q=0.8",
    "Accept-Language": "vi-VN,vi;q=0.9",
    "Referer": BASE_URL + "/"
};
var FETCH_HEADERS = {
    "User-Agent": JSON_HEADERS["User-Agent"],
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.5",
    "Referer": BASE_URL + "/"
};

function trimText(s) { return s ? String(s).replace(/\s+/g, " ").replace(/^\s+|\s+$/g, "") : ""; }
function stripHtml(s) {
    return s ? String(s).replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#0?39;/g, "'")
        .replace(/\s+/g, " ").replace(/^\s+|\s+$/g, "") : "";
}
function resolveUrl(url) {
    if (!url) return BASE_URL;
    url = String(url).trim();
    if (url.indexOf("http") === 0) return url;
    if (url.indexOf("//") === 0) return "https:" + url;
    return BASE_URL + (url.charAt(0) === "/" ? url : "/" + url);
}

// ─── API OTruyen (JSON, nhanh) ───
function fetchJson(url) {
    try {
        var res = fetch(url, { headers: JSON_HEADERS });
        var s = (res && res.ok) ? res.text() : "";
        if (!s) { s = Http.get(url).headers(JSON_HEADERS).string(); }
        return s && s.charAt(0) === "{" ? s : null;
    } catch (e) { return null; }
}
function parseJson(str) { if (!str) return null; try { return JSON.parse(str); } catch (e) { return null; } }

function buildCover(thumb, cdnImage) {
    if (!thumb) return "";
    var t = String(thumb);
    if (t.indexOf("http") === 0) return t;
    var cdn = cdnImage || CDN_IMAGE;
    if (t.charAt(0) === "/") return cdn + t;
    return cdn + "/uploads/comics/" + t;
}

// Link detail giữ tên miền thegioitruyen.vn (khớp regexp), mang slug OTruyen
function mapItem(it, cdnImage) {
    if (!it || !it.slug) return null;
    var name = trimText(it.name);
    if (!name) return null;
    var desc = "";
    if (it.chaptersLatest && it.chaptersLatest.length > 0) {
        var cn = trimText(it.chaptersLatest[0].chapter_name);
        if (cn) desc = "Chap " + cn;
    }
    if (!desc && it.status === "completed") desc = "Hoàn thành";
    return {
        name: name,
        link: BASE_URL + "/truyen/" + it.slug,
        cover: buildCover(it.thumb_url || it.poster_url, cdnImage),
        description: desc,
        host: HOST
    };
}

function parseListResponse(json, currentPage) {
    var out = { items: [], next: "" };
    if (!json || json.status !== "success" || !json.data) return out;
    var data = json.data;
    var cdnImage = data.APP_DOMAIN_CDN_IMAGE || CDN_IMAGE;
    var list = data.items || [];
    for (var i = 0; i < list.length; i++) {
        var card = mapItem(list[i], cdnImage);
        if (card) out.items.push(card);
    }
    var pag = (data.params && data.params.pagination) ? data.params.pagination : {};
    var total = pag.totalItems || 0;
    var perPage = pag.totalItemsPerPage || 24;
    if (total > 0 && currentPage * perPage < total) out.next = String(currentPage + 1);
    return out;
}

// slug từ link thegioitruyen /truyen/{slug} (hoặc /truyen-tranh/{slug})
function extractSlug(url) {
    var m = String(url || "").match(/\/truyen(?:-tranh)?\/([a-z0-9-]+)/i);
    return m ? m[1] : "";
}

function withPage(url, page) {
    if (!page || page <= 1) return url;
    var sep = (url.indexOf("?") >= 0) ? "&" : "?";
    return url + sep + "page=" + page;
}

// ─── Fallback scrape WordPress (chỉ dùng khi API OTruyen miss) ───
function httpGet(url) {
    var s = "";
    try { var res = fetch(url, { headers: FETCH_HEADERS }); if (res && res.ok) s = res.text() || ""; } catch (e) {}
    if (!s) { try { s = Http.get(url).headers(FETCH_HEADERS).string() || ""; } catch (e2) {} }
    return s || "";
}
