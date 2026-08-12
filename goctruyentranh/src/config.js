// ============================================================
// config.js - GocTruyenTranh (Micro-Proxy Fast Integration)
// Site: https://goctruyentranhvui41.com
// ============================================================

// Thay thế URL Server Proxy của bạn tại đây (ví dụ trên Render/Vercel)
var PROXY_URL = 'https://gtt-proxy.onrender.com';
var SITE_URL = 'https://goctruyentranhvui41.com';
var UA = 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36';

function HEADERS() {
    return {
        'User-Agent': UA,
        'Accept': 'application/json,text/html,*/*',
        'Referer': SITE_URL + '/'
    };
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
    var sIdx = s.indexOf(';');
    if (sIdx !== -1) s = s.substring(0, sIdx);
    while (s.length > 0 && s.charAt(s.length - 1) === '/') {
        s = s.substring(0, s.length - 1);
    }
    var tIdx = s.indexOf('/truyen/');
    if (tIdx !== -1) {
        return s.substring(tIdx + 8);
    }
    var parts = s.split('/');
    return parts[parts.length - 1];
}

function comicSlug(url) {
    var s = extractSlug(url);
    var idx = s.indexOf('/');
    return (idx !== -1) ? s.substring(0, idx) : s;
}

// Gọi API thông qua Micro-Proxy Server (Bypass Cloudflare & Fast REST)
function proxyGet(path) {
    try {
        var s = Http.get(PROXY_URL + path)
            .headers(HEADERS())
            .string();
        if (!s) return null;
        return JSON.parse(s);
    } catch (e) {
        return null;
    }
}

function proxyPost(path, bodyStr) {
    try {
        var s = Http.post(PROXY_URL + path)
            .headers(HEADERS())
            .body(bodyStr)
            .contentType('application/x-www-form-urlencoded; charset=UTF-8')
            .string();
        if (!s) return null;
        return JSON.parse(s);
    } catch (e) {
        return null;
    }
}

function mapComicCard(c) {
    if (!c || !c.nameEn || !c.name) return null;
    var slug = String(c.nameEn).trim();
    var name = String(c.name).trim();
    if (!slug || !name) return null;

    var desc = '';
    if (c.chapterLatest) {
        var latest = c.chapterLatest;
        if (typeof latest === 'object' && latest.length) {
            latest = latest[0];
        }
        var parts = String(latest).split(' ');
        if (parts.length > 0 && parts[0]) {
            desc = 'Chương ' + parts[0];
        }
    }

    return {
        name: name,
        link: '/truyen/' + slug,
        description: desc,
        cover: c.photo ? absUrl(String(c.photo)) : '',
        host: SITE_URL
    };
}
