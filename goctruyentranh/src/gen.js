load('config.js');

// gen.js: Xử lý phân trang cho cả HTML (/truyen-cap-nhat) lẫn API (/api/v2/search, /api/comic/search)
function execute(input, page) {
    if (!page) page = '1';
    ensureSiteUrl();

    var apiPath = String(input);

    // ── API /api/v2/search (genre, home Truyện Mới / Đang Hot) ──────────────
    // Response: { status, result: { p, limit, next, data: [comic, ...] } }
    // Phân trang: p=0,1,2,...  result.next = true nếu còn trang tiếp
    if (apiPath.indexOf('/api/v2/search') === 0) {
        var apiPage = parseInt(page, 10) - 1; // gen.js page 1-indexed, API p 0-indexed
        if (apiPage < 0) apiPage = 0;

        if (apiPath.indexOf('p=') !== -1) {
            apiPath = apiPath.replace(/p=\d+/, 'p=' + apiPage);
        } else {
            apiPath += (apiPath.indexOf('?') !== -1 ? '&' : '?') + 'p=' + apiPage;
        }

        var json = apiGet(apiPath);
        if (!json || !json.status || !json.result) return Response.error('Không tải được danh sách truyện.');

        var comics = json.result.data;
        if (!comics || !comics.length) return Response.success([], null);

        var list = [];
        for (var i = 0; i < comics.length; i++) {
            var card = mapComicCard(comics[i]);
            if (card) list.push(card);
        }

        var next = json.result.next ? String(parseInt(page, 10) + 1) : null;
        return Response.success(list, next);
    }

    // ── API khác (/api/comic/search, etc.) ──────────────────────────────────
    if (apiPath.indexOf('/api/') === 0) {
        if (apiPath.indexOf('page=') !== -1) {
            apiPath = apiPath.replace(/page=\d+/, 'page=' + page);
        } else {
            apiPath += (apiPath.indexOf('?') !== -1 ? '&' : '?') + 'page=' + page;
        }
        var json2 = apiGet(apiPath);
        if (!json2 || !json2.status) return Response.error('Không tải được danh sách truyện.');

        var comics2 = null;
        if (json2.result && json2.result.comics) {
            comics2 = json2.result.comics;
        } else if (json2.result && json2.result.length !== undefined && !json2.result.comics) {
            comics2 = json2.result;
        }

        if (!comics2 || !comics2.length) return Response.success([], null);

        var list2 = [];
        for (var j = 0; j < comics2.length; j++) {
            var card2 = mapComicCard(comics2[j]);
            if (card2) list2.push(card2);
        }

        var next2 = (list2.length >= 20) ? String(parseInt(page, 10) + 1) : null;
        return Response.success(list2, next2);
    }

    // ── HTML Page (/truyen-cap-nhat) ────────────────────────────────────────
    if (apiPath.indexOf('p=') !== -1) {
        apiPath = apiPath.replace(/p=\d+/, 'p=' + page);
    } else {
        apiPath += (apiPath.indexOf('?') !== -1 ? '&' : '?') + 'p=' + page;
    }

    try {
        var doc = Http.get(SITE_URL + apiPath).headers(HEADERS()).html();
        if (!doc) return Response.error('Không tải được danh sách truyện.');

        var list3 = parseHtmlCards(doc);
        if (!list3 || !list3.length) return Response.success([], null);

        var next3 = (list3.length > 0) ? String(parseInt(page, 10) + 1) : null;
        return Response.success(list3, next3);
    } catch (e) {
        return Response.error('Lỗi khi nạp trang ' + page);
    }
}
