var BASE_URL = 'https://www.zettruyen.work';
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
            var res = fetch(url, { headers: HTML_HEADERS });
            if (res && res.ok) return res.html();
        }
        return Http.get(url).headers(HTML_HEADERS).html();
    } catch (e) {
        return null;
    }
}

function fetchJson(url) {
    try {
        if (typeof fetch !== "undefined") {
            var res = fetch(url, { headers: JSON_HEADERS });
            if (res && res.ok) return res.text();
        }
        return Http.get(url).headers(JSON_HEADERS).string();
    } catch (e) {
        return null;
    }
}
