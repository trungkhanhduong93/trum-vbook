load("config.js");

function execute(key, page) {
    var k = String(key || "").trim();
    if (!k) return Response.success([], null);

    var p = parseInt(page, 10) || 1;
    var json = apiGet(withPage("/mangas/search?q=" + encodeURIComponent(k), p));
    if (!json) return Response.error("Không tìm kiếm được trên Cứu Truyện.");
    if (json.status === "error") return Response.success([], null);

    return Response.success(mapList(json), nextPageFrom(json, p));
}
