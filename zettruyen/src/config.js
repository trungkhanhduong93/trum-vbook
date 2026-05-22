let BASE_URL = 'https://www.zettruyen.top';

function fetchRetry(url) {
    let doc = Http.get(url).headers({
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.8",
        "Referer": BASE_URL + "/"
    }).html();
    
    let title = doc ? doc.select("title").text() : "";
    
    if (doc && title.indexOf("Just a moment") === -1 && title.indexOf("Cloudflare") === -1) {
        return doc;
    }
    
    // Fallback to browser
    let browser = Engine.newBrowser();
    browser.launch(url, 15000);
    let browserDoc = browser.html();
    browser.close();
    return browserDoc;
}

function fetchJson(url) {
    let res = Http.get(url).headers({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Referer': BASE_URL + '/'
    });
    
    let str = res.string();
    if (str && str.indexOf('Just a moment') === -1 && str.indexOf('Cloudflare') === -1) {
        return str;
    }
    
    // Fallback to browser for JSON
    let browser = Engine.newBrowser();
    browser.launch(url, 15000);
    let browserDoc = browser.html();
    browser.close();
    
    // browserDoc is HTML, we need to extract JSON text from body
    if (browserDoc) {
        let body = browserDoc.select("body").text();
        return body;
    }
    return null;
}
