load('config.js');
function execute(url) {
    if (url.indexOf('/') === 0) url = BASE_URL + url;
    url = url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);
    var doc = fetchRetry(url);
    if (doc) {
        var imgs = doc.select(".chapter-img-wrapper img");
        if (imgs.size() === 0) {
            imgs = doc.select(".chapter-images img");
        }
        var data = [];
        var seen = {};
        for (var i = 0; i < imgs.size(); i++) {
            var e = imgs.get(i);
            var link = e.attr("src") || e.attr("data-src") || "";
            if (link) {
                link = link.trim();
                if (link.indexOf("//") === 0) {
                    link = "https:" + link;
                }
                if (!seen[link]) {
                    seen[link] = true;
                    data.push(link + "|Referer=" + BASE_URL + "/");
                }
            }
        }
        return Response.success(data);
    }
    return null;
}
