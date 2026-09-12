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
    // API tra kem 2 anh quang cao cua site: banner-introduce.webp o dau va
    // banner_last_introduce.webp o cuoi (do 12/09/2026). Anh dau tien nguoi doc
    // nhin thay dang la banner, khong phai trang truyen.
    var junkWords = ["banner", "introduce", "/ads", "logo", "watermark"];
    for (var i = 0; i < images.length; i++) {
        var img = images[i];
        var link = img && img.src ? String(img.src).trim() : "";
        if (!link) continue;
        var lower = link.toLowerCase();
        var isJunk = false;
        for (var j = 0; j < junkWords.length; j++) {
            if (lower.indexOf(junkWords[j]) >= 0) {
                isJunk = true;
                break;
            }
        }
        if (isJunk) continue;
        var finalUrl = resolveUrl(link);
        if (!finalUrl || seen[finalUrl]) continue;
        seen[finalUrl] = true;
        data.push(finalUrl);
    }

    if (data.length === 0) return null;
    return Response.success(data);
}
