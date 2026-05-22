load("config.js");

function execute(url) {
    var res = fetchRetry(url);
    if (!res || !res.ok) return Response.error("Không tải được mục lục");

    var doc = res.html();
    if (!doc) return Response.error("Không parse được HTML");

    // Lấy slug của truyện từ URL, ví dụ: https://www.toptruyenzone2.com/truyen-tranh/trong-sinh-chi-ac-phi-nghich-tap/18207
    // Cắt slug: "trong-sinh-chi-ac-phi-nghich-tap"
    var slug = "";
    var parts = url.split("/truyen-tranh/");
    if (parts.length > 1) {
        slug = parts[1].split("/")[0];
    }

    var chapters = [];
    var el = doc.select(".list-chapter li.row a");
    if (el.size() === 0) {
        el = doc.select(".list-chapter a");
    }

    for (var i = 0; i < el.size(); i++) {
        var e = el.get(i);
        var chName = e.text().trim();
        var chapterUrl = e.attr("href") || "";

        if (!chName || !chapterUrl) continue;

        // Chỉ lấy những chương có href chứa slug của truyện để tránh link quảng cáo liên kết chéo
        if (slug && chapterUrl.indexOf(slug) === -1) {
            continue;
        }

        chapterUrl = resolveUrl(chapterUrl);

        chapters.push({
            name: chName,
            url: chapterUrl,
            host: HOST
        });
    }

    if (chapters.length === 0) {
        return Response.error("Không tìm thấy chương nào");
    }

    chapters.reverse();
    return Response.success(chapters);
}
