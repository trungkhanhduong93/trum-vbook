load("config.js");

function execute(url) {
    if (url.indexOf("/") === 0) url = BASE_URL + url;
    url = url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);

    var doc = fetchRetry(url);
    if (!doc) return Response.error("Không tải được mục lục");

    var chapters = [];
    var links = doc.select("div.reading-list div.item a.chapter-name");
    for (var i = 0; i < links.size(); i++) {
        var a = links.get(i);
        var href = resolveUrl(a.attr("href"));
        var name = trimText(a.text()) || ("Chương " + (i + 1));
        chapters.push({ name: name, url: href, host: BASE_URL });
    }

    // Site shows newest first, VBook needs oldest first
    chapters.reverse();

    if (chapters.length === 0) return Response.error("Không tìm thấy chương nào");
    return Response.success(chapters);
}
