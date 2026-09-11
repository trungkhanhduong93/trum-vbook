load("config.js");

function execute(url, page) {
    if (!page) page = '1';
    var p = parseInt(page, 10) || 1;

    var fullUrl = resolveUrl(url);
    if (p > 1) {
        if (fullUrl === BASE_URL || fullUrl === BASE_URL + "/") {
            return Response.success([], null);
        }
        if (fullUrl.indexOf("?") >= 0) {
            fullUrl += "&page=" + p;
        } else {
            fullUrl += "?page=" + p;
        }
    }

    var res = fetchRetry(fullUrl);
    if (!res || !res.ok) return Response.error("Không tải được danh sách truyện");
    var doc = res.html();
    if (!doc) return Response.error("Không parse được HTML");

    var items = parseItems(doc);
    var next = null;
    if (fullUrl !== BASE_URL && fullUrl !== BASE_URL + "/" && items.length >= 20) {
        next = String(p + 1);
    }

    return Response.success(items, next);
}
