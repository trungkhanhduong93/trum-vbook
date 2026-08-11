load("config.js");

function execute(url, page) {
    var p = page ? parseInt(page, 10) : 1;
    if (!p || p < 1) p = 1;

    var doc = fetchDoc(withPage(url, p));
    if (!doc) return Response.success([], null);

    return Response.success(parseCards(doc), nextPage(doc, p));
}
