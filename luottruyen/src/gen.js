load("config.js");

// gen.js handles home content tabs and browsing pages
function execute(url, page) {
    syncBaseFromUrl(url);
    var p = page ? parseInt(page) : 1;

    // Build URL with page parameter
    var fetchUrl = url;
    if (fetchUrl.indexOf("?") >= 0) {
        fetchUrl = fetchUrl + "&page=" + p;
    } else {
        fetchUrl = fetchUrl + "?page=" + p;
    }

    var res = fetchRetry(fetchUrl);
    if (!res || !res.ok) return Response.success([], null);

    var doc = res.html();
    if (!doc) return Response.success([], null);

    var items = parseItems(doc);
    var next = getNextPage(doc, p);

    return Response.success(items, next);
}
