load("config.js");

function execute(keyword, page) {
    if (!keyword || keyword.trim().length === 0) return Response.success([]);

    var p = page ? parseInt(page) : 1;
    var kw = encodeURIComponent(keyword.trim());
    var qs = "?s=" + kw + "&post_type=wp-manga";
    var url = p > 1 ? (BASE_URL + "/page/" + p + "/" + qs) : (BASE_URL + "/" + qs);

    var res = fetchRetry(url);
    if (!res || !res.ok) return Response.success([]);

    var doc = res.html();
    if (!doc) return Response.success([]);

    var items = parseSearchItems(doc);
    var next = items.length > 0 ? String(p + 1) : null;

    return Response.success(items, next);
}
