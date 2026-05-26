let BASE_URL = "https://www.webtruyentranh.com";

function fetchRetry(url) {
    let doc = null;
    try {
        doc = Http.get(url).headers({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.8",
            "Referer": BASE_URL + "/"
        }).html();
    } catch (e) {}

    let title = doc ? doc.select("title").text() : "";
    if (doc && title.indexOf("Just a moment") === -1 && title.indexOf("Cloudflare") === -1) {
        return doc;
    }

    let browser = null;
    try {
        browser = Engine.newBrowser();
        browser.launch(url, 15000);
        let browserDoc = browser.html();
        browser.close();
        browser = null;
        return browserDoc;
    } catch (e) {
        if (browser) { try { browser.close(); } catch (err) {} }
        return null;
    }
}

function parseJsonLd(doc) {
    let scripts = doc.select("script[type='application/ld+json']");
    for (let i = 0; i < scripts.size(); i++) {
        let txt = scripts.get(i).html();
        if (txt.indexOf("ComicSeries") !== -1) {
            try { return JSON.parse(txt); } catch (e) {}
        }
    }
    return null;
}
