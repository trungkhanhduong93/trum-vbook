load("config.js");

function execute(url, page) {
    var p = page ? parseInt(page) : 1;
    var html = httpGet(withPage(url, p));
    if (!html) return Response.success([], null);

    var items = parseItems(html);
    var next = items.length > 0 ? getNextPage(html, p) : null;
    return Response.success(items, next);
}
