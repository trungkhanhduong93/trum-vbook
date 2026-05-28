load("config.js");

function execute(url) {
    var slug = extractSlug(url);
    if (!slug) return Response.error("URL truyện không hợp lệ");

    var str = fetchJson(API_BASE + "/truyen-tranh/" + slug);
    if (!str) return Response.error("Không tải được mục lục");

    var json = parseJson(str);
    if (!json || json.status !== "success" || !json.data || !json.data.item) {
        return Response.error("API trả về dữ liệu không hợp lệ");
    }

    var servers = json.data.item.chapters || [];
    if (servers.length === 0) return Response.error("Truyện chưa có chương");

    // Lấy server đầu tiên (thường là server chính)
    var serverData = servers[0].server_data || [];
    if (serverData.length === 0) return Response.error("Truyện chưa có chương");

    var chapters = [];
    for (var i = 0; i < serverData.length; i++) {
        var ch = serverData[i];
        var cn = trimText(ch.chapter_name);
        var ct = trimText(ch.chapter_title);
        var apiUrl = ch.chapter_api_data;
        if (!apiUrl) continue;

        var nm = cn ? ("Chương " + cn) : trimText(ch.filename);
        if (ct) nm += ": " + ct;
        if (!nm) nm = "Chương " + (i + 1);

        chapters.push({
            name: nm,
            url: apiUrl,
            host: HOST
        });
    }

    if (chapters.length === 0) return Response.error("Không có chương hợp lệ");

    // Đảm bảo sắp xếp từ cũ đến mới (chương 1 đầu tiên)
    if (chapters.length > 1) {
        var firstNum = parseFloat(serverData[0].chapter_name);
        var lastNum = parseFloat(serverData[serverData.length - 1].chapter_name);
        if (!isNaN(firstNum) && !isNaN(lastNum) && firstNum > lastNum) {
            chapters.reverse();
        }
    }

    return Response.success(chapters);
}
