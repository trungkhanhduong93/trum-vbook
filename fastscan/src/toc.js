load("config.js");

function execute(url) {
    var doc = fetchRetry(url);
    if (!doc) return Response.error("Không tải được mục lục");

    var chapters = [];
    // Bám .list_chapter: quét toàn trang sẽ dính chương của truyện khác ở
    // sidebar "đề cử" và 2 nút "Đọc từ đầu"/"Đọc tiếp".
    var links = doc.select(".list_chapter a[href*='/chuong-']");
    if (!links || links.size() === 0) links = doc.select(".works-chapter-item a[href*='/chuong-']");
    var seen = {};

    for (var i = 0; i < links.size(); i++) {
        var a = links.get(i);
        var href = a.attr("href") || "";
        if (!href) continue;

        href = resolveUrl(href);

        var name = a.text().trim().replace(/\s+/g, ' ');
        if (!name) continue;
        if (name === "Đọc từ đầu" || name === "Đọc tiếp" || name === "Mới nhất") continue;

        if (seen[href]) continue;
        seen[href] = true;

        chapters.push({
            name: name,
            url: href,
            host: HOST
        });
    }

    if (chapters.length === 0) return Response.error("Không tìm thấy chương truyện");

    // Reversing latest-first order to get chronological order for VBook
    chapters.reverse();
    return Response.success(chapters);
}
