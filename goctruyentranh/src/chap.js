load('config.js');

// chap.js: Tải ảnh chương
// Site lấy ảnh bằng POST /api/chapter/loadAll với {comicId, chapterNumber, nameEn}
// (xem /contents/v2/js/view_addition.js -> doLoadChapter). API cần cookie usid.
// URL pattern: /truyen/{slug}/chuong-{number}

// VBook nuốt Response.error của chap.js và tự hiện "không tải được ảnh, bấm trang
// nguồn để xác minh bạn là con người" — câu đó khiến người đọc tưởng dính Cloudflare.
// Nên với các lỗi CÓ THẬT NGUYÊN NHÂN, trả về một trang ảnh ghi rõ lý do.
function noticeImage(lines) {
    var text = '';
    for (var i = 0; i < lines.length; i++) {
        text += (i ? '\n' : '') + lines[i];
    }
    return ['https://placehold.co/900x1300/111827/f9fafb/png?font=roboto&text=' +
            encodeURIComponent(text)];
}

// Một lần gọi API ảnh. Tách riêng để retry được khi phiên hết hạn.
function loadChapter(comicId, chapNum, nameEn) {
    var postData = 'comicId=' + encodeURIComponent(comicId) +
                   '&chapterNumber=' + encodeURIComponent(chapNum) +
                   '&nameEn=' + encodeURIComponent(nameEn);

    var resStr = Http.post(SITE_URL + '/api/chapter/loadAll')
        .headers(HEADERS())
        .body(postData)
        .contentType('application/x-www-form-urlencoded; charset=UTF-8')
        .string();

    return resStr ? JSON.parse(resStr) : null;
}

function execute(url) {
    ensureSiteUrl();
    var sUrl = String(url);

    // slug truyện, KHÔNG lấy cả đuôi /chuong-N — API detail là /api/comic/{slug}
    var slug = comicSlug(sUrl);
    if (!slug) return Response.error('URL chương không hợp lệ.');

    // Neo cuối đường dẫn để slug có chữ "chuong-" không cướp mất số chương thật
    var match = extractSlug(sUrl).match(/\/chuong-([0-9.]+)$/i);
    if (!match) return Response.error('Không đọc được số chương từ đường dẫn.');
    var chapNum = match[1];

    // comicId là bắt buộc: thiếu nó server trả "Không có dữ liệu."
    var jsonDetail = apiGet('/api/comic/' + slug);
    if (!jsonDetail || !jsonDetail.status || !jsonDetail.result || !jsonDetail.result.id) {
        return Response.success(noticeImage([
            '[GTT-DETAIL] Khong lay duoc',
            'thong tin truyen',
            '',
            slug,
            '',
            'Co the site doi ten mien.'
        ]));
    }
    var comicId = String(jsonDetail.result.id);
    var nameEn = jsonDetail.result.nameEn ? String(jsonDetail.result.nameEn) : slug;

    ensureSession();

    var res = null;
    try {
        res = loadChapter(comicId, chapNum, nameEn);

        // status:false thường là cookie usid đã hết hạn -> lấy phiên mới, thử lại 1 lần
        if (res && !res.status) {
            resetSession();
            ensureSession();
            res = loadChapter(comicId, chapNum, nameEn);
        }
    } catch (e) {
        return Response.success(noticeImage([
            '[GTT-NET] Loi mang khi goi API',
            'chuong ' + chapNum,
            '',
            'Kiem tra ket noi hoac doi DNS',
            've 1.1.1.1 roi thu lai.'
        ]));
    }

    if (!res || !res.status || !res.result) {
        var why = (res && res.messages && res.messages.length) ? String(res.messages[0]) : '';
        return Response.success(noticeImage([
            '[GTT-API] Chuong ' + chapNum,
            'khong tai duoc',
            '',
            why || 'Site khong tra du lieu.'
        ]));
    }

    var r = res.result;

    // codeState theo handleOutput() của site: 01 = bắt đăng nhập, 02 = hết lượt đọc,
    // 03 = phiên hỏng. Site khoá khoảng 20 chương mới nhất của mỗi truyện.
    if (r.codeState === '01') {
        return Response.success(noticeImage([
            'Chuong ' + chapNum + ' can dang nhap',
            'Site khoa mot so chuong le',
            'Cac chuong khac van doc binh thuong',
            'Trong muc luc, chuong nao doc duoc',
            'thi khong ghi "can dang nhap"'
        ]));
    }
    if (r.codeState === '02') {
        return Response.success(noticeImage([
            '[GTT-02] Het luot doc',
            '',
            'Site da het luot doc mien phi',
            'cho mang cua ban hom nay.',
            '',
            'Thu lai sau hoac doc chuong cu.'
        ]));
    }
    if (r.codeState === '03') {
        return Response.success(noticeImage([
            '[GTT-03] Phien lam viec bi huy',
            '',
            'Thu lai sau vai phut.'
        ]));
    }
    if (!r.state) {
        return Response.success(noticeImage([
            '[GTT-ERR] Khong tai duoc chuong ' + chapNum,
            '',
            String(r.message || 'Site khong tra du lieu.')
        ]));
    }

    var imgs = r.data;
    if (!imgs || !imgs.length) {
        return Response.success(noticeImage([
            '[GTT-EMPTY] Chuong ' + chapNum,
            'chua co anh tren site.'
        ]));
    }

    // TẠM THỜI (v11, sẽ gỡ): dải mỏng đầu chương để phân biệt "plugin không lấy được
    // ảnh" với "plugin lấy được nhưng app không tải nổi ảnh từ CDN gtt-bk.pro".
    // Thấy dải này mà không thấy trang truyện = CDN chặn app, không phải lỗi plugin.
    var images = noticeImage(['[GTT-OK] API tra ve ' + imgs.length + ' anh']);

    for (var i = 0; i < imgs.length; i++) {
        var imgUrl = String(imgs[i]).trim();
        if (imgUrl) images.push(absUrl(imgUrl));
    }

    if (!images.length) {
        return Response.error('Chương ' + chapNum + ' chưa có ảnh.');
    }

    return Response.success(images);
}
