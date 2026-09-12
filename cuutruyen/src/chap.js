load("config.js");

// ============================================================
// v17 — PHÉP THỬ CUỐI, chọn đúng kiểu đường dẫn ảnh.
//
// v16: app báo "Không thể tải hình ảnh". Đó là câu của chính bộ tải ảnh trong
// app (chuỗi error_load_image trong APK), tức là plugin giao hàng thành công
// nhưng app không hiểu kiểu đường dẫn "data:image/png;base64,...".
//
// Trong dex của app có 6 kiểu đường dẫn ảnh nằm cạnh nhau:
//   file · content · android.resource · asset · data · base64
// Chữ "base64" đứng riêng như một kiểu độc lập => nhiều khả năng app có bộ đọc
// riêng cho nó, và đó mới là chỗ capture() sinh ra để dùng.
//
// Bản này lấy ĐÚNG MỘT trang rồi trả về BA lần, mỗi lần một kiểu:
//   trang 1: base64:<chuỗi>
//   trang 2: <chuỗi> trần, không tiền tố
//   trang 3: data:image/png;base64,<chuỗi>   (kiểu đã biết là hỏng, để đối chứng)
//
// Trang nào hiện được thì đó là kiểu đúng. Không trang nào hiện thì đường ghép
// ảnh trong plugin là ngõ cụt, chuyển nguồn sang chỉ duyệt + đọc bằng Trang nguồn.
// ============================================================

function rawCapture(p) {
    var raw = imgUrl(p.image_url);
    if (!raw) return null;
    var bands = drmDecode(p.drm_data);
    if (!bands) return null;
    if (typeof Graphics === "undefined" || !Graphics.createImage) return null;

    var b64 = null;
    var cands = imgCandidates(raw);
    for (var c = 0; c < cands.length && !b64; c++) {
        try {
            var blob = Http.get(cands[c]).headers(HEADERS).timeout(REQ_TIMEOUT).blob();
            if (blob && blob.base64) b64 = blob.base64();
        } catch (eDl) {}
    }
    if (!b64) return null;

    try {
        var img = Graphics.createImage(b64);
        b64 = null;
        if (!img) return null;
        var w = img.width;
        var canvas = Graphics.createCanvas(w, img.height);
        var sy = 0;
        for (var i = 0; i < bands.length; i++) {
            canvas.drawImage(img, 0, sy, w, bands[i].h, 0, bands[i].sy, w, bands[i].h);
            sy += bands[i].h;
        }
        var out = canvas.capture();
        return out ? String(out) : null;
    } catch (eDraw) {
        return null;
    }
}

function execute(url) {
    var cid = lastId(url);
    if (!cid) return Response.error("Không đọc được mã chương từ đường dẫn.");

    var json = apiGet("/chapters/" + cid);
    if (!json || !json.data) return Response.error("Không tải được nội dung chương.");

    var pages = json.data.pages || [];
    if (!pages.length) return Response.error("Chương này chưa có trang nào.");

    var b64 = rawCapture(pages[0]);
    if (!b64) return Response.error("PHÉP THỬ: không ghép được trang đầu.");

    return Response.success([
        "base64:" + b64,
        b64,
        "data:image/png;base64," + b64
    ]);
}
