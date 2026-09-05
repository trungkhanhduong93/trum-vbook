var BASE_URL = "https://mimimoe.moe";
var API_URL = "https://mimimoe.moe/api";
var HOST = "https://mimimoe.moe";

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

// API fetch wrapper: gọi thẳng API công khai tốc độ cao
function apiFetch(path) {
    var url = path.indexOf("http") === 0 ? path : API_URL + path;
    try {
        var res = fetch(url, { headers: COMMON_HEADERS, timeout: 8000 });
        if (res && res.ok) return res;
        return null;
    } catch (e) {
        return null;
    }
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
