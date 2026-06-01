load("config.js");

function execute(keyword, page) {
    if (!keyword || keyword.trim().length === 0) return Response.success([]);
    var kw = keyword.trim();
    var p = page ? parseInt(page) : 1;

    var url = BASE_URL + "/tim-kiem?q=" + encodeURIComponent(kw);
    url = withPage(url, p);

    var doc = fetchRetry(url);
    if (!doc) return Response.success([]);

    var items = parseItems(doc);
    var next = items.length > 0 ? getNextPage(doc, p) : null;
    return Response.success(items, next);
}
