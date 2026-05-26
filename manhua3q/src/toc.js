load("config.js");

function execute(url) {
    var doc = fetchRetry(url);
    if (!doc) return Response.error("Không tải được mục lục");
    
    var html = doc.html();
    var chapters = [];
    
    var chapBlockMatch = html.match(/\\"chapters\\":\\\[(.*?)\\\]/);
    if (chapBlockMatch) {
        var chapBlock = chapBlockMatch[1];
        var cPattern = /\\"name\\":\\"([^\\"]+)\\",(?:.*?)\\"slug\\":\\"([^\\"]+)\\"/g;
        var cm;
        while ((cm = cPattern.exec(chapBlock)) !== null) {
            var cName = cm[1];
            var cSlug = cm[2];
            var cUrl = url + "/" + cSlug;
            chapters.push({
                name: "Chương " + cName,
                url: cUrl,
                host: BASE_URL
            });
        }
    } else {
        var links = doc.select("a[href*=/chapter-]");
        var seen = {};
        for (var i = 0; i < links.size(); i++) {
            var a = links.get(i);
            var href = resolveUrl(a.attr("href"));
            if (seen[href]) continue;
            seen[href] = true;
            chapters.push({
                name: trimText(a.text()) || ("Chương " + (i + 1)),
                url: href,
                host: BASE_URL
            });
        }
    }
    
    if (chapters.length === 0) return Response.error("Không tìm thấy chương");
    
    if (chapters.length > 1) {
        var first = chapters[0].name.replace(/[^\d]/g, "");
        var last = chapters[chapters.length - 1].name.replace(/[^\d]/g, "");
        if (parseInt(first) > parseInt(last)) {
            chapters.reverse();
        }
    }
    
    return Response.success(chapters);
}
