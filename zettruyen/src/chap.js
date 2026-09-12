load('config.js');

function execute(url) {
    if (url.indexOf('/') === 0) url = BASE_URL + url;
    url = url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);

    var doc = fetchRetry(url);
    if (!doc) return Response.error("Không tải được trang chương");

    // Live structure: div.chapter-images-container > div.w-full.mx-auto.center > img (src is direct CDN URL)
    var imgs = doc.select("div.chapter-images-container img");
    if (!imgs || imgs.size() === 0) {
        imgs = doc.select("div.w-full.mx-auto.center img");
    }
    if (!imgs || imgs.size() === 0) {
        imgs = doc.select(".reading-detail img, #chapter-content img, .page-chapter img");
    }

    var data = [];
    var seen = {};
    var n = (imgs.size ? imgs.size() : imgs.length);
    // "zettruyen-wp" la watermark cua site, do 12/09/2026 no la ANH DAU moi chuong.
    var junkWords = ["logo", "/icons/", "icon", "thumb-default", "/thumb/", "banner", "avatar", "/ads", "button", "pepe", "placeholder", "loading", "follow", "zettruyen-wp"];

    for (var i = 0; i < n; i++) {
        var e = (imgs.get ? imgs.get(i) : imgs[i]);
        var link = e.attr("src") || e.attr("data-src") || "";
        if (!link) {
            var ss = e.attr("srcset") || "";
            if (ss && ss.indexOf(" ") > 0) link = ss.split(" ")[0];
            else link = ss;
        }
        if (!link) continue;
        link = link.trim();

        if (link.indexOf("data:") === 0) continue;

        var lower = link.toLowerCase();
        var isJunk = false;
        for (var j = 0; j < junkWords.length; j++) {
            if (lower.indexOf(junkWords[j]) !== -1) {
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

    if (data.length === 0) return Response.error("Không tìm thấy ảnh chương");
    return Response.success(data);
}
