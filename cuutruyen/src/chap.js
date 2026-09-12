load("config.js");

// ============================================================
// v22: đọc chương qua máy chủ giải xáo trộn ảnh.
//
// cuutruyen.net cắt mỗi trang thành dải ngang rồi đảo thứ tự, kèm chuỗi
// drm_data để web tự ghép lại bằng canvas. vBook không làm được việc đó: trình
// đọc chỉ nhận URL http để tự tải, không nhận ảnh plugin tự dựng (v14→v17 đã
// thử đủ ba kiểu đường dẫn, app đều báo "Không thể tải hình ảnh").
//
// Nên việc ghép phải làm ở máy chủ. Khai địa chỉ máy chủ đó vào DESCRAMBLER
// trong config.js; cách dựng nằm ở tools/cuutruyen-worker/README.md.
// Chưa khai thì chương báo hướng dẫn chứ không trả ảnh cắt nát.
// ============================================================

var HUONG_DAN = "Chương này cần máy chủ giải ảnh mới đọc được trong app. "
    + "Mở tools/cuutruyen-worker/README.md để dựng (miễn phí, 5 phút), rồi dán "
    + "địa chỉ vào DESCRAMBLER trong config.js. Trong lúc chờ, bấm \"Trang nguồn\" "
    + "để đọc chương này trên web.";

function execute(url) {
    var cid = lastId(url);
    if (!cid) return Response.error("Không đọc được mã chương từ đường dẫn.");

    var json = apiGet("/chapters/" + cid);
    if (!json || !json.data) return Response.error("Không tải được nội dung chương.");

    var pages = json.data.pages || [];
    if (!pages.length) return Response.error("Chương này chưa có trang nào trên Cứu Truyện.");

    var images = [];
    var thieu = 0;
    for (var i = 0; i < pages.length; i++) {
        var u = chapterImageUrl(pages[i]);
        if (u) images.push(u);
        else thieu++;
    }

    // Thiếu trang vì chưa có máy chủ giải ảnh: nói thẳng, đừng trả chương què.
    if (thieu > 0 && !DESCRAMBLER) return Response.error(HUONG_DAN);
    if (!images.length) return Response.error("Không tải được ảnh cho chương này.");

    return Response.success(images);
}
