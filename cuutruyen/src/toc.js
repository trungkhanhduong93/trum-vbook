load("config.js");

// /mangas/{id}/chapters trả TOÀN BỘ chương trong đúng một request (1093 chương
// = 241 KB), mới nhất trước -> phải đảo lại vì Vbook cần chương đầu đứng trước.
function execute(url) {
    var id = mangaIdFromUrl(url);
    if (!id) return Response.error("Không đọc được mã truyện từ đường dẫn.");

    var json = apiGet("/mangas/" + id + "/chapters");
    if (!json || !json.data) return Response.error("Không tải được mục lục truyện.");
    if (!json.data.length) return Response.error("Truyện này chưa có chương nào trên Cứu Truyện.");

    var list = [];
    var seen = {};
    for (var i = 0; i < json.data.length; i++) {
        var c = json.data[i];
        if (!c || !c.id) continue;
        if (seen[c.id]) continue;
        seen[c.id] = true;

        var label = "Chương " + String(c.number || "");
        if (c.name) label = label + " - " + String(c.name);

        list.push({
            name: label,
            url: chapterLink(id, c.id),
            host: HOST
        });
    }

    if (!list.length) return Response.error("Mục lục rỗng.");
    list.reverse();
    return Response.success(list);
}
