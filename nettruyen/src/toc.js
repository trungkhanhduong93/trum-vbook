load("config.js");

function execute(url) {
    var doc = fetchRetry(url);
    if (!doc) return Response.error("Không tải được mục lục");

    var chapters = [];
    var items = doc.select("#nt_listchapter .chapter a, .list-chapter .chapter a, .col-xs-5.chapter a");
    if (!items || items.size() === 0) {
        items = doc.select(".list-chapter a, #nt_listchapter a");
    }

    var seen = {};
    for (var i = 0; i < items.size(); i++) {
        var a = items.get(i);
        var nm = a.text().trim();
        var href = a.attr("href") || "";
        if (!nm || !href) continue;
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

    chapters.reverse();
    return Response.success(chapters);
}
