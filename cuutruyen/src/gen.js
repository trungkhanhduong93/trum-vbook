load('config.js');

function execute(input, page) {
    if (!page) page = "1";

    var url = withPage(input, page);
    var html = httpGet(url);
    if (!html) return null;

    var list = parseMangaCards(html);
    if (list.length === 0) return null;

    // Còn trang sau khi HTML có link page=N+1
    var nextNum = parseInt(page) + 1;
    var nextRe = new RegExp("[?&]page=" + nextNum + "(?:&|\"|')");
    var hasNext = nextRe.test(html);

    var next = hasNext ? String(nextNum) : "";
    return Response.success(list, next);
}
