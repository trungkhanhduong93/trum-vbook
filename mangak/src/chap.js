load('config.js');
function execute(url) {
    if (url.startsWith('/')) url = BASE_URL + url;
    url = url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);
    var doc = fetchRetry(url);
    if (doc) {
        var imgs = doc.select(".chapter-img-wrapper img");
        if (imgs.size() === 0) {
            imgs = doc.select(".chapter-images img");
        }
        var data = [];
        var seen = {};
        imgs.forEach(e => {
            var link = e.attr("src") || e.attr("data-src") || "";
            if (link) {
                link = link.trim();
                if (link.startsWith("//")) {
                    link = "https:" + link;
                }
                if (!seen[link]) {
                    seen[link] = true;
                    // Optimize image loading speed using WP proxy
                    if (link.indexOf('otruyencdn') > 0 || link.indexOf('mangak') > 0) {
                        data.push("https://i0.wp.com/" + link.replace(/^(https?:\/\/)/, ""));
                    } else {
                        data.push(link);
                    }
                }
            }
        });
        return Response.success(data);
    }
    return null;
}
