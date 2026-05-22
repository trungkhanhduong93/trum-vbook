load('config.js');
function execute(url) {
    url = url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);
    var doc = fetchRetry(url);
    if (doc) {
        var imgs = doc.select(".chapter-images img");
        if (imgs.size() === 0) {
            imgs = doc.select(".chapter-img-wrapper img");
        }
        var data = [];
        imgs.forEach(e => {
            var link = e.attr("src") || e.attr("data-src") || "";
            if (link) {
                if (link.startsWith("//")) {
                    link = "https:" + link;
                }
                data.push({link: link});
            }
        });
        return Response.success(data);
    }
    return null;
}
