var SITE_URL = "https://cuutruyen.cc";
var HOST = SITE_URL;

var HEADERS = {
    "User-Agent": "Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.5",
    "Referer": SITE_URL + "/"
};

// Site bọc mọi ảnh chương qua worker Cloudflare này. GIỮ NGUYÊN, đừng bóc ra trả
// thẳng mangadex.network: mạng di động VN chặn mangadex.network, worker thì không
// (đã trả giá ở v3→v4). Prefix này hardcode vì đường nhanh không tải HTML chương
// nữa — site đổi worker thì sửa đúng một dòng ở đây.
var IMG_PROXY = "https://dex.cdn-07077.workers.dev/?url=";

// Chapter id của cuutruyen chính là chapter id MangaDex (đã đối chiếu khớp tuyệt
// đối 45/45 URL). at-home trả 6,6KB JSON thay cho 662KB HTML trang chương.
var MDX_AT_HOME = "https://api.mangadex.org/at-home/server/";

function proxiedImage(innerUrl) {
    return IMG_PROXY + encodeURIComponent(innerUrl);
}

// Rhino-Jsoup của Vbook KHÔNG có selectFirst() — luôn đi qua helper này.
function selFirst(el, css) {
    if (!el) return null;
    var items = el.select(css);
    return (items && items.size() > 0) ? items.get(0) : null;
}

function absUrl(url) {
    url = String(url || "").trim();
    if (!url) return "";
    if (url.indexOf("http") === 0) return url;
    if (url.indexOf("//") === 0) return "https:" + url;
    if (url.indexOf("/") === 0) return SITE_URL + url;
    return SITE_URL + "/" + url;
}

// Ảnh bìa của site có 3 mức: {file}.jpg.256.jpg (~70KB), .512.jpg (~250KB)
// và bản gốc không hậu tố (đo được 12MB — tuyệt đối không dùng).
// Danh sách dùng 256 cho nhẹ, trang chi tiết dùng 512 cho nét.
function coverAt(url, size) {
    url = String(url || "");
    if (!url) return "";
    if (/\.(256|512)\.jpg$/.test(url)) return url.replace(/\.(256|512)\.jpg$/, "." + size + ".jpg");
    if (url.indexOf("/covers/") >= 0) return url + "." + size + ".jpg";
    return url;
}

// Nhận diện challenge Cloudflare qua <title>. KHÔNG dựng outerHtml() để dò chuỗi:
// trang chi tiết nặng ~460KB, dựng nguyên chuỗi trong Rhino vừa chậm vừa dễ chết ngầm.
function isChallenge(doc) {
    if (!doc) return true;
    var title = "";
    try { title = String(doc.select("title").text()); } catch (e) {}
    return title.indexOf("Just a moment") !== -1 ||
           title.indexOf("Cloudflare") !== -1 ||
           title.indexOf("Attention Required") !== -1;
}

// Đường HTTP thường là đủ (đã đo: site trả HTML đầy đủ cho cả UA okhttp lẫn
// không UA). Nhánh browser chỉ để cứu trường hợp Cloudflare bật challenge cho
// OkHttp theo TLS fingerprint — bản v1 của nguồn này từng chết đúng vì vậy.
function fetchDoc(url) {
    var doc = null;
    try {
        doc = Http.get(url).headers(HEADERS).html();
    } catch (e) {}

    if (doc && !isChallenge(doc)) return doc;

    var browser = null;
    try {
        browser = Engine.newBrowser();
        try {
            browser.block([".*google.*", ".*facebook.*", ".*analytics.*", ".*doubleclick.*", ".*adservice.*", ".*\\.css.*", ".*\\.gif"]);
        } catch (eBlock) {}
        try { browser.setUserAgent(HEADERS["User-Agent"]); } catch (e2) {}
        browser.launch(url, 4);
        var bdoc = browser.html();
        if (bdoc) return bdoc;
    } catch (err) {
    } finally {
        if (browser) {
            try { browser.close(); } catch (e3) {}
        }
    }

    return doc;
}

