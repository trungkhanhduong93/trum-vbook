load('config.js');

function execute(key, page) {
    if (!key) return null;
    if (!page) page = "1";

    var q = encodeURIComponent(String(key));
    var path = "/search?keyword=" + q;
    var url = withPage(path, page);

    var html = httpGet(url);
    if (!html) return null;

    var list = parseMangaCards(html);
    if (list.length === 0) return null;

    var nextNum = parseInt(page) + 1;
    var nextRe = new RegExp("[?&]page=" + nextNum + "(?:&|\"|')");
    var hasNext = nextRe.test(html);
    var next = hasNext ? String(nextNum) : "";

    return Response.success(list, next);
}
