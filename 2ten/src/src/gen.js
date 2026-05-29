load("config.js");

// Bộ xử lý phân trang dùng chung cho mọi listing (home tab + thể loại)
function execute(input, page) {
    var p = page ? parseInt(page) : 1;
    var url = buildPageUrl(input, p);

    var res = fetchRetry(url);
    if (!res || !res.ok) return Response.success([], null);

    var doc = res.html();
    if (!doc) return Response.success([], null);

    var items = parseItems(doc);
    // Còn item → còn trang sau; trang rỗng sẽ tự dừng (next=null)
    var next = items.length > 0 ? String(p + 1) : null;

    return Response.success(items, next);
}
