load('config.js');

// search.js: Tìm kiếm truyện
// API: /api/comic/search?name={key}  (đã verify: trả mảng trực tiếp)
function execute(key, page) {
    if (!key) return Response.success([], null);
    if (!page) page = '1';
    ensureSiteUrl();

    var encodedKey = encodeURIComponent(String(key));
    // Note: /api/comic/search không hỗ trợ phân trang qua page= (trả tất cả ngắn)
    var json = apiGet('/api/comic/search?name=' + encodedKey);
    if (!json || !json.status) return Response.error('Không tìm được truyện.');

    var comics = json.result;
    if (!comics || !comics.length) {
        return Response.success([], null);
    }

    var list = [];
    for (var i = 0; i < comics.length; i++) {
        var card = mapComicCard(comics[i]);
        if (card) list.push(card);
    }

    // Search API trả tất cả - không phân trang
    return Response.success(list, null);
}
