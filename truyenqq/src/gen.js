load("config.js");

function execute(url, page) {
    var p = page ? parseInt(page) : 1;
    var fetchUrl = withPage(url, p);

    var doc = fetchRetry(fetchUrl);
    if (!doc) return Response.success([], null);

    var items = parseItems(doc);
    var next = getNextPage(doc, p);

    return Response.success(items, next);
}
