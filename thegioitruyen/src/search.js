load("config.js");

function execute(keyword, page) {
    if (!keyword || keyword.trim().length === 0) return Response.success([]);

    var p = page ? parseInt(page) : 1;
    var kw = encodeURIComponent(keyword.trim()).replace(/%20/g, "+");

    var url;
    if (p === 1) {
        url = BASE_URL + "/search/" + kw + "/";
    } else {
        url = BASE_URL + "/search/" + kw + "/page/" + p + "/";
    }

    var res = fetchRetry(url);
    if (!res || !res.ok) return Response.success([]);

    var doc = res.html();
    if (!doc) return Response.success([]);

    return Response.success(parseItems(doc), getNextPage(doc, p));
}
