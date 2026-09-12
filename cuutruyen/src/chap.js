load("config.js");

// Mọi trang của cuutruyen.net là ảnh bị xáo trộn theo dải ngang (xem drmDecode
// trong config.js). App chỉ nhận URL ảnh nên việc ghép lại phải làm ngay trong
// plugin bằng Graphics của Vbook: tải ảnh -> vẽ từng dải vào đúng chỗ -> xuất ra.
//
// Hai điều đã đo và cần nhớ:
//  - Đăng nhập KHÔNG gỡ được xáo trộn: tài khoản thật vẫn nhận 21/21 trang scrambled.
//  - CDN ảnh là storage-ct.lrclib.net, không nhận tham số resize nào.

var DRM_MSG = "Kho ảnh của Cứu Truyện (storage-ct.lrclib.net) hiện không phân giải được tên miền, "
    + "và ảnh của site còn bị xáo trộn theo dải. Chưa đọc được chương cho tới khi site dựng lại kho ảnh.";

function pageImage(p) {
    if (!p) return null;
    var raw = absUrl(p.image_url);
    if (!raw) return null;

    var bands = drmDecode(p.drm_data);

    // Không có drm_data, hoặc các dải vốn đã đúng thứ tự -> trả URL trần,
    // app tự tải, nhanh nhất và nhẹ nhất.
    if (!bands || drmIsIdentity(bands)) return raw;

    if (typeof Graphics === "undefined" || !Graphics.createImage) return null;

    // Thử lần lượt từng gương kho ảnh; gương nào tải được thì dùng.
    var b64 = null;
    var cands = imgCandidates(raw);
    for (var c = 0; c < cands.length && !b64; c++) {
        try {
            var blob = Http.get(cands[c]).headers(HEADERS).timeout(REQ_TIMEOUT).blob();
            if (blob && blob.base64) b64 = blob.base64();
        } catch (eDl) {}
    }
    if (!b64) return null;

    var out = null;
    try {
        var img = Graphics.createImage(b64);
        b64 = null; // nhả sớm, ảnh gốc ~800 KB nên chuỗi base64 rất nặng
        if (!img) return null;

        var w = img.width;
        var canvas = Graphics.createCanvas(w, img.height);
        var dy = 0;
        for (var i = 0; i < bands.length; i++) {
            canvas.drawImage(img, 0, bands[i].sy, w, bands[i].h, 0, dy, w, bands[i].h);
            dy += bands[i].h;
        }
        out = canvas.capture();
    } catch (eDraw) {
        return null;
    }

    if (!out) return null;
    out = String(out);
    if (out.indexOf("http") === 0 || out.indexOf("data:") === 0) return out;
    return "data:image/png;base64," + out;
}

function execute(url) {
    var cid = lastId(url);
    if (!cid) return Response.error("Không đọc được mã chương từ đường dẫn.");

    var json = apiGet("/chapters/" + cid);
    if (!json || !json.data) return Response.error("Không tải được nội dung chương.");

    var pages = json.data.pages || [];
    if (!pages.length) return Response.error("Chương này chưa có trang nào trên Cứu Truyện.");

    var images = [];
    var failed = 0;
    for (var i = 0; i < pages.length; i++) {
        var u = pageImage(pages[i]);
        if (u) images.push(u);
        else failed++;
    }

    if (!images.length) return Response.error(DRM_MSG);

    // Thiếu vài trang giữa chương còn tệ hơn báo lỗi: người đọc không biết mình
    // đang đọc thiếu. Thiếu quá 1/4 thì báo thẳng.
    if (failed > 0 && failed * 4 > pages.length) {
        return Response.error("Chỉ ghép được " + images.length + "/" + pages.length
            + " trang. " + DRM_MSG);
    }

    return Response.success(images);
}
