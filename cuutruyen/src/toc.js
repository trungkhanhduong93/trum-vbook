load("config.js");

function execute(url) {
    var doc = fetchDoc(url);
    if (!doc) return Response.error("Không tải được mục lục");

    var chapters = [];
    var seen = {};

    // Mục lục nằm sẵn trong trang chi tiết, mỗi chương là một div.chapter-item.
    var items = doc.select("div.chapter-item");

    for (var i = 0; i < items.size(); i++) {
        var item = items.get(i);

        var a = selFirst(item, "a[href*='/chapters/']");
        if (!a) continue;
        var href = absUrl(a.attr("href"));
        if (!href || seen[href]) continue;

        // Số chương nằm trong div.p-1 cùng 2 nhãn "Chương"/"C." — cả hai đều có
        // trong DOM (site chỉ ẩn một cái bằng CSS), nên phải lấy <span> cuối.
        var num = "";
        var numBox = selFirst(item, "div.p-1");
        if (numBox) {
            var spans = numBox.select("span");
            if (spans.size() > 0) num = String(spans.get(spans.size() - 1).text()).trim();
            else num = String(numBox.text()).trim();
        }

        var title = "";
        var titleBox = selFirst(item, "div.truncate.flex-grow");
        if (titleBox) {
            title = String(titleBox.text()).trim().replace(/\s+/g, " ");
            if (title === "Không có tiêu đề") title = "";
        }

        var label = num ? ("Chương " + num) : "";
        if (label && title) label = label + " - " + title;
        if (!label) label = title || String(a.text()).trim().replace(/\s+/g, " ");
        if (!label) continue;

        seen[href] = true;
        chapters.push({ name: label, url: href, host: HOST });
    }

    if (chapters.length === 0) {
        return Response.error("Truyện này chưa có chương nào trên Cứu Truyện");
    }

    // Site liệt kê mới nhất trước; Vbook cần thứ tự từ chương đầu.
    chapters.reverse();
    return Response.success(chapters);
}
