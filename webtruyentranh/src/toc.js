load("config.js");

function execute(url) {
    var slugMatch = url.match(/\/truyen-tranh\/([^\/]+)/);
    if (!slugMatch) return Response.error("URL không hợp lệ");
    var slug = slugMatch[1];

    var fetchUrl = API_BASE + "/truyen-tranh/" + slug;
    var str = fetchJson(fetchUrl);
    if (!str) return Response.error("Không tải được mục lục chương");

    try {
        var json = JSON.parse(str);
        if (json.status !== "success") return Response.error("Lỗi API: " + json.status);

        var data = json.data;
        var item = data.item || {};
        var servers = item.chapters || [];
        var chapters = [];

        if (servers.length > 0) {
            // Lấy server đầu tiên
            var server = servers[0];
            var serverData = server.server_data || [];
            
            for (var i = 0; i < serverData.length; i++) {
                var ch = serverData[i];
                var name = ch.filename || ("Chương " + ch.chapter_name);
                if (ch.chapter_title) name += " - " + ch.chapter_title;

                chapters.push({
                    name: trimText(name),
                    url: ch.chapter_api_data, // URL API lấy dữ liệu chương trực tiếp
                    host: BASE_URL
                });
            }
        }

        if (chapters.length === 0) return Response.error("Không tìm thấy chương nào");

        // Đảm bảo sắp xếp từ cũ đến mới (Chương 1 ở đầu)
        if (chapters.length > 1) {
            var firstNum = parseFloat(serverData[0].chapter_name);
            var lastNum = parseFloat(serverData[serverData.length - 1].chapter_name);
            if (!isNaN(firstNum) && !isNaN(lastNum) && firstNum > lastNum) {
                chapters.reverse();
            }
        }

        return Response.success(chapters);
    } catch (e) {
        return Response.error("Lỗi parse JSON: " + e.message);
    }
}
