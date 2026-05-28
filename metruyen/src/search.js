load('config.js');

function execute(key, page) {
    if (!page) page = "1";
    if (!key) return null;

    var q = encodeURIComponent(String(key));
    var url = SITE_URL + "/tim-kiem?sort=-updated_at&filter[name]=" + q
              + "&filter[status]=2,1&page=" + page;

    var html = httpGet(url);
    if (!html) return null;

    var list = parseMangaCards(html);
    if (list.length === 0) return null;

    var next = (list.length >= LIMIT) ? String(parseInt(page) + 1) : "";
    return Response.success(list, next);
}
