// ============================================================
// config.js — Cứu Truyện (cuutruyen.net)
//
// v10 (12/09/2026): VIẾT LẠI HOÀN TOÀN. Nguồn cũ trỏ cuutruyen.cc — đó là một
// site KHÁC (mirror MangaDex, HTML tĩnh, ảnh không xáo trộn) và nay đã chết:
// đo 5/5 lần không trả byte nào trong 12 giây.
//
// cuutruyen.net mới là Cứu Truyện thật: Vue SPA (manga4u_app), HTML trả về chỉ
// là khung rỗng 3 KB -> KHÔNG scrape được, bắt buộc đi qua API JSON /api/v2.
//
// KHÔNG cần đăng nhập để đọc: đã đo, mọi endpoint danh sách / chi tiết / mục lục
// / chương đều trả 200 khi không gửi token. Đăng nhập chỉ để đồng bộ tủ truyện,
// và KHÔNG gỡ được xáo trộn ảnh (đã kiểm bằng tài khoản thật).
// ============================================================

var SITE_URL = 'https://www.cuutruyen.net';
var HOST = SITE_URL;
var API = SITE_URL + '/api/v2';

// Không đặt timeout thì host chết ăn trọn 10-11 giây (đo 12/09/2026).
var REQ_TIMEOUT = 8000;
var PROBE_TIMEOUT = 4000;

var UA = 'Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36';

// Header định danh của web chính chủ. Không bắt buộc (API vẫn trả 200 nếu thiếu)
// nhưng gửi cho giống client thật, tránh bị siết về sau.
var HEADERS = {
    'User-Agent': UA,
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'vi-VN,vi;q=0.9',
    'Cuutruyen-Client': 'OfficialWebApp-20250805',
    'Referer': SITE_URL + '/'
};

var PER_PAGE = 24;

// Kho ảnh của site có NHIỀU gương và API trả về gương ĐÃ CHẾT.
//
// API luôn ghi image_url/cover_url trỏ storage-ct.lrclib.net — tên miền này
// NXDOMAIN ở cả 4 dịch vụ tra cứu độc lập (Google, Cloudflare, AdGuard, dns.sb).
// Web chính chủ không dùng URL đó: nó tự dò rồi chọn gương nhanh nhất, console
// in ra "Choose fastest storage server: https://storage-bravo.cuutruyen.net".
//
// => PHẢI đổi host của mọi URL ảnh sang gương sống. Đây không phải tối ưu tốc độ,
//    mà là điều kiện để ảnh tải được. Đã kiểm: bravo trả 200 đúng 792.497 byte,
//    khớp image_url_size của API.
var IMG_PRIMARY = 'https://storage-bravo.cuutruyen.net';
var IMG_MIRRORS = [
    IMG_PRIMARY,
    'https://storage-ct.lrclib.net',
    'https://storage-ct-riften.site'
];

function stripHost(url) {
    return String(url || '').trim().replace(/^https?:\/\/[^\/]+/, '');
}

// Ảnh bìa: app tự tải nên chỉ đưa được đúng một URL -> dùng gương chính.
function imgUrl(url) {
    var path = stripHost(url);
    if (!path) return '';
    return IMG_PRIMARY + path;
}

// Ảnh chương: plugin tự tải nên thử lần lượt từng gương.
function imgCandidates(url) {
    var path = stripHost(url);
    if (!path) return [];
    var out = [];
    for (var i = 0; i < IMG_MIRRORS.length; i++) out.push(IMG_MIRRORS[i] + path);
    return out;
}

// Rhino-Jsoup của Vbook KHÔNG có selectFirst() — giữ helper cho script nào cần.
function selFirst(el, css) {
    if (!el) return null;
    var items = el.select(css);
    return (items && items.size() > 0) ? items.get(0) : null;
}

function absUrl(url) {
    url = String(url || '').trim();
    if (!url) return '';
    if (url.indexOf('http') === 0) return url;
    if (url.indexOf('//') === 0) return 'https:' + url;
    return SITE_URL + (url.charAt(0) === '/' ? url : '/' + url);
}

