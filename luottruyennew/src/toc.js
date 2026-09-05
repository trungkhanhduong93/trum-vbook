load("config.js");

function execute(url) {
    if (url.indexOf("/") === 0) url = BASE_URL + url;
    url = url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);

    var doc = fetchRetry(url);
    if (!doc || isChallenge(doc)) {
        if (url.indexOf("/truyen-tranh/") !== -1) {
            var altUrl = url.replace("/truyen-tranh/", "/").replace(/\/$/, "");
            var altDoc = fetchRetry(altUrl);
            if (altDoc) doc = altDoc;
        }
    }
    if (!doc) return Response.error("Không tải được mục lục");

    var chapters = [];
    var seen = {};

    // Selector mở rộng: quét cả item-name, chapter-list, reading-list
    // (Các chap cũ không có class .chapter-name mà chỉ có <a href="..."> nằm trong .item-name)
    var links = doc.select("#chapter-list .reading-list .item a, .reading-list .item a, .reading-list a[href*='/chapter-'], #chapter-list a[href*='/chapter-'], a.chapter-name");
    for (var i = 0; i < links.size(); i++) {
        var a = links.get(i);
        var href = a.attr("href") || "";
        if (!href || href.indexOf("/chapter-") === -1) continue;

        var fullUrl = resolveUrl(href);
        if (seen[fullUrl]) continue;
        seen[fullUrl] = true;

        var name = trimText(a.text()) || ("Chương " + (chapters.length + 1));
        chapters.push({ name: name, url: fullUrl, host: BASE_URL });
    }

    // Fallback nếu danh sách rỗng: quét toàn bộ thẻ a có href chứa /chapter-
    if (chapters.length === 0) {
        var allLinks = doc.select("a[href*='/chapter-']");
        for (var j = 0; j < allLinks.size(); j++) {
            var la = allLinks.get(j);
            var lhref = la.attr("href") || "";
            if (!lhref || lhref.indexOf("/chapter-") === -1) continue;

            var lFull = resolveUrl(lhref);
            if (seen[lFull]) continue;
            seen[lFull] = true;

            var lname = trimText(la.text()) || ("Chương " + (chapters.length + 1));
            chapters.push({ name: lname, url: lFull, host: BASE_URL });
        }
    }

    // Site shows newest first, VBook needs oldest first
    chapters.reverse();

    if (chapters.length === 0) return Response.error("Không tìm thấy chương nào");
    return Response.success(chapters);
}
