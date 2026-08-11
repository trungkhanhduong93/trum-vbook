load('config.js');

// toc.js: Mục lục chương
// URL pattern: /truyen/{slug}
// API: GET /api/comic/{slug}  → result.chapters (21 chương/trang, limit=21)
// Nếu chapters < limit thì hết; nếu = limit thì cần fetch trang tiếp
// Chapter URL: /truyen/{slug}/chuong-{number}

function execute(url) {
    ensureSiteUrl();
    var sUrl = String(url);

    var m = sUrl.match(/\/truyen\/([a-z0-9-]+)\/?$/);
    if (!m) return Response.error('URL truyện không hợp lệ.');
    var slug = m[1];

    // Fetch tất cả chapters qua phân trang
    var allChapters = [];
    var page = 1;
    var limit = 21;
    var maxPages = 100; // tránh vòng lặp vô hạn

    while (page <= maxPages) {
        // Trang 1: API URL gốc, trang sau: thêm ?chapterPage=N
        var apiPath = '/api/comic/' + slug;
        if (page > 1) {
            apiPath = apiPath + '?chapterPage=' + page;
        }
        var json = apiGet(apiPath);
        if (!json || !json.status || !json.result) break;

        var d = json.result;
        var chapters = d.chapters;
        if (!chapters || !chapters.length) break;

        // Cập nhật limit nếu server trả khác
        if (d.limit) limit = d.limit;

        for (var i = 0; i < chapters.length; i++) {
            var ch = chapters[i];
            if (!ch || !ch.numberChapter) continue;
            allChapters.push({
                name: 'Chương ' + String(ch.numberChapter),
                url: '/truyen/' + slug + '/chuong-' + String(ch.numberChapter),
                host: SITE_URL
            });
        }

        // Nếu nhận ít hơn limit → hết trang
        if (chapters.length < limit) break;
        page++;
    }

    if (!allChapters.length) {
        return Response.error('Truyện chưa có chương nào.');
    }

    // API trả chapters mới nhất trước → đảo ngược để chương 1 đứng đầu
    allChapters.reverse();

    return Response.success(allChapters);
}