// Gọi API JSON. Trả object đã parse, hoặc null nếu hỏng.
//
// THỬ LẠI 2 LẦN là bắt buộc ở nguồn này. Đo 12/09/2026, cùng một endpoint gọi
// 3 lần liên tiếp: 13,9s — 1,5s — 1,5s. Máy chủ thỉnh thoảng "nguội" và mất hơn
// 13 giây cho request đầu. Timeout 8s cắt đúng vào đó, nên nếu chỉ gọi một lần
// thì người dùng thấy lỗi ngẫu nhiên; gọi lại thì lần hai gần như luôn nhanh.
function apiGet(path) {
    var url = API + path;
    for (var attempt = 0; attempt < 2; attempt++) {
        var s = null;
        try {
            s = Http.get(url).headers(HEADERS).timeout(REQ_TIMEOUT).string();
        } catch (eHttp) {}

        if (!s) {
            try {
                var res = fetch(url, { headers: HEADERS, timeout: REQ_TIMEOUT });
                if (res && res.ok) s = res.text();
            } catch (eFetch) {}
        }

        if (s) {
            try {
                return JSON.parse(s);
            } catch (eJson) {
                return null;
            }
        }
    }
    return null;
}

// Đường dẫn trang chi tiết mà app dùng làm link truyện, khớp regexp trong plugin.json.
function mangaLink(id) {
    return SITE_URL + '/mangas/' + id;
}

function chapterLink(mangaId, chapterId) {
    return SITE_URL + '/mangas/' + mangaId + '/chapters/' + chapterId;
}

