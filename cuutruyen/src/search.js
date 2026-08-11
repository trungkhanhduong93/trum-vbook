load("config.js");

function execute(key, page) {
    if (!key || String(key).trim().length === 0) return Response.success([], null);

    var p = page ? parseInt(page, 10) : 1;
    if (!p || p < 1) p = 1;

    // Tham số tìm kiếm của site là ?keyword= — ?q= bị bỏ qua và trả về trang rỗng.
    var url = SITE_URL + "/search?keyword=" + encodeURIComponent(String(key).trim());

    var doc = fetchDoc(withPage(url, p));
    if (!doc) return Response.success([], null);

    return Response.success(parseCards(doc), nextPage(doc, p));
}
