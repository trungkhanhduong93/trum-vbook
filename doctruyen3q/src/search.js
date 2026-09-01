load("config.js");

function execute(keyword, page) {
    if (!keyword || keyword.trim().length === 0) return Response.success([]);

    var p = page ? parseInt(page) : 1;
    var kw = encodeURIComponent(keyword.trim()).replace(/%20/g, "+");

    var url = BASE_URL + "/tim-truyen?keyword=" + kw;
    url = withPage(url, p);

    var doc = fetchRetry(url);
    if (!doc) return Response.success([]);

    var items = parseItems(doc);
    var next = getNextPage(doc, p);

    return Response.success(items, next);
}
