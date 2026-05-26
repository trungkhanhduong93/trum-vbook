var BASE_URL = "https://www.webtruyentranh.com";
var HOST = BASE_URL;
var API_BASE = "https://otruyenapi.com/v1/api";

var JSON_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36",
    "Accept": "application/json,*/*;q=0.8",
    "Accept-Language": "vi-VN,vi;q=0.9"
};

function trimText(s) {
    return s ? String(s).replace(/^\s+|\s+$/g, "") : "";
}

function fetchJson(url) {
    var str = "";
    try {
        str = Http.get(url).headers(JSON_HEADERS).string();
    } catch (e) {}

    if (str && str.charAt(0) === "{") return str;
    if (str && str.indexOf("Just a moment") === -1 && str.indexOf("Cloudflare") === -1) {
        return str;
    }

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
