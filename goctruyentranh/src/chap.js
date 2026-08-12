load('config.js');

// chap.js: Tải ảnh chương
// Site lấy ảnh bằng POST /api/chapter/loadAll với {comicId, chapterNumber, nameEn}
// (xem /contents/v2/js/view_addition.js -> doLoadChapter). API cần cookie X-TOKEN.
// URL pattern: /truyen/{slug}/chuong-{number}
//
// VBook Http client không parse được X-TOKEN (server gửi 2 cookie trên cùng 1
// Set-Cookie header). Nên phải gọi API qua WebView (apiPostSession).

// VBook nuốt Response.error của chap.js và tự hiện "không tải được ảnh, bấm trang
// nguồn để xác minh bạn là con người" — câu đó khiến người đọc tưởng dính Cloudflare.
// Nên với các lỗi CÓ THẬT NGUYÊN NHÂN, trả về một trang ảnh ghi rõ lý do.
function noticeUrl(size, lines) {
    var text = '';
    for (var i = 0; i < lines.length; i++) {
        text += (i ? '\n' : '') + lines[i];
    }
    return 'https://placehold.co/' + size + '/111827/f9fafb/png?font=roboto&text=' +
           encodeURIComponent(text);
}

function noticeImage(lines) {
    return [noticeUrl('900x1300', lines)];
}

// API trả URL ảnh trên CDN vn2/vn3.gtt-bk.pro. CDN đó trả 403 nếu thiếu Referer,
// và chỉ nhận Referer thuộc goctruyentranhvui*.com. CHÍNH DOMAIN SITE phục vụ
// đúng những ảnh đó qua cùng path — và VBook ImageLoader sẽ tự đặt Referer theo
// host URL ảnh. Nên trả URL trên domain site cho an toàn.
function siteImage(url) {
    var s = String(url || '').trim();
    if (!s) return '';
    if (s.indexOf('http') !== 0) return absUrl(s);
    if (s.indexOf('gtt-bk.pro') === -1) return s;
    var m = s.match(/^https?:\/\/[^\/]+(\/.*)$/);
    return m ? SITE_URL + m[1] : s;
}

function execute(url) {
    ensureSiteUrl();
    var sUrl = String(url);

    // slug truyện, KHÔNG lấy cả đuôi /chuong-N
    var slug = comicSlug(sUrl);
    if (!slug) return Response.error('URL chương không hợp lệ.');

    var match = extractSlug(sUrl).match(/\/chuong-([0-9.]+)$/i);
    if (!match) return Response.error('Không đọc được số chương từ đường dẫn.');
    var chapNum = match[1];

    // comicId bắt buộc — API detail không cần cookie
    var jsonDetail = apiGet('/api/comic/' + slug);
    if (!jsonDetail || !jsonDetail.status || !jsonDetail.result || !jsonDetail.result.id) {
        return Response.success(noticeImage([
            '[GTT] Khong lay duoc',
            'thong tin truyen',
            '',
            slug,
            '',
            'Co the site doi ten mien.'
        ]));
    }
    var comicId = String(jsonDetail.result.id);
    var nameEn = jsonDetail.result.nameEn ? String(jsonDetail.result.nameEn) : slug;

    var postData = 'comicId=' + encodeURIComponent(comicId) +
                   '&chapterNumber=' + encodeURIComponent(chapNum) +
                   '&nameEn=' + encodeURIComponent(nameEn);

    // Gọi loadAll qua WebView (đường duy nhất hoạt động vì cần cookie X-TOKEN)
    var res = apiPostSession('/api/chapter/loadAll', postData);

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

    // codeState theo handleOutput() của site:
    // 01 = bắt đăng nhập, 02 = hết lượt đọc, 03 = phiên hỏng
    if (r.codeState === '01') {
        return Response.success(noticeImage([
            'Chuong ' + chapNum + ' can dang nhap',
            '',
            'Cach mo: bam menu ... o goc phai',
            'chon "Trang nguon", dang nhap',
            'Google ngay trong trang do,',
            'roi quay lai doc.',
            '',
            'Chuong khong ghi "khoa" trong',
            'muc luc thi doc duoc ngay.'
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

    var images = [];
    for (var i = 0; i < imgs.length; i++) {
        var imgUrl = siteImage(imgs[i]);
        if (imgUrl) images.push(imgUrl);
    }

    if (!images.length) {
        return Response.error('Chương ' + chapNum + ' chưa có ảnh.');
    }

    return Response.success(images);
}
