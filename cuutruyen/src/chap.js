load("config.js");

// ============================================================
// v19: Tải và hiển thị ảnh chương qua Descrambler Worker.
//
// Web cuutruyen.net xáo trộn dải ngang các trang ảnh và cấp chuỗi drm_data.
// Trình đọc vBook dùng Coil ZoomImage chỉ hỗ trợ stream ảnh qua HTTP URL.
// Plugin bọc các trang có DRM qua Descrambler Worker (Cloudflare Worker)
// để giải mã và stream ảnh JPEG nguyên bản về cho app tải và hiển thị.
// Trang nào không có DRM hoặc dải ảnh đã đúng thứ tự thì trả thẳng URL CDN.
// ============================================================

function execute(url) {
    var cid = lastId(url);
    if (!cid) return Response.error("Không đọc được mã chương từ đường dẫn.");

    var json = apiGet("/chapters/" + cid);
    if (!json || !json.data) return Response.error("Không tải được nội dung chương.");

    var pages = json.data.pages || [];
    if (!pages.length) return Response.error("Chương này chưa có trang nào trên Cứu Truyện.");

    var images = [];
    for (var i = 0; i < pages.length; i++) {
        var u = chapterImageUrl(pages[i]);
        if (u) images.push(u);
    }

    if (!images.length) {
        return Response.error("Không tải được ảnh cho chương này.");
    }

    return Response.success(images);
}

