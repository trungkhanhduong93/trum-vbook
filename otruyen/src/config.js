var BASE_URL = "https://otruyen.cc";
var HOST = BASE_URL;
var API_BASE = "https://otruyenapi.com/v1/api";
var CDN_IMAGE = "https://img.otruyenapi.com";

var JSON_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36",
    "Accept": "application/json,*/*;q=0.8",
    "Accept-Language": "vi-VN,vi;q=0.9",
    "Referer": BASE_URL + "/"
};

function trimText(s) {
    return s ? String(s).replace(/\s+/g, " ").replace(/^\s+|\s+$/g, "") : "";
}

function stripHtml(s) {
    return s ? String(s).replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#039;/g, "'")
        .replace(/\s+/g, " ").replace(/^\s+|\s+$/g, "") : "";
}

// Fetch JSON từ API; trả về raw string. KHÔNG dùng browser fallback vì
// otruyenapi.com là JSON API thuần — không có CF challenge, không cần Engine.newBrowser.
function fetchJson(url) {
    try {
        var s = Http.get(url).headers(JSON_HEADERS).string();
        return s && s.charAt(0) === "{" ? s : null;
    } catch (e) { return null; }
}

function parseJson(str) {
    if (!str) return null;
    try { return JSON.parse(str); } catch (e) { return null; }
}

// Build cover URL từ thumb_url của API (có thể là full URL hoặc tên file)
function buildCover(thumb, cdnImage) {
    if (!thumb) return "";
    var t = String(thumb);
    if (t.indexOf("http") === 0) return t;
    var cdn = cdnImage || CDN_IMAGE;
    if (t.charAt(0) === "/") return cdn + t;
    return cdn + "/uploads/comics/" + t;
}

// Map 1 item từ API list response sang card Vbook
function mapItem(it, cdnImage) {
    if (!it || !it.slug) return null;
    var name = trimText(it.name);
    if (!name) return null;

    var desc = "";
    if (it.chaptersLatest && it.chaptersLatest.length > 0) {
        var ch = it.chaptersLatest[0];
        var cn = trimText(ch.chapter_name);
        if (cn) desc = "Chương " + cn;
    }
    if (!desc && it.status === "completed") desc = "Hoàn thành";

    return {
        name: name,
        link: BASE_URL + "/truyen-tranh/" + it.slug,
        cover: buildCover(it.thumb_url || it.poster_url, cdnImage),
        description: desc,
        host: HOST
    };
}

// Parse list response chung của /danh-sach, /the-loai, /tim-kiem
// Trả về {items: [...], next: "N" | ""}
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

    // Pagination từ params.pagination
    var pag = (data.params && data.params.pagination) ? data.params.pagination : {};
    var total = pag.totalItems || 0;
    var perPage = pag.totalItemsPerPage || 24;
    if (total > 0 && currentPage * perPage < total) {
        out.next = String(currentPage + 1);
    }

    return out;
}

// Extract slug từ URL /truyen-tranh/{slug}
function extractSlug(url) {
    var m = String(url || "").match(/\/truyen-tranh\/([a-z0-9-]+)/i);
    return m ? m[1] : "";
}

// Build URL có ?page=N (giữ nguyên query string có sẵn)
function withPage(url, page) {
    if (!page || page <= 1) return url;
    var sep = (url.indexOf("?") >= 0) ? "&" : "?";
    return url + sep + "page=" + page;
}
