load("config.js");

function execute(url) {
    if (url.startsWith("/")) url = BASE_URL + url;
    var doc = fetchRetry(url);
    if (!doc) return Response.error("Không tải được mục lục chương");

    var chapters = [];
    var seen = {};

    var links = doc.select(".chapter-list .ten-chapter a");
    for (var i = 0; i < links.size(); i++) {
        var a = links.get(i);
        var href = resolveUrl(a.attr("href"));
        if (!href || seen[href]) continue;
        seen[href] = true;

        var name = trimText(a.text());
        if (!name) name = "Chương " + (links.size() - i);

        chapters.push({
            name: name,
            url: href,
            host: BASE_URL
        });
    }

    if (chapters.length === 0) {
        // Fallback sang tất cả a chứa link /chapter- hoặc /chuong-
        var fallbackLinks = doc.select("a[href*=/chapter-], a[href*=/chuong-]");
        for (var j = 0; j < fallbackLinks.size(); j++) {
            var fa = fallbackLinks.get(j);
            var fHref = resolveUrl(fa.attr("href"));
            if (!fHref || seen[fHref]) continue;
            seen[fHref] = true;
            
            var fName = trimText(fa.text());
            if (!fName) fName = "Chương " + (fallbackLinks.size() - j);
            
            chapters.push({
                name: fName,
                url: fHref,
                host: BASE_URL
            });
        }
    }

    if (chapters.length === 0) return Response.error("Không tìm thấy chương nào");

    // Sắp xếp lại từ cũ nhất đến mới nhất (Chương 1 ở đầu)
    if (chapters.length > 1) {
        var firstNum = parseFloat(chapters[0].name.replace(/[^\d.]/g, ""));
        var lastNum = parseFloat(chapters[chapters.length - 1].name.replace(/[^\d.]/g, ""));
        if (!isNaN(firstNum) && !isNaN(lastNum) && firstNum > lastNum) {
            chapters.reverse();
        } else if (isNaN(firstNum) || isNaN(lastNum)) {
            // Fallback nếu không parse được số thì đảo ngược vì urimana mặc định mới nhất ở đầu
            chapters.reverse();
        }
    }

    return Response.success(chapters);
}
