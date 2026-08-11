load('config.js');

// gen.js: Pagination handler dùng chung cho home + genre + search
// input: API path (ví dụ '/api/comic?page=1&sort=update')
// page: trang hiện tại (default '1')
function execute(input, page) {
    if (!page) page = '1';
    ensureSiteUrl();

    // Parse input URL để thay page
    var apiPath = String(input);

    // Thay thế page= trong URL nếu có, hoặc append
    if (apiPath.indexOf('page=') !== -1) {
        apiPath = apiPath.replace(/page=\d+/, 'page=' + page);
    } else {
        apiPath += (apiPath.indexOf('?') !== -1 ? '&' : '?') + 'page=' + page;
    }

    var json = apiGet(apiPath);
    if (!json || !json.status) return Response.error('Không tải được danh sách truyện.');

    // API /api/comic trả result.comics
    // API /api/comic/search trả result (mảng trực tiếp)
    var comics = null;
    if (json.result && json.result.comics) {
        comics = json.result.comics;
    } else if (json.result && json.result.length !== undefined && !json.result.comics) {
        // result là mảng (search API)
        comics = json.result;
    }

    if (!comics || !comics.length) {
        return Response.success([], null);
    }

    var list = [];
    for (var i = 0; i < comics.length; i++) {
        var card = mapComicCard(comics[i]);
        if (card) list.push(card);
    }

    // Xác định trang tiếp
    var next = calcNextPage(list, page);
    return Response.success(list, next);
}
