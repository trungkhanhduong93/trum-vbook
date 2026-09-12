var BASE_URL = 'https://www.zettruyen1.com';
// Khong dat timeout thi host chet an tron 10-11 giay (do 12/09/2026).
var REQ_TIMEOUT = 8000;    // request chinh
var PROBE_TIMEOUT = 4000;  // mirror / do domain
var REFERER = BASE_URL + '/';

var HTML_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,*/*;q=0.8",
    "Accept-Language": "vi-VN,vi;q=0.9",
    "Referer": REFERER
};

var JSON_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36",
    "Accept": "application/json,text/plain,*/*",
    "Accept-Language": "vi-VN,vi;q=0.9",
    "Referer": REFERER
};

function fetchRetry(url) {
    try {
        if (typeof fetch !== "undefined") {
            var res = fetch(url, { headers: HTML_HEADERS, timeout: REQ_TIMEOUT });
            if (res && res.ok) return res.html();
        }
        return Http.get(url).headers(HTML_HEADERS).timeout(REQ_TIMEOUT).html();
    } catch (e) {
        return null;
    }
}

function fetchJson(url) {
    try {
        if (typeof fetch !== "undefined") {
            var res = fetch(url, { headers: JSON_HEADERS, timeout: REQ_TIMEOUT });
            if (res && res.ok) return res.text();
        }
        return Http.get(url).headers(JSON_HEADERS).timeout(REQ_TIMEOUT).string();
    } catch (e) {
        return null;
    }
}

function safeEncodeUrl(u) {
    if (!u) return "";
    try {
        return encodeURI(u);
    } catch (e) {
        return u;
    }
}

function resolveUrl(url) {
    if (!url) return "";
    url = String(url).trim();
    if (!url) return "";
    var full = url;
    if (url.indexOf("http") === 0) full = url;
    else if (url.indexOf("//") === 0) full = "https:" + url;
    else full = BASE_URL + (url.charAt(0) === "/" ? url : "/" + url);
    return safeEncodeUrl(full);
}
