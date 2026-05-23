load("config.js");

function execute(url, page) {
    var p = page ? parseInt(page) : 1;

    // Build paged URL: append /page/N/ before query string
    var base = url.replace(/\/$/, "");
    var fetchUrl;
    if (p === 1) {
        fetchUrl = base + "/";
    } else {
        fetchUrl = base + "/page/" + p + "/";
    }

    var res = fetchRetry(fetchUrl);
    if (!res || !res.ok) return Response.success([], null);

    var doc = res.html();
    if (!doc) return Response.success([], null);

    var items = parseItems(doc);
    var next = getNextPage(doc, p);

    return Response.success(items, next);
}
