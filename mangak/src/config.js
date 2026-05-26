var BASE_URL = 'https://mangak.site';
try {
    if (CONFIG_URL) {
        BASE_URL = CONFIG_URL;
    }
} catch (error) {
}

var REFERER = BASE_URL + "/";
var REQ_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,*/*;q=0.8",
    "Accept-Language": "vi-VN,vi;q=0.9",
    "Referer": REFERER
};

function fetchRetry(url) {
    var doc = null;
    try {
        doc = Http.get(url).headers(REQ_HEADERS).html();
    } catch (e) {}

    if (doc) {
        var titles = doc.select("title");
        var title = titles.size() > 0 ? titles.get(0).text() : "";
        if (title.indexOf("Just a moment") === -1 && title.indexOf("Cloudflare") === -1) {
            return doc;
        }
    }

    var browser = null;
    try {
        browser = Engine.newBrowser();
        browser.launch(url, 15000);
        var browserDoc = browser.html();
        browser.close();
        return browserDoc;
    } catch (e) {
        if (browser) { try { browser.close(); } catch (err) {} }
        return null;
    }
}
