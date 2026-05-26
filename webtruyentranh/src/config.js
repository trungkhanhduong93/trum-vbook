var BASE_URL = "https://www.webtruyentranh.com";
var HOST = "https://www.webtruyentranh.com";
var API_BASE = "https://otruyenapi.com/v1/api";

function trimText(s) {
    return s ? String(s).replace(/^\s+|\s+$/g, "") : "";
}

function fetchJson(url) {
    var str = "";
    try {
        var res = Http.get(url).headers({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
            "Accept": "application/json, text/plain, */*"
        });
        str = res.string();
    } catch (e) {}
    
    if (str && str.indexOf("Just a moment") === -1 && str.indexOf("Cloudflare") === -1) {
        return str;
    }
    
    // Fallback Browser
    var browser = null;
    try {
        browser = Engine.newBrowser();
        browser.launch(url, 15000);
        var doc = browser.html();
        browser.close();
        browser = null;
        return doc ? doc.select("body").text() : null;
    } catch (e) {
        if (browser) { try { browser.close(); } catch (err) {} }
        return null;
    }
}
