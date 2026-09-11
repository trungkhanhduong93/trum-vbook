load("config.js");

function execute(url, page) {
    if (!page) page = '1';
    var p = parseInt(page, 10) || 1;

    var fullUrl = resolveUrl(url);
    if (p > 1) {
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
    var next = (items.length > 0) ? String(p + 1) : null;

    var hasNext = doc.select(".pagination li.active + li a, .pagination a[rel='next']");
    if (hasNext.size() === 0 && items.length < 10) {
        next = null;
    }

    return Response.success(items, next);
}
