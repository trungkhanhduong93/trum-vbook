load("config.js");

var PAGE_SIZE = 24;

function execute(keyword, page) {
    if (!keyword || keyword.trim().length === 0) return Response.success([]);
    var p = page ? parseInt(page) : 1;
    var offset = (p - 1) * PAGE_SIZE;
    var q = encodeURIComponent(keyword.trim());

    var url = "/manga/search?q=" + q + "&limit=" + PAGE_SIZE + "&offset=" + offset;
    var res = apiFetch(url);
    if (!res || !res.ok) return Response.success([]);

    var items = parseListResponse(res);

    var next = null;
    if (items.length >= PAGE_SIZE) next = String(p + 1);

    return Response.success(items, next);
}
