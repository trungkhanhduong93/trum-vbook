load('config.js');

function parseUrl(url) {
    var s = String(url);
    var mChap = s.match(/\/chapters\/(\d+)/);
    var mComic = s.match(/comicId=(\d+)/);
    if (!mChap) return null;
    return {chapterId: mChap[1], comicId: mComic ? mComic[1] : ""};
}

function execute(url) {
    var p = parseUrl(url);
    if (!p) return null;

    var params = {chapterId: p.chapterId};
    if (p.comicId) params.comicId = p.comicId;

    var json = apiGet("/api/web/comic/chapters/" + p.chapterId, params);
    if (!json || json.code !== 0 || !json.data || !json.data.images) return null;

    var images = json.data.images;
    var data = [];
    var seen = {};
    for (var i = 0; i < images.length; i++) {
        var img = images[i];
        var link = img && img.src ? String(img.src).trim() : "";
        if (!link) continue;
        if (link.indexOf("//") === 0) link = "https:" + link;
        if (!seen[link]) {
            seen[link] = true;
            data.push(link);
        }
    }

    if (data.length === 0) return null;
    return Response.success(data);
}
