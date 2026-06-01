var SITE_URL = 'https://cuutruyen.cc';
try { if (CONFIG_URL) SITE_URL = CONFIG_URL; } catch (e) {}
var LIMIT = 24;

function REQ_HEADERS() {
    return {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7",
        "Referer": SITE_URL + "/"
    };
}

// Phát hiện trang challenge Cloudflare (OkHttp của Vbook hay bị chặn dù curl qua được)
function isBlocked(html) {
    if (!html) return true;
    return html.indexOf("Just a moment") !== -1
        || html.indexOf("challenge-platform") !== -1
        || html.indexOf("cf-browser-verification") !== -1
        || html.indexOf("Enable JavaScript and cookies") !== -1
        || html.indexOf("/cdn-cgi/challenge") !== -1;
}

function httpGet(url) {
    var s = "";
    try {
        s = Http.get(url).headers(REQ_HEADERS()).string() || "";
    } catch (e) { s = ""; }

    // Bị Cloudflare chặn / rỗng → render lại bằng browser (WebView vượt được challenge)
    if (isBlocked(s)) {
        var browser = null;
        try {
            browser = Engine.newBrowser();
            browser.launch(url, 15000);
            var doc = browser.html();
            browser.close();
            browser = null;
            if (doc) {
                try { s = doc.outerHtml(); }
                catch (e2) { try { s = doc.html(); } catch (e3) {} }
            }
        } catch (eb) {
            if (browser) { try { browser.close(); } catch (e4) {} }
        }
    }
    return s || "";
}

function toAbs(url) {
    url = String(url || "").trim();
    if (!url) return "";
    if (url.indexOf("//") === 0) return "https:" + url;
    if (url.indexOf("/") === 0) return SITE_URL + url;
    return url;
}

function strip(s) {
    return String(s || "")
        .replace(/<[^>]+>/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&nbsp;/g, " ")
        .replace(/&#039;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/\s+/g, " ")
        .trim();
}

// Parse manga cards from listing/search/tag pages.
// Mỗi card có cấu trúc:
//   <a href="https://cuutruyen.cc/mangas/{id}"> ... <img src="{cover}" alt="{name}" ... class="manga-cover"> </a>
//   <a href=".../mangas/{id}"> <h3 ...>{name}</h3> </a>
//   <a href=".../chapters/{chapId}"> <span class="font-semibold">C. {n}</span> ... <span>{time}</span> </a>
function parseMangaCards(html) {
    var list = [];
    var seen = {};
    // Split theo class manga-cover để mỗi block chứa đúng 1 card
    var parts = html.split('manga-cover');
    for (var i = 0; i < parts.length; i++) {
        var before = parts[i];
        var after = parts[i + 1];
        if (!after) continue;

        // Link manga đứng trước img: lấy href cuối cùng trong block trước
        var linkM = null;
        var lre = /href="(https?:\/\/[^"]*cuutruyen\.cc\/mangas\/[a-z0-9-]+)"/g;
        var lm;
        while ((lm = lre.exec(before)) !== null) linkM = lm;
        if (!linkM) {
            var lre2 = /href="(\/mangas\/[a-z0-9-]+)"/g;
            while ((lm = lre2.exec(before)) !== null) linkM = lm;
        }
        if (!linkM) continue;
        var link = toAbs(linkM[1]);
        if (seen[link]) continue;

        // Cover: src cuối cùng trong before
        var coverM = null;
        var cre = /src="([^"]+)"\s+alt="([^"]*)"/g;
        var cm;
        while ((cm = cre.exec(before)) !== null) coverM = cm;
        var cover = coverM ? toAbs(coverM[1]) : "";
        var altName = coverM ? strip(coverM[2]) : "";

        // Name: tìm <h3 ...>{name}</h3> trong after (cùng card)
        var name = altName;
        var nameM = after.match(/<h3[^>]*>\s*([\s\S]{0,300}?)\s*<\/h3>/);
        if (nameM) {
            var n = strip(nameM[1]);
            if (n) name = n;
        }

        if (!link || !name) continue;

        // Description: chapter mới nhất / thời gian update (nếu có)
        var desc = "";
        var chapM = after.match(/<span class="font-semibold">([^<]+)<\/span>/);
        var timeM = after.match(/<span>([^<]{1,40}?(?:trước|ngày|giờ|phút|giây))<\/span>/);
        if (chapM) desc = strip(chapM[1]);
        if (timeM) desc = (desc ? desc + " - " : "") + strip(timeM[1]);

        seen[link] = true;
        list.push({
            name: name,
            link: link,
            cover: cover,
            description: desc,
            host: SITE_URL
        });
    }
    return list;
}

// Build URL kèm query string giữ nguyên query có sẵn (?keyword=...)
function withPage(path, page) {
    page = String(page || "1");
    var sep = (path.indexOf("?") >= 0) ? "&" : "?";
    return SITE_URL + path + sep + "page=" + page;
}
