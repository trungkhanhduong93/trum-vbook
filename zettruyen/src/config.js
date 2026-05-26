let BASE_URL = 'https://www.zettruyen.top';
let REFERER = BASE_URL + '/';

let HTML_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,*/*;q=0.8",
    "Accept-Language": "vi-VN,vi;q=0.9",
    "Referer": REFERER
};

let JSON_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36",
    "Accept": "application/json,text/plain,*/*",
    "Accept-Language": "vi-VN,vi;q=0.9",
    "Referer": REFERER
};

function fetchRetry(url) {
    let doc = null;
    try {
        doc = Http.get(url).headers(HTML_HEADERS).html();
    } catch (e) {}

    if (doc) {
        let titles = doc.select("title");
        let title = titles.size() > 0 ? titles.get(0).text() : "";
        if (title.indexOf("Just a moment") === -1 && title.indexOf("Cloudflare") === -1) {
            return doc;
        }
    }

    let browser = null;
    try {
        browser = Engine.newBrowser();
        browser.launch(url, 15000);
        let browserDoc = browser.html();
        browser.close();
        return browserDoc;
    } catch (e) {
        if (browser) { try { browser.close(); } catch (err) {} }
        return null;
    }
}

function fetchJson(url) {
    let str = "";
    try {
        str = Http.get(url).headers(JSON_HEADERS).string();
    } catch (e) {}

    if (str && str.charAt(0) === "{") return str;
    if (str && str.indexOf('Just a moment') === -1 && str.indexOf('Cloudflare') === -1) {
        return str;
    }

    let browser = null;
    try {
        browser = Engine.newBrowser();
        browser.launch(url, 15000);
        let browserDoc = browser.html();
        browser.close();
        return browserDoc ? browserDoc.select("body").text() : null;
    } catch (e) {
        if (browser) { try { browser.close(); } catch (err) {} }
        return null;
    }
}
