var BASE_URL = 'https://mangak.site';
try {
    if (CONFIG_URL) {
        BASE_URL = CONFIG_URL;
    }
} catch (error) {
}

function fetchRetry(url) {
    var doc = Http.get(url).headers({
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.8",
        "Referer": BASE_URL + "/"
    }).html();
    
    var title = doc ? doc.select("title").text() : "";
    
    if (doc && title.indexOf("Just a moment") === -1 && title.indexOf("Cloudflare") === -1) {
        return doc;
    }
    
    // Fallback to browser
    var browser = Engine.newBrowser();
    browser.launch(url, 15000);
    var browserDoc = browser.html();
    browser.close();
    return browserDoc;
}
