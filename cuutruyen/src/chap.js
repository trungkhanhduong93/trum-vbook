load("config.js");

// ============================================================
// KẾT LUẬN SAU 4 BẢN THỬ (v14 → v17): KHÔNG đọc được chương trong app.
//
// Ảnh trang của cuutruyen.net bị cắt thành dải ngang rồi đảo lộn. Muốn hiện
// đúng thì phải ghép lại rồi giao ảnh đã ghép cho app. Đo trên máy thật:
//
//   v15 (bản dò)  Graphics=có · tải 486.540 ký tự b64 · createImage 1500x958
//                 capture() trả base64 PNG trần, dài 1.813.920 ký tự
//                 => KHÂU GHÉP CHẠY ĐÚNG, không hỏng chỗ nào.
//   v16 (3 trang) app báo "Không thể tải hình ảnh" — đây là chuỗi
//                 error_load_image của chính bộ tải ảnh trong app.
//   v17 (3 kiểu)  thử cả "base64:", chuỗi trần, và "data:image/png;base64,"
//                 cho cùng một trang. Không kiểu nào hiện được.
//
// Nghĩa là: plugin ghép được ảnh, nhưng KHÔNG có đường nào giao ảnh tự dựng cho
// trình đọc của Vbook. Trình đọc chỉ nhận URL http để tự tải. Đây là giới hạn
// của app, không phải lỗi nguồn — đừng viết lại lần thứ năm.
//
// Nguồn vẫn dùng tốt để: duyệt danh sách, tìm kiếm, xem chi tiết, theo dõi
// truyện mới, và mở mục lục. Đọc thì bấm nút "Trang nguồn".
//
// Nếu về sau site bỏ xáo trộn (trang nào không có drm_data) thì hàm dưới tự
// trả URL trần và chương đó đọc được ngay, không cần sửa gì thêm.
// ============================================================

var HUONG_DAN = "Cứu Truyện xáo trộn ảnh từng trang. Vbook ghép lại được nhưng "
    + "không có cách nào đưa ảnh tự dựng vào trình đọc — đã thử cả 3 kiểu đường dẫn. "
    + "Bấm \"Trang nguồn\" để đọc chương này trên web.";

function plainImage(p) {
    if (!p) return null;
    if (p.drm_data) return null;
    if (String(p.image_url || '').indexOf('scrambled') >= 0) return null;
    return imgUrl(p.image_url);
}

function execute(url) {
    var cid = lastId(url);
    if (!cid) return Response.error("Không đọc được mã chương từ đường dẫn.");

    var json = apiGet("/chapters/" + cid);
    if (!json || !json.data) return Response.error("Không tải được nội dung chương.");

    var pages = json.data.pages || [];
    if (!pages.length) return Response.error("Chương này chưa có trang nào trên Cứu Truyện.");

    // Đường sống duy nhất: trang nào KHÔNG bị xáo trộn thì trả thẳng URL.
    var images = [];
    for (var i = 0; i < pages.length; i++) {
        var u = plainImage(pages[i]);
        if (u) images.push(u);
    }

    // Chỉ đọc được khi TOÀN BỘ trang đều sạch. Thiếu trang giữa chương còn tệ
    // hơn báo lỗi vì người đọc không biết mình đang đọc thiếu.
    if (images.length === pages.length) return Response.success(images);

    return Response.error(HUONG_DAN);
}
