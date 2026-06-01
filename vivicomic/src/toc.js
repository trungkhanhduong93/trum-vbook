load("config.js");

function execute(url) {
    var doc = fetchRetry(url);
    if (!doc) return Response.error("Không tải được mục lục");

    var items = doc.select(".chapter-list a.chapter-item");
    if (!items || items.size() === 0) items = doc.select("a.chapter-item");
    if (!items || items.size() === 0) items = doc.select("#chapterList a");

    var chapters = [];
    var seen = {};
    for (var i = 0; i < items.size(); i++) {
        var a = items.get(i);
        var href = a.attr("href") || "";
        if (!href || href.indexOf("-chap-") < 0) continue;
        var link = resolveUrl(href);
        if (seen[link]) continue;
        seen[link] = true;

        var nmEl = selFirst(a, ".chap-name");
        var nm = nmEl ? nmEl.text().trim().replace(/\s+/g, " ") : a.text().trim().replace(/\s+/g, " ");
        var m = href.match(/-chap-([0-9]+(?:[.-][0-9]+)?)/i);
        var num = m ? parseFloat(m[1].replace("-", ".")) : 0;
        if (!nm) nm = "Chương " + (m ? m[1] : "");

        chapters.push({ name: nm, url: link, num: num, host: HOST });
    }

    if (chapters.length === 0) return Response.error("Không tìm thấy chapter");

    chapters.sort(function (a, b) { return a.num - b.num; });
    var out = [];
    for (var j = 0; j < chapters.length; j++) {
        out.push({ name: chapters[j].name, url: chapters[j].url, host: HOST });
    }
    return Response.success(out);
}
