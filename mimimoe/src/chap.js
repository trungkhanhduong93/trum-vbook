load("config.js");

function execute(url) {
    var chapId = extractChapterId(url);
    if (!chapId) return Response.error("URL chương không hợp lệ");

    var res = apiFetch("/chapters/" + chapId);
    if (!res || !res.ok) {
        return Response.error("Không tải được chương: " + (res ? res.status : "null"));
    }

    var data;
    try {
        data = JSON.parse(res.text());
    } catch (e) {
        return Response.error("Lỗi parse JSON: " + e.message);
    }

    if (!data || !data.pages || !data.pages.length) {
        return Response.error("Không tìm thấy ảnh chương");
    }

    var images = [];
    for (var i = 0; i < data.pages.length; i++) {
        var p = data.pages[i];
        if (!p) continue;
        var src = p.image_url || p.url || "";
        if (!src) continue;
        images.push(src + "|Referer=" + BASE_URL + "/");
    }

    if (images.length === 0) return Response.error("Không tìm thấy ảnh chương");
    return Response.success(images);
}
