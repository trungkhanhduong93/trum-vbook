load("config.js");

function execute(url) {
    var base = String(url).replace(/\/+$/, "") + "/";
    var chapters = chaptersViaAjax(base, url);

    if (chapters.length === 0) {
        var res = fetchRetry(url);
        if (res && res.ok) {
            var doc = res.html();
            if (doc) chapters = parseChapters(doc);
        }
    }

    if (chapters.length === 0) return Response.error("Không tải được mục lục");

    chapters.reverse();
    return Response.success(chapters);
}

function chaptersViaAjax(base, referer) {
    var res = fetch(base + "ajax/chapters/", {
        method: "POST",
        headers: {
            "User-Agent": FETCH_HEADERS["User-Agent"],
            "Referer": referer,
            "X-Requested-With": "XMLHttpRequest",
            "Accept": "text/html, */*; q=0.01"
        }
    });
    if (!res || !res.ok) return [];
    var doc = res.html();
    if (!doc) return [];
    return parseChapters(doc);
}

function parseChapters(doc) {
    var list = [];
    var rows = doc.select("li.wp-manga-chapter, .wp-manga-chapter");
    for (var i = 0; i < rows.size(); i++) {
        var a = selFirst(rows.get(i), "a");
        if (!a) continue;
        var href = a.attr("href") || "";
        if (!href || href === "#") continue;
        var title = txt(a);
        if (!title) continue;
        list.push({
            name: title,
            url: resolveUrl(href),
            host: HOST
        });
    }
    return list;
}
