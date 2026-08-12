load('config.js');

function execute(url) {
    var slug = comicSlug(url);
    if (!slug) return Response.error('Không nhận được đường dẫn truyện.');

    var json = proxyGet('/api/proxy/comic/' + slug);
    if (!json || !json.status || !json.result) {
        return Response.error('Không tải được thông tin truyện.');
    }

    var d = json.result;

    var ongoing = true;
    var statusStr = 'Đang tiến hành';
    if (d.statusCode) {
        var sc = String(d.statusCode).toUpperCase();
        if (sc === 'END' || sc === 'DONE' || sc === 'COMPLETE' || sc === 'COMPLETED') {
            ongoing = false;
            statusStr = 'Đã hoàn thành';
        }
    }

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
                    input: '/api/proxy/v2/search?categories=' + catId + '&orders=viewCount&p=0',
                    script: 'gen.js'
                });
            }
        }
    }

    var author = d.authorName ? String(d.authorName) : 'Đang cập nhật';
    var views  = d.viewCount  ? String(d.viewCount)  : '';
    var detail = 'Tác giả: ' + author + '<br>'
               + 'Trạng thái: ' + statusStr + '<br>'
               + (views ? 'Lượt xem: ' + views + '<br>' : '')
               + (d.otherName ? 'Tên khác: ' + d.otherName : '');

    var cover = d.photo ? absUrl(String(d.photo)) : '';
    var desc = d.description ? String(d.description).replace(/\r\n/g, '\n') : '';

    return Response.success({
        name: String(d.name || slug),
        cover: cover,
        host: SITE_URL,
        author: author,
        description: desc,
        detail: detail,
        ongoing: ongoing,
        genres: genres
    });
}
