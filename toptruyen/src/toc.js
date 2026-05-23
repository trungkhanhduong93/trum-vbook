load("config.js");

function execute(url) {
    var doc = fetchRetry(url);
    if (!doc) return Response.error("Không tải được mục lục");

    var chapters = [];
    var links = doc.select("a.chapter-row");

    for (var i = 0; i < links.size(); i++) {
        var a = links.get(i);
        var href = a.attr("href") || "";
        if (!href) continue;

        var nmEl = selFirst(a, ".chapter-left");
        var nm = nmEl ? nmEl.text().trim() : a.text().trim();
        if (!nm) continue;

        var timeEl = selFirst(a, ".chapter-right");
        var t = timeEl ? timeEl.text().trim() : "";
        var label = t ? (nm + " (" + t + ")") : nm;

        chapters.push({
            name: label,
            url: resolveUrl(href),
            host: HOST
        });
    }

    if (chapters.length === 0) return Response.error("Không tìm thấy chapter");

    chapters.reverse();
    return Response.success(chapters);
}
