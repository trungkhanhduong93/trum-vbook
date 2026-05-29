load('config.js');

// Bộ xử lý listing dùng chung (home tab + thể loại). Gọi API JSON
// trực tiếp — KHÔNG dùng Engine.newBrowser → nhanh hơn nhiều lần.
function execute(input, page) {
    var p = page ? parseInt(page) : 1;
    var data = jsonGet(API + "/books?" + buildBooksQuery(input, p));
    if (!data || !data.books) return Response.success([], null);

    var list = [];
    for (var i = 0; i < data.books.length; i++) {
        var c = mapBook(data.books[i]);
        if (c) list.push(c);
    }

    var total = data.countBook || 0;
    var next = (p * LIMIT < total) ? String(p + 1) : null;
    return Response.success(list, next);
}
