load("config.js");

function execute(url) {
    // URL nhận vào là chapter_api_data (vd: https://sv1.otruyencdn.com/v1/api/chapter/{id})
    var sUrl = String(url || "").trim();
    if (!sUrl) return Response.error("URL chương không hợp lệ");

    var str = fetchJson(sUrl);
    if (!str) return Response.error("Không tải được dữ liệu chương");

    var json = parseJson(str);
    if (!json || json.status !== "success" || !json.data || !json.data.item) {
        return Response.error("API trả về dữ liệu không hợp lệ");
    }

    var data = json.data;
    var item = data.item;
    var domainCdn = data.domain_cdn || "https://sv1.otruyencdn.com";
    var chapterPath = item.chapter_path || "";
    var imgs = item.chapter_image || [];

    var out = [];
    var seen = {};
    for (var i = 0; i < imgs.length; i++) {
        var img = imgs[i];
        if (!img) continue;
        var file = img.image_file ? String(img.image_file).trim() : "";
        if (!file) continue;

        var link;
        if (file.indexOf("http") === 0) {
            link = file;
        } else if (chapterPath) {
            link = domainCdn + "/" + chapterPath + "/" + file;
        } else {
            link = domainCdn + "/" + file;
        }

        if (seen[link]) continue;
        seen[link] = true;
        out.push(link);
    }

    if (out.length === 0) return Response.error("Không tìm thấy ảnh chương");
    return Response.success(out);
}
