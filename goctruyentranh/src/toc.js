load('config.js');

// toc.js: Mục lục chương
// /api/comic/{slug} chỉ trả 21 chương mới nhất (server ép limit). Toàn bộ chương
// nằm ở /api/comic/{comicId}/chapter?offset=0&limit=-1 — MỘT request là đủ,
// nhưng bắt buộc có cookie X-TOKEN (Path=/api).
//
// Chương nào bắt đăng nhập thì API đánh dấu bằng type = "TRIPLE" — cờ này
// CHÍNH XÁC, đã đối chiếu với loadAll trên nhiều truyện.
// URL pattern: /truyen/{slug}

function fetchAllChapters(comicId) {
    if (!comicId) return [];

    var json = apiGetSession('/api/comic/' + comicId + '/chapter?offset=0&limit=-1');
    if (json && json.status && json.result && json.result.chapters && json.result.chapters.length) {
        return json.result.chapters;
    }
    return [];
}

function execute(url) {
    ensureSiteUrl();
    var slug = comicSlug(url);
    if (!slug) return Response.error('URL truyện không hợp lệ.');

    // API detail không cần cookie
    var json = apiGet('/api/comic/' + slug);
    if (!json || !json.status || !json.result) {
        return Response.error('Không tải được mục lục truyện.');
    }

    var latest = json.result.chapters || [];

    // Lấy toàn bộ chương qua WebView; nếu hỏng thì ít nhất còn 21 chương mới nhất
    var all = fetchAllChapters(json.result.id);
    if (!all.length) all = latest;
    if (!all.length) return Response.error('Truyện chưa có chương nào.');

    var locked = {};
    var nums = [];
    var seenNum = {};
    var i;
    for (i = 0; i < all.length; i++) {
        var cNum = String(all[i].numberChapter || '').trim();
        if (!cNum || seenNum[cNum]) continue;
        seenNum[cNum] = true;
        nums.push(cNum);
        if (String(all[i].type || '') === 'TRIPLE') locked[cNum] = true;
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
            name: 'Chương ' + nums[i] + (locked[nums[i]] ? ' (khoá - cần đăng nhập)' : ''),
            url: '/truyen/' + slug + '/chuong-' + nums[i],
            host: SITE_URL
        });
    }

    return Response.success(list);
}
