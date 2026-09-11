load("config.js");

function execute(key, page) {
    if (!key || String(key).trim().length === 0) return Response.success([], null);
    var p = page ? parseInt(page) : 1;
    var encodedKey = encodeURIComponent(String(key).trim());

    var targetUrl = BASE_URL + "/?s=" + encodedKey + "&post_type=wp-manga";
    if (p > 1) {
        targetUrl = BASE_URL + "/page/" + p + "/?s=" + encodedKey + "&post_type=wp-manga";
    }

    var res = fetchRetry(targetUrl);
    if (!res || !res.ok) return Response.success([], null);

    var doc = res.html();
    if (!doc) return Response.success([], null);

    var items = parseItems(doc);
    var next = null;
    if (items.length >= 10) {
        next = String(p + 1);
    }
    return Response.success(items, next);
}