// Lấy số cuối cùng trong URL — dùng cho cả link truyện lẫn link chương.
function lastId(url) {
    var m = String(url || '').match(/(\d+)\/?(?:[?#].*)?$/);
    return m ? m[1] : '';
}

function mangaIdFromUrl(url) {
    var m = String(url || '').match(/\/mangas\/(\d+)/);
    return m ? m[1] : lastId(url);
}

// Card danh sách. API trả cover_mobile_url nhẹ hơn cover_url rõ rệt — dùng bản
// mobile cho trang danh sách, giữ bản đầy đủ cho trang chi tiết.
// "2026-09-12T19:23:18.912+07:00" -> "8 phút trước". Tự tách bằng regex, không
// tin Date.parse của Rhino với chuỗi có múi giờ.
function agoText(iso) {
    if (!iso) return '';
    var m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:([+-])(\d{2}):(\d{2})|Z)?/);
    if (!m) return '';
    var t = Date.UTC(parseInt(m[1], 10), parseInt(m[2], 10) - 1, parseInt(m[3], 10),
                     parseInt(m[4], 10), parseInt(m[5], 10), parseInt(m[6], 10));
    if (m[7]) {
        var off = (parseInt(m[8], 10) * 60 + parseInt(m[9], 10)) * 60000;
        t += (m[7] === '+') ? -off : off;
    }
    var diff = new Date().getTime() - t;
    if (isNaN(diff)) return '';
    if (diff < 0) diff = 0;
    var mins = Math.floor(diff / 60000);
    if (mins < 1) return 'vừa xong';
    if (mins < 60) return mins + ' phút trước';
    var hours = Math.floor(mins / 60);
    if (hours < 24) return hours + ' giờ trước';
    var days = Math.floor(hours / 24);
    if (days < 30) return days + ' ngày trước';
    var months = Math.floor(days / 30);
    if (months < 12) return months + ' tháng trước';
    return Math.floor(months / 12) + ' năm trước';
}

// API /mangas/recently_updated đã trả sẵn mới nhất trước — giữ nguyên thứ tự đó.
// Ghi kèm thời gian cập nhật vào description để nhìn phát biết ngay có đúng thứ
// tự không, giống cách web hiển thị "C. 2 - 8 PHÚT TRƯỚC".
function mapCard(m) {
    if (!m || !m.id || !m.name) return null;
    var desc = '';
    if (m.newest_chapter_number) desc = 'Chương ' + m.newest_chapter_number;
    var ago = agoText(m.newest_chapter_created_at);
    if (ago) desc = desc ? (desc + ' · ' + ago) : ago;
    if (m.author_name) desc = desc ? (desc + ' · ' + m.author_name) : String(m.author_name);
    return {
        name: String(m.name),
        link: mangaLink(m.id),
        cover: imgUrl(m.cover_mobile_url || m.cover_url),
        description: desc,
        host: HOST
    };
}

function mapList(json) {
    var out = [];
    if (!json || !json.data) return out;
    for (var i = 0; i < json.data.length; i++) {
        var c = mapCard(json.data[i]);
        if (c) out.push(c);
    }
    return out;
}

// _metadata: { total_count, total_pages, current_page, per_page }
function nextPageFrom(json, page) {
    var p = parseInt(page, 10) || 1;
    if (!json || !json._metadata) {
        return (json && json.data && json.data.length >= PER_PAGE) ? String(p + 1) : null;
    }
    var total = parseInt(json._metadata.total_pages, 10) || 0;
    return (p < total) ? String(p + 1) : null;
}

function withPage(path, page) {
    var p = parseInt(page, 10) || 1;
    var sep = (path.indexOf('?') >= 0) ? '&' : '?';
    return path + sep + 'page=' + p + '&per_page=' + PER_PAGE;
}

// Lọc theo thẻ dùng cú pháp riêng của site: q phải là TOKEN TRONG NGOẶC KÉP.
// q=crime -> "Unknown token: crime"; q="crime" -> trả đúng danh sách.
function tagPath(tag) {
    return '/mangas/search_by_tags?q=' + encodeURIComponent('"' + tag + '"');
}

// ─── Xáo trộn ảnh (DRM) ────────────────────────────────────────────────
// Mọi trang của cuutruyen.net đều là ảnh bị xáo trộn theo DẢI NGANG, kèm
// trường drm_data. Đã kiểm 6 truyện khác nhau: 100% số trang đều có drm_data,
// kể cả khi đã đăng nhập.
//
// drm_data = base64( XOR( chuỗi, "3141592653589793" ) )
// giải ra: "#v4|300-150|900-150|450-150|0-150|1050-102|150-150|750-150|600-150"
//          tức là dải thứ i của ảnh ĐÚNG lấy từ toạ độ y=300 cao 150 của ảnh gốc.
var DRM_KEY = '3141592653589793';

// Giải base64 BẰNG TAY, không dùng Crypto.base64Decode. Crypto không nằm trong
// core.js (nó ở crypto.js riêng) và không rõ nó trả chuỗi theo bảng mã nào —
// v13 nghi đúng chỗ này: drmDecode trả null nên chương rơi về URL ảnh xáo trộn
// và người đọc thấy ảnh "cắt nát". Chuỗi sau khi giải toàn ký tự < 0x80 nên
// bảng mã không còn là biến số nữa.
var B64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function b64Bytes(str) {
    var s = String(str).replace(/[^A-Za-z0-9+/=]/g, '');
    var out = [];
    var i = 0;
    while (i < s.length) {
        var c1 = B64_CHARS.indexOf(s.charAt(i++));
        var c2 = B64_CHARS.indexOf(s.charAt(i++));
        var c3 = B64_CHARS.indexOf(s.charAt(i++));
        var c4 = B64_CHARS.indexOf(s.charAt(i++));
        if (c1 < 0 || c2 < 0) break;
        out.push(((c1 << 2) | (c2 >> 4)) & 0xFF);
        if (c3 >= 0) out.push(((c2 << 4) | (c3 >> 2)) & 0xFF);
        if (c4 >= 0) out.push(((c3 << 6) | c4) & 0xFF);
    }
    return out;
}

function drmDecode(drm) {
    if (!drm) return null;
    var bytes = b64Bytes(drm);
    if (!bytes.length) return null;
    var out = '';
    for (var i = 0; i < bytes.length; i++) {
        out += String.fromCharCode(bytes[i] ^ DRM_KEY.charCodeAt(i % DRM_KEY.length));
    }
    if (out.indexOf('#v4|') !== 0) return null;

    var parts = out.substring(4).split('|');
    var bands = [];
    for (var j = 0; j < parts.length; j++) {
        var kv = parts[j].split('-');
        if (kv.length !== 2) continue;
        var sy = parseInt(kv[0], 10);
        var h = parseInt(kv[1], 10);
        if (isNaN(sy) || isNaN(h) || h <= 0) continue;
        bands.push({ sy: sy, h: h });
    }
    return bands.length ? bands : null;
}

// Dải đã đúng thứ tự thì khỏi vẽ lại — trả thẳng URL cho app tải, nhanh nhất.
function drmIsIdentity(bands) {
    var y = 0;
    for (var i = 0; i < bands.length; i++) {
        if (bands[i].sy !== y) return false;
        y += bands[i].h;
    }
    return true;
}
