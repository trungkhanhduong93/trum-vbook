var BASE_URL = "https://luottruyen.net";

function trimText(s) {
    return s ? String(s).replace(/^\s+|\s+$/g, "") : "";
}

function resolveUrl(href) {
    if (!href) return "";
    href = trimText(href);
    if (href.indexOf("http") === 0) return href;
    if (href.indexOf("//") === 0) return "https:" + href;
    if (href.indexOf("/") === 0) return BASE_URL + href;
    return BASE_URL + "/" + href;
}

function fetchRetry(url) {
    var doc = null;
    try {
        if (typeof fetch !== "undefined") {
            var res = fetch(url, {
                headers: {
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
                    "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.8",
                    "Referer": BASE_URL + "/"
                }
            });
            if (res && res.ok) return res.html();
        }
        
        doc = Http.get(url).headers({
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.8",
            "Referer": BASE_URL + "/"
        }).html();
    } catch (e) {}

    return doc;
}
