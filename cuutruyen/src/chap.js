load("config.js");

// Ảnh trang của cuutruyen.net bị xáo trộn theo dải ngang (xem drmDecode trong
// config.js). App chỉ nhận URL nên phải ghép lại ngay trong plugin bằng Graphics.
//
// Ba điều đã đo và cần nhớ:
//  - Đăng nhập KHÔNG gỡ được xáo trộn: tài khoản thật vẫn nhận 21/21 trang scrambled.
//  - API ghi URL ảnh trỏ storage-ct.lrclib.net (đã chết). Gương sống là
//    storage-bravo.cuutruyen.net — xem IMG_MIRRORS trong config.js.
//  - Không có bản chưa xáo trộn: thử processed- / original- / raw- đều 404.
//
// ⚠️ TUYỆT ĐỐI KHÔNG trả URL ảnh còn xáo trộn cho app. v13 làm đúng lỗi đó: khi
// drmDecode trả null thì rơi về URL trần, người đọc thấy ảnh "cắt nát" mà không
// biết vì sao. Thà báo lỗi có mã để lần sau biết hỏng ở khâu nào.

// Đếm lý do hỏng để câu báo lỗi chỉ đúng chỗ cần sửa.
var failDrm = 0;   // giải drm_data không ra
var failGfx = 0;   // không có Graphics
var failDl = 0;    // tải ảnh hỏng ở cả 3 gương
var failCap = 0;   // vẽ xong nhưng capture() không trả gì

function isScrambled(p) {
    if (p && p.drm_data) return true;
    return String((p && p.image_url) || '').indexOf('scrambled') >= 0;
}

function pageImage(p) {
    if (!p) return null;
    // Đổi sang gương sống ngay từ đây: URL do API trả về trỏ host đã chết.
    var raw = imgUrl(p.image_url);
    if (!raw) return null;

    var bands = drmDecode(p.drm_data);

    // Trang không xáo trộn, hoặc các dải vốn đã đúng thứ tự -> trả URL trần,
    // app tự tải, nhanh nhất và nhẹ nhất.
    if (bands && drmIsIdentity(bands)) return raw;
    if (!bands) {
        if (!isScrambled(p)) return raw;
        failDrm++;
        return null;
    }

    if (typeof Graphics === "undefined" || !Graphics.createImage) {
        failGfx++;
        return null;
    }

    // Thử lần lượt từng gương kho ảnh; gương nào tải được thì dùng.
    var b64 = null;
    var cands = imgCandidates(raw);
    for (var c = 0; c < cands.length && !b64; c++) {
        try {
            var blob = Http.get(cands[c]).headers(HEADERS).timeout(REQ_TIMEOUT).blob();
            if (blob && blob.base64) b64 = blob.base64();
        } catch (eDl) {}
    }
    if (!b64) {
        failDl++;
        return null;
    }

    var out = null;
    try {
        var img = Graphics.createImage(b64);
        b64 = null; // nhả sớm, ảnh gốc ~800 KB nên chuỗi base64 rất nặng
        if (!img) {
            failCap++;
            return null;
        }

        // CHIỀU GHÉP: dải thứ i của ảnh TẢI VỀ (lấy tuần tự từ trên xuống) phải
        // đặt vào toạ độ y = bands[i].sy của ảnh đúng. Đã dựng thử cả hai chiều
        // trên trang thật rồi nhìn bằng mắt: chiều ngược lại ra ảnh vỡ khung.
        var w = img.width;
        var canvas = Graphics.createCanvas(w, img.height);
        var sy = 0;
        for (var i = 0; i < bands.length; i++) {
            canvas.drawImage(img, 0, sy, w, bands[i].h, 0, bands[i].sy, w, bands[i].h);
            sy += bands[i].h;
        }
        out = canvas.capture();
    } catch (eDraw) {
        failCap++;
        return null;
    }

    if (!out) {
        failCap++;
        return null;
    }
    out = String(out);
    if (out.indexOf("http") === 0 || out.indexOf("data:") === 0) return out;
    return "data:image/png;base64," + out;
}

function failMessage(total) {
    if (failGfx > 0) {
        return "[CT-GFX] Bản Vbook này không dùng được Graphics nên không ghép lại được "
            + "ảnh đã xáo trộn của Cứu Truyện. Đọc chương bằng nút Trang nguồn.";
    }
    if (failDrm > 0) {
        return "[CT-DRM] Không giải được dữ liệu xáo trộn của " + failDrm + "/" + total
            + " trang. Nguồn cần cập nhật lại cách giải.";
    }
    if (failDl > 0) {
        return "[CT-DL] Không tải được ảnh gốc của " + failDl + "/" + total
            + " trang từ kho ảnh của Cứu Truyện.";
    }
    if (failCap > 0) {
        return "[CT-CAP] Ghép được ảnh nhưng Graphics không xuất ra được ("
            + failCap + "/" + total + " trang).";
    }
    return "[CT] Không dựng được trang nào của chương này.";
}

function execute(url) {
    failDrm = 0; failGfx = 0; failDl = 0; failCap = 0;

    var cid = lastId(url);
    if (!cid) return Response.error("Không đọc được mã chương từ đường dẫn.");

    var json = apiGet("/chapters/" + cid);
    if (!json || !json.data) return Response.error("Không tải được nội dung chương.");

    var pages = json.data.pages || [];
    if (!pages.length) return Response.error("Chương này chưa có trang nào trên Cứu Truyện.");

    var images = [];
    for (var i = 0; i < pages.length; i++) {
        var u = pageImage(pages[i]);
        if (u) images.push(u);
    }

    if (!images.length) return Response.error(failMessage(pages.length));

    // Thiếu vài trang giữa chương còn tệ hơn báo lỗi: người đọc không biết mình
    // đang đọc thiếu. Thiếu quá 1/4 thì báo thẳng.
    var missing = pages.length - images.length;
    if (missing > 0 && missing * 4 > pages.length) {
        return Response.error("Chỉ dựng được " + images.length + "/" + pages.length
            + " trang. " + failMessage(pages.length));
    }

    return Response.success(images);
}