function withPage(url, page) {
    var p = parseInt(page, 10);
    if (!p || p <= 1) return url;
    return url + ((url.indexOf("?") >= 0) ? "&" : "?") + "page=" + p;
}

// URL lọc theo thẻ. Cú pháp tag_query của site nhận cả AND/OR/NOT, đặt tên thẻ
// trong ngoặc kép để khớp đúng cụm (vd "Slice of Life" không bị tách thành 3 từ).
function tagUrl(tag) {
    return SITE_URL + "/search?tag_query=" + encodeURIComponent('"' + tag + '"');
}

// Mỗi card ở trang danh sách/tìm kiếm/thẻ là một div.snap-start:
//   <a href=".../mangas/{uuid}"><img class="manga-cover" src="{cover}" alt="{tên}"></a>
//   <div><a ...><h3>{tên}</h3></a><h4><a ...><span>C. {số}</span> - <span>{thời gian}</span></a></h4></div>
//
// Đi từ khối card xuống, KHÔNG đi từ <img> rồi ngược lên bằng .parent():
// parent() từng ném TypeError trong Vbook (ghi chú ở zettruyen/src/search.js).
function parseCards(doc) {
    var out = [];
    if (!doc) return out;

    var seen = {};
    var cards = doc.select("div.snap-start");

    for (var i = 0; i < cards.size(); i++) {
        var card = cards.get(i);

        var a = selFirst(card, "a[href*='/mangas/']");
        if (!a) continue;
        var link = absUrl(a.attr("href"));
        if (!link || seen[link]) continue;

        var img = selFirst(card, "img.manga-cover");
        if (!img) img = selFirst(card, "img");

        var name = "";
        var h3 = selFirst(card, "h3");
        if (h3) name = String(h3.text()).trim();
        if (!name && img) name = String(img.attr("alt") || "").trim();
        if (!name) continue;

        var cover = img ? absUrl(img.attr("src") || img.attr("data-src")) : "";

        var desc = "";
        var h4 = selFirst(card, "h4");
        if (h4) desc = String(h4.text()).trim().replace(/\s+/g, " ");

        seen[link] = true;
        out.push({
            name: name,
            link: link,
            cover: cover,
            description: desc,
            host: HOST
        });
    }

    if (out.length > 0) return out;

    // Site đổi khung card: gom theo chính link truyện. Vẫn bám họ selector của
    // trang danh sách (a[href*=/mangas/]) chứ không nới ra quét toàn trang.
    var links = doc.select("a[href*='/mangas/']");
    for (var j = 0; j < links.size(); j++) {
        var la = links.get(j);
        var lnk = absUrl(la.attr("href"));
        if (!lnk || seen[lnk]) continue;

        var limg = selFirst(la, "img");
        var lname = limg ? String(limg.attr("alt") || "").trim() : "";
        if (!lname) lname = String(la.text()).trim();
        if (!lname) continue;

        seen[lnk] = true;
        out.push({
            name: lname,
            link: lnk,
            cover: limg ? absUrl(limg.attr("src") || limg.attr("data-src")) : "",
            description: "",
            host: HOST
        });
    }

    return out;
}

// Nút "Trang sau" là <a href="...?page=N">; ở trang cuối site đổi nó thành
// <a> không href (button-disabled) nên không còn link nào khớp -> hết trang.
function nextPage(doc, page) {
    if (!doc) return null;
    var want = parseInt(page, 10) + 1;
    var links = doc.select("a[href*=page]");
    for (var i = 0; i < links.size(); i++) {
        var href = String(links.get(i).attr("href") || "");
        var m = href.match(/[?&]page=(\d+)/);
        if (m && parseInt(m[1], 10) >= want) return String(want);
    }
    return null;
}
