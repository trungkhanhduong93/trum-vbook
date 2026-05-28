load('config.js');

function execute(input, page) {
    if (!page) page = "1";

    // Thay page number trong URL
    var url = SITE_URL + input.replace(/\/\d+\/?$/, "/" + page);
    var html = httpGet(url);
    if (!html) return null;

    var list = parseMangaCards(html);
    if (list.length === 0) return null;

    var next = (list.length >= LIMIT) ? String(parseInt(page) + 1) : "";
    return Response.success(list, next);
}
