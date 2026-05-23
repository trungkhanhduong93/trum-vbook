load("config.js");

function execute(url) {
    var doc = fetchRetry(url);
    if (!doc) return Response.error("Không tải được mục lục");

    var chapters = [];
    var links = doc.select("div.tgt-chapter-list a.tgt-chapter-item");
    if (!links || links.size() === 0) {
        links = doc.select("a.tgt-chapter-item");
    }

    for (var i = 0; i < links.size(); i++) {
        var a = links.get(i);
        var href = a.attr("href") || "";
        if (!href) continue;

        var nameEl = selFirst(a, "span.tgt-chap-name");
        var chName = nameEl ? nameEl.text().trim() : a.text().trim();
        if (!chName) continue;

        var titleEl = selFirst(a, "span.tgt-chap-title");
        if (titleEl) {
            var t = titleEl.text().trim();
            if (t) chName = chName + " - " + t;
        }

        chapters.push({
            name: chName,
            url: resolveUrl(href),
            host: HOST
        });
    }

    if (chapters.length === 0) {
        return Response.error("Không tìm thấy chapter");
    }

    // Reverse so oldest first (Vbook ascending)
    chapters.reverse();
    return Response.success(chapters);
}
