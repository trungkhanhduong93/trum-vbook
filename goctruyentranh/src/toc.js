load('config.js');

// toc.js: Mục lục chương
// /api/comic/{slug} chỉ trả 21 chương mới nhất (server ép limit). Toàn bộ chương
// nằm ở /api/comic/{comicId}/chapter?offset=0&limit=-1 — MỘT request là đủ,
// nhưng bắt buộc có cookie session.
//
// Đúng 21 chương mà /api/comic/{slug} trả về cũng chính là các chương site khoá
// (đo trên 2 truyện: 874-894 khoá / 870 mở). Nên đánh dấu luôn "(khoá)" ở đây,
// không tốn thêm request nào, để khỏi bấm vào rồi mới biết.
// URL pattern: /truyen/{slug}

function allChapters(comicId) {
    if (!comicId) return [];
    ensureSession();
    var j = apiGet('/api/comic/' + comicId + '/chapter?offset=0&limit=-1');
    if (j && j.status && j.result && j.result.chapters) {
        return j.result.chapters;
    }
    return [];
}

function execute(url) {
    ensureSiteUrl();
    var slug = comicSlug(url);
    if (!slug) return Response.error('URL truyện không hợp lệ.');

    var json = apiGet('/api/comic/' + slug);
    if (!json || !json.status || !json.result) {
        return Response.error('Không tải được mục lục truyện.');
    }

    var latest = json.result.chapters || [];

    // Toàn bộ chương; nếu request này hỏng thì ít nhất còn 21 chương mới nhất.
    var all = allChapters(json.result.id);
    if (!all.length) all = latest;
    if (!all.length) return Response.error('Truyện chưa có chương nào.');

    // Chỉ đánh dấu khi truyện thực sự dài hơn khối 21 chương đó — truyện ngắn trả
    // về đúng toàn bộ chương ở /api/comic/{slug} và KHÔNG hề bị khoá (đã đo trên
    // truyện 7 chương: chương 0 và 1 đều tải ảnh bình thường).
    var locked = {};
    var i;
    if (all.length > latest.length) {
        for (i = 0; i < latest.length; i++) {
            var ln = String(latest[i].numberChapter || '').trim();
            if (ln) locked[ln] = true;
        }
    }

    var nums = [];
    var seenNum = {};
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
            name: 'Chương ' + nums[i] + (locked[nums[i]] ? ' (khoá - cần đăng nhập)' : ''),
            url: '/truyen/' + slug + '/chuong-' + nums[i],
            host: SITE_URL
        });
    }

    return Response.success(list);
}
