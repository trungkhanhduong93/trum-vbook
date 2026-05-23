load("config.js");

function execute(keyword, page) {
    if (!keyword || keyword.trim().length === 0) return Response.success([]);

    var p = page ? parseInt(page) : 1;
    var kw = encodeURIComponent(keyword.trim());

    var url;
    if (p === 1) {
        url = BASE_URL + "/?s=" + kw;
    } else {
        url = BASE_URL + "/page/" + p + "/?s=" + kw;
    }

    var doc = fetchRetry(url);
    if (!doc) return Response.success([]);

    var items = parseItems(doc);
    var next = getNextPage(doc, p);

    return Response.success(items, next);
}
