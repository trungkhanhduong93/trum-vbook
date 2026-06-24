var BASE_URL = "https://luottruyen.net";

var UA = "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36";

function trimText(s) {
    return s ? String(s).replace(/^\s+|\s+$/g, "") : "";
}

function resolveUrl(href) {
    if (!href) return "";
    href = trimText(href);
    if (href.indexOf("http") === 0) return href;
    if (href.indexOf("//") === 0) return "https:" + href;
    if (href.indexOf("/") === 0) return BASE_URL + href;
    return BASE_URL + "/" + href;
}

// Phát hiện trang challenge của Cloudflare ("Just a moment...")
function isChallenge(doc) {
    if (!doc) return true;
    var title = "";
    try { title = doc.select("title").text(); } catch (e) {}
    return title.indexOf("Just a moment") !== -1 || title.indexOf("Cloudflare") !== -1;
}

// Tải HTML: ưu tiên Http.get (nhanh, 1 request). Chỉ khi gặp challenge
// hoặc lỗi mạng mới fallback sang Browser → đường đi bình thường luôn nhanh.
function fetchRetry(url) {
    var doc = null;
    try {
        doc = Http.get(url).headers({
            "User-Agent": UA,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.8",
            "Referer": BASE_URL + "/"
        }).html();
    } catch (e) {}

    if (doc && !isChallenge(doc)) return doc;

    // Fallback Browser an toàn (chỉ chạy khi thật sự bị chặn)
    var browser = null;
    try {
        browser = Engine.newBrowser();
        browser.launch(url, 15000);
        var bdoc = browser.html();
        browser.close();
        browser = null;
        if (bdoc && !isChallenge(bdoc)) return bdoc;
        return bdoc;
    } catch (e) {
        if (browser) { try { browser.close(); } catch (err) {} }
    }

    return doc;
}
