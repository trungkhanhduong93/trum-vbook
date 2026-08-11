// ============================================================
// config.js - GocTruyenTranh
// API: JSON-based (không scrape HTML)
// Domain pattern: goctruyentranhvui{N}.com  (N tự tăng khi sập)
// ============================================================

// --- Cơ chế tự dò domain ---
// Khởi đầu từ số đã biết, thử tăng dần đến MAX_NUM
// Nếu không tìm được sẽ fallback về FALLBACK_NUM
var BASE_DOMAIN = 'goctruyentranhvui';
var TLD = '.com';
var START_NUM = 41;          // Số hiện tại biết đang hoạt động
var MAX_SCAN = 20;           // Quét tối đa 20 số tiếp theo
var SITE_URL = '';           // Sẽ được set bởi detectDomain()
var API_SUFFIX = '/api';

var UA = 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36';

function HEADERS() {
    return {
        'User-Agent': UA,
        'Accept': 'application/json,text/html,*/*',
        'Referer': SITE_URL + '/'
    };
}

// Hàm tự dò domain khả dụng
// Ưu tiên: số lớn nhất tìm được (mới nhất) hay số nhỏ nhất hoạt động
function detectDomain() {
    // Thử từ START_NUM tăng dần
    for (var i = 0; i <= MAX_SCAN; i++) {
        var num = START_NUM + i;
        var candidate = 'https://' + BASE_DOMAIN + num + TLD;
        try {
            var s = Http.get(candidate + '/api/comic?page=1')
                .headers({'User-Agent': UA, 'Accept': 'application/json'})
                .string();
            if (s && s.indexOf('"status":true') !== -1) {
                return candidate;
            }
        } catch (e) {
            // Không có hoặc timeout -> thử số tiếp theo
        }
    }
    // Fallback: thử lại từ đầu phòng trường hợp mạng tạm lỗi
    return 'https://' + BASE_DOMAIN + START_NUM + TLD;
}

// Khởi tạo domain (gọi một lần, các script con gọi ensureSiteUrl())
var _domainReady = false;
function ensureSiteUrl() {
    if (!_domainReady || !SITE_URL) {
        SITE_URL = detectDomain();
        _domainReady = true;
    }
}

// Helper: chuẩn hoá URL ảnh (tương đối → tuyệt đối)
function absUrl(url) {
    if (!url) return '';
    var s = String(url).trim();
    if (s.indexOf('http') === 0) return s;
    if (s.indexOf('//') === 0) return 'https:' + s;
    return SITE_URL + (s.charAt(0) === '/' ? s : '/' + s);
}

// Helper: selFirst (KHÔNG dùng selectFirst - bẫy #5)
function selFirst(el, css) {
    if (!el) return null;
    var items = el.select(css);
    return (items && items.size() > 0) ? items.get(0) : null;
}

// API GET JSON
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

// Map một comic item từ API /api/comic?page=N
function mapComicCard(c) {
    if (!c || !c.nameEn || !c.name) return null;
    var slug = String(c.nameEn).trim();
    var name = String(c.name).trim();
    if (!slug || !name) return null;

    // Latest chapter info từ chapterLatest (string space-separated)
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

// Kiểm tra trang tiếp theo: nếu comics trả đủ 30 thì có page sau
function calcNextPage(items, pageNum) {
    if (!items || items.length < 30) return null;
    return String(parseInt(pageNum, 10) + 1);
}
