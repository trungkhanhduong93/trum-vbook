load('config.js');

function execute(input, page) {
    if (!page) page = '1';

    var apiPath = String(input);
    var apiPage = parseInt(page, 10) - 1;
    if (apiPage < 0) apiPage = 0;

    if (apiPath.indexOf('p=') !== -1) {
        apiPath = apiPath.replace(/p=\d+/, 'p=' + apiPage);
    } else {
        apiPath += (apiPath.indexOf('?') !== -1 ? '&' : '?') + 'p=' + apiPage;
    }

    var json = siteGet(apiPath);
    if (!json || !json.result) return Response.error('Không tải được danh sách truyện.');

    var comics = json.result.data;
    if (!comics || !comics.length) return Response.success([], null);

    var list = [];
    for (var i = 0; i < comics.length; i++) {
        var card = mapComicCard(comics[i]);
        if (card) list.push(card);
    }

    // result.next là boolean của site
    var next = json.result.next ? String(parseInt(page, 10) + 1) : null;
    return Response.success(list, next);
}
