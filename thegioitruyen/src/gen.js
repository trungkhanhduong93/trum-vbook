load("config.js");

function execute(input, page) {
    var p = page ? parseInt(page, 10) : 1;
    if (!p || p < 1) p = 1;
    var str = fetchJson(withPage(input, p));
    if (!str) return Response.success([], null);
    var r = parseListResponse(parseJson(str), p);
    return Response.success(r.items, r.next);
}
