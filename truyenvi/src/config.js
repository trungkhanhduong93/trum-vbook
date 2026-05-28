var SITE_URL = 'https://www.truyenvi.com';
try { if (CONFIG_URL) SITE_URL = CONFIG_URL; } catch (e) {}
var LIMIT = 30;

function REQ_HEADERS() {
    return {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7",
        "Cookie": "age_valid=true",
        "Referer": SITE_URL + "/"
    };
}

function httpGet(url) {
    try {
        var s = Http.get(url).headers(REQ_HEADERS()).string();
        return s || "";
    } catch (e) { return ""; }
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

function parseMangaCards(html) {
    var list = [];
    var seen = {};
    var parts = html.split('browse-bookcontent');
    for (var i = 1; i < parts.length; i++) {
        var block = parts[i];
        // Link from href="/truyen/{slug}/"
        var linkM = block.match(/href="(\/truyen\/[a-z0-9-]+\/)"/);
        if (!linkM) continue;
        var link = SITE_URL + linkM[1];
        if (seen[link]) continue;
        seen[link] = true;

        // Cover from itemprop="image"
        var coverM = block.match(/itemprop="image"[^>]*src="([^"]+)"/);
        if (!coverM) coverM = block.match(/src="(https?:\/\/s[0-9]+\.truyenvi\.com\/[^"]+)"/);
        var cover = coverM ? coverM[1] : "";

        // Name từ title attribute của <a class="rdthumbs" ...title="...">
        // (itemprop="headline" đầu tiên trong block là thể loại, không phải tên truyện)
        var nameM = block.match(/class="rdthumbs"[^>]*title="([^"]+)"/);
        var name = nameM ? nameM[1].trim() : "";

        if (!link || !name) continue;
        list.push({ name: name, link: link, cover: cover, host: SITE_URL });
    }
    return list;
}

function buildPageUrl(base, page) {
    page = parseInt(page || 1);
    // URLs like /danh-sach-truyen/moi-dang/1 → replace last segment
    if (base.match(/\/\d+\/?$/)) {
        return base.replace(/\/\d+\/?$/, "/" + page);
    }
    // URLs like /danh-sach-truyen/moi-dang → append page
    return base.replace(/\/$/, "") + "/" + page;
}
