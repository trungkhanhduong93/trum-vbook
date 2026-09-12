load('config.js');

function execute(input, page) {
    var p = page ? parseInt(page) : 1;
    var data = jsonGet(API + "/books?" + buildBooksQuery(input, p));
    if (!data || !data.data || !data.data.books) return Response.success([], null);

    var list = [];
    for (var i = 0; i < data.data.books.length; i++) {
        var c = mapBook(data.data.books[i]);
        if (c) list.push(c);
    }

    var total = (data.meta && typeof data.meta.itemCount === 'number') ? data.meta.itemCount : 0;
    var next = (p * LIMIT < total) ? String(p + 1) : null;
    return Response.success(list, next);
}
