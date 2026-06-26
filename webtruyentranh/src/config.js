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
    try {
        var s = Http.get(url).headers(JSON_HEADERS).string();
        return s && s.charAt(0) === "{" ? s : null;
    } catch (e) { return null; }
}
