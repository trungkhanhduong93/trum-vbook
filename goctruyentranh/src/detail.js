load('config.js');

// detail.js: Chi tiết truyện
// URL pattern: /truyen/{nameEn}
// API: GET /api/comic/{nameEn}
// Response: { status, result: { name, otherName, description, photo, statusCode, authorName,
//              categoryIds, categoryNames, viewCount, followerCount,
//              chapters: [{id, numberChapter, stringUpdateTime}],
//              limit: 21 (mục lục theo trang) } }
function execute(url) {
    ensureSiteUrl();
    var sUrl = String(url);

    // Extract slug từ URL: /truyen/{slug}
    var m = sUrl.match(/\/truyen\/([a-z0-9-]+)\/?$/);
    if (!m) return Response.error('Không nhận được đường dẫn truyện.');
    var slug = m[1];

    var json = apiGet('/api/comic/' + slug);
    if (!json || !json.status || !json.result) {
        return Response.error('Không tải được thông tin truyện.');
    }

    var d = json.result;

    // Trạng thái
    var ongoing = true;
    var statusStr = 'Đang tiến hành';
    if (d.statusCode) {
        var sc = String(d.statusCode).toUpperCase();
        if (sc === 'END' || sc === 'DONE' || sc === 'COMPLETE' || sc === 'COMPLETED') {
            ongoing = false;
            statusStr = 'Đã hoàn thành';
        }
    }

    // Thể loại → genre items
    var genres = [];
    if (d.categoryIds && d.categoryNames) {
        var ids = String(d.categoryIds).split(' ');
        var names = String(d.categoryNames).split(' ');
        for (var i = 0; i < ids.length; i++) {
            var catId = ids[i] ? ids[i].trim() : '';
            var catName = names[i] ? names[i].trim() : '';
            if (catId && catName) {
                genres.push({
                    title: catName,
                    input: '/api/comic/search?category=' + catId + '&page=1',
                    script: 'gen.js'
                });
            }
        }
    }

    // Info string
    var author = d.authorName ? String(d.authorName) : 'Đang cập nhật';
    var views  = d.viewCount  ? String(d.viewCount)  : '';
    var detail = 'Tác giả: ' + author + '<br>'
               + 'Trạng thái: ' + statusStr + '<br>'
               + (views ? 'Lượt xem: ' + views + '<br>' : '')
               + (d.otherName ? 'Tên khác: ' + d.otherName : '');

    var cover = d.photo ? absUrl(String(d.photo)) : '';
    // Xoá ?code=gtt-yes nếu cần - nhưng để nguyên vì server cần nó
    var desc = d.description ? String(d.description).replace(/\r\n/g, '\n') : '';

    return Response.success({
        name: String(d.name || ''),
        cover: cover,
        host: SITE_URL,
        author: author,
        description: desc,
        detail: detail,
        ongoing: ongoing,
        genres: genres
    });
}
