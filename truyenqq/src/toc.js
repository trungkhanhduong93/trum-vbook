load("config.js");

function execute(url) {
    var doc = fetchRetry(url);
    if (!doc) return Response.error("Không tải được mục lục");

    var chapters = [];
    var items = doc.select(".list_chapter .works-chapter-item");
    if (!items || items.size() === 0) {
        items = doc.select(".works-chapter-list .works-chapter-item");
    }
    if (!items || items.size() === 0) {
        items = doc.select(".works-chapter-item");
    }

    for (var i = 0; i < items.size(); i++) {
        var it = items.get(i);
        var a = selFirst(it, ".name-chap a");
        if (!a) a = selFirst(it, "a");
        if (!a) continue;

        var nm = a.text().trim();
        var href = a.attr("href") || "";
        if (!nm || !href) continue;

        chapters.push({
            name: nm,
            url: resolveUrl(href),
            host: HOST
        });
    }

    if (chapters.length === 0) return Response.error("Không tìm thấy chapter");

    chapters.reverse();
    return Response.success(chapters);
}
