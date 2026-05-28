load("config.js");

function execute(keyword, page) {
    var kw = trimText(keyword);
    if (!kw) return Response.success([]);

    var p = page ? parseInt(page, 10) : 1;
    if (!p || p < 1) p = 1;

    var url = API_BASE + "/tim-kiem?keyword=" + encodeURIComponent(kw) + "&page=" + p;
    var str = fetchJson(url);
    if (!str) return Response.success([], null);

    var json = parseJson(str);
    var r = parseListResponse(json, p);
    return Response.success(r.items, r.next);
}
