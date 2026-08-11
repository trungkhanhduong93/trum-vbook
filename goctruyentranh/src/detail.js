load('config.js');

// detail.js: Chi tiết truyện
// URL pattern: /truyen/{nameEn}
// API: GET /api/comic/{nameEn}

function execute(url) {
    ensureSiteUrl();
    var slug = extractSlug(url);
    if (!slug) return Response.error('Không nhận được đường dẫn truyện.');

    var json = apiGet('/api/comic/' + slug);
    if (!json || !json.status || !json.result) {
        // Fallback: Thử tải HTML nếu API gặp sự cố
        try {
            var doc = Http.get(SITE_URL + '/truyen/' + slug).headers(HEADERS()).html();
            if (doc) {
                var titleEl = doc.select("h1, .title-detail, .comic-name").first();
                var name = titleEl ? String(titleEl.text()).trim() : slug;

                var coverEl = doc.select(".card-image img, .comic-detail img, img.lazy").first();
                var cover = coverEl ? absUrl(String(coverEl.attr("data-original") || coverEl.attr("src"))) : '';

                var descEl = doc.select(".description, .comic-desc, .detail-content").first();
                var desc = descEl ? String(descEl.text()).trim() : '';

                return Response.success({
                    name: name,
                    cover: cover,
                    host: SITE_URL,
                    author: 'Đang cập nhật',
                    description: desc,
                    detail: 'Trạng thái: Đang tiến hành',
                    ongoing: true,
                    genres: []
                });
            }
        } catch (e) {}

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
                    input: '/danh-sach?category=' + catId + '&p=1',
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
