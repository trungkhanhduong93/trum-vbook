var SITE_URL = 'https://metruyen18.net';
try {
    if (CONFIG_URL) SITE_URL = CONFIG_URL;
} catch (e) {}

var LIMIT = 30;

function REQ_HEADERS() {
    return {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "vi-VN,vi;q=0.9",
        "Referer": SITE_URL + "/"
    };
}

function httpGet(url) {
    try {
        var s = Http.get(url).headers(REQ_HEADERS()).string();
        return s || "";
    } catch (e) {
        return "";
    }
}

// Chuyển URL protocol-relative hoặc relative thành absolute HTTPS
function toAbs(url) {
    url = String(url || "").trim();
    if (!url) return "";
    if (url.indexOf("//") === 0) return "https:" + url;
    if (url.indexOf("/") === 0) return SITE_URL + url;
    return url;
}

// Bóc text từ HTML, strip tags
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

// Lấy giá trị attribute từ HTML string
function getAttr(html, attrName) {
    var re = new RegExp(attrName + '="([^"]*)"');
    var m = String(html).match(re);
    return m ? m[1] : "";
}

// Parse danh sách manga cards từ HTML trang list
function parseMangaCards(html) {
    var list = [];
    var seen = {};
    // Tách theo từng card
    var parts = html.split('class="bsx-item mycover"');
    for (var i = 1; i < parts.length; i++) {
        var block = parts[i];
        // Cắt tại pagination
        var endIdx = block.indexOf('class="blog-pager"');
        if (endIdx !== -1) block = block.substring(0, endIdx);

        // Link (chỉ lấy link truyen/{slug} không phải chapter)
        var linkM = block.match(/href="(\/\/metruyen18\.net\/truyen\/[a-z0-9-]+)"/);
        if (!linkM) continue;
        var link = toAbs(linkM[1]);
        if (seen[link]) continue;
        seen[link] = true;

        // Cover image
        var dsrcM = block.match(/data-src="([^"]+)"/);
        var cover = dsrcM ? toAbs(dsrcM[1]) : "";

        // Tên manga từ alt attribute
        var altM = block.match(/alt="([^"]+)"/);
        var name = altM ? altM[1] : "";

        // Chương mới nhất làm description
        var chapM = block.match(/class="btn-link"[^>]*>\s*([^<]+)\s*</);
        var desc = chapM ? chapM[1].trim() : "";

        if (!link || !name) continue;
        list.push({
            name: name,
            link: link,
            description: desc,
            cover: cover,
            host: SITE_URL
        });
    }
    return list;
}

// Build URL với page parameter
function buildPageUrl(base, page) {
    page = parseInt(page || 1);
    if (page <= 1 && base.indexOf("page=") === -1) return base;
    if (base.indexOf("?") !== -1) {
        // Kiểm tra đã có page= chưa
        if (base.indexOf("page=") !== -1) {
            return base.replace(/page=\d+/, "page=" + page);
        }
        return base + "&page=" + page;
    }
    return base + "?page=" + page;
}
