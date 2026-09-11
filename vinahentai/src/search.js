load("config.js");

function execute(key, page) {
    if (!page) page = "1";
    var searchUrl = BASE_URL + "/search?q=" + encodeURIComponent(key) + "&page=" + page;

    var resp = fetchRetry(searchUrl);
    if (!resp || !resp.ok) {
        return Response.error("Lỗi tìm kiếm: " + (resp ? resp.status : "unknown"));
    }

    var doc = resp.html();
    var items = parseItems(doc);

    if (items.length === 0) {
        return Response.success([], null);
    }

    var nextPage = items.length >= 20 ? String(parseInt(page, 10) + 1) : null;
    return Response.success(items, nextPage);
}
