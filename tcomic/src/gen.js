load('config.js');

function execute(input, page) {
    if (!page) page = '1';
    if (!input) return null;

    var path = input;
    var json = apiGet(path, {page: page, limit: LIMIT});
    if (!json) return null;

    var arr = json.comics || json.data || [];
    if (!arr.length) return Response.success([], "");

    var list = [];
    for (var i = 0; i < arr.length; i++) {
        var card = mapComicCard(arr[i]);
        if (card) list.push(card);
    }

    var next = (list.length >= LIMIT) ? (parseInt(page) + 1).toString() : "";
    return Response.success(list, next);
}
