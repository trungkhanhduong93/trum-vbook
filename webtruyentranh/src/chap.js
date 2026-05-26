load("config.js");

function execute(url) {
    // URL nhận vào chính là endpoint API của Otruyen (ví dụ: https://sv1.otruyencdn.com/v1/api/chapter/...)
    var str = fetchJson(url);
    if (!str) return Response.error("Không tải được hình ảnh chương");

    try {
        var json = JSON.parse(str);
        if (json.status !== "success") return Response.error("Lỗi API: " + json.status);

        var data = json.data;
        var item = data.item || {};
        var domainCdn = data.domain_cdn || "https://sv1.otruyencdn.com";
        var chapterPath = item.chapter_path || "";
        var chapterImages = item.chapter_image || [];
        var images = [];

        for (var i = 0; i < chapterImages.length; i++) {
            var img = chapterImages[i];
            var file = img.image_file || "";
            if (file) {
                var finalUrl = domainCdn + "/" + chapterPath + "/" + file;
                images.push(finalUrl);
            }
        }

        if (images.length === 0) return Response.error("Không tìm thấy ảnh chương");
        return Response.success(images);
    } catch (e) {
        return Response.error("Lỗi parse JSON: " + e.message);
    }
}
