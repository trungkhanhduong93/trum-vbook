load("config.js");

function execute(url, page) {
    var p = page ? parseInt(page, 10) : 1;
    var fetchUrl = buildPagedUrl(url, p);

    var res = fetchRetry(fetchUrl);
    if (!res || !res.ok) return Response.success([], null);

    var doc = res.html();
    if (!doc) return Response.success([], null);

    return Response.success(parseItems(doc), getNextPage(doc, p));
}
