// ============================================================
// config.js - GocTruyenTranh
// Site: https://goctruyentranhvui41.com
//
// v22: bỏ hẳn micro-proxy (server đã chết) — gọi thẳng API site.
// Đã đo 13/08/2026: API site KHÔNG có Cloudflare challenge, 0,2–0,3s/request.
// ============================================================

// ─── TOKEN CÁ NHÂN (tuỳ chọn) — chỗ duy nhất cần sửa để đọc chương khoá ──
// Chương site khoá (🔒) chỉ mở khi request có header `Authorization`. Site lấy
// giá trị đó từ localStorage sau khi đăng nhập Google — KHÔNG có cookie nào
// thay thế (xem hàm beforeAuth trong /contents/v2/js/common.js của site).
// Trình duyệt nền của app không đọc hộ được vì nguồn trả X-Frame-Options: DENY
// nên nó đứng ở about:blank. Dán token vào đây thì mọi request đi bằng HTTP
// thẳng, khỏi cần WebView, khỏi dính header khung.
//
// Lấy token: mở goctruyentranhvui41.com trên Chrome, đăng nhập Google, F12 →
// tab Console → gõ:   localStorage.getItem('Authorization')
// rồi copy chuỗi trong dấu nháy (bỏ dấu nháy).
//
// ⚠️ ĐÂY LÀ THÔNG TIN ĐĂNG NHẬP CỦA BẠN. Điền xong thì ĐỪNG commit/push file
// này lên GitHub công khai — ai đọc repo cũng dùng được tài khoản của bạn.
// Cách an toàn: sửa ở máy, đóng gói zip ở máy, cài file zip đó vào VBook.
var GTT_TOKEN = '';

var SITE_URL = 'https://goctruyentranhvui41.com';
var HOST = SITE_URL;
var UA = 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36';

// ─── Đổi domain ───────────────────────────────────────────────
// Site xoay số domain (…vui40 chết, 41 và 42 đang sống, 43+ chưa mở).
// Mọi mirror goctruyentranhvui* dùng CHUNG backend — đã đối chiếu comicId
// giữa vui41 và vui42 ra cùng một giá trị. `goctruyentranhvui.com` (không số)
// KHÔNG dùng được: /api trả 404.
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

// Lấy domain ngay từ URL người dùng đang xem — 0 request, luôn khớp.
function syncBaseFromUrl(url) {
    var o = gttOrigin(url);
    if (o && o !== SITE_URL) setBase(o);
}

var __GTT_PROBED = false;

// Chỉ gọi khi request THẬT SỰ không ra gì (mất mạng / domain chết).
// KHÔNG gọi khi chỉ là lỗi phiên hay bị chặn — bài học luottruyen: rà domain
// nhầm lúc là nổ hàng chục request timeout trước khi báo lỗi.
function probeDomain() {
    if (__GTT_PROBED) return false;
    __GTT_PROBED = true;

    var cur = 41;
    var m = String(SITE_URL).match(/goctruyentranhvui(\d+)\.com/i);
    if (m) cur = parseInt(m[1], 10);

    // thử quanh số hiện tại, gần trước xa sau — dừng ngay khi trúng
    var order = [cur + 1, cur + 2, cur - 1, cur + 3, cur - 2];
    for (var i = 0; i < order.length; i++) {
        var n = order[i];
        if (n < 30 || n > 99 || n === cur) continue;
        var cand = 'https://goctruyentranhvui' + n + '.com';
        try {
            var s = Http.get(cand + '/api/v2/search?p=0')
                .headers({ 'User-Agent': UA, 'Accept': 'application/json', 'Referer': cand + '/' })
                .string();
            if (s && s.indexOf('"status":true') >= 0) {
                setBase(cand);
                return true;
            }
        } catch (e) {}
    }
    return false;
}

// Gắn token nếu có. Không có thì trả header y như cũ — nguồn vẫn chạy bình
// thường cho chương không khoá.
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
    var s = null;
    try {
        s = Http.get(SITE_URL + path).headers(HEADERS()).string();
    } catch (e) {}

    // Không ra gì = domain có thể đã đổi số → dò một lần rồi gọi lại.
    // Có trả về (kể cả JSON báo lỗi phiên) nghĩa là domain còn sống → đừng dò.
    if (!s) {
        if (probeDomain()) {
            try { s = Http.get(SITE_URL + path).headers(HEADERS()).string(); } catch (e2) {}
        }
    }
    if (!s) return null;

    try { return JSON.parse(s); } catch (e3) { return null; }
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

// Cloudflare chặn tốc độ (429 / Error 1015) trả về JSON của CHÍNH Cloudflare,
// parse được nhưng không có `result` → nếu không nhận ra thì code tưởng phiên
// hỏng rồi đi mở WebView, báo sai hoàn toàn. Đo 30/08/2026 khi gọi API dồn dập.
function isRateLimited(json) {
    if (!json || json.result) return false;
    var t = String(json.type || '') + ' ' + String(json.title || '');
    return t.indexOf('1015') >= 0 || t.toLowerCase().indexOf('rate limited') >= 0;
}

// ─── Gọi API TỪ BÊN TRONG WebView ─────────────────────────────
// Cần khi cookie jar của Http client không mang được `X-TOKEN` (cookie này
// Path=/api, Secure, HttpOnly — bản v17 cũ đã từng hỏng đúng vì mất nó).
// Trong WebView thì trình duyệt tự gửi, khỏi phải đọc ra (mà HttpOnly cũng
// không đọc ra được bằng JS).
// XHR ĐỒNG BỘ: callJs trả về là html() bị đọc ngay — async là một cuộc đua.
function browserGetJson(path) {
    var browser = null;
    try {
        browser = Engine.newBrowser();
        // KHÔNG setUserAgent — đổi UA giữa chừng có nguy cơ mất phiên đăng nhập
        browser.launch(SITE_URL + '/lien-he', 12);
        // launch() trả về trước khi trang nạp xong — chạy XHR trên about:blank
        // thì x.open() với URL tương đối ném "Invalid URL". Chờ như chap.js.
        try { browser.callJs('void 0;', 2500); } catch (e) {}

        var js = '' +
            '(function(){' +
            '  var mark=function(s){try{document.body.innerHTML="GTTSTART"+s+"GTTEND";}catch(e){}};' +
            '  try{' +
            '    if(String(location.href).indexOf("goctruyentranhvui")<0){mark("ERR_NOTLOADED");return;}' +
            '    var x=new XMLHttpRequest();' +
            '    x.open("GET",location.protocol+"//"+location.host+' + JSON.stringify(path) + ',false);' +
            '    x.setRequestHeader("X-Requested-With","XMLHttpRequest");' +
            '    var tk=null; try{tk=localStorage.getItem("Authorization");}catch(e){}' +
            '    if(tk){x.setRequestHeader("Authorization",tk);}' +
            '    x.send(null);' +
            '    mark(x.status===200?x.responseText:("ERR"+x.status));' +
            '  }catch(e){mark("ERR_EXC");}' +
            '})();';

        browser.callJs(js, 10000);
        var doc = browser.html();
        browser.close();
        browser = null;
        if (!doc) return null;

        var m = String(doc.select('body').text()).match(/GTTSTART([\s\S]*?)GTTEND/);
        if (!m || m[1].indexOf('ERR') === 0) return null;
        try { return JSON.parse(m[1]); } catch (e) { return null; }
    } catch (e) {
        if (browser) { try { browser.close(); } catch (err) {} }
    }
    return null;
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
