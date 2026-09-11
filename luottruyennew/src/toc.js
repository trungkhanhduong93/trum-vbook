load("config.js");

function execute(url) {
    try {
        if (!url) return Response.error("URL truyện không hợp lệ");
        if (url.indexOf("/") === 0) url = BASE_URL + url;
        url = url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);
        if (url.indexOf("/truyen-tranh/") !== -1) {
            url = url.replace("/truyen-tranh/", "/").replace(/\/$/, "").replace(/-\d+$/, "");
        }

        var doc = fetchRetry(url);
        if (!doc) return Response.error("Không tải được mục lục (mạng chậm hoặc lỗi kết nối)");

        var chapters = [];
        var seen = {};

        var links = doc.select("#chapter-list .item a, .reading-list .item a, #chapter-list a.chapter-name, a.chapter-name");
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

        // Fallback an toàn có phạm vi nếu chưa bóc được
        if (chapters.length === 0) {
            var fallbackLinks = doc.select("#chapter-list a[href*='/chapter-'], .reading-list a[href*='/chapter-']");
            for (var j = 0; j < fallbackLinks.size(); j++) {
                var la = fallbackLinks.get(j);
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
    } catch (e) {
        return Response.error("Lỗi khi tải mục lục: " + (e.message || e));
    }
}
