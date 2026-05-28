load('config.js');

function execute(input, page) {
    if (!page) page = "1";
    var url = buildPageUrl(SITE_URL + input, page);
    var html = httpGet(url);
    if (!html) return null;

    var list = parseMangaCards(html);
    if (list.length === 0) return null;

    var next = (list.length >= LIMIT) ? String(parseInt(page) + 1) : "";
    return Response.success(list, next);
}
