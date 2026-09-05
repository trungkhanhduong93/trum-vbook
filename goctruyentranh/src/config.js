// ============================================================
// config.js - GocTruyenTranh
// Site: https://goctruyentranhvui41.com
//
// v36: Toàn bộ chuyển sang REST API backend siêu tốc (0.2s - 0.3s/req).
// Cookie session tự động prime qua /lien-he để né 100% Cloudflare Turnstile.
// ============================================================

var GTT_TOKEN = 'Bearer eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJEdW9uZyBUcnVuZyIsImNvbWljSWRzIjpbXSwicm9sZUlkIjpudWxsLCJncm91cElkIjpudWxsLCJhZG1pbiI6ZmFsc2UsInJhbmsiOjAsInBlcm1pc3Npb24iOltdLCJpZCI6IjAwMDEzMzU4MDgiLCJ0ZWFtIjpmYWxzZSwiaWF0IjoxNzg4MTA3NjQzLCJlbWFpbCI6Im51bGwifQ.kZbSOa04rE8b5AX4oW3Uo0w1HU8BzYuIpdxkG9OxIFUNpo8OLcqZgLJQ2WUqxQWS2D-WDM5XRkekDhtcqefQQA';
var GTT_IMG_PROXY = '';

var SITE_URL = 'https://goctruyentranhvui41.com';
var HOST = SITE_URL;
var UA = 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36';

function gttOrigin(url) {
    if (!url) return null;
    var m = String(url).match(/^https?:\/\/(goctruyentranhvui\d*\.com)/i);
    return m ? 'https://' + m[1].toLowerCase() : null;
}

function setBase(origin) {
    if (!origin) return;
    SITE_URL = origin;
    HOST = origin;
}

function syncBaseFromUrl(url) {
    var o = gttOrigin(url);
    if (o && o !== SITE_URL) setBase(o);
}

var __GTT_PROBED = false;

function probeDomain() {
    if (__GTT_PROBED) return false;
    __GTT_PROBED = true;

    var cur = 41;
    var m = String(SITE_URL).match(/goctruyentranhvui(\d+)\.com/i);
    if (m) cur = parseInt(m[1], 10);

    var order = [cur + 1, cur + 2, cur - 1, cur + 3, cur - 2];
    for (var i = 0; i < order.length; i++) {
        var n = order[i];
        if (n < 30 || n > 99 || n === cur) continue;
        var cand = 'https://goctruyentranhvui' + n + '.com';
        try {
            var s = Http.get(cand + '/lien-he')
                .headers({ 'User-Agent': UA, 'Accept': 'text/html,application/xhtml+xml', 'Referer': cand + '/' })
                .string();
            if (s && s.indexOf('Goc Truyen Tranh') >= 0) {
                setBase(cand);
                __GTT_PRIMED = true;
                return true;
            }
        } catch (e) {}
    }
    return false;
}

function withAuth(h) {
    if (GTT_TOKEN) h['Authorization'] = GTT_TOKEN;
    return h;
}

function hasToken() {
    return !!GTT_TOKEN;
}

function HEADERS() {
    return withAuth({
        'User-Agent': UA,
        'Accept': 'application/json, text/plain, */*',
        'Referer': SITE_URL + '/'
    });
}

function FORM_HEADERS(referer) {
    return withAuth({
        'User-Agent': UA,
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest',
        'Referer': referer || (SITE_URL + '/')
    });
}

var __GTT_PRIMED = false;

function primeSession(force) {
    if (__GTT_PRIMED && !force) return;
    __GTT_PRIMED = true;
    try {
        Http.get(SITE_URL + '/lien-he')
            .headers({
                'User-Agent': UA,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Referer': SITE_URL + '/'
            })
            .string();
    } catch (e) {}
}

function siteGet(path) {
    primeSession(false);
    var s = null;
    try {
        s = Http.get(SITE_URL + path).headers(HEADERS()).string();
    } catch (e) {}

    if (!s) {
        if (probeDomain()) {
            try { s = Http.get(SITE_URL + path).headers(HEADERS()).string(); } catch (e2) {}
        }
    }
    if (!s) return null;

    try {
        var json = JSON.parse(s);
        if (json && json.messages && json.messages[0] && json.messages[0].indexOf('hết hạn') >= 0) {
            primeSession(true);
            try {
                s = Http.get(SITE_URL + path).headers(HEADERS()).string();
                json = JSON.parse(s);
            } catch (e4) {}
        }
        return json;
    } catch (e3) {
        return null;
    }
}

function sitePost(path, bodyStr, referer) {
    primeSession(false);
    var s = null;
    try {
        s = Http.post(SITE_URL + path)
            .headers(FORM_HEADERS(referer))
            .body(bodyStr)
            .contentType('application/x-www-form-urlencoded; charset=UTF-8')
            .string();
    } catch (e) {}

    if (!s) {
        if (probeDomain()) {
            try {
                s = Http.post(SITE_URL + path)
                    .headers(FORM_HEADERS(referer))
                    .body(bodyStr)
                    .contentType('application/x-www-form-urlencoded; charset=UTF-8')
                    .string();
            } catch (e2) {}
        }
    }
    if (!s) return null;

    try {
        var json = JSON.parse(s);
        if (json && json.messages && json.messages[0] && json.messages[0].indexOf('hết hạn') >= 0) {
            primeSession(true);
            try {
                s = Http.post(SITE_URL + path)
                    .headers(FORM_HEADERS(referer))
                    .body(bodyStr)
                    .contentType('application/x-www-form-urlencoded; charset=UTF-8')
                    .string();
                json = JSON.parse(s);
            } catch (e4) {}
        }
        return json;
    } catch (e3) {
        return null;
    }
}

function isRateLimited(json) {
    if (!json || json.result) return false;
    var t = String(json.type || '') + ' ' + String(json.title || '');
    return t.indexOf('1015') >= 0 || t.toLowerCase().indexOf('rate limited') >= 0;
}

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

function comicSlug(url) {
    var s = extractSlug(url);
    var idx = s.indexOf('/');
    return (idx !== -1) ? s.substring(0, idx) : s;
}

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
