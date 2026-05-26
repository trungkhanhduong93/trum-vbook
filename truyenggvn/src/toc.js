load("config.js");

function execute(url) {
    if (url.indexOf("/") === 0) url = BASE_URL + url;
    var doc = fetchRetry(url);
    if (!doc) return Response.error("Không tải được mục lục chương");

    var chapters = [];
    var seen = {};

    // Selector chính: .works-chapter-item .name-chap a
    var links = doc.select(".works-chapter-item .name-chap a");

    // Fallback 1: .list_chapter a
    if (links.size() === 0) {
        links = doc.select(".list_chapter a");
    }

    // Fallback 2: chapter-list chung
    if (links.size() === 0) {
        links = doc.select(".chapter-list a[href*=chap]");
    }

    for (var i = 0; i < links.size(); i++) {
        var a = links.get(i);
        var href = a.attr("href") || "";
        if (!href || href.indexOf("chap") < 0) continue;

        var fullUrl = resolveUrl(href);
        if (seen[fullUrl]) continue;
        seen[fullUrl] = true;

        var name = trimText(a.text());
        if (!name) name = "Chương " + (i + 1);

        chapters.push({
            name: name,
            url: fullUrl,
            host: HOST
        });
    }

    if (chapters.length === 0) return Response.error("Không tìm thấy chương nào");

    // Sắp xếp từ cũ nhất đến mới nhất (Chương 1 ở đầu)
    // Trang truyenggvn liệt kê chương mới nhất ở đầu
    if (chapters.length > 1) {
        var firstNum = parseFloat(chapters[0].name.replace(/[^\d.]/g, ""));
        var lastNum = parseFloat(chapters[chapters.length - 1].name.replace(/[^\d.]/g, ""));
        if (!isNaN(firstNum) && !isNaN(lastNum) && firstNum > lastNum) {
            chapters.reverse();
        }
    }

    return Response.success(chapters);
}
