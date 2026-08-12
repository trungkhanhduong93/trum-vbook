load('config.js');

// toc.js: Mục lục chương (Tải tức thì, không bị loop 100 lần)
// URL pattern: /truyen/{slug}

function execute(url) {
    ensureSiteUrl();
    var slug = extractSlug(url);
    if (!slug) return Response.error('URL truyện không hợp lệ.');

    // Lấy thông tin truyện để tìm số chương mới nhất
    var json = apiGet('/api/comic/' + slug);
    if (!json || !json.status || !json.result) {
        // Fallback: Thử tải HTML mục lục nếu API gặp sự cố
        try {
            var doc = Http.get(SITE_URL + '/truyen/' + slug).headers(HEADERS()).html();
            if (doc) {
                var aChaps = doc.select("a[href*='/chuong-']");
                if (aChaps && aChaps.size() > 0) {
                    var list = [];
                    var seen = {};
                    for (var k = aChaps.size() - 1; k >= 0; k--) {
                        var aEl = aChaps.get(k);
                        var cUrl = String(aEl.attr("href") || '').trim();
                        var cName = String(aEl.text() || '').trim();
                        if (cUrl && !seen[cUrl]) {
                            seen[cUrl] = true;
                            list.push({
                                name: cName || 'Chương',
                                url: cUrl,
                                host: SITE_URL
                            });
                        }
                    }
                    if (list.length > 0) return Response.success(list);
                }
            }
        } catch (e) {}

        return Response.error('Không tải được mục lục truyện.');
    }

    var chapters = json.result.chapters;
    if (!chapters || !chapters.length) {
        return Response.error('Truyện chưa có chương nào.');
    }

    // Map danh sách chương thực tế từ API (đảo ngược từ cũ nhất -> mới nhất)
    var list = [];
    var seenNum = {};
    for (var j = chapters.length - 1; j >= 0; j--) {
        var cNum = String(chapters[j].numberChapter || '').trim();
        if (!cNum || seenNum[cNum]) continue;
        seenNum[cNum] = true;

        list.push({
            name: 'Chương ' + cNum,
            url: '/truyen/' + slug + '/chuong-' + cNum,
            host: SITE_URL
        });
    }

    return Response.success(list);
}
