load('config.js');

// toc.js: Mục lục chương
// /api/comic/{slug} bị server ép limit (21 chương mới nhất), phần còn lại nằm ở
// /api/comic/{comicId}/chapter?offset={limit}&limit=-1 (xem /contents/v2/js/detail.js).
// URL pattern: /truyen/{slug}

// Lấy các chương cũ hơn khối đầu. offset phải đúng bằng result.limit; offset=0 trả rỗng.
function fetchRemainChapters(comicId, offset) {
    if (!comicId || !offset) return [];
    ensureSession();
    var j = apiGet('/api/comic/' + comicId + '/chapter?offset=' + offset + '&limit=-1');
    if (j && j.status && j.result && j.result.chapters) {
        return j.result.chapters;
    }
    return [];
}

function execute(url) {
    ensureSiteUrl();
    var slug = comicSlug(url);
    if (!slug) return Response.error('URL truyện không hợp lệ.');

    // Lấy thông tin truyện để tìm số chương mới nhất
    var json = apiGet('/api/comic/' + slug);
    if (!json || !json.status || !json.result) {
        // Fallback: Thử tải HTML mục lục nếu API gặp sự cố.
        // Không có cookie thì request bị 302 về trang chủ -> phải lọc đúng slug,
        // nếu không sẽ nhặt nhầm chương của truyện khác.
        try {
            ensureSession();
            var doc = Http.get(SITE_URL + '/truyen/' + slug).headers(HEADERS()).html();
            if (doc) {
                var aChaps = doc.select("a[href*='/truyen/" + slug + "/chuong-']");
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

    var offset = json.result.limit ? parseInt(json.result.limit, 10) : chapters.length;
    var remain = fetchRemainChapters(json.result.id, offset);
    var all = chapters.concat(remain);

    // Gom số chương thực tế rồi xếp tăng dần (cả hai API đều trả mới -> cũ)
    var nums = [];
    var seenNum = {};
    var i;
    for (i = 0; i < all.length; i++) {
        var cNum = String(all[i].numberChapter || '').trim();
        if (!cNum || seenNum[cNum]) continue;
        seenNum[cNum] = true;
        nums.push(cNum);
    }
    // Chương lẻ kiểu "104.5" vẫn xếp đúng; chương không phải số thì đẩy xuống cuối
    nums.sort(function (a, b) {
        var na = parseFloat(a), nb = parseFloat(b);
        if (isNaN(na) && isNaN(nb)) return 0;
        if (isNaN(na)) return 1;
        if (isNaN(nb)) return -1;
        return na - nb;
    });

    var list = [];
    for (i = 0; i < nums.length; i++) {
        list.push({
            name: 'Chương ' + nums[i],
            url: '/truyen/' + slug + '/chuong-' + nums[i],
            host: SITE_URL
        });
    }

    return Response.success(list);
}
