load("config.js");

// ============================================================
// v15 — BẢN DÒ, KHÔNG PHẢI BẢN SỬA.
//
// v14 không hiện ảnh mà cũng không ra mã [CT-...], nghĩa là plugin tưởng đã
// dựng xong ảnh và trả về cho app, còn app thì không hiện được. Không đoán nữa:
// bản này chạy đúng MỘT trang đầu của chương rồi báo cáo từng bước ra màn hình.
//
// Chụp màn hình câu báo đó gửi lại, xong tui trả chap.js thật về ngay.
// Bản thật là chap.js của v14, lấy lại bằng: git show f3c7555:cuutruyen/src/chap.js
// ============================================================

function short(v) {
    var s = String(v);
    if (s.length <= 48) return s;
    return s.substring(0, 48) + '…';
}

function execute(url) {
    var log = [];
    var cid = lastId(url);
    log.push('chap=' + cid);

    var json = apiGet('/chapters/' + cid);
    if (!json || !json.data) return Response.error('DÒ: không gọi được API chương.');

    var pages = json.data.pages || [];
    log.push('trang=' + pages.length);
    if (!pages.length) return Response.error('DÒ: chương không có trang nào.');

    var p = pages[0];
    log.push('drm=' + (p.drm_data ? 'có' : 'không'));

    var bands = drmDecode(p.drm_data);
    log.push('giải=' + (bands ? (bands.length + ' dải') : 'THẤT BẠI'));

    var raw = imgUrl(p.image_url);
    log.push('host=' + String(raw).replace(/^https?:\/\//, '').split('/')[0]);

    log.push('Graphics=' + (typeof Graphics === 'undefined' ? 'KHÔNG CÓ' : 'có'));
    if (typeof Graphics === 'undefined') return Response.error('DÒ: ' + log.join(' | '));

    var b64 = null;
    try {
        var blob = Http.get(raw).headers(HEADERS).timeout(REQ_TIMEOUT).blob();
        if (blob && blob.base64) b64 = blob.base64();
        log.push('tải=' + (b64 ? (b64.length + ' ký tự b64') : 'RỖNG'));
    } catch (eDl) {
        log.push('tải=LỖI ' + short(eDl && eDl.message));
        return Response.error('DÒ: ' + log.join(' | '));
    }
    if (!b64) return Response.error('DÒ: ' + log.join(' | '));

    var img = null;
    try {
        img = Graphics.createImage(b64);
        log.push('createImage=' + (img ? (img.width + 'x' + img.height) : 'NULL'));
    } catch (eImg) {
        log.push('createImage=LỖI ' + short(eImg && eImg.message));
        return Response.error('DÒ: ' + log.join(' | '));
    }
    if (!img) return Response.error('DÒ: ' + log.join(' | '));

    var out = null;
    try {
        var canvas = Graphics.createCanvas(img.width, img.height);
        var sy = 0;
        for (var i = 0; i < bands.length; i++) {
            canvas.drawImage(img, 0, sy, img.width, bands[i].h, 0, bands[i].sy, img.width, bands[i].h);
            sy += bands[i].h;
        }
        out = canvas.capture();
        log.push('capture kiểu=' + (typeof out));
        log.push('capture dài=' + (out === null ? 'null' : String(out).length));
        log.push('capture đầu=' + short(out));
    } catch (eDraw) {
        log.push('vẽ=LỖI ' + short(eDraw && eDraw.message));
    }

    return Response.error('DÒ: ' + log.join(' | '));
}
