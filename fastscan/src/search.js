load("config.js");

function execute(keyword, page) {
    if (!keyword || keyword.trim().length === 0) return Response.success([]);

    var p = page ? parseInt(page) : 1;
    var kw = encodeURIComponent(keyword.trim()).replace(/%20/g, "+");

    // Tham số tìm kiếm thật của fastscan là ?q= — ?keyword= bị server bỏ qua
    // và trả về danh sách mặc định (kết quả sai hoàn toàn).
    var url = BASE_URL + "/tim-kiem?q=" + kw;
    url = withPage(url, p);

    var doc = fetchRetry(url);
    if (!doc) return Response.success([]);

    var items = parseItems(doc);
    var next = getNextPage(doc, p);

    return Response.success(items, next);
}
