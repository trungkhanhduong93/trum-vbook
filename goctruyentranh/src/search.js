load('config.js');

// /api/comic/search?name= trả thẳng mảng ở result (không phân trang)
function execute(key, page) {
    if (!key) return Response.success([], null);

    var json = siteGet('/api/comic/search?name=' + encodeURIComponent(String(key).trim()));
    if (!json) return Response.error('Không tìm được truyện.');

    var comics = json.result;
    if (!comics || !comics.length) return Response.success([], null);

    var list = [];
    for (var i = 0; i < comics.length; i++) {
        var card = mapComicCard(comics[i]);
        if (card) list.push(card);
    }

    return Response.success(list, null);
}
