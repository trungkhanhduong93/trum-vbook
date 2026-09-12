load("config.js");

// ============================================================
// v16 — BẢN THỬ SỨC CHỨA, vẫn chưa phải bản đọc đầy đủ.
//
// Kết quả dò v15 trên máy thật (chương 58 trang):
//   Graphics=có | tải=486.540 ký tự b64 | createImage=1500x958
//   capture kiểu=string | capture dài=1.813.920 | capture đầu=iVBORw0KGgo...
//
// Đọc ra: capture() trả base64 PNG TRẦN (không có tiền tố data:), tức là khâu
// ghép chạy đúng. Vấn đề là KÍCH THƯỚC: ảnh gốc JPEG 365 KB, ghép xong thành
// PNG 1,4 MB — gấp 3,7 lần. Một chương 58 trang là ~80 MB chuỗi nhồi một lượt,
// app nuốt không nổi nên bỏ qua im lặng, không báo lỗi.
//
// Bản này trả về ĐÚNG 3 TRANG ĐẦU để tách bạch hai câu hỏi:
//   - App có hiện được ảnh dạng data: hay không?
//   - Nếu có thì trần chịu đựng nằm ở đâu?
// Ba trang ~4 MB, chắc chắn nằm trong sức chứa.
// ============================================================

var MAX_PAGES = 3;

function buildPage(p) {
    var raw = imgUrl(p.image_url);
    if (!raw) return null;

    var bands = drmDecode(p.drm_data);
    if (bands && drmIsIdentity(bands)) return raw;
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

    var out = null;
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
    if (!pages.length) return Response.error("Chương này chưa có trang nào.");

    var images = [];
    var limit = pages.length < MAX_PAGES ? pages.length : MAX_PAGES;
    for (var i = 0; i < limit; i++) {
        var u = buildPage(pages[i]);
        if (u) images.push(u);
    }

    if (!images.length) {
        return Response.error("THỬ SỨC CHỨA: dựng được 0/" + limit
            + " trang đầu (chương có " + pages.length + " trang).");
    }
    return Response.success(images);
}
