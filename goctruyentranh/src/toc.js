load('config.js');

function fetchAllChapters(comicId) {
    if (!comicId) return [];
    var json = proxyGet('/api/proxy/comic/' + comicId + '/chapter?offset=0&limit=-1');
    if (json && json.status && json.result && json.result.chapters && json.result.chapters.length) {
        return json.result.chapters;
    }
    return [];
}

function execute(url) {
    var slug = comicSlug(url);
    if (!slug) return Response.error('URL truyện không hợp lệ.');

    var json = proxyGet('/api/proxy/comic/' + slug);
    if (!json || !json.status || !json.result) {
        return Response.error('Không tải được mục lục truyện.');
    }

    var latest = json.result.chapters || [];
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
