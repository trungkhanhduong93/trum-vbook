load('config.js');

function execute(url) {
    syncBaseFromUrl(url);

    var slug = comicSlug(url);
    if (!slug) return Response.error('Không nhận được đường dẫn truyện.');

    primeSession();

    var json = siteGet('/api/comic/' + slug);
    if (!json || !json.result) return Response.error('Không tải được thông tin truyện.');

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

    // categoryIds / categoryNames là MẢNG, không phải chuỗi ngăn cách bằng
    // dấu cách — bản cũ String().split(' ') làm thể loại vỡ hết.
    var genres = [];
    var ids = d.categoryIds || [];
    var names = d.categoryNames || [];
    for (var i = 0; i < ids.length; i++) {
        var catId = String(ids[i] || '').trim();
        var catName = (i < names.length) ? String(names[i] || '').trim() : '';
        if (catId && catName) {
            genres.push({
                title: catName,
                input: '/api/v2/search?p=0&categories=' + catId,
                script: 'gen.js'
            });
        }
    }

    var author = d.authorName ? String(d.authorName) : 'Đang cập nhật';
    var views = d.viewCount ? String(d.viewCount) : '';
    var detail = 'Tác giả: ' + author + '<br>'
               + 'Trạng thái: ' + statusStr + '<br>'
               + (views ? 'Lượt xem: ' + views + '<br>' : '')
               + (d.otherName ? 'Tên khác: ' + d.otherName : '');

    return Response.success({
        name: String(d.name || slug),
        cover: d.photo ? absUrl(String(d.photo)) : '',
        host: HOST,
        author: author,
        description: d.description ? String(d.description).replace(/\r\n/g, '\n') : '',
        detail: detail,
        ongoing: ongoing,
        genres: genres
    });
}
