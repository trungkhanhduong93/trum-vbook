// ============================================================
// config.js - GocTruyenTranh
// Site: https://goctruyentranhvui41.com
//
// v22: bỏ hẳn micro-proxy (server đã chết) — gọi thẳng API site.
// Đã đo 13/08/2026: API site KHÔNG có Cloudflare challenge, 0,2–0,3s/request.
// ============================================================

var SITE_URL = 'https://goctruyentranhvui41.com';
var HOST = SITE_URL;
var UA = 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36';

function HEADERS() {
    return {
        'User-Agent': UA,
        'Accept': 'application/json, text/plain, */*',
        'Referer': SITE_URL + '/'
    };
}

function FORM_HEADERS(referer) {
    return {
        'User-Agent': UA,
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest',
        'Referer': referer || (SITE_URL + '/')
    };
}

// ─── Phiên làm việc ───────────────────────────────────────────
// /api/chapter/loadAll và /api/comic/{id}/chapter đòi cookie `usid`;
// thiếu nó site trả {"status":false,"messages":["Phiên làm việc đã hết hạn"]}.
// `GET /lien-he` (55KB) là trang nhẹ nhất set được cookie đó — /trang-chu tốn 600KB.
var __GTT_PRIMED = false;

function primeSession() {
    if (__GTT_PRIMED) return;
    __GTT_PRIMED = true;
    try {
        Http.get(SITE_URL + '/lien-he').headers(HEADERS()).string();
    } catch (e) {}
}

// ─── Gọi API site ─────────────────────────────────────────────
function siteGet(path) {
    try {
        var s = Http.get(SITE_URL + path).headers(HEADERS()).string();
        if (!s) return null;
        return JSON.parse(s);
    } catch (e) {
        return null;
    }
}

function sitePost(path, bodyStr, referer) {
    try {
        var s = Http.post(SITE_URL + path)
            .headers(FORM_HEADERS(referer))
            .body(bodyStr)
            .contentType('application/x-www-form-urlencoded; charset=UTF-8')
            .string();
        if (!s) return null;
        return JSON.parse(s);
    } catch (e) {
        return null;
    }
}

// ─── Helper ───────────────────────────────────────────────────
function selFirst(el, css) {
    if (!el) return null;
    var items = el.select(css);
    return (items && items.size() > 0) ? items.get(0) : null;
}

function absUrl(url) {
    if (!url) return '';
    var s = String(url).trim();
    if (s.indexOf('http') === 0) return s;
    if (s.indexOf('//') === 0) return 'https:' + s;
    return SITE_URL + (s.charAt(0) === '/' ? s : '/' + s);
}

function extractSlug(url) {
    if (!url) return '';
    var s = String(url).trim();
    var qIdx = s.indexOf('?');
    if (qIdx !== -1) s = s.substring(0, qIdx);
    var hIdx = s.indexOf('#');
    if (hIdx !== -1) s = s.substring(0, hIdx);
    // site có lúc chèn `;usid=XXX` vào path (URL rewriting kiểu servlet)
    var sIdx = s.indexOf(';');
    if (sIdx !== -1) s = s.substring(0, sIdx);
    while (s.length > 0 && s.charAt(s.length - 1) === '/') {
        s = s.substring(0, s.length - 1);
    }
    var tIdx = s.indexOf('/truyen/');
    if (tIdx !== -1) return s.substring(tIdx + 8);
    var parts = s.split('/');
    return parts[parts.length - 1];
}

// "abc-xyz/chuong-12" -> "abc-xyz"
function comicSlug(url) {
    var s = extractSlug(url);
    var idx = s.indexOf('/');
    return (idx !== -1) ? s.substring(0, idx) : s;
}

// Card truyện từ /api/v2/search — `category`/`categoryCode`/`chapterLatest` đều là MẢNG
function mapComicCard(c) {
    if (!c || !c.nameEn || !c.name) return null;
    var slug = String(c.nameEn).trim();
    var name = String(c.name).trim();
    if (!slug || !name) return null;

    var desc = '';
    var latest = c.chapterLatest;
    if (latest && latest.length) {
        desc = 'Chương ' + String(latest[0]).split(' ')[0];
    }

    return {
        name: name,
        link: SITE_URL + '/truyen/' + slug,
        description: desc,
        cover: c.photo ? absUrl(String(c.photo)) : '',
        host: HOST
    };
}
