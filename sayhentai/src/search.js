load("config.js");

function execute(key, page) {
    if (!page) page = '1';
    var p = parseInt(page, 10) || 1;

    var searchUrl = BASE_URL + "/search?q=" + encodeURIComponent(key);
    if (p > 1) {
        searchUrl += "&page=" + p;
    }

    var res = fetchRetry(searchUrl);
    if (!res || !res.ok) return Response.error("Tìm kiếm thất bại");
    var doc = res.html();
    if (!doc) return Response.error("Không parse được kết quả tìm kiếm");

    var items = parseItems(doc);
    var next = (items.length > 0) ? String(p + 1) : null;

    var hasNext = doc.select(".pagination li.active + li a, .pagination a[rel='next']");
    if (hasNext.size() === 0 && items.length < 10) {
        next = null;
    }

    return Response.success(items, next);
}
