load("config.js");

function execute(url) {
    var resp = fetchRetry(url);
    if (!resp || !resp.ok) {
        return Response.error("Không thể tải danh sách chương");
    }

    var doc = resp.html();
    var links = doc.select("a[href*='/truyen-hentai/']");
    var chapters = [];
    var seen = {};

    for (var i = 0; i < links.size(); i++) {
        var a = links.get(i);
        var href = a.attr("href") || "";

        if (href.indexOf("/chuong-") < 0 && href.indexOf("/chap-") < 0) continue;

        var rawTxt = txt(a);
        if (rawTxt === "Đọc từ đầu" || rawTxt === "Đọc mới nhất" || rawTxt === "Đọc oneshot") continue;

        var fullUrl = resolveUrl(href);
        if (seen[fullUrl]) continue;

        var titleEl = selFirst(a, "span.text-txt-primary, span.font-medium");
        var chapName = titleEl ? txt(titleEl) : rawTxt;

        if (chapName.indexOf("ngày trước") >= 0 || chapName.indexOf("giờ trước") >= 0 || chapName.indexOf("tháng trước") >= 0) {
            var m = chapName.match(/^(Chương\s+[0-9\.\-\sA-Za-z]+|Chap\s+[0-9\.\-\sA-Za-z]+|Oneshot[^\d]*)/i);
            if (m && m[1]) chapName = m[1].trim();
        }

        if (!chapName) chapName = "Chương " + (chapters.length + 1);

        seen[fullUrl] = true;
        chapters.push({
            name: chapName,
            url: fullUrl,
            host: HOST
        });
    }

    if (chapters.length === 0) {
        return Response.error("Không tìm thấy chương nào");
    }

    chapters.reverse();

    return Response.success(chapters);
}
