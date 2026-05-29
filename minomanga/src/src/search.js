load('config.js');

function execute(key, page) {
    if (!key || String(key).trim().length === 0) return Response.success([], null);
    var p = page ? parseInt(page) : 1;

    var url = API + "/books?category=" + TYPE + "&take=" + LIMIT + "&page=" + p +
              "&q=" + encodeURIComponent(String(key).trim());
    var data = jsonGet(url);
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
