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
    // Site redirect kèm session vào path: /truyen/abc;usid=XXX
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

// Slug truyện thuần, kể cả khi url là url chương (/truyen/{slug}/chuong-{n})
function comicSlug(url) {
    var s = extractSlug(url);
    var idx = s.indexOf('/');
    return (idx !== -1) ? s.substring(0, idx) : s;
}

// Các API cần session: /api/comic/{id}/chapter và /api/chapter/loadAll.
// Không có cookie usid thì server trả "Phiên làm việc đã hết hạn".
// /lien-he là trang nhẹ nhất có Set-Cookie usid (55KB, so với /trang-chu 600KB).
var _sessionReady = false;
function ensureSession() {
    if (_sessionReady) return;
    ensureSiteUrl();
    try {
        Http.get(SITE_URL + '/lien-he').headers(HEADERS()).string();
    } catch (e) {}
    _sessionReady = true;
}

// Cookie usid sống ~13 tiếng. Hết hạn thì API trả status:false — gọi cái này rồi
// ensureSession() để lấy cookie mới.
function resetSession() {
    _sessionReady = false;
}

// Http của app không giữ nổi cookie thì mọi API cần session đều hỏng như nhau.
// Biết rồi thì lần sau khỏi thử lại cho tốn request.
var _httpSessionBroken = false;
function markHttpSessionBroken() { _httpSessionBroken = true; }
function httpSessionBroken() { return _httpSessionBroken; }

// ── Đường dự phòng khi Http của Vbook không giữ được cookie ─────────────────
// Hai API xương sống của nguồn này (/api/comic/{id}/chapter và /api/chapter/loadAll)
// đòi cookie X-TOKEN (Path=/api). Nếu cookie jar của app không hoạt động thì
// Http.get/post luôn nhận "Phiên làm việc đã hết hạn" — mục lục tụt về 21 chương
// và chương không có ảnh. Token đó KHÔNG lộ ở HTML hay body nên plugin không thể
// tự gửi tay.
//
// WebView thì có cookie store riêng và tự quản. Nên mượn nó chạy XHR ĐỒNG BỘ
// cùng origin: launch một trang nhẹ (/lien-he, 55KB, không dính redirect
// https->http;usid= như trang chương), rồi gọi API từ trong trang.
// callJs trả chuỗi nên phía JS phải tự rút gọn dữ liệu trước khi trả về.
function browserApi(jsBody) {
    var browser = null;
    try {
        browser = Engine.newBrowser();
        try { browser.setUserAgent(UA); } catch (e1) {}
        browser.launch(SITE_URL + '/lien-he', 15000);

        var out = browser.callJs('(function(){try{' + jsBody + '}catch(e){return "";}}())');

        browser.close();
        browser = null;
        return out ? String(out) : '';
    } catch (e2) {
        if (browser) { try { browser.close(); } catch (e3) {} }
        return '';
    }
}

// Đoạn JS dùng lại cho cả GET lẫn POST: XHR đồng bộ, cookie do WebView tự gắn.
//
// Kèm luôn header Authorization nếu có — đây đúng là cách site tự làm
// (beforeAuth trong /contents/v2/js/common.js đọc localStorage."Authorization").
// Nghĩa là nếu người dùng đã đăng nhập trong WebView của app (mở "Trang nguồn"
// rồi đăng nhập Google/Facebook), thì token nằm sẵn ở localStorage cùng origin
// và các chương bị khoá cũng mở ra. Chưa đăng nhập thì bỏ qua, chạy như khách.
function xhrSnippet(method, path, body) {
    var js = 'var x=new XMLHttpRequest();' +
             'x.open("' + method + '","' + path + '",false);';
    if (method === 'POST') {
        js += 'x.setRequestHeader("Content-Type","application/x-www-form-urlencoded; charset=UTF-8");';
    }
    js += 'try{var tk=localStorage.getItem("Authorization");' +
          'if(tk)x.setRequestHeader("Authorization",tk);}catch(eA){}';
    js += 'x.send(' + (body ? '"' + body + '"' : 'null') + ');';
    return js;
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
            while (parentHref.length > 1 && parentHref.charAt(parentHref.length - 1) === '/') {
                parentHref = parentHref.substring(0, parentHref.length - 1);
            }
            var targetKey = map[parentHref] ? parentHref : (map[parentHref + '/'] ? parentHref + '/' : null);
            if (targetKey) {
                var chapTxt = String(a.text() || '').trim();
                if (chapTxt && !map[targetKey].description) {
                    map[targetKey].description = chapTxt;
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
