load("config.js");

var PAGE_SIZE = 24;

function execute(input, page) {
    var p = page ? parseInt(page) : 1;
    var offset = (p - 1) * PAGE_SIZE;

    // input is a path like "/manga?sort=latest" or "/manga/top/all-time"
    var path = input || "/manga";
    var sep = path.indexOf("?") >= 0 ? "&" : "?";
    var url = path + sep + "limit=" + PAGE_SIZE + "&offset=" + offset;

    var res = apiFetch(url);
    if (!res || !res.ok) return Response.success([], null);

    var items = parseListResponse(res);

    var next = null;
    if (items.length >= PAGE_SIZE) next = String(p + 1);

    return Response.success(items, next);
}
