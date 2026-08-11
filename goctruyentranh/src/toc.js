load('config.js');

// toc.js: Mục lục chương (Tải tức thì, không bị loop 100 lần)
// URL pattern: /truyen/{slug}

function execute(url) {
    ensureSiteUrl();
    var sUrl = String(url);

    var m = sUrl.match(/\/truyen\/([a-z0-9-]+)\/?$/);
    if (!m) return Response.error('URL truyện không hợp lệ.');
    var slug = m[1];

    // Lấy thông tin truyện để tìm số chương mới nhất
    var json = apiGet('/api/comic/' + slug);
    if (!json || !json.status || !json.result) {
        return Response.error('Không tải được mục lục truyện.');
    }

    var chapters = json.result.chapters;
    if (!chapters || !chapters.length) {
        return Response.error('Truyện chưa có chương nào.');
    }

    // Tìm số chương cao nhất trong mảng trả về
    var maxNum = 0;
    for (var i = 0; i < chapters.length; i++) {
        var num = parseInt(chapters[i].numberChapter, 10);
        if (!isNaN(num) && num > maxNum) {
            maxNum = num;
        }
    }

    if (maxNum <= 0) {
        // Fallback: dùng danh sách mảng chapters trực tiếp
        var list = [];
        for (var j = chapters.length - 1; j >= 0; j--) {
            list.push({
                name: 'Chương ' + String(chapters[j].numberChapter),
                url: '/truyen/' + slug + '/chuong-' + String(chapters[j].numberChapter),
                host: SITE_URL
            });
        }
        return Response.success(list);
    }

    // Tạo danh sách đầy đủ từ Chương 1 tới Chương maxNum
    var allChapters = [];
    for (var c = 1; c <= maxNum; c++) {
        allChapters.push({
            name: 'Chương ' + String(c),
            url: '/truyen/' + slug + '/chuong-' + String(c),
            host: SITE_URL
        });
    }

    return Response.success(allChapters);
}
