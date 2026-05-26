load("config.js");

function execute(keyword, page) {
    var p = page ? parseInt(page) : 1;
    var fetchUrl = "";

    if (keyword && keyword.indexOf("http") === 0) {
        // URL từ home.js categories
        fetchUrl = withPage(keyword, p);
    } else if (keyword && keyword.trim().length > 0) {
        // Tìm kiếm bằng từ khóa
        fetchUrl = BASE_URL + "/tim-truyen";
        if (p > 1) fetchUrl += "/trang-" + p + ".html";
        fetchUrl += "?keyword=" + encodeURIComponent(keyword.trim());
    } else {
        fetchUrl = withPage(BASE_URL + "/truyen-moi-cap-nhat.html", p);
    }

    var doc = fetchRetry(fetchUrl);
    if (!doc) return Response.error("Không tải được danh sách truyện");

    var items = parseItems(doc);
    var next = items.length > 0 ? getNextPage(doc, p) : null;

    // Nếu parseItems trả rỗng nhưng trang vẫn có nội dung, thử check next page
    if (items.length > 0 && !next) {
        // Fallback: nếu có items nhưng getNextPage không tìm thấy link, vẫn cho phép load thêm
        next = String(p + 1);
    }

    return Response.success(items, next);
}
