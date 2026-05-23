var BASE_URL = "https://mimimoe.moe";
var API_URL = "https://mimimoe.moe/api";
var HOST = "https://mimimoe.moe";

// Login credentials (embedded). API mostly works without auth, but a token
// unlocks gated content (NSFW preferences, follow lists, ...).
var LOGIN_EMAIL = "khanhbapbap@gmail.com";
var LOGIN_PASS = "T4555544554";

var COMMON_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.5",
    "Origin": BASE_URL,
    "Referer": BASE_URL + "/"
};

function selFirst(el, css) {
    var items = el.select(css);
    return items.size() > 0 ? items.get(0) : null;
}

function resolveUrl(url) {
    if (!url) return BASE_URL;
    if (url.indexOf("http") === 0) return url;
    return BASE_URL + (url.charAt(0) === "/" ? url : "/" + url);
}

// Build header map by copying COMMON_HEADERS + extras (avoid Object.assign in Rhino)
function buildHeaders(extra) {
    var h = {};
    for (var k in COMMON_HEADERS) h[k] = COMMON_HEADERS[k];
    if (extra) for (var k2 in extra) h[k2] = extra[k2];
    return h;
}

// ─── Auth helpers ──────────────────────────────────────────────────
var _CACHED_TOKEN = null;

function loginAndGetToken() {
    if (_CACHED_TOKEN) return _CACHED_TOKEN;
    try {
        var body = '{"email":"' + LOGIN_EMAIL + '","password":"' + LOGIN_PASS + '"}';
        var res = fetch(API_URL + "/auth/login", {
            method: "POST",
            headers: buildHeaders({ "Content-Type": "application/json" }),
            body: body
        });
        if (!res || !res.ok) return null;
        var data = JSON.parse(res.text());
        if (data && data.token) {
            _CACHED_TOKEN = data.token;
            return _CACHED_TOKEN;
        }
    } catch (e) {}
    return null;
}

// API fetch wrapper: tries anonymous first, falls back to authenticated on 401/403.
function apiFetch(path) {
    var url = path.indexOf("http") === 0 ? path : API_URL + path;
    var res = null;
    try {
        res = fetch(url, { headers: buildHeaders() });
    } catch (e) {
        // Rhino fetch may throw on network errors; fall through to auth fallback
    }

    if (res && res.ok) return res;

    // Only attempt auth on 401/403 or if fetch threw an exception (res is null)
    if (!res || res.status === 401 || res.status === 403) {
        var token = loginAndGetToken();
        if (token) {
            try {
                res = fetch(url, { headers: buildHeaders({ "Authorization": "Bearer " + token }) });
            } catch (e) {
                // Ignore
            }
        }
    }
    return res;
}

// ─── Item parser (manga list item from API) ────────────────────────
function buildItem(m) {
    if (!m) return null;
    var name = m.title || "";
    if (!name) return null;
    var cover = m.cover_url || "";
    var link = BASE_URL + "/manga/" + m.id;

    var descParts = [];
    if (m.chapter_count) descParts.push(m.chapter_count + " chapter");
    if (m.view) descParts.push("👁 " + m.view);
    if (m.follows) descParts.push("🔖 " + m.follows);
    if (m.total_likes) descParts.push("❤ " + m.total_likes);

    return {
        name: name,
        cover: cover,
        link: link,
        description: descParts.join(" • "),
        host: HOST
    };
}

function parseListResponse(res) {
    var items = [];
    if (!res || !res.ok) return items;
    try {
        var data = JSON.parse(res.text());
        var arr = data;
        if (data && data.items) arr = data.items;
        if (!arr || !arr.length) return items;
        for (var i = 0; i < arr.length; i++) {
            var it = buildItem(arr[i]);
            if (it) items.push(it);
        }
    } catch (e) {}
    return items;
}

// Extract numeric id from a URL like https://mimimoe.moe/manga/12345 or /manga/12345/chapter/678
function extractMangaId(url) {
    var m = ("" + url).match(/\/manga\/(\d+)/);
    return m ? m[1] : "";
}
function extractChapterId(url) {
    var m = ("" + url).match(/\/chapter\/(\d+)/);
    if (m) return m[1];
    m = ("" + url).match(/\/chapters\/(\d+)/);
    return m ? m[1] : "";
}
