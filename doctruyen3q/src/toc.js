load("config.js");

function execute(url) {
    var doc = fetchRetry(url);
    if (!doc) return Response.error("Không tải được mục lục");

    var chapters = [];
    var items = doc.select("#list-chapter-dt .chapters a.chapter, .list-chapter .chapters a, .list-chapter li.row a.chapter, .list-chapter .chapter a");
    if (!items || items.size() === 0) {
        items = doc.select(".list-chapter a, #list-chapter-dt a");
    }

    var seen = {};
    for (var i = 0; i < items.size(); i++) {
        var a = items.get(i);
        var rel = a.attr("rel") || "";
        if (rel.indexOf("nofollow") >= 0) continue;

        var nm = a.text().trim();
        var href = a.attr("href") || "";
        if (!nm || !href) continue;

        if (nm.indexOf("Truy cập") >= 0 || nm.indexOf("doctruyen3q") >= 0) continue;

        var fullUrl = resolveUrl(href);
        if (seen[fullUrl]) continue;
        seen[fullUrl] = true;

        chapters.push({
            name: nm,
            url: fullUrl,
            host: HOST
        });
    }

    if (chapters.length === 0) return Response.error("Không tìm thấy chapter");

    // Đảo ngược để xếp chap 1 lên đầu
    chapters.reverse();
    return Response.success(chapters);
}
