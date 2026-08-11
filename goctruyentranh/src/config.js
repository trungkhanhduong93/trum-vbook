// ============================================================
// config.js - GocTruyenTranh
// Domain rotation order: 30, 31, 41, 42, 43... (vui30 & vui31 không dính Cloudflare Turnstile loop)
// ============================================================

var BASE_DOMAIN = 'goctruyentranhvui';
var TLD = '.com';

// Ưu tiên các domain không bị Cloudflare Turnstile loop (vui30, vui31)
var PREFER_NUMS = [30, 31, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50];
var SITE_URL = '';
var UA = 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36';

function HEADERS() {
    return {
        'User-Agent': UA,
        'Accept': 'application/json,text/html,*/*',
        'Referer': (SITE_URL || 'https://goctruyentranhvui30.com') + '/'
    };
}

// Tự động dò domain khả dụng, ưu tiên domain chạy mượt
function detectDomain() {
    for (var i = 0; i < PREFER_NUMS.length; i++) {
        var num = PREFER_NUMS[i];
        var candidate = 'https://' + BASE_DOMAIN + num + TLD;
        try {
            var s = Http.get(candidate + '/api/comic?page=1')
                .headers({'User-Agent': UA, 'Accept': 'application/json'})
                .string();
            if (s && s.indexOf('"status":true') !== -1) {
                return candidate;
            }
        } catch (e) {}
    }
    return 'https://' + BASE_DOMAIN + '30' + TLD;
}

var _domainReady = false;
function ensureSiteUrl() {
    if (!_domainReady || !SITE_URL) {
        SITE_URL = detectDomain();
        _domainReady = true;
    }
}

function absUrl(url) {
    if (!url) return '';
    var s = String(url).trim();
    if (s.indexOf('http') === 0) return s;
    if (s.indexOf('//') === 0) return 'https:' + s;
    return SITE_URL + (s.charAt(0) === '/' ? s : '/' + s);
}

function selFirst(el, css) {
    if (!el) return null;
    var items = el.select(css);
    return (items && items.size() > 0) ? items.get(0) : null;
}

function apiGet(path) {
    ensureSiteUrl();
    try {
        var s = Http.get(SITE_URL + path)
            .headers(HEADERS())
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
        var parts = String(c.chapterLatest).split(' ');
        if (parts.length > 0 && parts[0]) {
            desc = 'Chương ' + parts[0];
        }
    }
    if (!desc && c.updateDate) {
        desc = String(c.updateDate);
    }

    return {
        name: name,
        link: '/truyen/' + slug,
        description: desc,
        cover: c.photo ? absUrl(String(c.photo)) : '',
        host: SITE_URL
    };
}

function calcNextPage(items, pageNum) {
    if (!items || items.length < 30) return null;
    return String(parseInt(pageNum, 10) + 1);
}
