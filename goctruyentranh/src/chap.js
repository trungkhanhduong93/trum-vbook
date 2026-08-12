load('config.js');

// chap.js: Tải ảnh chương
// Site lấy ảnh bằng POST /api/chapter/loadAll với {comicId, chapterNumber, nameEn}
// (xem /contents/v2/js/view_addition.js -> doLoadChapter). API cần cookie usid.
// URL pattern: /truyen/{slug}/chuong-{number}

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
        return Response.error('Không lấy được thông tin truyện để tải chương.');
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
        return Response.error('Lỗi mạng khi tải chương ' + chapNum + '. Thử lại sau.');
    }

    if (!res || !res.status || !res.result) {
        var why = (res && res.messages && res.messages.length) ? String(res.messages[0]) : '';
        return Response.error('Không tải được chương ' + chapNum + '.' + (why ? ' ' + why : ''));
    }

    var r = res.result;

    // codeState theo handleOutput() của site: 01 = bắt đăng nhập, 02 = hết lượt đọc,
    // 03 = phiên hỏng. Site khoá khoảng 20 chương mới nhất của mỗi truyện.
    if (r.codeState === '01') {
        return Response.error('Chương ' + chapNum + ' bị site khoá, chỉ đọc được khi đăng nhập tài khoản trên web. Hãy chọn chương cũ hơn.');
    }
    if (r.codeState === '02') {
        return Response.error('Đã hết lượt đọc chương mới trong ngày trên site.');
    }
    if (r.codeState === '03') {
        return Response.error('Phiên làm việc với site bị huỷ. Thử lại sau ít phút.');
    }
    if (!r.state) {
        return Response.error(r.message ? String(r.message) : 'Không tải được chương ' + chapNum + '.');
    }

    var imgs = r.data;
    if (!imgs || !imgs.length) {
        return Response.error('Chương ' + chapNum + ' chưa có ảnh.');
    }

    var images = [];
    for (var i = 0; i < imgs.length; i++) {
        var imgUrl = String(imgs[i]).trim();
        if (imgUrl) images.push(absUrl(imgUrl));
    }

    if (!images.length) {
        return Response.error('Chương ' + chapNum + ' chưa có ảnh.');
    }

    return Response.success(images);
}
