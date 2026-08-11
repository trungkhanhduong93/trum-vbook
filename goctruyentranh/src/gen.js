load('config.js');

function execute(input, page) {
    if (!page) page = '1';
    ensureSiteUrl();

    var apiPath = String(input);

    // Xử lý API Search (/api/comic/search?name=...)
    if (apiPath.indexOf('/api/') === 0) {
        if (apiPath.indexOf('page=') !== -1) {
            apiPath = apiPath.replace(/page=\d+/, 'page=' + page);
        } else {
            apiPath += (apiPath.indexOf('?') !== -1 ? '&' : '?') + 'page=' + page;
        }
        var json = apiGet(apiPath);
        if (!json || !json.status) return Response.error('Không tải được danh sách truyện.');

        var comics = null;
        if (json.result && json.result.comics) {
            comics = json.result.comics;
        } else if (json.result && json.result.length !== undefined && !json.result.comics) {
            comics = json.result;
        }

        if (!comics || !comics.length) return Response.success([], null);

        var list = [];
        for (var i = 0; i < comics.length; i++) {
            var card = mapComicCard(comics[i]);
            if (card) list.push(card);
        }

        var next = (list.length >= 20) ? String(parseInt(page, 10) + 1) : null;
        return Response.success(list, next);
    }

    // Xử lý HTML Page (/truyen-cap-nhat hoặc /danh-sach)
    if (apiPath.indexOf('p=') !== -1) {
        apiPath = apiPath.replace(/p=\d+/, 'p=' + page);
    } else {
        apiPath += (apiPath.indexOf('?') !== -1 ? '&' : '?') + 'p=' + page;
    }

    try {
        var doc = Http.get(SITE_URL + apiPath).headers(HEADERS()).html();
        if (!doc) return Response.error('Không tải được danh sách truyện.');

        var list = parseHtmlCards(doc);
        if (!list || !list.length) return Response.success([], null);

        var next = (list.length >= 15) ? String(parseInt(page, 10) + 1) : null;
        return Response.success(list, next);
    } catch (e) {
        return Response.error('Lỗi khi nạp trang ' + page);
    }
}
