load('config.js');

// toc.js: Mục lục chương
// /api/comic/{slug} chỉ trả 21 chương mới nhất (server ép limit). Toàn bộ chương
// nằm ở /api/comic/{comicId}/chapter?offset=0&limit=-1 — MỘT request là đủ,
// nhưng bắt buộc có cookie session.
//
// Chương nào bắt đăng nhập thì API đánh dấu sẵn bằng type = "TRIPLE" — cờ này
// CHÍNH XÁC, không phải suy từ vị trí chương. Đã đối chiếu với loadAll:
//   dai-quan-gia  775/800/850/873 TRIPLE -> khoá · 870 NORMAL -> 48 ảnh
//   dao-quy       52/92 TRIPLE -> khoá   · 60/71/91 NORMAL -> có ảnh
//   truyện đã hoàn thành (toan-chuc-phap-su, dai-vuong-tha-mang, cau-be-shotgun)
//   có 0 chương TRIPLE -> đọc được toàn bộ.
// Chương khoá nằm RẢI RÁC chứ không phải "21 chương mới nhất".
// URL pattern: /truyen/{slug}

function chapterCall(comicId, offset) {
    var j = apiGet('/api/comic/' + comicId + '/chapter?offset=' + offset + '&limit=-1');
    if (j && j.status && j.result && j.result.chapters && j.result.chapters.length) {
        return j.result.chapters;
    }
    return [];
}

// Ba lớp, vì đây là chỗ duy nhất quyết định mục lục đủ hay thiếu:
//   1. offset=0 -> trả trọn bộ trong một request
//   2. cookie hỏng thì lấy phiên mới rồi thử lại
//   3. server không nhận offset=0 thì quay về kiểu site tự dùng (offset={limit})
//      và ghép với khối chương mới nhất
function allChapters(comicId, latest, limit) {
    if (!comicId) return [];

    ensureSession();
    var out = chapterCall(comicId, 0);
    if (out.length) return out;

    resetSession();
    ensureSession();
    out = chapterCall(comicId, 0);
    if (out.length) return out;

    var off = limit ? parseInt(limit, 10) : latest.length;
    if (off) {
        out = chapterCall(comicId, off);
        if (out.length) return latest.concat(out);
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

    // Toàn bộ chương; nếu cả ba lớp đều hỏng thì ít nhất còn khối chương mới nhất.
    var all = allChapters(json.result.id, latest, json.result.limit);
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
