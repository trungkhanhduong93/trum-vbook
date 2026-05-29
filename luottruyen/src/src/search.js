load("config.js");

function execute(keyword, page) {
    if (!keyword || keyword.trim().length === 0) return Response.success([]);

    resolveBaseUrl();
    var p = page ? parseInt(page) : 1;
    var url = BASE_URL + "/tim-truyen?keyword=" + encodeURIComponent(keyword.trim()) + "&page=" + p;

    var res = fetchRetry(url);
    if (!res || !res.ok) return Response.success([]);

    var doc = res.html();
    if (!doc) return Response.success([]);

    return Response.success(parseItems(doc), getNextPage(doc, p));
}
