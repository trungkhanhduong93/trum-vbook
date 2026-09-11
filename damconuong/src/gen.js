load("config.js");

function execute(input, page) {
    var p = page ? parseInt(page) : 1;
    var rawInput = input || "/";
    var fullUrl = rawInput.indexOf("http") === 0 ? rawInput : resolveUrl(rawInput);
    var targetUrl = buildPageUrl(fullUrl, p);

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
