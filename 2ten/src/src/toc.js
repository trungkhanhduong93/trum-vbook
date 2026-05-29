load("config.js");

function execute(url) {
    // Nhanh: gọi endpoint AJAX của Madara (chỉ ~8KB) thay vì tải cả trang detail
    var base = String(url).replace(/\/+$/, "") + "/";
    var chapters = chaptersViaAjax(base, url);

    // Fallback: parse từ chính trang truyện (một số bản nhúng sẵn danh sách)
    if (chapters.length === 0) {
        var res = fetchRetry(url);
        if (res && res.ok) {
            var doc = res.html();
            if (doc) chapters = parseChapters(doc);
        }
    }

    if (chapters.length === 0) return Response.error("Không tải được mục lục");

    // API trả mới → cũ; đảo để cũ nhất lên đầu (Vbook cần tăng dần)
    chapters.reverse();
    return Response.success(chapters);
}

function chaptersViaAjax(base, referer) {
    var res = fetch(base + "ajax/chapters/", {
        method: "POST",
        headers: {
            "User-Agent": FETCH_HEADERS["User-Agent"],
            "Referer": referer,
            "X-Requested-With": "XMLHttpRequest",
            "Accept": "text/html, */*; q=0.01"
        }
    });
    if (!res || !res.ok) return [];
    var doc = res.html();
    if (!doc) return [];
    return parseChapters(doc);
}
