load('config.js');

function execute(key, page) {
    if (!page) page = '1';
    if (!key) return null;

    var json = apiGet("/api/web/comic/search", {q: key, page: page, limit: LIMIT});
    if (!json) return null;

    var arr = json.comics || json.data || [];
    var list = [];
    for (var i = 0; i < arr.length; i++) {
        var card = mapComicCard(arr[i]);
        if (card) list.push(card);
    }

    var next = (list.length >= LIMIT) ? (parseInt(page) + 1).toString() : "";
    return Response.success(list, next);
}
