load('config.js');

function fetchRest(comicId, offset) {
    var path = '/api/comic/' + comicId + '/chapter?offset=' + offset + '&limit=-1';
    var json = siteGet(path);
    if (json && json.result) {
        if (Array.isArray(json.result)) return json.result;
        if (json.result.chapters && json.result.chapters.length) return json.result.chapters;
    }
    return [];
}

function execute(url) {
    syncBaseFromUrl(url);

    var slug = comicSlug(url);
    if (!slug) return Response.error('URL truyện không hợp lệ.');

    var json = siteGet('/api/comic/' + slug);
    if (!json || !json.result) return Response.error('Không tải được mục lục truyện.');

    var result = json.result;
    var latest = result.chapters || [];
    var limit = result.limit ? parseInt(result.limit, 10) : latest.length;

    var all = [];
    var i;
    for (i = 0; i < latest.length; i++) all.push(latest[i]);

    var rest = fetchRest(String(result.id), limit);
    for (i = 0; i < rest.length; i++) all.push(rest[i]);

    if (!all.length) return Response.error('Truyện chưa có chương nào.');

    var locked = {};
    var nums = [];
    var seen = {};
    for (i = 0; i < all.length; i++) {
        var cNum = String(all[i].numberChapter || '').trim();
        if (!cNum || seen[cNum]) continue;
        seen[cNum] = true;
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
            name: 'Chương ' + nums[i] + (locked[nums[i]] ? ' 🔒' : ''),
            url: SITE_URL + '/truyen/' + slug + '/chuong-' + nums[i],
            host: HOST
        });
    }

    return Response.success(list);
}
