// ============================================================
// config.js - GocTruyenTranh
// Link: https://goctruyentranhvui41.com/trang-chu
// ============================================================

var BASE_DOMAIN = 'goctruyentranhvui';
var TLD = '.com';
var PREFER_NUMS = [41, 42, 43, 44, 45, 30, 31];
var SITE_URL = 'https://goctruyentranhvui41.com';
var UA = 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36';

function HEADERS() {
    return {
        'User-Agent': UA,
        'Accept': 'application/json,text/html,*/*',
        'Referer': SITE_URL + '/'
    };
}

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
    return 'https://' + BASE_DOMAIN + '41' + TLD;
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

function extractSlug(url) {
    if (!url) return '';
    var s = String(url).trim();
    var qIdx = s.indexOf('?');
    if (qIdx !== -1) s = s.substring(0, qIdx);
    var hIdx = s.indexOf('#');
    if (hIdx !== -1) s = s.substring(0, hIdx);
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

function parseHtmlCards(doc) {
    var list = [];
    var map = {};
    if (!doc) return list;

    var aList = doc.select("a[href^='/truyen/']");
    if (!aList || aList.size() === 0) return list;

    for (var i = 0; i < aList.size(); i++) {
        var a = aList.get(i);
        var href = String(a.attr("href") || '').trim();
        if (!href || href === '/truyen/theo-doi' || href === '/truyen/luot-su') continue;

        // Nếu là link tới chương (/chuong-XX), cập nhật description (số chương) cho truyện cha
        if (href.indexOf('/chuong-') !== -1) {
            var parentHref = href.substring(0, href.indexOf('/chuong-'));
            if (map[parentHref]) {
                var chapTxt = String(a.text() || '').trim();
                if (chapTxt && !map[parentHref].description) {
                    map[parentHref].description = chapTxt;
                }
            }
            continue;
        }

        if (!map[href]) {
            map[href] = { name: '', link: href, description: '', cover: '', host: SITE_URL };
        }

        var img = a.select("img").first();
        if (img) {
            var cover = String(img.attr("data-original") || img.attr("data-src") || img.attr("src") || '').trim();
            if (cover && cover.indexOf("bg2.gif") === -1 && cover.indexOf("logo") === -1) {
                map[href].cover = absUrl(cover);
            }
            var alt = String(img.attr("alt") || '').trim();
            if (alt && alt.indexOf("/image/") === -1 && !map[href].name) {
                map[href].name = alt;
            }
        }

        var spanName = a.select(".name, .title").first();
        if (spanName) {
            var txt = String(spanName.text() || '').trim();
            if (txt) map[href].name = txt;
        }
    }

    for (var k in map) {
        if (map[k].name) list.push(map[k]);
    }
    return list;
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

    return {
        name: name,
        link: '/truyen/' + slug,
        description: desc,
        cover: c.photo ? absUrl(String(c.photo)) : '',
        host: SITE_URL
    };
}
