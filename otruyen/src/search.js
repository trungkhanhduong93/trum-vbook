load("config.js");

function execute(keyword, page) {
    var kw = trimText(keyword);
    if (!kw) return Response.success([]);

    var p = page ? parseInt(page, 10) : 1;
    var url = buildSearchUrl(kw, p);
    var res = fetchRetry(url);
    if (!res || !res.ok) return Response.success([]);

    var doc = res.html();
    if (!doc) return Response.success([]);

    return Response.success(parseItems(doc), getNextPage(doc, p));
}
