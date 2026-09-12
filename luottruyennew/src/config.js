var BASE_URL = "https://luottruyen.net";

var UA = "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36";

function trimText(s) {
    return s ? String(s).replace(/^\s+|\s+$/g, "") : "";
}

// Rhino-Jsoup an toàn: KHÔNG dùng selectFirst()/Elements.first().
// Luôn select() rồi lấy phần tử đầu qua size()/get(0).
function selFirst(el, css) {
    if (!el) return null;
    var items = el.select(css);
    return (items && items.size() > 0) ? items.get(0) : null;
}

function safeEncodeUrl(u) {
    if (!u) return "";
    try {
        return encodeURI(u);
    } catch (e) {
        return u;
    }
}

function resolveUrl(href) {
    if (!href) return "";
    href = trimText(href);
    if (!href) return "";
    var full = href;
    if (href.indexOf("http") === 0) full = href;
    else if (href.indexOf("//") === 0) full = "https:" + href;
    else if (href.indexOf("/") === 0) full = BASE_URL + href;
    else full = BASE_URL + "/" + href;
    return safeEncodeUrl(full);
}

// Phát hiện trang challenge của Cloudflare ("Just a moment...")
function isChallenge(doc) {
    if (!doc) return false;
    var title = "";
    try { title = doc.select("title").text(); } catch (e) {}
    return title.indexOf("Just a moment") !== -1 || title.indexOf("Cloudflare") !== -1;
}

// Tải HTML: ưu tiên Http.get (nhanh, timeout 5s chống treo).
// Chỉ khi phát hiện Cloudflare challenge mới fallback sang Browser (timeout 2s).
function fetchRetry(url) {
    var doc = null;
    try {
        var req = Http.get(url).headers({
            "User-Agent": UA,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.8",
            "Referer": BASE_URL + "/"
        });
        try { req = req.timeout(5000); } catch (eTimeout) {}
        doc = req.html();
    } catch (e) {}

    if (doc && !isChallenge(doc)) return doc;

    // Fallback Browser an toàn (chỉ chạy khi thật sự bị Cloudflare challenge)
    if (doc && isChallenge(doc)) {
        var browser = null;
        try {
            browser = Engine.newBrowser();
            try {
                browser.block([".*google.*", ".*facebook.*", ".*analytics.*", ".*doubleclick.*", ".*adservice.*", ".*\\.css.*", ".*\\.gif"]);
            } catch (eBlock) {}
            browser.launch(url, 2);
            var bdoc = browser.html();
            if (bdoc && !isChallenge(bdoc)) return bdoc;
            return bdoc;
        } catch (eBrowser) {
        } finally {
            if (browser) {
                try { browser.close(); } catch (err) {}
            }
        }
    }

    return doc;
}
