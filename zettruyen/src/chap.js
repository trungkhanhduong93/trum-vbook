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

        if (link.indexOf("//") === 0) link = "https:" + link;
        if (link.indexOf("data:") === 0) continue;
        if (link.indexOf("logo") !== -1) continue;
        if (link.indexOf("/icons/") !== -1) continue;
        if (link.indexOf("thumb-default") !== -1) continue;
        if (link.indexOf("/thumb/") !== -1) continue;

        if (seen[link]) continue;
        seen[link] = true;
        data.push(link);
    }

    if (data.length === 0) return Response.error("Không tìm thấy ảnh chương");
    return Response.success(data);
}
