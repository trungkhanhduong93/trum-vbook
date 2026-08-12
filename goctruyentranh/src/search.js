load('config.js');

function execute(key, page) {
    if (!key) return Response.success([], null);
    var encodedKey = encodeURIComponent(String(key));

    var json = proxyGet('/api/proxy/comic/search?name=' + encodedKey);
    if (!json || !json.status) return Response.error('Không tìm được truyện.');

    var comics = json.result;
    if (!comics || !comics.length) return Response.success([], null);

    var list = [];
    for (var i = 0; i < comics.length; i++) {
        var card = mapComicCard(comics[i]);
        if (card) list.push(card);
    }

    return Response.success(list, null);
}
