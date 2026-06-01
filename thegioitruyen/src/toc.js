load("config.js");

function execute(url) {
    var doc = fetchRetry(url);
    if (!doc) return Response.error("Không tải được mục lục");

    // Lấy slug truyện từ URL detail để chỉ nhận đúng chapter của truyện này
    var mSlug = String(url).match(/\/truyen\/([a-z0-9-]+)/i);
    var slug = mSlug ? mSlug[1] : "";

    var chapters = [];
    var seen = {};
    var links = doc.select("a[href*='/chap-']");
    for (var i = 0; i < links.size(); i++) {
        var a = links.get(i);
        var href = a.attr("href") || "";
        if (!href) continue;
        if (slug && href.indexOf("/truyen/" + slug + "/chap-") < 0) continue;
        var m = href.match(/\/chap-([0-9]+(?:[.-][0-9]+)?)\/?$/i);
        if (!m) continue;
        var link = resolveUrl(href);
        if (seen[link]) continue;
        seen[link] = true;

        var numStr = m[1].replace("-", ".");
        chapters.push({ name: "Chapter " + numStr, url: link, num: parseFloat(numStr) || 0, host: HOST });
    }

    if (chapters.length === 0) return Response.error("Không tìm thấy chapter");

    // Sắp xếp tăng dần theo số chương
    chapters.sort(function (a, b) { return a.num - b.num; });
    var out = [];
    for (var j = 0; j < chapters.length; j++) {
        out.push({ name: chapters[j].name, url: chapters[j].url, host: HOST });
    }
    return Response.success(out);
}
