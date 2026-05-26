load("config.js");

function execute(url) {
    if (url.charAt(0) === "/") url = BASE_URL + url;
    var doc = fetchRetry(url);
    if (!doc) return Response.error("Không tải được mục lục chương");

    var links = doc.select(".works-chapter-item .name-chap a");
    var n = links.size();
    if (n === 0) {
        links = doc.select(".list_chapter a");
        n = links.size();
    }
    if (n === 0) {
        links = doc.select(".chapter-list a[href*=chap]");
        n = links.size();
    }

    var chapters = [];
    var seen = {};
    for (var i = 0; i < n; i++) {
        var a = links.get(i);
        var href = a.attr("href");
        if (!href || href.indexOf("chap") < 0) continue;

        var fullUrl = resolveUrl(href);
        if (seen[fullUrl]) continue;
        seen[fullUrl] = true;

        var name = trimText(a.text());
        if (!name) name = "Chương " + (chapters.length + 1);

        chapters.push({ name: name, url: fullUrl, host: HOST });
    }

    var len = chapters.length;
    if (len === 0) return Response.error("Không tìm thấy chương nào");

    if (len > 1) {
        var firstNum = parseFloat(chapters[0].name.replace(/[^\d.]/g, ""));
        var lastNum = parseFloat(chapters[len - 1].name.replace(/[^\d.]/g, ""));
        if (!isNaN(firstNum) && !isNaN(lastNum) && firstNum > lastNum) {
            chapters.reverse();
        }
    }

    return Response.success(chapters);
}
