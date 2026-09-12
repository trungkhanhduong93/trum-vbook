load("config.js");

function execute(input, page) {
    var p = parseInt(page, 10) || 1;
    var json = apiGet(withPage(String(input), p));
    if (!json) return Response.error("Không tải được danh sách truyện từ Cứu Truyện.");
    if (json.status === "error") return Response.error(json.message || "Cứu Truyện trả về lỗi.");

    return Response.success(mapList(json), nextPageFrom(json, p));
}
