load("config.js");

function execute(url) {
    var base = String(url).replace(/\/+$/, "") + "/";
    var chapters = chaptersViaAjax(base, url);

    if (chapters.length === 0) {
        try {
            var res = fetch(safeEncodeUrl(url), {
                headers: FETCH_HEADERS,
                timeout: 5000
            });
            if (res && res.ok) {
                var doc = res.html();
                if (doc) chapters = parseChapters(doc);
            }
        } catch (e) {}
    }

    if (chapters.length === 0) return Response.error("Không tải được mục lục hoặc truyện chưa có chương.");

    chapters.reverse();
    return Response.success(chapters);
}

function chaptersViaAjax(base, referer) {
    try {
        var ajaxUrl = safeEncodeUrl(base + "ajax/chapters/");
        var res = fetch(ajaxUrl, {
            method: "POST",
            headers: {
                "User-Agent": FETCH_HEADERS["User-Agent"],
                "Referer": BASE_URL + "/",
                "X-Requested-With": "XMLHttpRequest",
                "Accept": "text/html, */*; q=0.01"
            },
            body: "",
            timeout: 7000
        });
        if (!res || !res.ok) return [];
        var doc = res.html();
        if (!doc) return [];
        return parseChapters(doc);
    } catch (e) {
        return [];
    }
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
